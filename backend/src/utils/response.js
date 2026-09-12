/**
 * Standard API response helper functions per Team Handbook Section 15
 * 
 * Success: { success: true, data, message }
 * Error:   { success: false, error: { code, message, ...extra } }
 */

/**
 * Standard success response helper.
 * 
 * @param {import('express').Response} res - Express response object
 * @param {any} data - Payload data
 * @param {string} [message='Success'] - Human-readable success message
 * @param {number} [statusCode=200] - HTTP status code
 */
const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard error response helper per Team Handbook Section 15.
 * 
 * @param {import('express').Response} res - Express response object
 * @param {string} [message='Error occurred'] - Human-readable error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {string|object} [code='SERVER_ERROR'] - Error code or options object
 * @param {object} [extra={}] - Additional metadata fields
 */
const error = (res, message = 'Error occurred', statusCode = 500, code = 'SERVER_ERROR', extra = {}) => {
  let errorCode = typeof code === 'string' ? code : (code && code.code) || 'SERVER_ERROR';
  let extraObj = typeof code === 'object' && code !== null ? { ...code, ...extra } : { ...extra };
  delete extraObj.code;
  delete extraObj.message;

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...extraObj,
    },
  });
};

module.exports = {
  success,
  error,
};
