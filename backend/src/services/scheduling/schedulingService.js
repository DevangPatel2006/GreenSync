const Schedule = require('../../models/Schedule');
const Device = require('../../models/Device');
const energyService = require('../energy/energyService');
const schedulingConfig = require('../../config/schedulingConfig');
const { validateSchedulingRequest, recommendSchedule: runEngineRecommendation } = require('./engine');
const { estimateCo2AvoidedKg } = require('./co2Model');
const logger = require('../../utils/logger');
const rewardsService = require('../rewards/rewardsService');

/**
 * Custom typed error class for scheduling service exceptions.
 * Encapsulates HTTP status code and standardized error code.
 */
class SchedulingServiceError extends Error {
  /**
   * @param {string} message - Error description
   * @param {string} code - Machine-readable code ('NOT_FOUND', 'FORBIDDEN', 'VALIDATION_ERROR')
   * @param {number} statusCode - HTTP status code (400, 403, 404, 500)
   */
  constructor(message, code, statusCode) {
    super(message);
    this.name = 'SchedulingServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Scheduling Service Facade
 * 
 * Orchestrates device lookup, ownership authorization, energy time slot generation,
 * engine recommendation evaluation, and persistence to MongoDB.
 */

/**
 * Generates an optimal schedule recommendation for a user's device.
 * 
 * @param {string} userId - Requesting user ID (from JWT auth)
 * @param {string} deviceId - Target device ID
 * @returns {Promise<object|null>} Persisted Schedule document or null sentinel if NO_FEASIBLE_SLOT
 * @throws {SchedulingServiceError} On device not found (404), ownership violation (403), or invalid bounds (400)
 */
async function recommendSchedule(userId, deviceId) {
  // 1. Device Lookup & Ownership Verification
  const device = await Device.findById(deviceId);
  if (!device) {
    throw new SchedulingServiceError(`Device with id ${deviceId} not found`, 'NOT_FOUND', 404);
  }

  // Enforce strict user isolation: prevent probing another user's device
  if (device.userId.toString() !== userId.toString()) {
    throw new SchedulingServiceError('Access denied: Device belongs to another user', 'FORBIDDEN', 403);
  }

  // 2. Request Validation: Verify deadlines, status, and horizons
  const validation = validateSchedulingRequest(device, new Date());
  if (!validation.valid) {
    throw new SchedulingServiceError(validation.reason, 'VALIDATION_ERROR', 400);
  }

  // 3. Phase 4 Integration: Retrieve discrete evaluation slots across device window
  const timeSlots = await energyService.getTimeSlots(
    device.earliestStart,
    device.deadline,
    schedulingConfig.slotSearchGranularityMinutes
  );

  // 4. Engine Evaluation: Run pure multi-objective scheduling algorithm
  const recommendation = runEngineRecommendation(device, timeSlots, schedulingConfig, new Date());

  // 5. Infeasibility Sentinel Handling (Section 15 Contract)
  // When window is too narrow for device duration, return null sentinel (maps to HTTP 200, data: null)
  if (recommendation.outcome === 'NO_FEASIBLE_SLOT') {
    logger.info(`[SchedulingService] No feasible slot found for device ${deviceId} within requested window`);
    return null;
  }

  const winningWindow = recommendation.window;

  // 6. Metrics Derivations
  const energyShifted = device.energyRequired;
  const renewableUtilization = winningWindow.avgRenewableAvailability;

  // Derive peak reduction relative to peak demand in the evaluated slots
  const peakDemandBaseline = (timeSlots && timeSlots.length > 0)
    ? Math.max(...timeSlots.map((s) => s.gridDemand))
    : 100;
  const peakReduction = Math.max(0, Math.round((peakDemandBaseline - winningWindow.avgGridDemand) * 100) / 100);

  // Calculate CO2 avoided based on energy shifted and renewable ratio
  const co2Avoided = estimateCo2AvoidedKg(energyShifted, renewableUtilization, schedulingConfig);

  /**
   * FROZEN SCHEMA CONTRACT WORKAROUND:
   * The Schedule schema fields are frozen by Handbook Section 13 (no isBestEffort boolean column).
   * To communicate best-effort compromises transparently to the frontend without schema mutations,
   * we prepend the reason with "[Best-effort] ". Frontend components detect this marker via startsWith().
   */
  let finalReason = recommendation.reason;
  if (recommendation.isBestEffort && !finalReason.startsWith('[Best-effort]')) {
    finalReason = `[Best-effort] ${finalReason}`;
  }

  // 7. Persist Schedule Document (status defaults to 'proposed')
  const schedule = await Schedule.create({
    userId,
    deviceId: device._id,
    recommendedStart: winningWindow.start,
    recommendedEnd: winningWindow.end,
    energyShifted,
    renewableUtilization,
    peakReduction,
    co2Avoided,
    flexCoinsEarned: 0, // Filled downstream by Phase 6 Rewards Engine
    reason: finalReason,
    status: 'proposed',
  });

  return schedule;
}

/**
 * Accepts a proposed schedule, transitioning its status to 'accepted'.
 * 
 * @param {string} userId - Requesting user ID (from JWT auth)
 * @param {string} scheduleId - Target schedule ID
 * @returns {Promise<object>} Updated Schedule document
 * @throws {SchedulingServiceError} On schedule not found (404), ownership violation (403), or invalid status (400)
 */
async function acceptSchedule(userId, scheduleId) {
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    throw new SchedulingServiceError(`Schedule with id ${scheduleId} not found`, 'NOT_FOUND', 404);
  }

  // Ownership verification
  if (schedule.userId.toString() !== userId.toString()) {
    throw new SchedulingServiceError('Access denied: Schedule belongs to another user', 'FORBIDDEN', 403);
  }

  // Transition validation: Only 'proposed' schedules can be accepted
  if (schedule.status !== 'proposed') {
    throw new SchedulingServiceError(
      `Cannot accept schedule with status "${schedule.status}". Only proposed schedules can be accepted.`,
      'VALIDATION_ERROR',
      400
    );
  }

  schedule.status = 'accepted';
  await schedule.save();

  return schedule;
}

/**
 * Completes an accepted schedule, transitioning its status to 'completed'
 * and granting calculated FlexCoins via rewardsService.
 * 
 * @param {string} userId - Requesting user ID (from JWT auth)
 * @param {string} scheduleId - Target schedule ID
 * @returns {Promise<object>} Updated Schedule document with flexCoinsEarned populated
 * @throws {SchedulingServiceError} On schedule not found (404), ownership violation (403), or invalid status (400)
 */
async function completeSchedule(userId, scheduleId) {
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    throw new SchedulingServiceError(`Schedule with id ${scheduleId} not found`, 'NOT_FOUND', 404);
  }

  // Ownership verification
  if (schedule.userId.toString() !== userId.toString()) {
    throw new SchedulingServiceError('Access denied: Schedule belongs to another user', 'FORBIDDEN', 403);
  }

  // Transition validation: Only 'accepted' schedules can be completed
  // (Idempotency: if already completed, delegate to rewardsService which handles idempotency)
  if (schedule.status !== 'accepted') {
    if (schedule.status === 'completed') {
      const existingTx = await rewardsService.grantRewardForSchedule(schedule);
      schedule.flexCoinsEarned = existingTx.coins;
      return schedule;
    }
    throw new SchedulingServiceError(
      `Cannot complete schedule with status "${schedule.status}". Only accepted schedules can be completed.`,
      'VALIDATION_ERROR',
      400
    );
  }

  schedule.status = 'completed';
  await schedule.save();

  // Call rewardsService.grantRewardForSchedule
  const rewardTx = await rewardsService.grantRewardForSchedule(schedule);
  schedule.flexCoinsEarned = rewardTx.coins;
  await schedule.save();

  return schedule;
}

/**
 * Retrieves full scheduling history for the authenticated user, newest first.
 * 
 * @param {string} userId - Requesting user ID
 * @returns {Promise<Array<object>>} Chronological list of user schedules
 */
async function getScheduleHistory(userId) {
  return Schedule.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = {
  recommendSchedule,
  acceptSchedule,
  completeSchedule,
  getScheduleHistory,
  SchedulingServiceError,
};
