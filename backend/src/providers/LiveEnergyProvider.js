const EnergyDataProvider = require('./EnergyDataProvider');
const energyConfig = require('../config/energyConfig');

/**
 * Custom Error type for Live Energy Provider failures.
 * Encapsulates network issues, timeouts, HTTP status errors, and credential defects.
 */
class EnergyProviderError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {string} code - Machine-readable error code (e.g. 'MISSING_API_KEY', 'TIMEOUT', 'HTTP_ERROR', 'NETWORK_ERROR')
   * @param {number|null} [statusCode=null] - Associated HTTP response status code if available
   * @param {Error|null} [originalError=null] - Underlying system error if available
   */
  constructor(message, code, statusCode = null, originalError = null) {
    super(message);
    this.name = 'EnergyProviderError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Normalization function that converts external API responses into GreenSync's standard shape:
 * { timestamp, renewableAvailability, gridDemand, price, source: "live" }
 * 
 * ISOLATION CONTRACT:
 * If the external grid telemetry vendor API changes its payload schema,
 * ONLY this function requires modification.
 * 
 * @param {Record<string, any>} payload - Raw item returned by the external energy API
 * @returns {{
 *   timestamp: Date,
 *   renewableAvailability: number,
 *   gridDemand: number,
 *   price?: number,
 *   source: 'live'
 * }} Normalized energy data record
 */
function normalizeExternalEnergyData(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new EnergyProviderError(
      'Cannot normalize invalid or empty external energy telemetry payload',
      'INVALID_PAYLOAD'
    );
  }

  // 1. Resolve timestamp: support common naming patterns (timestamp, time, datetime, recorded_at)
  const rawTime = payload.timestamp || payload.time || payload.datetime || payload.recorded_at;
  const timestamp = rawTime ? new Date(rawTime) : new Date();
  if (Number.isNaN(timestamp.getTime())) {
    throw new EnergyProviderError(`Invalid timestamp in external payload: ${rawTime}`, 'INVALID_TIMESTAMP');
  }

  // 2. Resolve renewable availability percentage [0, 100]
  // Supports direct percentage, ratio (0-1), or generation breakdown
  let renewableAvailability = 0;
  if (typeof payload.renewableAvailability === 'number') {
    renewableAvailability = payload.renewableAvailability;
  } else if (typeof payload.renewablePercentage === 'number') {
    renewableAvailability = payload.renewablePercentage;
  } else if (typeof payload.cleanEnergyRatio === 'number') {
    renewableAvailability = payload.cleanEnergyRatio * 100;
  } else if (typeof payload.renewables_mw === 'number' && typeof payload.total_mw === 'number' && payload.total_mw > 0) {
    renewableAvailability = (payload.renewables_mw / payload.total_mw) * 100;
  }
  const clampedRenewable = Math.max(0, Math.min(100, Math.round(renewableAvailability * 100) / 100));

  // 3. Resolve grid demand percentage [0, 100]
  let gridDemand = 50; // Fallback median demand if omitted
  if (typeof payload.gridDemand === 'number') {
    gridDemand = payload.gridDemand;
  } else if (typeof payload.demandPercentage === 'number') {
    gridDemand = payload.demandPercentage;
  } else if (typeof payload.demand_mw === 'number' && typeof payload.capacity_mw === 'number' && payload.capacity_mw > 0) {
    gridDemand = (payload.demand_mw / payload.capacity_mw) * 100;
  }
  const clampedDemand = Math.max(0, Math.min(100, Math.round(gridDemand * 100) / 100));

  // 4. Resolve optional electricity price ($/kWh)
  let price = undefined;
  if (typeof payload.price === 'number') {
    price = Math.round(payload.price * 10000) / 10000;
  } else if (typeof payload.marketPriceMwh === 'number') {
    price = Math.round((payload.marketPriceMwh / 1000) * 10000) / 10000;
  }

  return {
    timestamp,
    renewableAvailability: clampedRenewable,
    gridDemand: clampedDemand,
    price,
    source: 'live',
  };
}

/**
 * LiveEnergyProvider
 * 
 * Adapts live third-party energy grid telemetry APIs (e.g. OpenNEM, National Grid ESO,
 * or regional ISO APIs) into GreenSync's EnergyDataProvider interface.
 * 
 * Strict Error Semantics:
 * Throws EnergyProviderError on any missing credential, timeout, network failure, or HTTP error.
 * Does not swallow errors — upstream factories/proxies manage fallback.
 */
class LiveEnergyProvider extends EnergyDataProvider {
  /**
   * @param {typeof energyConfig} [config=energyConfig] - Energy configuration
   */
  constructor(config = energyConfig) {
    super();
    this.config = config;

    const { apiKey, baseUrl, timeoutMs } = this.config.liveApi;

    // Fail loudly at construction time if credentials are missing
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new EnergyProviderError(
        'ENERGY_API_KEY is not configured or is empty. Cannot initialize LiveEnergyProvider.',
        'MISSING_API_KEY'
      );
    }

    this.apiKey = apiKey.trim();
    this.baseUrl = (baseUrl || '').replace(/\/+$/, '');
    this.timeoutMs = timeoutMs;
  }

  /**
   * Performs an authenticated HTTP GET request with an AbortController-enforced timeout.
   * 
   * @private
   * @param {string} endpoint - API endpoint path (e.g. '/current', '/forecast')
   * @param {Record<string, string|number>} [params={}] - Query parameters
   * @returns {Promise<any>} Raw JSON response body
   * @throws {EnergyProviderError} On timeout, network drop, non-2xx status, or malformed JSON
   */
  async _fetchWithTimeout(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        query.append(k, String(v));
      }
    });

    const queryString = query.toString();
    const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
          'Accept': 'application/json',
          'User-Agent': 'GreenSync-EnergyProvider/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new EnergyProviderError(
          `Live energy provider HTTP error: ${response.status} ${response.statusText} from ${url}`,
          'HTTP_ERROR',
          response.status
        );
      }

      const json = await response.json();
      return json;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new EnergyProviderError(
          `Live energy API request timed out after ${this.timeoutMs}ms for ${url}`,
          'TIMEOUT',
          null,
          err
        );
      }

      if (err instanceof EnergyProviderError) {
        throw err;
      }

      throw new EnergyProviderError(
        `Live energy API network or parse error: ${err.message}`,
        'NETWORK_ERROR',
        null,
        err
      );
    }
  }

  /**
   * Fetches real-time current grid conditions from the live API.
   * 
   * @returns {Promise<{
   *   timestamp: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price?: number,
   *   source: 'live'
   * }>} Normalized current conditions
   * @throws {EnergyProviderError}
   */
  async getCurrentConditions() {
    const rawData = await this._fetchWithTimeout('/current');
    // Adapt payload: can be rawData directly or nested in rawData.data
    const item = (rawData && rawData.data) ? rawData.data : rawData;
    return normalizeExternalEnergyData(item);
  }

  /**
   * Fetches forward-looking forecast points from the live API.
   * 
   * @param {number} [hours] - Number of forecast hours requested
   * @returns {Promise<Array<{
   *   timestamp: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price?: number,
   *   source: 'live'
   * }>>} Chronological array of normalized forecast points
   * @throws {EnergyProviderError}
   */
  async getForecast(hours = this.config.defaultForecastHours) {
    const rawData = await this._fetchWithTimeout('/forecast', { hours });
    const items = Array.isArray(rawData) ? rawData : (rawData && Array.isArray(rawData.data) ? rawData.data : []);

    if (!Array.isArray(items) || items.length === 0) {
      throw new EnergyProviderError(
        'Live energy provider returned empty forecast series',
        'EMPTY_FORECAST'
      );
    }

    return items.map(normalizeExternalEnergyData);
  }

  /**
   * Evaluates discrete time slots across an execution window using live/forecast API telemetry.
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
   *   source: 'live'
   * }>>} List of discrete evaluation time slots
   * @throws {EnergyProviderError}
   */
  async getTimeSlots(windowStart, windowEnd, slotMinutes = this.config.defaultSlotMinutes) {
    const start = new Date(windowStart);
    const end = new Date(windowEnd);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new EnergyProviderError('Invalid windowStart or windowEnd date', 'INVALID_PARAMETERS');
    }
    if (end <= start) {
      throw new EnergyProviderError('windowEnd must be strictly greater than windowStart', 'INVALID_PARAMETERS');
    }

    const durationMinutes = Math.max(5, Math.floor(slotMinutes));
    const slotDurationMs = durationMinutes * 60 * 1000;
    const slots = [];

    // Query live forecast covering the requested window
    const totalHours = Math.ceil((end.getTime() - start.getTime()) / (3600 * 1000)) + 1;
    const forecastPoints = await this.getForecast(totalHours);

    let current = start.getTime();
    const finalEnd = end.getTime();

    while (current < finalEnd) {
      const slotStart = new Date(current);
      const nextTime = current + slotDurationMs;
      const slotEnd = new Date(Math.min(nextTime, finalEnd));
      const midpointTime = slotStart.getTime() + (slotEnd.getTime() - slotStart.getTime()) / 2;

      // Find the closest forecast telemetry reading to the slot midpoint
      let closestReading = forecastPoints[0];
      let minDiff = Infinity;
      for (const pt of forecastPoints) {
        const diff = Math.abs(pt.timestamp.getTime() - midpointTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestReading = pt;
        }
      }

      slots.push({
        start: slotStart,
        end: slotEnd,
        renewableAvailability: closestReading.renewableAvailability,
        gridDemand: closestReading.gridDemand,
        price: closestReading.price,
        source: 'live',
      });

      current = nextTime;
    }

    return slots;
  }
}

module.exports = {
  LiveEnergyProvider,
  EnergyProviderError,
  normalizeExternalEnergyData,
};
