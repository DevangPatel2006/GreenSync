const EnergyDataProvider = require('./EnergyDataProvider');
const energyConfig = require('../config/energyConfig');
const logger = require('../utils/logger');

/**
 * Custom Error type for Live Energy Provider failures.
 * Encapsulates network issues, timeouts, HTTP status errors, and credential defects.
 */
class EnergyProviderError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {string} code - Machine-readable error code (e.g. 'MISSING_API_KEY', 'TIMEOUT', 'HTTP_ERROR', 'NETWORK_ERROR', 'feature_not_in_plan', 'quota_exceeded')
   * @param {number|null} [statusCode=null] - Associated HTTP response status code if available
   * @param {Error|null} [originalError=null] - Underlying system error if available
   * @param {Record<string, any>|null} [vendorDetail=null] - Vendor-specific error detail object from response envelope
   */
  constructor(message, code, statusCode = null, originalError = null, vendorDetail = null) {
    super(message);
    this.name = 'EnergyProviderError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.vendorDetail = vendorDetail;
  }
}

/**
 * Helper to pause execution for a given duration in milliseconds.
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Bounds a numerical value between min and max.
 * 
 * @param {number} val 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Derives renewable availability percentage (0 - 100) from carbon intensity (gCO2/kWh).
 * 
 * NOTE: This is an approximation derived from carbon intensity, not a direct measurement,
 * and is only used when the more accurate fuel-mix endpoint isn't available on the current plan.
 * Lower carbon intensity implies a cleaner, more renewable-heavy generation mix.
 * 
 * @param {number} actualIntensity - Current or forecasted carbon intensity in gCO2/kWh
 * @param {number} [dirty] - Baseline dirty intensity (approx. coal-heavy mix, default 950)
 * @param {number} [clean] - Baseline clean intensity (approx. renewable-heavy mix, default 300)
 * @returns {number} Renewable availability percentage [0, 100]
 */
function calculateRenewableProxy(
  actualIntensity,
  dirty = energyConfig.carbonIntensityDirtyGco2Kwh,
  clean = energyConfig.carbonIntensityCleanGco2Kwh
) {
  if (typeof actualIntensity !== 'number' || isNaN(actualIntensity)) return 0;
  const dirtyVal = typeof dirty === 'number' ? dirty : 950;
  const cleanVal = typeof clean === 'number' ? clean : 300;
  if (dirtyVal === cleanVal) return 50;
  const ratio = (dirtyVal - actualIntensity) / (dirtyVal - cleanVal);
  return clamp(Math.round(ratio * 10000) / 100, 0, 100);
}

/**
 * Normalizes absolute grid demand (MW) onto the standard 0 - 100 percentage scale.
 * 
 * NOTE: This mirrors exactly how the fallback SimulatedEnergyProvider already keeps
 * everything on the same 0-100 scale, so scoring.js in the scheduling engine needs
 * no changes regardless of which provider answered.
 * 
 * @param {number} demandMw - Grid demand in MW
 * @param {number} [minMw] - Off-peak national grid demand trough in MW (default 120,000)
 * @param {number} [maxMw] - Summer peak national grid demand in MW (default 260,000)
 * @returns {number} Normalized grid demand percentage [0, 100]
 */
function normalizeGridDemandMw(
  demandMw,
  minMw = energyConfig.gridDemandMinMw,
  maxMw = energyConfig.gridDemandMaxMw
) {
  if (typeof demandMw !== 'number' || isNaN(demandMw)) return 50;
  const minVal = typeof minMw === 'number' ? minMw : 120000;
  const maxVal = typeof maxMw === 'number' ? maxMw : 260000;
  if (maxVal === minVal) return 50;
  const ratio = (demandMw - minVal) / (maxVal - minVal);
  return clamp(Math.round(ratio * 10000) / 100, 0, 100);
}

/**
 * Extracts renewable availability percentage from India Energy Atlas fuel-mix endpoint if available.
 * Computes: (mix_pct.solar + mix_pct.wind + mix_pct.hydro) * 100.
 * 
 * @param {Record<string, any>} fuelMixPayload 
 * @returns {number|null} Clean percentage if valid, else null
 */
function extractRenewableFromFuelMix(fuelMixPayload) {
  if (!fuelMixPayload || !fuelMixPayload.data) return null;
  const data = fuelMixPayload.data;

  // Supports { mix_pct: { solar, wind, hydro } }
  if (data.mix_pct && typeof data.mix_pct === 'object') {
    const solar = Number(data.mix_pct.solar) || 0;
    const wind = Number(data.mix_pct.wind) || 0;
    const hydro = Number(data.mix_pct.hydro) || 0;
    const sum = solar + wind + hydro;
    const pct = sum <= 1.01 ? sum * 100 : sum;
    return clamp(Math.round(pct * 100) / 100, 0, 100);
  }

  // Supports breakdown items array: [ { fuel_type, generation_mw, ... } ]
  if (Array.isArray(data.items) && data.items.length > 0) {
    let cleanMw = 0;
    let totalMw = 0;
    for (const item of data.items) {
      const mw = Number(item.generation_mw ?? item.demand_mw) || 0;
      totalMw += mw;
      const type = (item.fuel_type || item.fuel || '').toLowerCase();
      if (type.includes('solar') || type.includes('wind') || type.includes('hydro') || type.includes('renewable')) {
        cleanMw += mw;
      }
    }
    if (totalMw > 0) {
      return clamp(Math.round((cleanMw / totalMw) * 10000) / 100, 0, 100);
    }
  }

  return null;
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

  const rawTime = payload.timestamp || payload.time || payload.datetime || payload.recorded_at || payload.as_of;
  const timestamp = rawTime ? new Date(rawTime) : new Date();
  if (Number.isNaN(timestamp.getTime())) {
    throw new EnergyProviderError(`Invalid timestamp in external payload: ${rawTime}`, 'INVALID_TIMESTAMP');
  }

  let renewableAvailability = 0;
  if (typeof payload.renewableAvailability === 'number') {
    renewableAvailability = payload.renewableAvailability;
  } else if (typeof payload.renewablePercentage === 'number') {
    renewableAvailability = payload.renewablePercentage;
  } else if (typeof payload.cleanEnergyRatio === 'number') {
    renewableAvailability = payload.cleanEnergyRatio * 100;
  } else if (typeof payload.carbon_intensity_gco2_kwh === 'number') {
    renewableAvailability = calculateRenewableProxy(payload.carbon_intensity_gco2_kwh);
  } else if (typeof payload.renewables_mw === 'number' && typeof payload.total_mw === 'number' && payload.total_mw > 0) {
    renewableAvailability = (payload.renewables_mw / payload.total_mw) * 100;
  }
  const clampedRenewable = clamp(Math.round(renewableAvailability * 100) / 100, 0, 100);

  let gridDemand = 50;
  if (typeof payload.gridDemand === 'number') {
    gridDemand = payload.gridDemand;
  } else if (typeof payload.demand_mw === 'number') {
    gridDemand = normalizeGridDemandMw(payload.demand_mw);
  } else if (typeof payload.demandPercentage === 'number') {
    gridDemand = payload.demandPercentage;
  }
  const clampedDemand = clamp(Math.round(gridDemand * 100) / 100, 0, 100);

  let price = undefined;
  if (typeof payload.price === 'number') {
    price = Math.round(payload.price * 10000) / 10000;
  } else if (payload.mcp_rs_mwh !== undefined && payload.mcp_rs_mwh !== null) {
    const parsedMcp = typeof payload.mcp_rs_mwh === 'number' ? payload.mcp_rs_mwh : parseFloat(payload.mcp_rs_mwh);
    if (!isNaN(parsedMcp)) {
      price = Math.round((parsedMcp / 1000) * 10000) / 10000; // MWh→kWh
    }
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
 * Adapts India Energy Atlas (https://api.energymap.in) grid telemetry and forecast APIs
 * into GreenSync's EnergyDataProvider interface.
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

    const { apiKey, baseUrl, timeoutMs, maxRetries } = this.config.liveApi;

    // Fail loudly at construction time if credentials are missing
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new EnergyProviderError(
        'ENERGY_API_KEY is not configured or is empty. Cannot initialize LiveEnergyProvider.',
        'MISSING_API_KEY'
      );
    }

    this.apiKey = apiKey.trim();
    this.baseUrl = (baseUrl || 'https://api.energymap.in').replace(/\/+$/, '');
    this.timeoutMs = timeoutMs || 5000;
    this.maxRetries = typeof maxRetries === 'number' ? Math.min(5, Math.max(0, maxRetries)) : 3;

    // In-memory rate-limit tracking for safe pre-flight throttling
    this.remainingMinute = null;
    this.limitMinute = null;
    this.lastMinuteReset = Date.now();
  }

  /**
   * Performs an authenticated HTTP GET request with retry backoff and AbortController timeout.
   * 
   * Vendor Contract:
   * - Auth: Single header `X-API-Key: <key>`
   * - No Authorization Bearer header
   * - Non-retryable: 400, 401, 402, 403, 404
   * - Retryable with backoff: 429, 500, 502, 503, 504
   * 
   * @private
   * @param {string} endpoint - API endpoint path under /developer/v1/
   * @param {Record<string, string|number>} [params={}] - Query parameters
   * @returns {Promise<any>} Raw JSON response body
   * @throws {EnergyProviderError}
   */
  async _fetchWithTimeout(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        query.append(k, String(v));
      }
    });

    const queryString = query.toString();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const separator = cleanEndpoint.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${cleanEndpoint}${queryString ? `${separator}${queryString}` : ''}`;

    // Rate-limit pre-flight pause: If remaining calls in minute dropped below 10%, pause
    if (this.remainingMinute !== null && this.limitMinute !== null && this.limitMinute > 0) {
      if (this.remainingMinute <= 0 || (this.remainingMinute / this.limitMinute) < 0.10) {
        const timeSinceReset = Date.now() - this.lastMinuteReset;
        const waitMs = Math.max(1000, 60000 - (timeSinceReset % 60000));
        logger.warn(
          `[LiveEnergyProvider] Rate limit safety buffer: ${this.remainingMinute}/${this.limitMinute} requests remaining this minute. Pausing ${Math.round(waitMs)}ms.`
        );
        await sleep(Math.min(waitMs, 5000));
        this.remainingMinute = null;
      }
    }

    let attempt = 0;
    const maxRetries = this.maxRetries;

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, this.timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'X-API-Key': this.apiKey,
            'Accept': 'application/json',
            'User-Agent': 'GreenSync-EnergyProvider/1.0',
          },
        });

        clearTimeout(timeoutId);

        // Read and record rate-limit headers
        const remMinHeader = response.headers.get('x-ratelimit-remaining-minute');
        const limMinHeader = response.headers.get('x-ratelimit-limit-minute');
        if (remMinHeader !== null) {
          this.remainingMinute = parseInt(remMinHeader, 10);
        }
        if (limMinHeader !== null) {
          this.limitMinute = parseInt(limMinHeader, 10);
        }

        if (response.ok) {
          return await response.json();
        }

        // Parse vendor error envelope
        let json = null;
        try {
          json = await response.json();
        } catch {
          // Response body was not JSON
        }

        const errSlug = json?.error || json?.detail?.code || 'HTTP_ERROR';
        const errMsg = json?.message || json?.detail?.message || `Live energy provider HTTP error: ${response.status} ${response.statusText} from ${url}`;
        const vendorDetail = json?.detail || null;

        // 400/401/402/403/404 -> NEVER retry, these fail identically every time per vendor docs
        if ([400, 401, 402, 403, 404].includes(response.status)) {
          throw new EnergyProviderError(errMsg, errSlug, response.status, null, vendorDetail);
        }

        // 429/500/502/503/504 -> retry with exponential backoff + jitter, capped at maxRetries
        if ([429, 500, 502, 503, 504].includes(response.status) && attempt < maxRetries) {
          attempt += 1;
          let delayMs;
          if (response.status === 429) {
            const retryAfterHeader = response.headers.get('retry-after');
            const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
            if (retryAfterSec && !isNaN(retryAfterSec) && retryAfterSec > 0) {
              delayMs = retryAfterSec * 1000;
            } else {
              delayMs = Math.min(30000, Math.pow(2, attempt) * 1000 + Math.random() * 500);
            }
            logger.warn(
              `[LiveEnergyProvider] Rate limited (429 ${errSlug}). Backing off for ${Math.round(delayMs)}ms (attempt ${attempt}/${maxRetries}).`
            );
          } else {
            delayMs = Math.min(30000, Math.pow(2, attempt) * 1000 + Math.random() * 500);
            logger.warn(
              `[LiveEnergyProvider] Server error ${response.status}. Retrying in ${Math.round(delayMs)}ms (attempt ${attempt}/${maxRetries}).`
            );
          }
          await sleep(delayMs);
          continue;
        }

        // Retries exhausted or other error status
        throw new EnergyProviderError(errMsg, errSlug, response.status, null, vendorDetail);
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

        // Network connection dropped or DNS failure
        if (attempt < maxRetries) {
          attempt += 1;
          const delayMs = Math.min(30000, Math.pow(2, attempt) * 1000 + Math.random() * 500);
          logger.warn(
            `[LiveEnergyProvider] Network error: ${err.message}. Retrying in ${Math.round(delayMs)}ms (attempt ${attempt}/${maxRetries}).`
          );
          await sleep(delayMs);
          continue;
        }

        throw new EnergyProviderError(
          `Live energy API network error: ${err.message}`,
          'NETWORK_ERROR',
          null,
          err
        );
      }
    }
  }

  /**
   * Fetches real-time current grid conditions from India Energy Atlas.
   * Concurrently requests:
   * 1. GET /developer/v1/grid/demand/latest (national demand_mw -> gridDemand)
   * 2. GET /developer/v1/market/iex/latest?market_type=DAM&limit=1 (mcp_rs_mwh -> price)
   * 3. GET /developer/v1/forecast/carbon-intensity?hours=1&order=asc (carbon intensity proxy)
   * 4. GET /developer/v1/fuel-mix/latest (attempts first, swallows 402 as expected plan tier)
   * 
   * @returns {Promise<{
   *   timestamp: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price?: number,
   *   source: 'live'
   * }>}
   * @throws {EnergyProviderError}
   */
  async getCurrentConditions() {
    // Attempt fuel-mix endpoint (Pro+ tier only); swallow 402 silently as expected tier behavior
    const fuelMixPromise = this._fetchWithTimeout('/developer/v1/fuel-mix/latest?state=national')
      .catch((err) => {
        if (err.statusCode === 402) return null;
        return null;
      });

    const [demandRes, marketRes, carbonRes, fuelMixRes] = await Promise.all([
      this._fetchWithTimeout('/developer/v1/grid/demand/latest'),
      this._fetchWithTimeout('/developer/v1/market/iex/latest?market_type=DAM&limit=1'),
      this._fetchWithTimeout('/developer/v1/forecast/carbon-intensity?hours=1&order=asc'),
      fuelMixPromise,
    ]);

    // 1. Resolve timestamp
    const demandData = demandRes.data || demandRes;
    const rawTime = demandData.as_of || demandRes.as_of || marketRes.data?.[0]?.timestamp || new Date().toISOString();
    const timestamp = new Date(rawTime);

    // 2. Resolve gridDemand (0-100 scale)
    const demandMw = Number(
      demandData.national?.demand_mw ??
      demandData.all_india?.demand_mw ??
      demandRes.national?.demand_mw ??
      demandRes.all_india?.demand_mw
    );
    if (typeof demandMw !== 'number' || isNaN(demandMw)) {
      throw new EnergyProviderError('Missing or invalid demand_mw in grid demand payload', 'INVALID_PAYLOAD');
    }
    const gridDemand = normalizeGridDemandMw(demandMw, this.config.gridDemandMinMw, this.config.gridDemandMaxMw);

    // 3. Resolve price in currency/kWh
    const rawMcp = marketRes.data?.[0]?.mcp_rs_mwh;
    if (rawMcp === undefined || rawMcp === null) {
      throw new EnergyProviderError('Missing mcp_rs_mwh in IEX market payload', 'INVALID_PAYLOAD');
    }
    const parsedMcp = typeof rawMcp === 'number' ? rawMcp : parseFloat(rawMcp);
    if (isNaN(parsedMcp)) {
      throw new EnergyProviderError(`Invalid mcp_rs_mwh value in IEX market payload: ${rawMcp}`, 'INVALID_PAYLOAD');
    }
    const price = Math.round((parsedMcp / 1000) * 10000) / 10000; // MWh→kWh unit conversion

    // 4. Resolve renewableAvailability (0-100 scale)
    let renewableAvailability = null;
    if (fuelMixRes) {
      renewableAvailability = extractRenewableFromFuelMix(fuelMixRes);
    }

    if (renewableAvailability === null || renewableAvailability === undefined) {
      // Fall back to carbon intensity proxy from forecast items or demand snapshot
      const carbonItems = carbonRes.data?.items;
      let carbonVal = (Array.isArray(carbonItems) && carbonItems.length > 0)
        ? (carbonItems[0].carbon_intensity_gco2_kwh ?? carbonItems[0].carbon_intensity)
        : null;

      if (typeof carbonVal !== 'number' || isNaN(carbonVal)) {
        const rawCarbon = demandData.carbon_intensity?.value_gco2_kwh
          ?? demandData.all_india?.carbon_intensity?.value_gco2_kwh
          ?? demandRes.carbon_intensity?.value_gco2_kwh
          ?? demandRes.all_india?.carbon_intensity?.value_gco2_kwh;
        carbonVal = rawCarbon !== undefined && rawCarbon !== null ? Number(rawCarbon) : null;
      }

      if (typeof carbonVal !== 'number' || isNaN(carbonVal)) {
        throw new EnergyProviderError('Missing carbon_intensity in telemetry payload', 'INVALID_PAYLOAD');
      }

      renewableAvailability = calculateRenewableProxy(
        carbonVal,
        this.config.carbonIntensityDirtyGco2Kwh,
        this.config.carbonIntensityCleanGco2Kwh
      );
    }

    return {
      timestamp,
      renewableAvailability,
      gridDemand,
      price,
      source: 'live',
    };
  }

  /**
   * Fetches forward-looking forecast points from India Energy Atlas.
   * 
   * THE GAP TO SOLVE — forecast rows without a live demand forecast:
   * Sandbox/Starter tiers have no forward demand signal; forecast rows fall back to simulation
   * entirely until upgraded to Student/Institutional/Growth/Enterprise.
   * We attempt forecast/demand first. If it 402s, this call throws EnergyProviderError with
   * statusCode 402, letting ResilientEnergyProvider cleanly delegate this call to SimulatedEnergyProvider.
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
    const horizon = Math.max(1, Math.min(this.config.maxForecastHours, Math.floor(hours)));

    // 1. Attempt forecast/demand (Pro/Student/Growth tiers). Throws EnergyProviderError on 402
    const demandForecastRes = await this._fetchWithTimeout(
      `/developer/v1/forecast/demand?horizon=${horizon}`
    );

    // 2. Fetch carbon intensity forecast, fuel-mix, and market price concurrently
    const fuelMixPromise = this._fetchWithTimeout('/developer/v1/fuel-mix/latest?state=national')
      .catch(() => null);

    const [carbonRes, marketRes, fuelMixRes] = await Promise.all([
      this._fetchWithTimeout(`/developer/v1/forecast/carbon-intensity?hours=${horizon}&order=asc`),
      this._fetchWithTimeout('/developer/v1/market/iex/latest?market_type=DAM&limit=1').catch(() => null),
      fuelMixPromise,
    ]);

    // Check meta.requested_hours vs meta.returned_hours: if clamped, log warning
    if (carbonRes.meta && typeof carbonRes.meta.requested_hours === 'number' && typeof carbonRes.meta.returned_hours === 'number') {
      if (carbonRes.meta.returned_hours < carbonRes.meta.requested_hours) {
        logger.warn(
          `[LiveEnergyProvider] Plan clamped carbon forecast hours from requested ${carbonRes.meta.requested_hours} to returned ${carbonRes.meta.returned_hours}.`
        );
      }
    }

    // Flat price across series as documented honest labeled approximation
    let flatPrice = undefined;
    const rawMcp = marketRes?.data?.[0]?.mcp_rs_mwh;
    if (rawMcp !== undefined && rawMcp !== null) {
      const parsedMcp = typeof rawMcp === 'number' ? rawMcp : parseFloat(rawMcp);
      if (!isNaN(parsedMcp)) {
        flatPrice = Math.round((parsedMcp / 1000) * 10000) / 10000; // MWh→kWh
      }
    }

    const demandItems = Array.isArray(demandForecastRes.data?.items)
      ? demandForecastRes.data.items
      : (Array.isArray(demandForecastRes.data) ? demandForecastRes.data : []);

    if (demandItems.length === 0) {
      throw new EnergyProviderError('Empty demand forecast series returned', 'EMPTY_FORECAST');
    }

    const carbonItems = Array.isArray(carbonRes.data?.items) ? carbonRes.data.items : [];

    // Merge series by nearest-timestamp matching
    return demandItems.map((dItem) => {
      const timestamp = new Date(dItem.timestamp || dItem.datetime);
      const demandMw = dItem.demand_mw ?? dItem.predicted_demand_mw;
      const gridDemand = normalizeGridDemandMw(demandMw, this.config.gridDemandMinMw, this.config.gridDemandMaxMw);

      let closestCarbon = carbonItems[0];
      let minDiff = Infinity;
      const tMs = timestamp.getTime();
      for (const c of carbonItems) {
        const cMs = new Date(c.timestamp || c.datetime).getTime();
        const diff = Math.abs(cMs - tMs);
        if (diff < minDiff) {
          minDiff = diff;
          closestCarbon = c;
        }
      }

      const carbonVal = closestCarbon ? (closestCarbon.carbon_intensity_gco2_kwh ?? closestCarbon.carbon_intensity) : 500;
      const renewableAvailability = calculateRenewableProxy(
        carbonVal,
        this.config.carbonIntensityDirtyGco2Kwh,
        this.config.carbonIntensityCleanGco2Kwh
      );

      return {
        timestamp,
        renewableAvailability,
        gridDemand,
        price: flatPrice,
        source: 'live',
      };
    });
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
