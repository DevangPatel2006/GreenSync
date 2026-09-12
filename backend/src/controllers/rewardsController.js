const rewardsService = require('../services/rewards/rewardsService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Rewards Controller
 * 
 * Thin request handlers for user FlexCoin balance and transaction history.
 * Adheres strictly to Section 15 API contracts and response envelopes.
 */

/**
 * Retrieves current aggregated FlexCoin balance for authenticated user.
 * 
 * @route   GET /api/rewards/balance
 * @access  Private (Authenticated user)
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
async function getBalance(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const balance = await rewardsService.getBalance(userId);

    return success(res, { balance }, 'FlexCoin balance in Impact Simulation retrieved successfully', 200);
  } catch (err) {
    if (err.statusCode && err.code) {
      return error(res, err.message, err.statusCode, err.code);
    }

    logger.error(`[rewardsController.getBalance] Unexpected error: ${err.message}`, err);
    return error(res, 'Internal server error occurred while retrieving balance', 500, 'SERVER_ERROR');
  }
}

/**
 * Retrieves historical reward transactions for authenticated user, newest first.
 * 
 * @route   GET /api/rewards/history
 * @access  Private (Authenticated user)
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
async function getHistory(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const transactions = await rewardsService.getRewardHistory(userId);

    return success(res, transactions, 'Reward transaction history retrieved successfully', 200);
  } catch (err) {
    if (err.statusCode && err.code) {
      return error(res, err.message, err.statusCode, err.code);
    }

    logger.error(`[rewardsController.getHistory] Unexpected error: ${err.message}`, err);
    return error(res, 'Internal server error occurred while retrieving reward history', 500, 'SERVER_ERROR');
  }
}

module.exports = {
  getBalance,
  getHistory,
};
