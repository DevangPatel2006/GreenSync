const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/schedule/recommend
 * @desc    Generate optimal schedule recommendation for device
 * @access  Private (Owner only)
 */
router.post('/recommend', auth, scheduleController.recommend);

/**
 * @route   POST /api/schedule/:id/accept
 * @desc    Accept a proposed schedule recommendation
 * @access  Private (Owner only)
 */
router.post('/:id/accept', auth, scheduleController.accept);

/**
 * @route   GET /api/schedule/history
 * @desc    Get user's schedule history
 * @access  Private (Authenticated user)
 */
router.get('/history', auth, scheduleController.history);

module.exports = router;
