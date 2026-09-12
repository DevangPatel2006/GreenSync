const energyConfig = require('../../config/energyConfig');
const EnergyDataProvider = require('../../providers/EnergyDataProvider');
const SimulatedEnergyProvider = require('../../providers/SimulatedEnergyProvider');
const { LiveEnergyProvider } = require('../../providers/LiveEnergyProvider');
const logger = require('../../utils/logger');

/**
 * ResilientEnergyProvider
 * 
 * Proxies calls to LiveEnergyProvider with call-level fault tolerance.
 * If LiveEnergyProvider encounters any error, timeout, network glitch,
 * or missing credentials, it logs a server-side warning and seamlessly
 * falls back to SimulatedEnergyProvider without raising any error to the user.
 */
class ResilientEnergyProvider extends EnergyDataProvider {
  /**
   * @param {typeof energyConfig} [config=energyConfig] - Energy configuration
   */
  constructor(config = energyConfig) {
    super();
    this.config = config;
    this.simulatedProvider = new SimulatedEnergyProvider(config);
    this.liveProvider = null;

    this._attemptLiveInitialization();
  }

  /**
   * Attempts to instantiate the LiveEnergyProvider.
   * If credentials are unset or invalid, gracefully records the warning
   * and defers calls to the simulated fallback.
   * 
   * @private
   */
  _attemptLiveInitialization() {
    try {
      this.liveProvider = new LiveEnergyProvider(this.config);
    } catch (err) {
      logger.warn(
        `[EnergyProviderFactory] Live provider unavailable (${err.message}). Defaulting calls to SimulatedEnergyProvider.`
      );
      this.liveProvider = null;
    }
  }

  /**
   * Re-checks live provider instantiation if config changed or credentials became available.
   * 
   * @private
   * @returns {LiveEnergyProvider|null}
   */
  _getOrRecreateLiveProvider() {
    if (!this.liveProvider && this.config.liveApi && this.config.liveApi.apiKey) {
      try {
        this.liveProvider = new LiveEnergyProvider(this.config);
      } catch (err) {
        this.liveProvider = null;
      }
    }
    return this.liveProvider;
  }

  /**
   * Evaluates current conditions via Live API with automatic fallback to Simulated.
   * 
   * @returns {Promise<{
   *   timestamp: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price?: number,
   *   source: 'live' | 'simulated'
   * }>}
   */
  async getCurrentConditions() {
    const live = this._getOrRecreateLiveProvider();
    if (live) {
      try {
        return await live.getCurrentConditions();
      } catch (err) {
        logger.warn(
          `[EnergyProviderFactory] Live getCurrentConditions failed: ${err.message}. Falling back to SimulatedEnergyProvider.`
        );
      }
    }
    return this.simulatedProvider.getCurrentConditions();
  }

  /**
   * Evaluates forward forecast via Live API with automatic fallback to Simulated.
   * 
   * @param {number} [hours] - Forecast horizon in hours
   * @returns {Promise<Array<{
   *   timestamp: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price?: number,
   *   source: 'live' | 'simulated'
   * }>>}
   */
  async getForecast(hours) {
    const live = this._getOrRecreateLiveProvider();
    if (live) {
      try {
        return await live.getForecast(hours);
      } catch (err) {
        logger.warn(
          `[EnergyProviderFactory] Live getForecast failed: ${err.message}. Falling back to SimulatedEnergyProvider.`
        );
      }
    }
    return this.simulatedProvider.getForecast(hours);
  }

  /**
   * Evaluates discrete time slots via Live API with automatic fallback to Simulated.
   * 
   * @param {Date|string|number} windowStart - Window start timestamp
   * @param {Date|string|number} windowEnd - Window end timestamp
   * @param {number} [slotMinutes] - Slot duration in minutes
   * @returns {Promise<Array<{
   *   start: Date,
   *   end: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price?: number,
   *   source: 'live' | 'simulated'
   * }>>}
   */
  async getTimeSlots(windowStart, windowEnd, slotMinutes) {
    const live = this._getOrRecreateLiveProvider();
    if (live) {
      try {
        return await live.getTimeSlots(windowStart, windowEnd, slotMinutes);
      } catch (err) {
        logger.warn(
          `[EnergyProviderFactory] Live getTimeSlots failed: ${err.message}. Falling back to SimulatedEnergyProvider.`
        );
      }
    }
    return this.simulatedProvider.getTimeSlots(windowStart, windowEnd, slotMinutes);
  }
}

/**
 * Returns an EnergyDataProvider instance adhering to Team Handbook Rule 8:
 * - When DEMO_MODE is true -> SimulatedEnergyProvider.
 * - Otherwise -> Resilient wrapper attempting LiveEnergyProvider with call-level
 *   automatic, silent fallback to SimulatedEnergyProvider on any failure.
 * 
 * @param {typeof energyConfig} [config=energyConfig] - Energy configuration override
 * @returns {EnergyDataProvider} Active provider instance
 */
function getEnergyProvider(config = energyConfig) {
  if (config.demoMode) {
    return new SimulatedEnergyProvider(config);
  }
  return new ResilientEnergyProvider(config);
}

module.exports = {
  getEnergyProvider,
  ResilientEnergyProvider,
};
