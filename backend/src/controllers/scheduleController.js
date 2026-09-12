const schedulingService = require('../services/scheduling/schedulingService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Schedule Controller
 * 
 * Thin request handlers for device scheduling operations.
 * Delegates all domain validation and scheduling execution to schedulingService.
 * Strictly adheres to Team Handbook Section 15 API contracts and response envelopes.
 */

/**
 * Generates an optimal schedule recommendation for a flexible device.
 * 
 * @route   POST /api/schedule/recommend
 * @access  Private (Owner only)
 * @param {import('express').Request} req - Express request with req.body.deviceId
 * @param {import('express').Response} res - Express response
 */
async function recommend(req, res) {
  const { deviceId } = req.body || {};

  if (!deviceId || typeof deviceId !== 'string' || deviceId.trim() === '') {
    return error(res, 'deviceId is required in request body', 400, 'VALIDATION_ERROR');
  }

  try {
    const userId = req.user.id || req.user._id;
    const schedule = await schedulingService.recommendSchedule(userId, deviceId.trim());

    // Section 15 Infeasibility contract: HTTP 200, success: true, data: null
    if (schedule === null) {
      return success(res, null, 'No feasible scheduling window was found for this device', 200);
    }

    return success(res, schedule, 'Schedule recommendation generated successfully', 201);
  } catch (err) {
    if (err.statusCode && err.code) {
      return error(res, err.message, err.statusCode, err.code);
    }

    logger.error(`[scheduleController.recommend] Unexpected error: ${err.message}`, err);
    return error(res, 'Internal server error occurred while recommending schedule', 500, 'SERVER_ERROR');
  }
}

/**
 * Accepts a proposed schedule, locking it into the user's execution plan.
 * 
 * @route   POST /api/schedule/:id/accept
 * @access  Private (Owner only)
 * @param {import('express').Request} req - Express request with req.params.id
 * @param {import('express').Response} res - Express response
 */
async function accept(req, res) {
  const scheduleId = req.params.id;

  if (!scheduleId || typeof scheduleId !== 'string' || scheduleId.trim() === '') {
    return error(res, 'Schedule ID is required in route parameter', 400, 'VALIDATION_ERROR');
  }

  try {
    const userId = req.user.id || req.user._id;
    const acceptedSchedule = await schedulingService.acceptSchedule(userId, scheduleId.trim());

    return success(res, acceptedSchedule, 'Schedule accepted successfully', 200);
  } catch (err) {
    if (err.statusCode && err.code) {
      return error(res, err.message, err.statusCode, err.code);
    }

    logger.error(`[scheduleController.accept] Unexpected error: ${err.message}`, err);
    return error(res, 'Internal server error occurred while accepting schedule', 500, 'SERVER_ERROR');
  }
}

/**
 * Retrieves historical schedules for the authenticated user, newest first.
 * 
 * @route   GET /api/schedule/history
 * @access  Private (Authenticated user)
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
async function history(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const records = await schedulingService.getScheduleHistory(userId);

    return success(res, records, 'Schedule history retrieved successfully', 200);
  } catch (err) {
    logger.error(`[scheduleController.history] Unexpected error: ${err.message}`, err);
    return error(res, 'Internal server error occurred while retrieving schedule history', 500, 'SERVER_ERROR');
  }
}

/**
 * Completes an accepted schedule, locking it into execution history and granting FlexCoins.
 * 
 * @route   POST /api/schedule/:id/complete
 * @access  Private (Owner only)
 * @param {import('express').Request} req - Express request with req.params.id
 * @param {import('express').Response} res - Express response
 */
async function complete(req, res) {
  const scheduleId = req.params.id;

  if (!scheduleId || typeof scheduleId !== 'string' || scheduleId.trim() === '') {
    return error(res, 'Schedule ID is required in route parameter', 400, 'VALIDATION_ERROR');
  }

  try {
    const userId = req.user.id || req.user._id;
    const completedSchedule = await schedulingService.completeSchedule(userId, scheduleId.trim());

    return success(res, completedSchedule, 'Schedule completed and FlexCoins granted in Impact Simulation successfully', 200);
  } catch (err) {
    if (err.statusCode && err.code) {
      return error(res, err.message, err.statusCode, err.code);
    }

    logger.error(`[scheduleController.complete] Unexpected error: ${err.message}`, err);
    return error(res, 'Internal server error occurred while completing schedule', 500, 'SERVER_ERROR');
  }
}

/**
 * Retrieves the user's active pending recommendation.
 * 
 * @route   GET /api/schedule/pending
 * @access  Private (Authenticated user)
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
async function pending(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const schedule = await schedulingService.getPendingSchedule(userId);

    return success(res, schedule, 'Pending schedule recommendation retrieved successfully', 200);
  } catch (err) {
    logger.error(`[scheduleController.pending] Unexpected error: ${err.message}`, err);
    return error(res, 'Internal server error occurred while retrieving pending schedule', 500, 'SERVER_ERROR');
  }
}

module.exports = {
  recommend,
  accept,
  complete,
  history,
  pending,
};

