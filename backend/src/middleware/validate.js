const AppError = require('../utils/AppError');

/**
 * Request Validation Middleware Wrapper
 * @param {Function} schemaValidator - Validation function or schema with validate/safeParse method
 */
const validate = (schemaValidator) => (req, res, next) => {
  if (typeof schemaValidator === 'function') {
    const error = schemaValidator(req.body);
    if (error) {
      return next(new AppError(typeof error === 'string' ? error : 'Validation failed', 400, 'VALIDATION_ERROR'));
    }
  }
  next();
};

module.exports = validate;
