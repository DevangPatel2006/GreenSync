const AppError = require('../utils/AppError');

// Simple, effective email format regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_DEVICE_TYPES = [
  'ev_charging',
  'washing_machine',
  'water_heater',
  'battery',
  'industrial',
  'other',
];
const ALLOWED_FLEXIBILITIES = ['low', 'medium', 'high'];
const ALLOWED_PRIORITIES = ['low', 'normal', 'high'];
const ALLOWED_CURRENT_STATES = ['idle', 'running', 'completed'];
const ALLOWED_STATUSES = ['active', 'disabled'];

/**
 * Generic validation middleware wrapper
 * @param {Function} validatorFn - Function receiving req (or req.body) that returns an error message string or null
 */
const validate = (validatorFn) => (req, res, next) => {
  if (typeof validatorFn === 'function') {
    const error = validatorFn(req.body, req);
    if (error) {
      return next(
        new AppError(typeof error === 'string' ? error : 'Validation failed', 400, 'VALIDATION_ERROR')
      );
    }
  }
  return next();
};

/**
 * Validation middleware for user registration
 */
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return next(new AppError('Name is required.', 400, 'VALIDATION_ERROR'));
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return next(new AppError('Please provide a valid email address.', 400, 'VALIDATION_ERROR'));
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return next(
      new AppError('Password must be at least 8 characters long.', 400, 'VALIDATION_ERROR')
    );
  }

  return next();
};

/**
 * Validation middleware for device creation
 */
const validateDeviceCreate = (req, res, next) => {
  const {
    name,
    type,
    energyRequired,
    earliestStart,
    deadline,
    flexibility,
    priority,
    currentState,
    status,
  } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return next(new AppError('Device name is required.', 400, 'VALIDATION_ERROR'));
  }

  if (!type || !ALLOWED_DEVICE_TYPES.includes(type)) {
    return next(
      new AppError(
        `Device type is required and must be one of: ${ALLOWED_DEVICE_TYPES.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      )
    );
  }

  if (
    energyRequired === undefined ||
    energyRequired === null ||
    typeof energyRequired !== 'number' ||
    isNaN(energyRequired) ||
    energyRequired <= 0
  ) {
    return next(
      new AppError('energyRequired must be a positive number.', 400, 'VALIDATION_ERROR')
    );
  }

  let parsedEarliestStart;
  if (earliestStart !== undefined && earliestStart !== null) {
    parsedEarliestStart = new Date(earliestStart);
    if (isNaN(parsedEarliestStart.getTime())) {
      return next(
        new AppError('earliestStart must be a valid date.', 400, 'VALIDATION_ERROR')
      );
    }
  }

  let parsedDeadline;
  if (deadline !== undefined && deadline !== null) {
    parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      return next(new AppError('deadline must be a valid date.', 400, 'VALIDATION_ERROR'));
    }
  }

  if (parsedEarliestStart && parsedDeadline && parsedDeadline < parsedEarliestStart) {
    return next(
      new AppError('deadline cannot be earlier than earliestStart.', 400, 'VALIDATION_ERROR')
    );
  }

  if (flexibility && !ALLOWED_FLEXIBILITIES.includes(flexibility)) {
    return next(
      new AppError(
        `flexibility must be one of: ${ALLOWED_FLEXIBILITIES.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      )
    );
  }

  if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
    return next(
      new AppError(
        `priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      )
    );
  }

  if (currentState && !ALLOWED_CURRENT_STATES.includes(currentState)) {
    return next(
      new AppError(
        `currentState must be one of: ${ALLOWED_CURRENT_STATES.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      )
    );
  }

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return next(
      new AppError(
        `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      )
    );
  }

  return next();
};

/**
 * Validation middleware for device update
 */
const validateDeviceUpdate = (req, res, next) => {
  const {
    name,
    type,
    energyRequired,
    earliestStart,
    deadline,
    flexibility,
    priority,
    currentState,
    status,
  } = req.body || {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return next(new AppError('Device name cannot be empty.', 400, 'VALIDATION_ERROR'));
    }
  }

  if (type !== undefined) {
    if (!ALLOWED_DEVICE_TYPES.includes(type)) {
      return next(
        new AppError(
          `Device type must be one of: ${ALLOWED_DEVICE_TYPES.join(', ')}`,
          400,
          'VALIDATION_ERROR'
        )
      );
    }
  }

  if (energyRequired !== undefined) {
    if (
      typeof energyRequired !== 'number' ||
      isNaN(energyRequired) ||
      energyRequired <= 0
    ) {
      return next(
        new AppError('energyRequired must be a positive number.', 400, 'VALIDATION_ERROR')
      );
    }
  }

  let parsedEarliestStart;
  if (earliestStart !== undefined && earliestStart !== null) {
    parsedEarliestStart = new Date(earliestStart);
    if (isNaN(parsedEarliestStart.getTime())) {
      return next(
        new AppError('earliestStart must be a valid date.', 400, 'VALIDATION_ERROR')
      );
    }
  }

  let parsedDeadline;
  if (deadline !== undefined && deadline !== null) {
    parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      return next(new AppError('deadline must be a valid date.', 400, 'VALIDATION_ERROR'));
    }
  }

  if (parsedEarliestStart && parsedDeadline && parsedDeadline < parsedEarliestStart) {
    return next(
      new AppError('deadline cannot be earlier than earliestStart.', 400, 'VALIDATION_ERROR')
    );
  }

  if (flexibility !== undefined && !ALLOWED_FLEXIBILITIES.includes(flexibility)) {
    return next(
      new AppError(
        `flexibility must be one of: ${ALLOWED_FLEXIBILITIES.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      )
    );
  }

  if (priority !== undefined && !ALLOWED_PRIORITIES.includes(priority)) {
    return next(
      new AppError(
        `priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      )
    );
  }

  if (currentState !== undefined && !ALLOWED_CURRENT_STATES.includes(currentState)) {
    return next(
      new AppError(
        `currentState must be one of: ${ALLOWED_CURRENT_STATES.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      )
    );
  }

  if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
    return next(
      new AppError(
        `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      )
    );
  }

  return next();
};

validate.validate = validate;
validate.validateRegister = validateRegister;
validate.validateDeviceCreate = validateDeviceCreate;
validate.validateDeviceUpdate = validateDeviceUpdate;

module.exports = validate;
module.exports.validate = validate;
module.exports.validateRegister = validateRegister;
module.exports.validateDeviceCreate = validateDeviceCreate;
module.exports.validateDeviceUpdate = validateDeviceUpdate;
