const express = require('express');
const impactController = require('../controllers/impactController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/impact/summary
 * @desc    Get personal environmental and grid impact summary
 * @access  Private (Authenticated user)
 */
router.get('/summary', auth, impactController.getSummary);

/**
 * @route   GET /api/impact/admin
 * @desc    Get aggregate platform-wide grid flexibility and impact metrics
 * @access  Private (Admin only)
 */
router.get('/admin', auth, impactController.getAdmin);

module.exports = router;
