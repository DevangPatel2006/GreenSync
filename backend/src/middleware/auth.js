const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

/**
 * JWT Authentication Middleware
 * Verifies Bearer JWT token from Authorization header
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Expect format "Bearer <token>"
  if (!authHeader || typeof authHeader !== 'string') {
    return next(new AppError('Authorization token required.', 401, 'UNAUTHORIZED'));
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return next(new AppError('Malformed authorization header. Expected "Bearer <token>".', 401, 'UNAUTHORIZED'));
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // Attach decoded user to request object
    req.user = {
      id: payload.sub,
      sub: payload.sub,
      role: payload.role,
    };

    return next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token has expired.' : 'Invalid or malformed token.';
    return next(new AppError(message, 401, 'UNAUTHORIZED'));
  }
};

/**
 * Role authorization middleware for admin-only routes
 * Checks if req.user.role === "admin"
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Access forbidden: Admins only.', 403, 'FORBIDDEN'));
  }
  return next();
};

/**
 * Helper to require any specified role(s)
 * @param  {...string} roles
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('Access forbidden: Insufficient permissions.', 403, 'FORBIDDEN'));
  }
  return next();
};

// Support both direct function import and destructuring
auth.auth = auth;
auth.requireAdmin = requireAdmin;
auth.requireRole = requireRole;

module.exports = auth;
module.exports.auth = auth;
module.exports.requireAdmin = requireAdmin;
module.exports.requireRole = requireRole;
