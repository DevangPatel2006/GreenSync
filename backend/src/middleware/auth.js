const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

/**
 * Authentication Middleware
 * Verifies Bearer JWT token from Authorization header
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Access denied. No token provided.', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (ex) {
    return next(new AppError('Invalid token.', 401, 'UNAUTHORIZED'));
  }
};

module.exports = auth;
