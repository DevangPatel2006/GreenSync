const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

// Simple, effective email format regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sign JWT token for user
 * @param {object} user
 * @returns {string}
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET || 'secret',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return next(new AppError('Name is required.', 400, 'VALIDATION_ERROR'));
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return next(new AppError('Please provide a valid email address.', 400, 'VALIDATION_ERROR'));
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return next(new AppError('Password must be at least 8 characters long.', 400, 'VALIDATION_ERROR'));
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return next(new AppError('Email is already registered.', 400, 'VALIDATION_ERROR'));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const token = generateToken(user);

    return success(
      res,
      {
        user,
        token,
      },
      'User registered successfully',
      201
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return next(
        new AppError("That email or password doesn't match our records.", 401, 'UNAUTHORIZED')
      );
    }

    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    // Explicitly select passwordHash for authentication check
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      return next(
        new AppError("That email or password doesn't match our records.", 401, 'UNAUTHORIZED')
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(
        new AppError("That email or password doesn't match our records.", 401, 'UNAUTHORIZED')
      );
    }

    const token = generateToken(user);

    // Convert to JSON / ensure passwordHash is excluded
    const userObj = user.toJSON ? user.toJSON() : user.toObject();
    delete userObj.passwordHash;

    return success(
      res,
      {
        user: userObj,
        token,
      },
      'Logged in successfully'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * @desc    Logout user (stateless JWT client cleanup)
 * @route   POST /api/auth/logout
 * @access  Protected
 */
const logout = async (req, res, next) => {
  try {
    return success(res, {}, 'Logged out successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * @desc    Get currently authenticated user profile
 * @route   GET /api/auth/me
 * @access  Protected
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.user && (req.user.sub || req.user.id || req.user._id);
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

module.exports = {
  register,
  login,
  logout,
  getMe,
};
