/**
 * Rewards & FlexCoin Engine Configuration
 * 
 * Centralizes all scoring weights, bonuses, normalization caps, and scarcity thresholds
 * for the GreenSync FlexCoin & Impact Engine (Handbook Section 18).
 * 
 * NO HARDCODING RULE: Every weight, threshold, and bonus factor is exposed as an
 * env-overridable named constant with sensible defaults — zero magic numbers in engine logic.
 */

// ==========================================
// 1. Core Multi-Factor Weights
// ==========================================

/** Weight for renewable availability contribution (40%) */
const DEFAULT_W_RENEWABLE = 0.40;

/** Weight for peak demand reduction contribution (30%) */
const DEFAULT_W_PEAK = 0.30;

/** Weight for normalized energy load shift contribution (15%) */
const DEFAULT_W_SHIFT = 0.15;

/** Weight for device flexibility bonus contribution (10%) */
const DEFAULT_W_FLEXIBILITY = 0.10;

const W_RENEWABLE = process.env.REWARDS_WEIGHT_RENEWABLE || process.env.FLEXCOIN_WEIGHT_RENEWABLE
  ? parseFloat(process.env.REWARDS_WEIGHT_RENEWABLE || process.env.FLEXCOIN_WEIGHT_RENEWABLE)
  : DEFAULT_W_RENEWABLE;

const W_PEAK = process.env.REWARDS_WEIGHT_PEAK || process.env.FLEXCOIN_WEIGHT_PEAK
  ? parseFloat(process.env.REWARDS_WEIGHT_PEAK || process.env.FLEXCOIN_WEIGHT_PEAK)
  : DEFAULT_W_PEAK;

const W_SHIFT = process.env.REWARDS_WEIGHT_SHIFT || process.env.FLEXCOIN_WEIGHT_SHIFT
  ? parseFloat(process.env.REWARDS_WEIGHT_SHIFT || process.env.FLEXCOIN_WEIGHT_SHIFT)
  : DEFAULT_W_SHIFT;

const W_FLEXIBILITY = process.env.REWARDS_WEIGHT_FLEXIBILITY || process.env.FLEXCOIN_WEIGHT_FLEXIBILITY
  ? parseFloat(process.env.REWARDS_WEIGHT_FLEXIBILITY || process.env.FLEXCOIN_WEIGHT_FLEXIBILITY)
  : DEFAULT_W_FLEXIBILITY;

// ==========================================
// 2. Bonus Factors & Flexibility Scale
// ==========================================

/** Flat bonus awarded when a schedule operates in a critical grid scarcity window */
const DEFAULT_FLAT_URGENCY_BONUS = 5;

const FLAT_URGENCY_BONUS = process.env.REWARDS_URGENCY_BONUS || process.env.FLEXCOIN_URGENCY_BONUS
  ? parseFloat(process.env.REWARDS_URGENCY_BONUS || process.env.FLEXCOIN_URGENCY_BONUS)
  : DEFAULT_FLAT_URGENCY_BONUS;

/** 
 * Device flexibility bonus scale (0-100 score).
 * Higher user-granted device flexibility enables greater grid responsiveness.
 */
const DEFAULT_FLEX_BONUS_LOW = 30;
const DEFAULT_FLEX_BONUS_MEDIUM = 65;
const DEFAULT_FLEX_BONUS_HIGH = 100;

const FLEX_BONUS_LOW = process.env.FLEX_BONUS_LOW
  ? parseFloat(process.env.FLEX_BONUS_LOW)
  : DEFAULT_FLEX_BONUS_LOW;

const FLEX_BONUS_MEDIUM = process.env.FLEX_BONUS_MEDIUM
  ? parseFloat(process.env.FLEX_BONUS_MEDIUM)
  : DEFAULT_FLEX_BONUS_MEDIUM;

const FLEX_BONUS_HIGH = process.env.FLEX_BONUS_HIGH
  ? parseFloat(process.env.FLEX_BONUS_HIGH)
  : DEFAULT_FLEX_BONUS_HIGH;

// ==========================================
// 3. Energy Shift Normalization Baseline
// ==========================================

/**
 * Maximum expected continuous energy shift in kWh used as normalization ceiling (100%).
 * Typical residential Level 2 EV charging sessions or heavy equipment load (~50 kWh).
 */
const DEFAULT_MAX_EXPECTED_ENERGY_SHIFT_KWH = 50.0;

const MAX_EXPECTED_ENERGY_SHIFT_KWH = process.env.REWARDS_MAX_EXPECTED_ENERGY_SHIFT_KWH || process.env.MAX_EXPECTED_ENERGY_SHIFT_KWH
  ? parseFloat(process.env.REWARDS_MAX_EXPECTED_ENERGY_SHIFT_KWH || process.env.MAX_EXPECTED_ENERGY_SHIFT_KWH)
  : DEFAULT_MAX_EXPECTED_ENERGY_SHIFT_KWH;

// ==========================================
// 4. Scarcity Window Thresholds
// ==========================================

/**
 * Renewable availability threshold (%) above which a window qualifies for scarcity response.
 */
const DEFAULT_SCARCITY_RENEWABLE_THRESHOLD = 75.0;

/**
 * Peak grid demand reduction threshold (%) above which a window qualifies for scarcity response.
 */
const DEFAULT_SCARCITY_PEAK_THRESHOLD = 20.0;

const SCARCITY_RENEWABLE_THRESHOLD = process.env.REWARDS_SCARCITY_RENEWABLE_THRESHOLD || process.env.SCARCITY_RENEWABLE_THRESHOLD
  ? parseFloat(process.env.REWARDS_SCARCITY_RENEWABLE_THRESHOLD || process.env.SCARCITY_RENEWABLE_THRESHOLD)
  : DEFAULT_SCARCITY_RENEWABLE_THRESHOLD;

const SCARCITY_PEAK_THRESHOLD = process.env.REWARDS_SCARCITY_PEAK_THRESHOLD || process.env.SCARCITY_PEAK_THRESHOLD
  ? parseFloat(process.env.REWARDS_SCARCITY_PEAK_THRESHOLD || process.env.SCARCITY_PEAK_THRESHOLD)
  : DEFAULT_SCARCITY_PEAK_THRESHOLD;

// ==========================================
// 5. Startup Assertions & Theoretical Ceiling
// ==========================================

/**
 * Theoretical maximum coins achievable per schedule:
 * 100 * (W_RENEWABLE + W_PEAK + W_SHIFT + (FLEX_BONUS_HIGH / 100) * W_FLEXIBILITY) + FLAT_URGENCY_BONUS
 * On the default scale: 100*(0.40 + 0.30 + 0.15 + 0.10) + 5 = 95 + 5 = 100 coins.
 */
const coreWeightPotential = 100 * (W_RENEWABLE + W_PEAK + W_SHIFT + (FLEX_BONUS_HIGH / 100) * W_FLEXIBILITY);
const theoreticalMaxCoins = coreWeightPotential + FLAT_URGENCY_BONUS;

if (theoreticalMaxCoins > 100.001) {
  throw new Error(
    `[RewardsConfig] Invalid rewards configuration: theoretical max coins (${theoreticalMaxCoins.toFixed(2)}) exceeds 100 on a 0-100 coin scale.`
  );
}

// Log startup confirmation and theoretical maximum
console.log(`[RewardsConfig] Initialized. Theoretical max FlexCoins achievable per schedule: ${theoreticalMaxCoins.toFixed(1)}.`);

const rewardsConfig = {
  weights: {
    W_RENEWABLE,
    W_PEAK,
    W_SHIFT,
    W_FLEXIBILITY,
  },
  flatUrgencyBonus: FLAT_URGENCY_BONUS,
  flexBonus: {
    low: FLEX_BONUS_LOW,
    medium: FLEX_BONUS_MEDIUM,
    high: FLEX_BONUS_HIGH,
  },
  maxExpectedEnergyShiftKwh: MAX_EXPECTED_ENERGY_SHIFT_KWH,
  scarcityRenewableThreshold: SCARCITY_RENEWABLE_THRESHOLD,
  scarcityPeakThreshold: SCARCITY_PEAK_THRESHOLD,
  theoreticalMaxCoins,
};

module.exports = rewardsConfig;
