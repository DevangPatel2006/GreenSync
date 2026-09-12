const express = require('express');
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);

module.exports = router;
