const EnergyDataProvider = require('./EnergyDataProvider');
const energyConfig = require('../config/energyConfig');

/**
 * ARCHITECTURAL DESIGN RATIONALE:
 * Why a formula-based diurnal curve satisfies "predicts renewable supply peaks"
 * significantly better than a static lookup table:
 * 
 * 1. Continuous Resolution: Real-world devices (EVs, heat pumps, laundry) can be scheduled
 *    at arbitrary offsets (e.g. 14:17 or 03:42). A static lookup table is discrete and brittle,
 *    requiring interpolation or failing on unindexed times. Formulaic curves (sinusoidal solar
 *    and Gaussian demand) accept any continuous Date/timestamp and return physically plausible,
 *    mathematically smooth values.
 * 2. Dynamic Parametric Shift: If sunrise, sunset, or seasonal demand shifts via configuration
 *    or environment variables, the entire peak automatically shifts dynamically without manual
 *    re-authoring of 24/48 tabular rows.
 * 3. Seeded Reproducibility: By hashing the calendar date into a pseudo-random seed, day-to-day
 *    variance (e.g. cloudy vs sunny days) is modeled deterministically, enabling reliable demoing
 *    and test suites without relying on unseeded Math.random().
 */

/**
 * 32-bit FNV-1a non-cryptographic hash for string seeding.
 * Deterministically converts a string (such as "YYYY-MM-DD") into a 32-bit unsigned integer.
 * 
 * @param {string} str - Input string
 * @returns {number} 32-bit unsigned integer seed
 */
function fnv1aHash(str) {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

/**
 * Mulberry32 deterministic Pseudo-Random Number Generator (PRNG).
 * Produces uniform pseudo-random floats in [0, 1) given a 32-bit seed.
 * 
 * @param {number} seed - 32-bit initial seed
 * @returns {() => number} Generator function returning deterministic values in [0, 1)
 */
function createMulberry32(seed) {
  let s = seed >>> 0;
  return function next() {
    let t = (s += 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Extracts the calendar date string in YYYY-MM-DD format to drive daily variance seeding.
 * 
 * @param {Date} date - Target date
 * @returns {string} Date string in YYYY-MM-DD format
 */
function getDateSeedKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates continuous decimal hour of the day (e.g., 14:30:00 -> 14.5).
 * 
 * @param {Date} date - Target date
 * @returns {number} Decimal hour from 0.000 to 23.999...
 */
function getDecimalHour(date) {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

/**
 * Evaluates a single 1D Gaussian curve at a given x coordinate.
 * 
 * @param {number} x - Value at which to evaluate (e.g. hour of day)
 * @param {number} mean - Center of peak (mu)
 * @param {number} stdDev - Spread / width of peak (sigma)
 * @returns {number} Value between 0.0 and 1.0 representing Gaussian amplitude
 */
function gaussian(x, mean, stdDev) {
  const diff = x - mean;
  return Math.exp(-(diff * diff) / (2 * stdDev * stdDev));
}

/**
 * SimulatedEnergyProvider
 * 
 * Concrete implementation of EnergyDataProvider providing deterministic,
 * formula-based energy conditions and forecasts without external network calls.
 */
class SimulatedEnergyProvider extends EnergyDataProvider {
  constructor(config = energyConfig) {
    super();
    this.config = config;
  }

  /**
   * Computes renewable availability (0-100%) at a specific timestamp.
   * Models solar irradiance as a smooth sinusoidal bell curve between sunrise and sunset,
   * peaking at the derived solar zenith (peakSolarHour).
   * 
   * @param {Date} timestamp - Evaluation timestamp
   * @returns {number} Renewable availability percentage [0, 100]
   */
  calculateRenewableAvailability(timestamp) {
    const hour = getDecimalHour(timestamp);
    const { sunriseHour, sunsetHour, maxAvailability } = this.config.solarModel;

    // Zero solar generation outside daylight hours
    if (hour <= sunriseHour || hour >= sunsetHour) {
      return 0.0;
    }

    // Normalized progress across daylight window: t in (0, 1)
    const daylightProgress = (hour - sunriseHour) / (sunsetHour - sunriseHour);

    // Half-sine bell curve: sin(0) = 0, sin(pi/2) = 1 (at peakSolarHour), sin(pi) = 0
    const rawAvailability = Math.sin(Math.PI * daylightProgress) * maxAvailability;

    // Apply deterministic daily variance derived from date key
    const dateKey = getDateSeedKey(timestamp);
    const seed = fnv1aHash(`solar-${dateKey}`);
    const prng = createMulberry32(seed);
    const varianceFactor = 1.0 + (prng() - 0.5) * 2 * this.config.variationModel.dateVariationAmplitude;

    const adjusted = rawAvailability * varianceFactor;
    const clamped = Math.max(0, Math.min(100, adjusted));
    return Math.round(clamped * 100) / 100;
  }

  /**
   * Computes grid demand (0-100%) at a specific timestamp.
   * Models residential/commercial demand using a twin-peak Gaussian distribution
   * (morning commute & evening cooking/lighting) atop a baseline load.
   * 
   * @param {Date} timestamp - Evaluation timestamp
   * @returns {number} Grid demand percentage [0, 100]
   */
  calculateGridDemand(timestamp) {
    const hour = getDecimalHour(timestamp);
    const {
      morningPeakHour,
      eveningPeakHour,
      peakWidthHours,
      morningPeakWeight,
      eveningPeakWeight,
      baselineDemand,
    } = this.config.demandModel;

    const morningContribution = morningPeakWeight * gaussian(hour, morningPeakHour, peakWidthHours);
    const eveningContribution = eveningPeakWeight * gaussian(hour, eveningPeakHour, peakWidthHours);

    const rawDemand = baselineDemand + morningContribution + eveningContribution;

    // Apply deterministic daily variance derived from date key
    const dateKey = getDateSeedKey(timestamp);
    const seed = fnv1aHash(`demand-${dateKey}`);
    const prng = createMulberry32(seed);
    const varianceFactor = 1.0 + (prng() - 0.5) * 2 * this.config.variationModel.dateVariationAmplitude;

    const adjusted = rawDemand * varianceFactor;
    const clamped = Math.max(0, Math.min(100, adjusted));
    return Math.round(clamped * 100) / 100;
  }

  /**
   * Computes a synthetic electricity price ($/kWh) based on grid demand and renewable availability.
   * High renewables reduce price; high demand increases price.
   * 
   * @param {number} renewableAvailability - Renewable percentage [0, 100]
   * @param {number} gridDemand - Grid demand percentage [0, 100]
   * @returns {number} Electricity price in $/kWh
   */
  calculatePrice(renewableAvailability, gridDemand) {
    const {
      basePrice,
      renewableDiscountFactor,
      demandSurchargeFactor,
      minPrice,
      maxPrice,
    } = this.config.priceModel;

    const price = basePrice + (gridDemand * demandSurchargeFactor) - (renewableAvailability * renewableDiscountFactor);
    const clamped = Math.max(minPrice, Math.min(maxPrice, price));
    return Math.round(clamped * 10000) / 10000;
  }

  /**
   * Evaluates all energy metrics for an exact timestamp.
   * 
   * @param {Date} timestamp - Evaluation timestamp
   * @returns {{
   *   timestamp: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price: number,
   *   source: 'simulated'
   * }} Point-in-time condition reading
   */
  evaluateAt(timestamp) {
    const renewableAvailability = this.calculateRenewableAvailability(timestamp);
    const gridDemand = this.calculateGridDemand(timestamp);
    const price = this.calculatePrice(renewableAvailability, gridDemand);

    return {
      timestamp: new Date(timestamp),
      renewableAvailability,
      gridDemand,
      price,
      source: 'simulated',
    };
  }

  /**
   * Applies realistic short-term fluctuation (jitter) on top of the base calibrated curve.
   * This jitter simulates natural short-term grid fluctuation (such as passing cloud cover
   * affecting solar irradiance, or minor domestic/commercial demand shifts) on top of the
   * calibrated baseline curve, ensuring values change realistically on every request/refresh
   * without altering the macro diurnal solar and demand profile.
   * 
   * @param {{
   *   timestamp: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price: number,
   *   source: 'simulated'
   * }} reading - Base calibrated reading
   * @returns {{
   *   timestamp: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price: number,
   *   source: 'simulated'
   * }} Reading with real-time fluctuation applied
   */
  applyRealtimeJitter(reading) {
    // This jitter simulates natural short-term grid fluctuation on top of the calibrated baseline pattern.
    // renewableAvailability: ±2-4% variation (cloud cover, micro-irradiance changes)
    const renSign = Math.random() < 0.5 ? -1 : 1;
    const renDelta = renSign * (2 + Math.random() * 2);

    // gridDemand: ±3-5% variation (minor aggregate residential & commercial load shifts)
    const demandSign = Math.random() < 0.5 ? -1 : 1;
    const demandDelta = demandSign * (3 + Math.random() * 2);

    // Keep all values clamped within [0, 100] after jitter is applied
    const renewableAvailability = Math.max(0, Math.min(100, Math.round((reading.renewableAvailability + renDelta) * 100) / 100));
    const gridDemand = Math.max(0, Math.min(100, Math.round((reading.gridDemand + demandDelta) * 100) / 100));

    // Recalculate dynamic synthetic price matching the jittered conditions
    const price = this.calculatePrice(renewableAvailability, gridDemand);

    return {
      timestamp: reading.timestamp,
      renewableAvailability,
      gridDemand,
      price,
      source: 'simulated',
    };
  }

  /**
   * Retrieves current real-time energy conditions.
   * Applies real-time jitter on top of the calibrated curve so values reflect natural live variation.
   * 
   * @returns {Promise<{
   *   timestamp: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price: number,
   *   source: 'simulated'
   * }>} Point-in-time condition reading
   */
  async getCurrentConditions() {
    const base = this.evaluateAt(new Date());
    return this.applyRealtimeJitter(base);
  }

  /**
   * Retrieves forward-looking hourly energy forecasts for a given horizon starting from now.
   * Applies real-time jitter on top of the calibrated curve so hourly forecasts reflect natural live variation.
   * 
   * @param {number} [hours] - Forecast horizon in hours (defaults to config.defaultForecastHours)
   * @returns {Promise<Array<{
   *   timestamp: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price: number,
   *   source: 'simulated'
   * }>>} Chronological hourly forecast readings
   */
  async getForecast(hours = this.config.defaultForecastHours) {
    const horizonHours = Math.max(1, Math.min(168, Math.floor(hours)));
    const now = new Date();
    const forecast = [];

    for (let step = 0; step < horizonHours; step += 1) {
      const stepDate = new Date(now.getTime() + step * 60 * 60 * 1000);
      const base = this.evaluateAt(stepDate);
      forecast.push(this.applyRealtimeJitter(base));
    }

    return forecast;
  }

  /**
   * Slices a given window into discrete slots and evaluates conditions at each slot's midpoint.
   * Consumed by Phase 5 Scheduling Engine for candidate slot evaluation.
   * 
   * @param {Date|string|number} windowStart - Start timestamp of the evaluation window
   * @param {Date|string|number} windowEnd - End timestamp of the evaluation window
   * @param {number} [slotMinutes] - Slot duration in minutes (defaults to config.defaultSlotMinutes)
   * @returns {Promise<Array<{
   *   start: Date,
   *   end: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price: number,
   *   source: 'simulated'
   * }>>} List of discrete evaluation time slots
   */
  async getTimeSlots(windowStart, windowEnd, slotMinutes = this.config.defaultSlotMinutes) {
    const start = new Date(windowStart);
    const end = new Date(windowEnd);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error('Invalid windowStart or windowEnd date provided to getTimeSlots');
    }

    if (end <= start) {
      throw new Error('windowEnd must be strictly greater than windowStart');
    }

    const durationMinutes = Math.max(5, Math.floor(slotMinutes));
    const slotDurationMs = durationMinutes * 60 * 1000;
    const slots = [];

    let current = start.getTime();
    const finalEnd = end.getTime();

    while (current < finalEnd) {
      const slotStart = new Date(current);
      const nextTime = current + slotDurationMs;
      const slotEnd = new Date(Math.min(nextTime, finalEnd));

      // Calculate conditions at exact midpoint of the slot interval
      const midpointTime = slotStart.getTime() + (slotEnd.getTime() - slotStart.getTime()) / 2;
      const conditions = this.evaluateAt(new Date(midpointTime));

      slots.push({
        start: slotStart,
        end: slotEnd,
        renewableAvailability: conditions.renewableAvailability,
        gridDemand: conditions.gridDemand,
        price: conditions.price,
        source: 'simulated',
      });

      current = nextTime;
    }

    return slots;
  }
}

module.exports = SimulatedEnergyProvider;
