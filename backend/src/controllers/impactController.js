const rewardsService = require('../services/rewards/rewardsService');
const User = require('../models/User');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const ADMIN_ROLE = 'admin';

/**
 * Impact Controller
 * 
 * Thin request handlers for user personal impact summary and administrative grid metrics.
 * Adheres strictly to Section 15 API contracts and response envelopes.
 */

/**
 * Retrieves aggregate environmental and grid impact summary for authenticated user.
 * 
 * @route   GET /api/impact/summary
 * @access  Private (Authenticated user)
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
async function getSummary(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const summary = await rewardsService.getUserImpactSummary(userId);

    return success(res, summary, 'Personal impact simulation summary retrieved successfully', 200);
  } catch (err) {
    if (err.statusCode && err.code) {
      return error(res, err.message, err.statusCode, err.code);
    }

    logger.error(`[impactController.getSummary] Unexpected error: ${err.message}`, err);
    return error(res, 'Internal server error occurred while retrieving user impact summary', 500, 'SERVER_ERROR');
  }
}

/**
 * Retrieves system-wide grid flexibility and impact metrics for administrators.
 * 
 * SECURITY CONTRACT:
 * Does NOT trust req.user.role from the decoded token payload.
 * Strictly queries the User document from the database server-side to verify role === 'admin'.
 * 
 * @route   GET /api/impact/admin
 * @access  Private (Admin only)
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
async function getAdmin(req, res) {
  try {
    const userId = req.user.id || req.user._id;

    // Server-side role verification
    const user = await User.findById(userId).lean();
    if (!user || user.role !== ADMIN_ROLE) {
      return error(res, 'Access denied: Administrator privileges required', 403, 'FORBIDDEN');
    }

    const adminSummary = await rewardsService.getAdminImpactSummary();
    return success(res, adminSummary, 'Administrative grid impact metrics retrieved successfully', 200);
  } catch (err) {
    if (err.statusCode && err.code) {
      return error(res, err.message, err.statusCode, err.code);
    }

    logger.error(`[impactController.getAdmin] Unexpected error: ${err.message}`, err);
    return error(res, 'Internal server error occurred while retrieving administrative impact metrics', 500, 'SERVER_ERROR');
  }
}

module.exports = {
  getSummary,
  getAdmin,
  ADMIN_ROLE,
};
