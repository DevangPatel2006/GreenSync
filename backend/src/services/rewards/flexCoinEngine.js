const defaultRewardsConfig = require('../../config/rewardsConfig');
const { normalize } = require('./normalizeModel');
const { deriveWasScarceWindow } = require('./scarcityModel');

/**
 * Calculates FlexCoins and detailed contribution breakdown for an accepted schedule.
 * 
 * Formula (Handbook Section 18):
 *   renewablePoints  = schedule.renewableUtilization * W_RENEWABLE (0.4)
 *   peakPoints       = schedule.peakReduction * W_PEAK (0.3)
 *   shiftPoints      = normalize(schedule.energyShifted) * W_SHIFT (0.15)
 *   flexibilityBonus = FLEX_BONUS[device.flexibility] * W_FLEXIBILITY (0.1)
 *   urgencyBonus     = wasScarceWindow ? FLAT_URGENCY_BONUS (5) : 0
 *   coins            = round(sum of the above)
 * 
 * @param {object} schedule - Evaluated schedule record
 * @param {number} schedule.renewableUtilization - 0-100 percentage
 * @param {number} schedule.peakReduction - 0-100 percentage
 * @param {number} schedule.energyShifted - Energy shifted in kWh
 * @param {object} [device] - Associated device record
 * @param {string} [device.flexibility='medium'] - 'low' | 'medium' | 'high'
 * @param {typeof defaultRewardsConfig} [config=defaultRewardsConfig] - Rewards configuration
 * @returns {{
 *   coins: number,
 *   breakdown: {
 *     renewablePoints: number,
 *     peakPoints: number,
 *     shiftPoints: number,
 *     flexibilityBonus: number,
 *     urgencyBonus: number,
 *   },
 *   wasScarceWindow: boolean
 * }}
 */
function calculateFlexCoins(schedule, device = {}, config = defaultRewardsConfig) {
  if (!schedule || typeof schedule !== 'object') {
    throw new Error('Invalid schedule payload provided to calculateFlexCoins');
  }

  const { W_RENEWABLE, W_PEAK, W_SHIFT, W_FLEXIBILITY } = config.weights;

  // 1. Renewable Contribution (0 - 40 points)
  const renUtil = Math.max(0, Math.min(100, Number(schedule.renewableUtilization) || 0));
  const renewablePoints = renUtil * W_RENEWABLE;

  // 2. Peak Reduction Contribution (0 - 30 points)
  const peakRed = Math.max(0, Math.min(100, Number(schedule.peakReduction) || 0));
  const peakPoints = peakRed * W_PEAK;

  // 3. Normalized Energy Shift Contribution (0 - 15 points)
  const normalizedShift = normalize(schedule.energyShifted, config);
  const shiftPoints = normalizedShift * W_SHIFT;

  // 4. Device Operational Flexibility Bonus (0 - 10 points)
  const flexKey = (device && device.flexibility && typeof device.flexibility === 'string')
    ? device.flexibility.trim().toLowerCase()
    : 'medium';

  const flexScore = (config.flexBonus && config.flexBonus[flexKey] !== undefined)
    ? config.flexBonus[flexKey]
    : (config.flexBonus ? config.flexBonus.medium : 65);

  const flexibilityBonus = flexScore * W_FLEXIBILITY;

  // 5. Scarcity / Urgency Window Bonus (0 or 5 points)
  const wasScarceWindow = deriveWasScarceWindow(schedule, config);
  const urgencyBonus = wasScarceWindow ? (Number(config.flatUrgencyBonus) || 5) : 0;

  // 6. Sum & Round to Integer Coins
  const rawTotal = renewablePoints + peakPoints + shiftPoints + flexibilityBonus + urgencyBonus;
  const maxCap = config.theoreticalMaxCoins || 100;
  const coins = Math.max(0, Math.min(maxCap, Math.round(rawTotal)));

  return {
    coins,
    breakdown: {
      renewablePoints: Math.round(renewablePoints * 100) / 100,
      peakPoints: Math.round(peakPoints * 100) / 100,
      shiftPoints: Math.round(shiftPoints * 100) / 100,
      flexibilityBonus: Math.round(flexibilityBonus * 100) / 100,
      urgencyBonus,
    },
    wasScarceWindow,
  };
}

/**
 * Classifies the dominant contributor category for a reward allocation.
 * Used to populate RewardTransaction.impactType ('renewable' | 'peak_reduction' | 'bonus').
 * 
 * Logic compares the respective point yields:
 * - 'renewable': if renewablePoints is the greatest contributor
 * - 'peak_reduction': if peakPoints is the greatest contributor
 * - 'bonus': if flexibility and scarcity bonuses combined exceed renewable and peak yields
 * 
 * @param {object} breakdown - Points breakdown
 * @param {number} [breakdown.renewablePoints]
 * @param {number} [breakdown.peakPoints]
 * @param {number} [breakdown.shiftPoints]
 * @param {number} [breakdown.flexibilityBonus]
 * @param {number} [breakdown.urgencyBonus]
 * @returns {'renewable' | 'peak_reduction' | 'bonus'}
 */
function classifyImpactType(breakdown) {
  if (!breakdown || typeof breakdown !== 'object') {
    return 'renewable';
  }

  const renewable = Number(breakdown.renewablePoints) || 0;
  const peak = Number(breakdown.peakPoints) || 0;
  
  // Aggregate all bonus incentives
  const bonus = (Number(breakdown.flexibilityBonus) || 0) +
                (Number(breakdown.urgencyBonus) || 0) +
                (Number(breakdown.bonus) || 0) +
                (Number(breakdown.bonusPoints) || 0);

  if (renewable >= peak && renewable >= bonus) {
    return 'renewable';
  }

  if (peak >= renewable && peak >= bonus) {
    return 'peak_reduction';
  }

  return 'bonus';
}

/**
 * Formulates a clear, transparent explanation for the FlexCoin reward.
 * 
 * COMPLIANCE RULE (Handbook Section 6):
 * FlexCoins must never imply real currency or charitable/NGO donations are being sent.
 * Any generated explanation text must explicitly frame FlexCoins as an "Impact Simulation" metric.
 * 
 * @param {object} schedule - Schedule details
 * @param {object} breakdown - Scored point breakdown
 * @param {number} coins - Total awarded FlexCoins
 * @returns {string} Plain-language explanation string
 */
function buildRewardExplanation(schedule, breakdown, coins) {
  const parts = [];

  parts.push(`Earned ${coins} FlexCoins in Impact Simulation.`);

  if (breakdown.renewablePoints > 0) {
    const renPct = Math.round(Number(schedule.renewableUtilization) || 0);
    parts.push(`Capitalized on clean energy generation (${renPct}% renewable, +${breakdown.renewablePoints.toFixed(1)} pts).`);
  }

  if (breakdown.peakPoints > 0) {
    const peakPct = Math.round(Number(schedule.peakReduction) || 0);
    parts.push(`Avoided grid stress periods (${peakPct}% peak reduction, +${breakdown.peakPoints.toFixed(1)} pts).`);
  }

  if (breakdown.shiftPoints > 0) {
    parts.push(`Shifted ${schedule.energyShifted} kWh of flexible demand (+${breakdown.shiftPoints.toFixed(1)} pts).`);
  }

  if (breakdown.urgencyBonus > 0) {
    parts.push(`Awarded grid scarcity window bonus (+${breakdown.urgencyBonus} pts).`);
  } else if (breakdown.flexibilityBonus > 0) {
    parts.push(`Recognized device flexibility setting (+${breakdown.flexibilityBonus.toFixed(1)} pts).`);
  }

  parts.push('(Simulated environmental impact metric — not a monetary payment or charitable donation).');

  return parts.join(' ');
}

module.exports = {
  calculateFlexCoins,
  classifyImpactType,
  buildRewardExplanation,
};
