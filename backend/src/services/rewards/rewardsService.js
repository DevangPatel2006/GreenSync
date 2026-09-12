const RewardTransaction = require('../../models/RewardTransaction');
const Schedule = require('../../models/Schedule');
const Device = require('../../models/Device');
const User = require('../../models/User');
const rewardsConfig = require('../../config/rewardsConfig');
const {
  calculateFlexCoins,
  classifyImpactType,
  buildRewardExplanation,
} = require('./flexCoinEngine');
const {
  computeUserImpactSummary,
  computeAdminImpactSummary,
} = require('./impactAggregator');
const logger = require('../../utils/logger');

/**
 * Custom typed error class for rewards service exceptions.
 * Encapsulates HTTP status code and standardized machine-readable error code.
 */
class RewardsServiceError extends Error {
  /**
   * @param {string} message - Error description
   * @param {string} code - Machine-readable code ('NOT_FOUND', 'FORBIDDEN', 'VALIDATION_ERROR')
   * @param {number} statusCode - HTTP status code (400, 403, 404, 500)
   */
  constructor(message, code, statusCode) {
    super(message);
    this.name = 'RewardsServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Grants FlexCoins and generates an immutable RewardTransaction upon schedule completion.
 * 
 * IDEMPOTENCY GUARANTEE:
 * Checks for an existing RewardTransaction for the scheduleId first.
 * If one exists, returns it immediately without creating duplicates or double-incrementing user balance.
 * 
 * @param {object} schedule - Target completed schedule document
 * @returns {Promise<object>} Created or existing RewardTransaction document
 */
async function grantRewardForSchedule(schedule) {
  if (!schedule || !schedule._id) {
    throw new RewardsServiceError('Invalid schedule provided to grantRewardForSchedule', 'VALIDATION_ERROR', 400);
  }

  // 1. Idempotency check: Return existing reward if already granted
  const existingTx = await RewardTransaction.findOne({ scheduleId: schedule._id });
  if (existingTx) {
    logger.info(`[RewardsService] RewardTransaction already exists for schedule ${schedule._id}. Returning idempotent record.`);
    return existingTx;
  }

  // 2. Fetch associated device to evaluate operational flexibility
  const device = await Device.findById(schedule.deviceId);

  // 3. Calculate FlexCoins using pure engine
  const calcResult = calculateFlexCoins(schedule, device, rewardsConfig);
  const impactType = classifyImpactType(calcResult.breakdown);
  const reason = buildRewardExplanation(schedule, calcResult.breakdown, calcResult.coins);

  // 4. Persist RewardTransaction record
  let rewardTx;
  try {
    rewardTx = await RewardTransaction.create({
      userId: schedule.userId,
      scheduleId: schedule._id,
      coins: calcResult.coins,
      reason,
      impactType,
    });
  } catch (err) {
    // Catch potential race condition unique key constraint violation
    if (err.code === 11000) {
      return RewardTransaction.findOne({ scheduleId: schedule._id });
    }
    throw err;
  }

  // 5. Update Schedule.flexCoinsEarned
  schedule.flexCoinsEarned = calcResult.coins;
  await schedule.save();

  // 6. Increment User.flexCoins (without schema alterations)
  await User.findByIdAndUpdate(
    schedule.userId,
    { $inc: { flexCoins: calcResult.coins } },
    { new: true }
  );

  logger.info(`[RewardsService] Granted ${calcResult.coins} FlexCoins for schedule ${schedule._id} (User ${schedule.userId}).`);
  return rewardTx;
}

/**
 * Calculates current FlexCoin balance for a user by summing RewardTransaction documents.
 * Source of truth: dynamic aggregation of immutable transaction records.
 * 
 * @param {string} userId - Target user ID
 * @returns {Promise<number>} Current aggregated balance
 */
async function getBalance(userId) {
  const transactions = await RewardTransaction.find({ userId }).lean();
  const balance = transactions.reduce((acc, tx) => acc + (Number(tx.coins) || 0), 0);
  return balance;
}

/**
 * Retrieves chronological reward transaction history for a user, newest first.
 * 
 * @param {string} userId - Target user ID
 * @returns {Promise<Array<object>>} List of RewardTransaction records
 */
async function getRewardHistory(userId) {
  return RewardTransaction.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Aggregates personal environmental and grid impact metrics for a user.
 * 
 * @param {string} userId - Target user ID
 * @returns {Promise<object>} User impact summary
 */
async function getUserImpactSummary(userId) {
  const schedules = await Schedule.find({ userId }).lean();
  const transactions = await RewardTransaction.find({ userId }).lean();

  return computeUserImpactSummary(schedules, transactions);
}

/**
 * Aggregates system-wide grid flexibility and impact metrics for administrator review.
 * 
 * @returns {Promise<object>} Admin impact summary
 */
async function getAdminImpactSummary() {
  const allSchedules = await Schedule.find({}).lean();
  const allUsers = await User.find({}).lean();

  return computeAdminImpactSummary(allSchedules, allUsers);
}

module.exports = {
  grantRewardForSchedule,
  getBalance,
  getRewardHistory,
  getUserImpactSummary,
  getAdminImpactSummary,
  RewardsServiceError,
};
