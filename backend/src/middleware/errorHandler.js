const logger = require('../utils/logger');

/**
 * Global Error Handling Middleware
 * Express 4-argument error handler formatting all unhandled exceptions
 * into the standardized Team Handbook Section 15 envelope shape:
 * { success: false, error: { code, message, ...(dev-only stack) } }
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;
