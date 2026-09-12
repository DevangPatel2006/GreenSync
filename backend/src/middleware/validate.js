const { error } = require('../utils/response');

/**
 * Request Validation Middleware Wrapper
 * @param {Function} schemaValidator - Validation function or schema with validate/safeParse method
 */
const validate = (schemaValidator) => (req, res, next) => {
  if (typeof schemaValidator === 'function') {
    const validationError = schemaValidator(req.body);
    if (validationError) {
      return error(res, validationError, 400, 'VALIDATION_ERROR');
    }
  }
  next();
};

module.exports = validate;
