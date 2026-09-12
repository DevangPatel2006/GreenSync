const mongoose = require('mongoose');
const Device = require('../models/Device');
const Schedule = require('../models/Schedule');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

const ALLOWED_TYPES = [
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
 * @desc    Get all devices owned by current user
 * @route   GET /api/devices
 * @access  Protected
 */
const getDevices = async (req, res, next) => {
  try {
    const userId = req.user && (req.user.id || req.user.sub);
    if (!userId) {
      return next(new AppError('Unauthorized access.', 401, 'UNAUTHORIZED'));
    }

    const devices = await Device.find({ userId });
    return success(res, { devices });
  } catch (err) {
    return next(err);
  }
};

/**
 * @desc    Create a new device owned by current user
 * @route   POST /api/devices
 * @access  Protected
 */
const createDevice = async (req, res, next) => {
  try {
    const userId = req.user && (req.user.id || req.user.sub);
    if (!userId) {
      return next(new AppError('Unauthorized access.', 401, 'UNAUTHORIZED'));
    }

    let {
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

    if (status === undefined && req.body && req.body.active !== undefined) {
      status = req.body.active ? 'active' : 'disabled';
    }

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return next(new AppError('Device name is required.', 400, 'VALIDATION_ERROR'));
    }

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return next(
        new AppError(
          `Device type is required and must be one of: ${ALLOWED_TYPES.join(', ')}`,
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

    // Validate optional date fields
function parseFlexibleDate(val, baseDate = new Date()) {
  if (val === undefined || val === null) return undefined;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(val.trim())) {
    const parts = val.trim().split(':').map(Number);
    const d = new Date(baseDate);
    d.setHours(parts[0], parts[1], parts[2] || 0, 0);
    return d;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

    let parsedEarliestStart = parseFlexibleDate(earliestStart);
    if (earliestStart !== undefined && earliestStart !== null && !parsedEarliestStart) {
      return next(
        new AppError('earliestStart must be a valid date.', 400, 'VALIDATION_ERROR')
      );
    }

    let parsedDeadline = parseFlexibleDate(deadline);
    if (deadline !== undefined && deadline !== null && !parsedDeadline) {
      return next(
        new AppError('deadline must be a valid date.', 400, 'VALIDATION_ERROR')
      );
    }

    const isTimeStr = (v) => typeof v === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(v.trim());
    if (parsedEarliestStart && parsedDeadline && parsedDeadline <= parsedEarliestStart) {
      if (isTimeStr(earliestStart) || isTimeStr(deadline)) {
        parsedDeadline = new Date(parsedDeadline.getTime() + 24 * 60 * 60 * 1000);
      } else {
        return next(new AppError('deadline cannot be earlier than earliestStart.', 400, 'VALIDATION_ERROR'));
      }
    }

    if ((isTimeStr(earliestStart) || isTimeStr(deadline)) && parsedDeadline && parsedDeadline.getTime() <= Date.now()) {
      if (parsedEarliestStart) {
        parsedEarliestStart = new Date(parsedEarliestStart.getTime() + 24 * 60 * 60 * 1000);
      }
      parsedDeadline = new Date(parsedDeadline.getTime() + 24 * 60 * 60 * 1000);
    }

    // Validate optional enum fields
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

    const device = await Device.create({
      userId,
      name: name.trim(),
      type,
      energyRequired,
      ...(parsedEarliestStart && { earliestStart: parsedEarliestStart }),
      ...(parsedDeadline && { deadline: parsedDeadline }),
      ...(flexibility && { flexibility }),
      ...(priority && { priority }),
      ...(currentState && { currentState }),
      ...(status && { status }),
    });

    return success(res, { device }, 'Device created successfully', 201);
  } catch (err) {
    return next(err);
  }
};

/**
 * @desc    Update an existing device (owner only)
 * @route   PUT /api/devices/:id
 * @access  Protected
 */
const updateDevice = async (req, res, next) => {
  try {
    const userId = req.user && (req.user.id || req.user.sub);
    if (!userId) {
      return next(new AppError('Unauthorized access.', 401, 'UNAUTHORIZED'));
    }

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid device ID format.', 400, 'VALIDATION_ERROR'));
    }

    const device = await Device.findById(id);
    if (!device) {
      return next(new AppError('Device not found.', 404, 'NOT_FOUND'));
    }

    // Verify ownership
    if (device.userId.toString() !== userId.toString()) {
      return next(new AppError('Access forbidden: You do not own this device.', 403, 'FORBIDDEN'));
    }

    let {
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

    if (status === undefined && req.body && req.body.active !== undefined) {
      status = req.body.active ? 'active' : 'disabled';
    }

    // Validate partial updates if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return next(new AppError('Device name cannot be empty.', 400, 'VALIDATION_ERROR'));
      }
      device.name = name.trim();
    }

    if (type !== undefined) {
      if (!ALLOWED_TYPES.includes(type)) {
        return next(
          new AppError(
            `Device type must be one of: ${ALLOWED_TYPES.join(', ')}`,
            400,
            'VALIDATION_ERROR'
          )
        );
      }
      device.type = type;
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
      device.energyRequired = energyRequired;
    }

    if (earliestStart !== undefined) {
      if (earliestStart === null) {
        device.earliestStart = undefined;
      } else {
        const parsed = new Date(earliestStart);
        if (isNaN(parsed.getTime())) {
          return next(
            new AppError('earliestStart must be a valid date.', 400, 'VALIDATION_ERROR')
          );
        }
        device.earliestStart = parsed;
      }
    }

    if (deadline !== undefined) {
      if (deadline === null) {
        device.deadline = undefined;
      } else {
        const parsed = new Date(deadline);
        if (isNaN(parsed.getTime())) {
          return next(new AppError('deadline must be a valid date.', 400, 'VALIDATION_ERROR'));
        }
        device.deadline = parsed;
      }
    }

    if (device.earliestStart && device.deadline && device.deadline < device.earliestStart) {
      return next(
        new AppError('deadline cannot be earlier than earliestStart.', 400, 'VALIDATION_ERROR')
      );
    }

    if (flexibility !== undefined) {
      if (!ALLOWED_FLEXIBILITIES.includes(flexibility)) {
        return next(
          new AppError(
            `flexibility must be one of: ${ALLOWED_FLEXIBILITIES.join(', ')}`,
            400,
            'VALIDATION_ERROR'
          )
        );
      }
      device.flexibility = flexibility;
    }

    if (priority !== undefined) {
      if (!ALLOWED_PRIORITIES.includes(priority)) {
        return next(
          new AppError(
            `priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`,
            400,
            'VALIDATION_ERROR'
          )
        );
      }
      device.priority = priority;
    }

    if (currentState !== undefined) {
      if (!ALLOWED_CURRENT_STATES.includes(currentState)) {
        return next(
          new AppError(
            `currentState must be one of: ${ALLOWED_CURRENT_STATES.join(', ')}`,
            400,
            'VALIDATION_ERROR'
          )
        );
      }
      device.currentState = currentState;
    }

    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return next(
          new AppError(
            `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
            400,
            'VALIDATION_ERROR'
          )
        );
      }
      device.status = status;
    }

    await device.save();

    return success(res, { device }, 'Device updated successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * @desc    Delete an existing device (owner only)
 * @route   DELETE /api/devices/:id
 * @access  Protected
 */
const deleteDevice = async (req, res, next) => {
  try {
    const userId = req.user && (req.user.id || req.user.sub);
    if (!userId) {
      return next(new AppError('Unauthorized access.', 401, 'UNAUTHORIZED'));
    }

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid device ID format.', 400, 'VALIDATION_ERROR'));
    }

    const device = await Device.findById(id);
    if (!device) {
      return next(new AppError('Device not found.', 404, 'NOT_FOUND'));
    }

    // Verify ownership
    if (device.userId.toString() !== userId.toString()) {
      return next(new AppError('Access forbidden: You do not own this device.', 403, 'FORBIDDEN'));
    }

    await Schedule.deleteMany({ deviceId: id, status: { $in: ['proposed', 'accepted'] } });
    await Device.findByIdAndDelete(id);

    return success(res, {}, 'Device deleted successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
};
