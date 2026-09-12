const energyService = require('../services/energy/energyService');
const energyConfig = require('../config/energyConfig');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Energy Controller
 * 
 * Thin request handlers for energy grid telemetry and forecasting endpoints.
 * All domain business logic is strictly delegated to energyService.
 * Response envelope formatting strictly uses utils/response.js.
 */

/**
 * Retrieves the current real-time energy grid conditions.
 * Preserves the `source` field ('live' | 'simulated') for the frontend indicator badge.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
async function getCurrentConditions(req, res) {
  try {
    const conditions = await energyService.getCurrentConditions();
    return success(res, conditions, 'Current energy conditions retrieved successfully');
  } catch (err) {
    logger.error(`[energyController.getCurrentConditions] Unexpected failure: ${err.message}`, err);
    return error(res, 'Internal server error occurred while retrieving energy conditions', 500, {
      code: 'SERVER_ERROR',
      message: err.message,
    });
  }
}

/**
 * Retrieves forward-looking energy grid conditions for a requested horizon.
 * Expects ?hours= query parameter (validated via middleware).
 * Preserves the `source` field ('live' | 'simulated') on every forecast point.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
async function getForecast(req, res) {
  try {
    let hours = energyConfig.defaultForecastHours;
    if (req.query.hours !== undefined && req.query.hours !== '') {
      hours = parseInt(req.query.hours, 10);
    }

    const forecast = await energyService.getForecast(hours);
    return success(res, forecast, `Energy forecast for next ${hours} hours retrieved successfully`);
  } catch (err) {
    logger.error(`[energyController.getForecast] Unexpected failure: ${err.message}`, err);
    return error(res, 'Internal server error occurred while generating energy forecast', 500, {
      code: 'SERVER_ERROR',
      message: err.message,
    });
  }
}

/**
 * Route-level validation middleware for the ?hours query parameter on /forecast.
 * Rejects non-numeric, decimal, negative, zero, or out-of-range horizons with 400 VALIDATION_ERROR.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 */
function validateForecastQuery(req, res, next) {
  const rawHours = req.query.hours;

  // Optional parameter: defaults to defaultForecastHours in controller if omitted
  if (rawHours === undefined || rawHours === '') {
    return next();
  }

  // Must be a positive whole integer
  if (typeof rawHours !== 'string' || !/^\d+$/.test(rawHours.trim())) {
    return error(
      res,
      'Query parameter "hours" must be a positive integer',
      400,
      { code: 'VALIDATION_ERROR', field: 'hours', received: rawHours }
    );
  }

  const hours = parseInt(rawHours, 10);
  if (hours < 1 || hours > energyConfig.maxForecastHours) {
    return error(
      res,
      `Query parameter "hours" must be between 1 and ${energyConfig.maxForecastHours}`,
      400,
      {
        code: 'VALIDATION_ERROR',
        field: 'hours',
        min: 1,
        max: energyConfig.maxForecastHours,
        received: hours,
      }
    );
  }

  return next();
}

module.exports = {
  getCurrentConditions,
  getForecast,
  validateForecastQuery,
};
