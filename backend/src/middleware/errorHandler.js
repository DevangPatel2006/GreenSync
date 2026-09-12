const logger = require('../utils/logger');
const { error: sendErrorResponse } = require('../utils/response');

/**
 * Standard error codes mapped by HTTP status codes
 */
const STATUS_CODE_MAP = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  500: 'SERVER_ERROR',
};

/**
 * Global Error Handling Middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (logger && typeof logger.error === 'function') {
    logger.error(err.stack || err.message);
  } else {
    console.error(err.stack || err.message);
  }

  let statusCode = err.statusCode || err.status || 500;
  let code = err.code;
  let message = err.message || 'Internal Server Error';

  // Handle common Mongoose/JWT errors
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
  }

  const validCodes = ['VALIDATION_ERROR', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'SERVER_ERROR'];

  // Ensure code matches one of the defined error codes or falls back to status map
  if (!code || !validCodes.includes(code) || (code === 'SERVER_ERROR' && statusCode !== 500)) {
    code = STATUS_CODE_MAP[statusCode] || 'SERVER_ERROR';
  }

  return sendErrorResponse(res, message, statusCode, code);
};

module.exports = errorHandler;
