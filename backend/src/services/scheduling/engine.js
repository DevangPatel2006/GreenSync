const defaultSchedulingConfig = require('../../config/schedulingConfig');
const { computeRequiredDurationMinutes } = require('./durationModel');
const { generateCandidateWindows } = require('./candidateGenerator');
const {
  renewableBenefit,
  peakReductionBenefit,
  priceBenefit,
  deadlineFeasibility,
  flexibilitySuitability,
} = require('./scoring');

/**
 * Validates a scheduling request against device constraints and current time.
 * Pure validation logic without database or HTTP dependencies.
 * 
 * Rules:
 * 1. device.deadline <= now -> invalid ("deadline is in the past")
 * 2. device.deadline <= device.earliestStart -> invalid ("deadline must be after earliest start")
 * 3. device.status !== 'active' -> invalid ("device is not active")
 * 
 * @param {object} device - Device entity
 * @param {Date|string|number} device.deadline - Target completion deadline
 * @param {Date|string|number} device.earliestStart - Earliest start timestamp
 * @param {string} device.status - Device status ('active', 'paused', etc.)
 * @param {Date|string|number} [now=new Date()] - Reference point in time
 * @returns {{ valid: boolean, reason?: string }} Structured validation result
 */
function validateSchedulingRequest(device, now = new Date()) {
  if (!device || typeof device !== 'object') {
    return { valid: false, reason: 'Invalid device payload' };
  }

  const nowTime = new Date(now).getTime();
  const deadlineTime = new Date(device.deadline).getTime();
  const earliestStartTime = new Date(device.earliestStart).getTime();

  if (Number.isNaN(deadlineTime)) {
    return { valid: false, reason: 'Invalid device deadline' };
  }

  if (Number.isNaN(earliestStartTime)) {
    return { valid: false, reason: 'Invalid device earliestStart' };
  }

  // 1. Deadline in past
  if (deadlineTime <= nowTime) {
    return { valid: false, reason: 'deadline is in the past' };
  }

  // 2. Deadline must be after earliestStart
  if (deadlineTime <= earliestStartTime) {
    return { valid: false, reason: 'deadline must be after earliest start' };
  }

  // 3. Status must be active
  if (device.status !== 'active') {
    return { valid: false, reason: 'device is not active' };
  }

  return { valid: true };
}

/**
 * Formulates a human-readable, explainable reason text for the scheduling recommendation.
 * Conditionally composes narrative sentences based on the actual scored metrics.
 * 
 * @private
 * @param {object} candidate - Scored candidate window
 * @param {boolean} isBestEffort - Flag indicating if score fell below ideal threshold
 * @param {Date} deadline - Device deadline
 * @returns {string} Human-readable reason
 */
function _buildExplanationReason(candidate, isBestEffort, deadline) {
  const parts = [];

  if (isBestEffort) {
    parts.push(
      'Best-effort schedule: Available slots within the deadline do not meet ideal efficiency thresholds, but this window offers the best achievable balance.'
    );
  }

  // 1. Renewable availability contribution
  if (candidate.avgRenewableAvailability >= 50) {
    parts.push(`Capitalizes on high renewable generation (~${Math.round(candidate.avgRenewableAvailability)}%).`);
  } else if (candidate.avgRenewableAvailability >= 25) {
    parts.push(`Utilizes moderate renewable generation (~${Math.round(candidate.avgRenewableAvailability)}%).`);
  }

  // 2. Peak grid avoidance contribution
  if (candidate.avgGridDemand <= 40) {
    parts.push(`Avoids grid stress during low average demand (~${Math.round(candidate.avgGridDemand)}%).`);
  } else if (candidate.avgGridDemand >= 70) {
    parts.push(`Accepts higher grid load (~${Math.round(candidate.avgGridDemand)}%) due to tighter schedule constraints.`);
  }

  // 3. Tariff optimization
  if (candidate.avgPrice !== null && candidate.avgPrice !== undefined) {
    parts.push(`Optimizes electricity tariff at $${candidate.avgPrice.toFixed(4)}/kWh.`);
  }

  // 4. Deadline buffer
  const slackMs = deadline.getTime() - new Date(candidate.end).getTime();
  const slackMinutes = Math.round(slackMs / (60 * 1000));
  if (slackMinutes > 0) {
    const slackHours = Math.round((slackMinutes / 60) * 10) / 10;
    parts.push(`Completes with a ${slackHours}h buffer before deadline.`);
  } else {
    parts.push('Completes exactly at deadline boundary.');
  }

  return parts.join(' ');
}

/**
 * Intelligent Scheduling Engine Orchestrator
 * 
 * Evaluates candidate windows within [device.earliestStart, device.deadline],
 * applies multi-objective weighted scoring, and resolves the optimal recommendation.
 * 
 * RESOLUTION CONTRACT:
 * - If validation fails -> { outcome: 'INVALID_REQUEST', reason }
 * - If no window physically fits duration -> { outcome: 'NO_FEASIBLE_SLOT' }
 * - If best candidate score >= minIdealScore -> { outcome: 'OK', window, score, isBestEffort: false, reason }
 * - If best candidate score < minIdealScore -> { outcome: 'OK', window, score, isBestEffort: true, reason }
 * 
 * @param {object} device - Device constraints & parameters
 * @param {Array<object>} timeSlots - Available time slots from energy provider
 * @param {typeof defaultSchedulingConfig} [config=defaultSchedulingConfig] - Engine config
 * @param {Date|string|number} [now=new Date()] - Reference point in time
 * @returns {{
 *   outcome: 'OK' | 'NO_FEASIBLE_SLOT' | 'INVALID_REQUEST',
 *   window?: object,
 *   score?: number,
 *   isBestEffort?: boolean,
 *   reason?: string
 * }} Scheduling recommendation result
 */
function recommendSchedule(device, timeSlots, config = defaultSchedulingConfig, now = new Date()) {
  // 1. Initial Request Validation
  const validation = validateSchedulingRequest(device, now);
  if (!validation.valid) {
    return {
      outcome: 'INVALID_REQUEST',
      reason: validation.reason,
    };
  }

  // 2. Duration Model: Calculate continuous minutes required
  const requiredDurationMinutes = computeRequiredDurationMinutes(device, config);

  const earliest = new Date(device.earliestStart).getTime();
  const deadline = new Date(device.deadline).getTime();

  // 3. Structural Constraint: Pre-filter slots strictly within [earliestStart, deadline]
  const boundedSlots = (Array.isArray(timeSlots) ? timeSlots : []).filter((slot) => {
    const sStart = new Date(slot.start).getTime();
    const sEnd = new Date(slot.end).getTime();
    return sStart >= earliest && sEnd <= deadline;
  });

  // 4. Candidate Generation: Produce all contiguous runs satisfying requiredDurationMinutes
  const candidates = generateCandidateWindows(
    boundedSlots,
    requiredDurationMinutes,
    config.slotSearchGranularityMinutes
  );

  // 5. Hard Infeasibility: No candidate window fits between earliestStart and deadline
  if (candidates.length === 0) {
    return { outcome: 'NO_FEASIBLE_SLOT' };
  }

  // 6. Multi-Objective Scoring
  const { W_RENEWABLE, W_PEAK, W_PRICE, W_DEADLINE, W_FLEXIBILITY } = config.weights;

  const scoredCandidates = candidates.map((candidate) => {
    const sRenewable = renewableBenefit(candidate);
    const sPeak = peakReductionBenefit(candidate);
    const sPrice = priceBenefit(candidate, candidates);
    const sDeadline = deadlineFeasibility(candidate, device);
    const sFlex = flexibilitySuitability(candidate, device, candidates);

    const compositeScore =
      W_RENEWABLE * sRenewable +
      W_PEAK * sPeak +
      W_PRICE * sPrice +
      W_DEADLINE * sDeadline +
      W_FLEXIBILITY * sFlex;

    const finalScore = Math.round(compositeScore * 10000) / 10000;

    return {
      ...candidate,
      score: finalScore,
      scoreBreakdown: { sRenewable, sPeak, sPrice, sDeadline, sFlex },
    };
  });

  // 7. Pick the highest scoring candidate (tie-break on earliest start time)
  scoredCandidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });

  const bestCandidate = scoredCandidates[0];

  // 8. Critical Invariant Assertion: Must never violate deadline or earliestStart
  const bestStart = new Date(bestCandidate.start).getTime();
  const bestEnd = new Date(bestCandidate.end).getTime();
  if (bestStart < earliest || bestEnd > deadline) {
    throw new Error(
      `CRITICAL INVARIANT VIOLATION: Recommended window [${new Date(bestStart).toISOString()} - ${new Date(bestEnd).toISOString()}] violates device bounds [${new Date(earliest).toISOString()} - ${new Date(deadline).toISOString()}]`
    );
  }

  // 9. Ideal vs Best-Effort Resolution
  const isBestEffort = bestCandidate.score < config.minIdealScore;
  const reason = _buildExplanationReason(bestCandidate, isBestEffort, new Date(deadline));

  return {
    outcome: 'OK',
    window: {
      start: bestCandidate.start,
      end: bestCandidate.end,
      avgRenewableAvailability: bestCandidate.avgRenewableAvailability,
      avgGridDemand: bestCandidate.avgGridDemand,
      avgPrice: bestCandidate.avgPrice,
      source: bestCandidate.source,
    },
    score: bestCandidate.score,
    isBestEffort,
    reason,
  };
}

module.exports = {
  validateSchedulingRequest,
  recommendSchedule,
};
