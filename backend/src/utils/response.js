/**
 * Standard API response helper functions
 *
 * Success envelope:
 * { "success": true, "data": {}, "message": "optional" }
 *
 * Error envelope:
 * { "success": false, "error": { "code": "...", "message": "..." } }
 */

/**
 * Format and send a standardized success response.
 * @param {import('express').Response} res
 * @param {any} [data={}]
 * @param {string} [message]
 * @param {number} [statusCode=200]
 */
const success = (res, data = {}, message, statusCode = 200) => {
  const payload = {
    success: true,
    data,
  };

  if (message !== undefined && message !== null) {
    payload.message = message;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Format and send a standardized error response.
 * Polymorphic signature supporting both:
 * 1. error(res, message, statusCode, code, extra)
 * 2. error(res, code, message, statusCode)
 */
const error = (res, arg1 = 'Error occurred', arg2 = 500, arg3 = 'SERVER_ERROR', extra = {}) => {
  let message = 'Error occurred';
  let statusCode = 500;
  let code = 'SERVER_ERROR';
  let extraObj = {};

  if (typeof arg1 === 'object' && arg1 !== null) {
    code = arg1.code || 'SERVER_ERROR';
    message = arg1.message || 'Error occurred';
    statusCode = typeof arg2 === 'number' ? arg2 : 500;
    extraObj = { ...arg1 };
    delete extraObj.code;
    delete extraObj.message;
  } else if (typeof arg1 === 'string' && typeof arg2 === 'string' && typeof arg3 === 'number') {
    // error(res, code, message, statusCode)
    code = arg1;
    message = arg2;
    statusCode = arg3;
    extraObj = typeof extra === 'object' && extra !== null ? { ...extra } : {};
  } else if (typeof arg1 === 'string' && typeof arg2 === 'number') {
    // error(res, message, statusCode, code, extra)
    message = arg1;
    statusCode = arg2;
    code = typeof arg3 === 'string' ? arg3 : (arg3 && arg3.code) || 'SERVER_ERROR';
    extraObj = typeof extra === 'object' && extra !== null ? { ...extra } : {};
  } else if (typeof arg1 === 'string') {
    message = arg1;
    code = typeof arg2 === 'string' ? arg2 : 'SERVER_ERROR';
    statusCode = typeof arg3 === 'number' ? arg3 : 500;
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...extraObj,
    },
  });
};

module.exports = {
  success,
  error,
};
