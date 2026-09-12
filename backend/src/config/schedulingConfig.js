const energyConfig = require('./energyConfig');

/**
 * Scheduling Engine Configuration
 * 
 * Centralizes all scoring weights, device power-rating heuristics, and feasibility
 * thresholds for the GreenSync Intelligent Scheduling Engine (Handbook Section 17).
 * 
 * NO HARDCODING RULE: Every real-world assumption is exposed as an env-overridable
 * named constant with sensible defaults.
 */

// ==========================================
// 1. Multi-Objective Scoring Weights
// ==========================================

/** Weight for renewable availability optimization (35%) */
const DEFAULT_W_RENEWABLE = 0.35;

/** Weight for grid peak reduction / stress avoidance (25%) */
const DEFAULT_W_PEAK = 0.25;

/** Weight for dynamic electricity price minimization (15%) */
const DEFAULT_W_PRICE = 0.15;

/** Weight for deadline buffer / completion slack preservation (15%) */
const DEFAULT_W_DEADLINE = 0.15;

/** Weight for device flexibility positioning suitability (10%) */
const DEFAULT_W_FLEXIBILITY = 0.10;

const W_RENEWABLE = process.env.SCORE_WEIGHT_RENEWABLE 
  ? parseFloat(process.env.SCORE_WEIGHT_RENEWABLE) 
  : DEFAULT_W_RENEWABLE;

const W_PEAK = process.env.SCORE_WEIGHT_PEAK 
  ? parseFloat(process.env.SCORE_WEIGHT_PEAK) 
  : DEFAULT_W_PEAK;

const W_PRICE = process.env.SCORE_WEIGHT_PRICE 
  ? parseFloat(process.env.SCORE_WEIGHT_PRICE) 
  : DEFAULT_W_PRICE;

const W_DEADLINE = process.env.SCORE_WEIGHT_DEADLINE 
  ? parseFloat(process.env.SCORE_WEIGHT_DEADLINE) 
  : DEFAULT_W_DEADLINE;

const W_FLEXIBILITY = process.env.SCORE_WEIGHT_FLEXIBILITY 
  ? parseFloat(process.env.SCORE_WEIGHT_FLEXIBILITY) 
  : DEFAULT_W_FLEXIBILITY;

// Startup Assertion: Scoring weights must sum to 1.0 (+/- epsilon for floating point arithmetic)
const weightSum = W_RENEWABLE + W_PEAK + W_PRICE + W_DEADLINE + W_FLEXIBILITY;
if (Math.abs(weightSum - 1.0) > 0.001) {
  throw new Error(
    `[SchedulingConfig] Invalid scoring configuration: weights must sum to 1.0. Current sum is ${weightSum.toFixed(4)}.`
  );
}

// ==========================================
// 2. Device Power-Rating Assumptions (MVP Model)
// ==========================================

/**
 * ARCHITECTURAL DESIGN NOTE:
 * The Device schema specifies energyRequired in kWh, but does not dictate electrical power draw (kW).
 * To calculate required run-time duration (hours = kWh / kW), the engine relies on assumed average kW ratings.
 * 
 * MVP SIMPLIFYING ASSUMPTION:
 * In a production smart-grid rollout, power ratings are queried from IoT smart plugs or OEM specs.
 * For this hackathon MVP, we map each standard device.type enum to a realistic electrical power profile,
 * with individual environment variable overrides and a reliable default fallback.
 */
const assumedPowerRatingKw = {
  ev_charging: process.env.POWER_RATING_EV_CHARGING_KW 
    ? parseFloat(process.env.POWER_RATING_EV_CHARGING_KW) 
    : 7.2, // Level 2 EVSE home charging (7.2 kW)
  washing_machine: process.env.POWER_RATING_WASHING_MACHINE_KW 
    ? parseFloat(process.env.POWER_RATING_WASHING_MACHINE_KW) 
    : 1.5, // Standard cycle motor + heating element (1.5 kW)
  water_heater: process.env.POWER_RATING_WATER_HEATER_KW 
    ? parseFloat(process.env.POWER_RATING_WATER_HEATER_KW) 
    : 4.0, // Domestic electric resistance/hybrid water heater (4.0 kW)
  battery: process.env.POWER_RATING_BATTERY_KW 
    ? parseFloat(process.env.POWER_RATING_BATTERY_KW) 
    : 3.3, // Residential energy storage charge rate (3.3 kW)
  industrial: process.env.POWER_RATING_INDUSTRIAL_KW 
    ? parseFloat(process.env.POWER_RATING_INDUSTRIAL_KW) 
    : 15.0, // Heavy equipment / 3-phase machinery load (15.0 kW)
  other: process.env.POWER_RATING_OTHER_KW 
    ? parseFloat(process.env.POWER_RATING_OTHER_KW) 
    : 2.0, // Default general load fallback (2.0 kW)
};

// ==========================================
// 3. Fallback & Quality Thresholds
// ==========================================

/**
 * Minimum normalized score (0 to 1) required for a schedule recommendation to be considered "ideal".
 * Any feasible candidate scoring below this threshold is flagged as `isBestEffort: true` per Section 17 & 28.
 */
const DEFAULT_MIN_IDEAL_SCORE = 0.60;

const minIdealScore = process.env.SCHEDULING_MIN_IDEAL_SCORE 
  ? parseFloat(process.env.SCHEDULING_MIN_IDEAL_SCORE) 
  : DEFAULT_MIN_IDEAL_SCORE;

/**
 * Slot search granularity in minutes passed through to energyService.getTimeSlots().
 * Reuses energyConfig.defaultSlotMinutes (30 mins) to maintain consistent system resolution.
 */
const slotSearchGranularityMinutes = process.env.SLOT_SEARCH_GRANULARITY_MINUTES 
  ? parseInt(process.env.SLOT_SEARCH_GRANULARITY_MINUTES, 10) 
  : (energyConfig.defaultSlotMinutes || 30);
// ==========================================
// 4. Environmental & Carbon Intensity Model
// ==========================================

/**
 * Average marginal grid carbon intensity in kg CO2 per kWh.
 * Represents emissions avoided per kWh of consumption shifted to renewable generation versus average grid mix.
 * Default: 0.40 kg CO2 / kWh (~400 gCO2/kWh, typical regional grid emissions factor).
 */
const DEFAULT_GRID_CARBON_INTENSITY_KG_PER_KWH = 0.40;

const gridCarbonIntensityKgPerKwh = process.env.GRID_CARBON_INTENSITY_KG_PER_KWH 
  ? parseFloat(process.env.GRID_CARBON_INTENSITY_KG_PER_KWH) 
  : DEFAULT_GRID_CARBON_INTENSITY_KG_PER_KWH;

const schedulingConfig = {
  weights: {
    W_RENEWABLE,
    W_PEAK,
    W_PRICE,
    W_DEADLINE,
    W_FLEXIBILITY,
  },
  assumedPowerRatingKw,
  minIdealScore,
  slotSearchGranularityMinutes,
  gridCarbonIntensityKgPerKwh,
};

module.exports = schedulingConfig;
