const mongoose = require('mongoose');

/**
 * Device Schema definition
 * Shared contract for smart devices and scheduling engine
 */
const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['ev_charging', 'washing_machine', 'water_heater', 'battery', 'industrial', 'other'],
    },
    energyRequired: {
      type: Number,
    },
    currentState: {
      type: String,
      enum: ['idle', 'running', 'completed'],
    },
    earliestStart: {
      type: Date,
    },
    deadline: {
      type: Date,
    },
    flexibility: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
    },
    status: {
      type: String,
      enum: ['active', 'disabled', 'paused', 'completed', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
