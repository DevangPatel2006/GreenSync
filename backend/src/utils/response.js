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
 * @param {object} [data={}]
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
 * @param {import('express').Response} res
 * @param {string|object} [code='SERVER_ERROR']
 * @param {string|number} [message='Internal Server Error']
 * @param {number|string} [statusCode=500]
 */
const error = (res, code = 'SERVER_ERROR', message = 'Internal Server Error', statusCode = 500) => {
  let errorCode = code;
  let errorMessage = message;
  let status = statusCode;

  if (typeof code === 'object' && code !== null) {
    errorCode = code.code || 'SERVER_ERROR';
    errorMessage = code.message || 'Internal Server Error';
    status = typeof message === 'number' ? message : 500;
  } else if (typeof message === 'number') {
    status = message;
    errorMessage = code;
    errorCode = typeof statusCode === 'string' ? statusCode : 'SERVER_ERROR';
  }

  return res.status(status).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
    },
  });
};

module.exports = {
  success,
  error,
};
