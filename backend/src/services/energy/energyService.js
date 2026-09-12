const { getEnergyProvider } = require('./energyProviderFactory');
let EnergyData;
try {
  EnergyData = require('../../models/EnergyData');
} catch (e) {
  EnergyData = null;
}
const energyConfig = require('../../config/energyConfig');
const logger = require('../../utils/logger');

/**
 * Energy Service Facade
 * 
 * Acts as the centralized domain service for all energy data operations in GreenSync.
 * Implements architectural separation of concerns:
 * - Providers (Live/Simulated) handle raw data computation/retrieval.
 * - EnergyService orchestrates provider acquisition, resilience, and persistence to MongoDB.
 * - Callers (Express controllers, Phase 5 Scheduling Engine, Phase 6 Rewards Engine)
 *   interact solely with this facade without needing to know which provider answered.
 */

/**
 * Safely persists point-in-time condition readings to the database for historical analytics.
 * Non-blocking: Failures to persist (e.g. during testing or if DB is offline) do not throw
 * to avoid degrading real-time requests.
 * 
 * @private
 * @param {Array<object>|object} records - Single condition record or array of records
 */
async function _persistEnergyData(records) {
  try {
    // Only persist if Mongoose is connected (readyState === 1) to avoid buffering delays when DB is offline
    if (!EnergyData || !EnergyData.db || EnergyData.db.readyState !== 1) return;
    const items = Array.isArray(records) ? records : [records];
    if (items.length === 0) return;

    // Filter out undefined prices if omitted to match schema
    const sanitized = items.map((item) => ({
      timestamp: item.timestamp,
      renewableAvailability: item.renewableAvailability,
      gridDemand: item.gridDemand,
      price: item.price !== undefined ? item.price : null,
      source: item.source,
    }));

    if (sanitized.length === 1) {
      await EnergyData.create(sanitized[0]);
    } else {
      await EnergyData.insertMany(sanitized, { ordered: false });
    }
  } catch (err) {
    logger.debug(`[EnergyService] Non-critical persistence failure: ${err.message}`);
  }
}

/**
 * Retrieves current real-time energy grid conditions and persists a snapshot for history.
 * 
 * @returns {Promise<{
 *   timestamp: Date,
 *   renewableAvailability: number,
 *   gridDemand: number,
 *   price?: number,
 *   source: 'live' | 'simulated'
 * }>} Current grid conditions
 */
async function getCurrentConditions() {
  // Check MongoDB cache for fresh live conditions before hitting network/quota
  if (!energyConfig.demoMode && EnergyData && EnergyData.db && EnergyData.db.readyState === 1) {
    try {
      const ttlMinutes = energyConfig.liveDataCacheTtlMinutes || 15;
      const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);
      const cached = await EnergyData.findOne({
        source: 'live',
        createdAt: { $gte: cutoff },
      })
        .sort({ createdAt: -1 })
        .lean();

      if (cached) {
        logger.debug(`[EnergyService] Serving cached live energy conditions from ${cached.createdAt}`);
        return {
          timestamp: cached.timestamp,
          renewableAvailability: cached.renewableAvailability,
          gridDemand: cached.gridDemand,
          price: cached.price !== null && cached.price !== undefined ? cached.price : undefined,
          source: cached.source,
        };
      }
    } catch (err) {
      logger.debug(`[EnergyService] Live cache check failed: ${err.message}`);
    }
  }

  const provider = getEnergyProvider();
  const conditions = await provider.getCurrentConditions();

  // Asynchronously record snapshot for audit and rewards historical baseline
  await _persistEnergyData(conditions);

  return conditions;
}

/**
 * Retrieves forward-looking hourly energy forecasts for a specified horizon.
 * 
 * @param {number} [hours] - Number of hours to forecast (defaults to energyConfig.defaultForecastHours)
 * @returns {Promise<Array<{
 *   timestamp: Date,
 *   renewableAvailability: number,
 *   gridDemand: number,
 *   price?: number,
 *   source: 'live' | 'simulated'
 * }>>} Chronological forecast series
 */
async function getForecast(hours = energyConfig.defaultForecastHours) {
  const provider = getEnergyProvider();
  const forecast = await provider.getForecast(hours);

  // Persist forecast series to DB
  await _persistEnergyData(forecast);

  return forecast;
}

/**
 * Evaluates discrete time slots across an execution window for device scheduling.
 * Directly consumed by Phase 5 (Intelligent Scheduling Engine) to score and rank candidate slots.
 * 
 * @param {Date|string|number} windowStart - Start timestamp of candidate window
 * @param {Date|string|number} windowEnd - End timestamp of candidate window
 * @param {number} [slotMinutes] - Duration of each slot in minutes (defaults to energyConfig.defaultSlotMinutes)
 * @returns {Promise<Array<{
 *   start: Date,
 *   end: Date,
 *   renewableAvailability: number,
 *   gridDemand: number,
 *   price?: number,
 *   source: 'live' | 'simulated'
 * }>>} Discrete evaluation slots with projected metrics
 */
async function getTimeSlots(windowStart, windowEnd, slotMinutes = energyConfig.defaultSlotMinutes) {
  const provider = getEnergyProvider();
  return provider.getTimeSlots(windowStart, windowEnd, slotMinutes);
}

/**
 * Retrieves historical energy grid condition records within a specific time range.
 * Used by Phase 6 (Rewards Engine) to evaluate actual carbon offset and calculate eco-credits.
 * 
 * @param {Date|string|number} startDate - Range start
 * @param {Date|string|number} endDate - Range end
 * @returns {Promise<Array<{
 *   timestamp: Date,
 *   renewableAvailability: number,
 *   gridDemand: number,
 *   price?: number,
 *   source: 'live' | 'simulated'
 * }>>} Historical records
 */
async function getHistoricalConditions(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid startDate or endDate provided');
  }

  return EnergyData.find({
    timestamp: { $gte: start, $lte: end },
  })
    .sort({ timestamp: 1 })
    .lean();
}

module.exports = {
  getCurrentConditions,
  getForecast,
  getTimeSlots,
  getHistoricalConditions,
};
