const express = require('express');
const rewardsController = require('../controllers/rewardsController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/rewards/balance
 * @desc    Get user's current FlexCoin balance
 * @access  Private (Authenticated user)
 */
router.get('/balance', auth, rewardsController.getBalance);

/**
 * @route   GET /api/rewards/history
 * @desc    Get user's reward transaction history
 * @access  Private (Authenticated user)
 */
router.get('/history', auth, rewardsController.getHistory);

module.exports = router;
