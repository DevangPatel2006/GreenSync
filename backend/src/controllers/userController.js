const User = require('../models/User');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

/**
 * @desc    Get logged-in user profile
 * @route   GET /api/users/profile
 * @access  Protected
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user && (req.user.id || req.user.sub);
    if (!userId) {
      return next(new AppError('Unauthorized access.', 401, 'UNAUTHORIZED'));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found.', 404, 'NOT_FOUND'));
    }

    return success(res, { user });
  } catch (err) {
    return next(err);
  }
};

/**
 * @desc    Update logged-in user profile (name only)
 * @route   PUT /api/users/profile
 * @access  Protected
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user && (req.user.id || req.user.sub);
    if (!userId) {
      return next(new AppError('Unauthorized access.', 401, 'UNAUTHORIZED'));
    }

    const { name } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return next(new AppError('Name is required and must be a non-empty string.', 400, 'VALIDATION_ERROR'));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found.', 404, 'NOT_FOUND'));
    }

    // Update name only
    user.name = name.trim();
    await user.save();

    return success(res, { user }, 'Profile updated successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
