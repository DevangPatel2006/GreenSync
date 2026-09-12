const mongoose = require('mongoose');

/**
 * Device Mongoose Schema (Handbook Section 13)
 * 
 * Minimal stub representing the Device model owned by Backend A.
 * Read-only from the perspective of the Scheduling engine.
 */
const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Device name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Device type is required'],
      enum: {
        values: ['ev_charging', 'washing_machine', 'water_heater', 'battery', 'industrial', 'other'],
        message: 'Invalid device type',
      },
    },
    energyRequired: {
      type: Number,
      required: [true, 'Energy required (kWh) is required'],
      min: [0.01, 'Energy required must be greater than 0'],
    },
    earliestStart: {
      type: Date,
      required: [true, 'Earliest start timestamp is required'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline timestamp is required'],
    },
    flexibility: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
