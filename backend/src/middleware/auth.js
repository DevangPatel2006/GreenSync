const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

/**
 * Authentication Middleware
 * Verifies Bearer JWT token from Authorization header
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Access denied. No token provided.', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (ex) {
    return error(res, 'Invalid token.', 401, 'UNAUTHORIZED');
  }
};

module.exports = auth;
