const express = require('express');
const energyController = require('../controllers/energyController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/energy/current
 * @desc    Get real-time renewable energy availability and grid demand conditions
 * @access  Private (Bearer JWT)
 */
router.get('/current', auth, energyController.getCurrentConditions);

/**
 * @route   GET /api/energy/forecast
 * @desc    Get forward-looking hourly energy availability and demand forecast
 * @query   hours - Number of forecast hours requested (optional, positive int <= maxForecastHours)
 * @access  Private (Bearer JWT)
 */
router.get(
  '/forecast',
  auth,
  energyController.validateForecastQuery,
  energyController.getForecast
);

module.exports = router;
