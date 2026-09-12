/**
 * Request Validation Middleware Wrapper
 * @param {Function} schemaValidator - Validation function or schema with validate/safeParse method
 */
const validate = (schemaValidator) => (req, res, next) => {
  if (typeof schemaValidator === 'function') {
    const error = schemaValidator(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
  }
  next();
};

module.exports = validate;
