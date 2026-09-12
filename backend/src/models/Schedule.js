const mongoose = require('mongoose');

/**
 * Schedule Mongoose Schema (Handbook Section 13)
 * 
 * Represents an optimized load-shifting schedule recommendation for a flexible device.
 * 
 * FROZEN FIELD SET CONTRACT:
 * Exactly the following fields are defined:
 * - userId (ObjectId -> User, required)
 * - deviceId (ObjectId -> Device, required)
 * - recommendedStart (Date, required)
 * - recommendedEnd (Date, required)
 * - energyShifted (Number, kWh, required)
 * - renewableUtilization (Number, 0-100, required)
 * - peakReduction (Number, required)
 * - co2Avoided (Number, required)
 * - flexCoinsEarned (Number, default 0)
 * - reason (String, required)
 * - status (String, enum ['proposed','accepted','completed','rejected'], default 'proposed')
 */
const scheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: [true, 'Device ID is required'],
      index: true,
    },
    recommendedStart: {
      type: Date,
      required: [true, 'Recommended start timestamp is required'],
    },
    recommendedEnd: {
      type: Date,
      required: [true, 'Recommended end timestamp is required'],
    },
    energyShifted: {
      type: Number,
      required: [true, 'Energy shifted (kWh) is required'],
    },
    renewableUtilization: {
      type: Number,
      required: [true, 'Renewable utilization percentage is required'],
      min: [0, 'Renewable utilization cannot be negative'],
      max: [100, 'Renewable utilization cannot exceed 100%'],
    },
    peakReduction: {
      type: Number,
      required: [true, 'Peak reduction percentage is required'],
    },
    co2Avoided: {
      type: Number,
      required: [true, 'Estimated CO2 avoided is required'],
    },
    flexCoinsEarned: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      required: [true, 'Recommendation reason is required'],
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['proposed', 'accepted', 'completed', 'rejected'],
        message: 'Invalid schedule status',
      },
      default: 'proposed',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for query performance
scheduleSchema.index({ userId: 1, createdAt: -1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
