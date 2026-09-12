/**
 * Energy Configuration Module
 * 
 * Centralizes all parameters, environmental overrides, and physical constants
 * used across the energy calculation, forecasting, and simulation systems.
 * 
 * NO HARDCODING RULE: Real-world assumptions, peak hours, weights, and timeouts
 * must reside here as named, documented constants with sensible fallbacks.
 */

// ==========================================
// 1. Live API & Communication Constants
// ==========================================

/** Default timeout for external energy API requests in milliseconds (5 seconds) */
const DEFAULT_API_TIMEOUT_MS = 5000;

/** Default base URL for live grid energy telemetry (India Energy Atlas bare origin) */
const DEFAULT_LIVE_API_BASE_URL = 'https://api.energymap.in';

/** Default max retry attempts for transient external energy API errors (429/5xx) */
const DEFAULT_API_MAX_RETRIES = 3;

// ==========================================
// 1b. India Energy Atlas Normalization & Proxy Constants
// ==========================================

/** Carbon intensity of coal-heavy dirty grid mix proxy in gCO2/kWh */
const DEFAULT_CARBON_INTENSITY_DIRTY_GCO2_KWH = 950;

/** Carbon intensity of clean renewable grid mix proxy in gCO2/kWh */
const DEFAULT_CARBON_INTENSITY_CLEAN_GCO2_KWH = 300;

/** Minimum national grid demand baseline in MW (approx. all-India off-peak trough) */
const DEFAULT_GRID_DEMAND_MIN_MW = 120000;

/** Maximum national grid demand ceiling in MW (approx. all-India summer peak) */
const DEFAULT_GRID_DEMAND_MAX_MW = 260000;

/** Freshness TTL window in minutes for caching live energy condition documents */
const DEFAULT_LIVE_DATA_CACHE_TTL_MINUTES = 15;

// ==========================================
// 2. Forecast & Scheduling Window Constants
// ==========================================

/** Default forward-looking forecast horizon in hours (24-hour day-ahead horizon) */
const DEFAULT_FORECAST_HOURS = 24;

/** Maximum allowable forward-looking forecast horizon in hours (7 days / 168 hours) */
const DEFAULT_MAX_FORECAST_HOURS = 168;

/** Default duration for discrete time evaluation slots in minutes (30-minute settlement intervals) */
const DEFAULT_SLOT_MINUTES = 30;

// ==========================================
// 3. Solar & Renewable Model Constants
// ==========================================

/** Hour of sunrise in local solar time (06:00 / 6 AM) */
const DEFAULT_SUNRISE_HOUR = 6.0;

/** Hour of sunset in local solar time (18:00 / 6 PM) */
const DEFAULT_SUNSET_HOUR = 18.0;

/** Maximum theoretical renewable availability percentage under peak generation conditions */
const DEFAULT_MAX_RENEWABLE_AVAILABILITY = 100.0;

/** Baseline minimum renewable percentage (e.g. baseline hydro, geothermal, or overnight wind) */
const DEFAULT_BASELINE_RENEWABLE_AVAILABILITY = 5.0;

// ==========================================
// 4. Grid Demand Model Constants
// ==========================================

/** Time of morning residential/commercial demand peak in hours (08:30 AM) */
const DEFAULT_MORNING_PEAK_HOUR = 8.5;

/** Time of evening domestic cooking/lighting/HVAC peak in hours (19:30 / 7:30 PM) */
const DEFAULT_EVENING_PEAK_HOUR = 19.5;

/** Standard deviation / Gaussian width of demand peaks in hours (spread of peak activity) */
const DEFAULT_PEAK_WIDTH_HOURS = 2.5;

/** Weight / percentage contribution of the morning peak above baseline */
const DEFAULT_MORNING_PEAK_WEIGHT = 35.0;

/** Weight / percentage contribution of the evening peak above baseline */
const DEFAULT_EVENING_PEAK_WEIGHT = 45.0;

/** Minimum base-load demand across the grid as a percentage */
const DEFAULT_BASELINE_DEMAND = 20.0;

// ==========================================
// 5. Deterministic Daily Variation Constants
// ==========================================

/** Maximum daily fluctuation percentage applied via seeded pseudo-random date hashing (+/- 8%) */
const DEFAULT_DATE_VARIATION_AMPLITUDE = 0.08;

// ==========================================
// 6. Synthetic Dynamic Pricing Constants
// ==========================================

/** Baseline grid electricity rate in $/kWh */
const DEFAULT_BASE_PRICE = 0.15;

/** Price reduction rate per unit of renewable availability in $/kWh */
const DEFAULT_PRICE_RENEWABLE_DISCOUNT_FACTOR = 0.0008;

/** Price increase rate per unit of grid demand in $/kWh */
const DEFAULT_PRICE_DEMAND_SURCHARGE_FACTOR = 0.0012;

/** Absolute floor electricity price in $/kWh */
const DEFAULT_MIN_PRICE = 0.04;

/** Absolute ceiling electricity price in $/kWh */
const DEFAULT_MAX_PRICE = 0.40;

// ==========================================
// Derived Solar Peak Calculation
// ==========================================

const sunrise = process.env.SOLAR_SUNRISE_HOUR 
  ? parseFloat(process.env.SOLAR_SUNRISE_HOUR) 
  : DEFAULT_SUNRISE_HOUR;

const sunset = process.env.SOLAR_SUNSET_HOUR 
  ? parseFloat(process.env.SOLAR_SUNSET_HOUR) 
  : DEFAULT_SUNSET_HOUR;

/**
 * Peak solar hour derived strictly as the midpoint between sunrise and sunset.
 * Shifting sunrise or sunset dynamically recalculates the solar zenith.
 */
const peakSolarHour = (sunrise + sunset) / 2.0;

// ==========================================
// Master Configuration Export
// ==========================================

const energyConfig = {
  /**
   * Flag determining whether to force the deterministic simulation provider.
   * Loaded from process.env.DEMO_MODE ('true' -> true).
   */
  demoMode: process.env.DEMO_MODE === 'true',

  /**
   * External live energy provider configuration and credentials.
   */
  liveApi: {
    baseUrl: (process.env.ENERGY_API_BASE_URL || DEFAULT_LIVE_API_BASE_URL).replace(/\/+$/, ''),
    apiKey: process.env.ENERGY_API_KEY || process.env.ENERGY_PROVIDER_API_KEY || null,
    timeoutMs: process.env.ENERGY_API_TIMEOUT_MS 
      ? parseInt(process.env.ENERGY_API_TIMEOUT_MS, 10) 
      : DEFAULT_API_TIMEOUT_MS,
    maxRetries: process.env.ENERGY_API_MAX_RETRIES
      ? parseInt(process.env.ENERGY_API_MAX_RETRIES, 10)
      : DEFAULT_API_MAX_RETRIES,
  },

  /**
   * Carbon intensity proxy parameters for converting gCO2/kWh into renewable availability %.
   */
  carbonIntensityDirtyGco2Kwh: process.env.CARBON_INTENSITY_DIRTY_GCO2_KWH
    ? parseFloat(process.env.CARBON_INTENSITY_DIRTY_GCO2_KWH)
    : DEFAULT_CARBON_INTENSITY_DIRTY_GCO2_KWH,

  carbonIntensityCleanGco2Kwh: process.env.CARBON_INTENSITY_CLEAN_GCO2_KWH
    ? parseFloat(process.env.CARBON_INTENSITY_CLEAN_GCO2_KWH)
    : DEFAULT_CARBON_INTENSITY_CLEAN_GCO2_KWH,

  /**
   * National grid demand normalization boundaries in MW (0-100 scale).
   */
  gridDemandMinMw: process.env.GRID_DEMAND_MIN_MW
    ? parseFloat(process.env.GRID_DEMAND_MIN_MW)
    : DEFAULT_GRID_DEMAND_MIN_MW,

  gridDemandMaxMw: process.env.GRID_DEMAND_MAX_MW
    ? parseFloat(process.env.GRID_DEMAND_MAX_MW)
    : DEFAULT_GRID_DEMAND_MAX_MW,

  /**
   * Cache freshness TTL in minutes for live energy telemetry.
   */
  liveDataCacheTtlMinutes: process.env.LIVE_DATA_CACHE_TTL_MINUTES
    ? parseInt(process.env.LIVE_DATA_CACHE_TTL_MINUTES, 10)
    : DEFAULT_LIVE_DATA_CACHE_TTL_MINUTES,

  /**
   * Default forecast horizon in hours.
   */
  defaultForecastHours: process.env.DEFAULT_FORECAST_HOURS 
    ? parseInt(process.env.DEFAULT_FORECAST_HOURS, 10) 
    : DEFAULT_FORECAST_HOURS,

  /**
   * Maximum allowable forecast horizon in hours to reject excessive horizon requests.
   */
  maxForecastHours: process.env.MAX_FORECAST_HOURS
    ? parseInt(process.env.MAX_FORECAST_HOURS, 10)
    : DEFAULT_MAX_FORECAST_HOURS,

  /**
   * Default slot duration in minutes for discrete schedule evaluation.
   */
  defaultSlotMinutes: process.env.DEFAULT_SLOT_MINUTES
    ? parseInt(process.env.DEFAULT_SLOT_MINUTES, 10)
    : DEFAULT_SLOT_MINUTES,

  /**
   * Solar diurnal curve model parameters.
   */
  solarModel: {
    sunriseHour: sunrise,
    sunsetHour: sunset,
    peakSolarHour: peakSolarHour,
    maxAvailability: DEFAULT_MAX_RENEWABLE_AVAILABILITY,
    baselineAvailability: DEFAULT_BASELINE_RENEWABLE_AVAILABILITY,
  },

  /**
   * Grid demand twin-peak Gaussian model parameters.
   */
  demandModel: {
    morningPeakHour: process.env.DEMAND_MORNING_PEAK_HOUR 
      ? parseFloat(process.env.DEMAND_MORNING_PEAK_HOUR) 
      : DEFAULT_MORNING_PEAK_HOUR,
    eveningPeakHour: process.env.DEMAND_EVENING_PEAK_HOUR 
      ? parseFloat(process.env.DEMAND_EVENING_PEAK_HOUR) 
      : DEFAULT_EVENING_PEAK_HOUR,
    peakWidthHours: process.env.DEMAND_PEAK_WIDTH_HOURS 
      ? parseFloat(process.env.DEMAND_PEAK_WIDTH_HOURS) 
      : DEFAULT_PEAK_WIDTH_HOURS,
    morningPeakWeight: process.env.DEMAND_MORNING_PEAK_WEIGHT 
      ? parseFloat(process.env.DEMAND_MORNING_PEAK_WEIGHT) 
      : DEFAULT_MORNING_PEAK_WEIGHT,
    eveningPeakWeight: process.env.DEMAND_EVENING_PEAK_WEIGHT 
      ? parseFloat(process.env.DEMAND_EVENING_PEAK_WEIGHT) 
      : DEFAULT_EVENING_PEAK_WEIGHT,
    baselineDemand: process.env.DEMAND_BASELINE 
      ? parseFloat(process.env.DEMAND_BASELINE) 
      : DEFAULT_BASELINE_DEMAND,
  },

  /**
   * Parameters for deterministic date variation (reproducible seed PRNG).
   */
  variationModel: {
    dateVariationAmplitude: DEFAULT_DATE_VARIATION_AMPLITUDE,
  },

  /**
   * Dynamic synthetic electricity price curve parameters.
   */
  priceModel: {
    basePrice: DEFAULT_BASE_PRICE,
    renewableDiscountFactor: DEFAULT_PRICE_RENEWABLE_DISCOUNT_FACTOR,
    demandSurchargeFactor: DEFAULT_PRICE_DEMAND_SURCHARGE_FACTOR,
    minPrice: DEFAULT_MIN_PRICE,
    maxPrice: DEFAULT_MAX_PRICE,
  },
};

// Attach named constants for direct destructuring or inspection
energyConfig.DEFAULT_API_MAX_RETRIES = DEFAULT_API_MAX_RETRIES;
energyConfig.DEFAULT_CARBON_INTENSITY_DIRTY_GCO2_KWH = DEFAULT_CARBON_INTENSITY_DIRTY_GCO2_KWH;
energyConfig.DEFAULT_CARBON_INTENSITY_CLEAN_GCO2_KWH = DEFAULT_CARBON_INTENSITY_CLEAN_GCO2_KWH;
energyConfig.DEFAULT_GRID_DEMAND_MIN_MW = DEFAULT_GRID_DEMAND_MIN_MW;
energyConfig.DEFAULT_GRID_DEMAND_MAX_MW = DEFAULT_GRID_DEMAND_MAX_MW;
energyConfig.DEFAULT_LIVE_DATA_CACHE_TTL_MINUTES = DEFAULT_LIVE_DATA_CACHE_TTL_MINUTES;

module.exports = energyConfig;
