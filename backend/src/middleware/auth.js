const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Verifies Bearer JWT token from Authorization header
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ success: false, message: 'Invalid token.' });
  }
};

module.exports = auth;
