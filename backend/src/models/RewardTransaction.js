const mongoose = require('mongoose');

/**
 * RewardTransaction Mongoose Schema (Handbook Section 13)
 * 
 * Represents an immutable environmental impact reward record for a completed schedule.
 * 
 * FROZEN FIELD SET CONTRACT:
 * Exactly the following fields are defined:
 * - userId (ObjectId -> User, required)
 * - scheduleId (ObjectId -> Schedule, required, unique)
 * - coins (Number, required)
 * - reason (String, required)
 * - impactType (String, enum ['renewable', 'peak_reduction', 'bonus'], required)
 */
const rewardTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      required: [true, 'Schedule ID is required'],
      unique: true,
      index: true,
    },
    coins: {
      type: Number,
      required: [true, 'Coins amount is required'],
      min: [0, 'Coins cannot be negative'],
    },
    reason: {
      type: String,
      required: [true, 'Reward reason is required'],
      trim: true,
    },
    impactType: {
      type: String,
      required: [true, 'Impact type is required'],
      enum: {
        values: ['renewable', 'peak_reduction', 'bonus'],
        message: 'Invalid impact type',
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for user history retrieval
rewardTransactionSchema.index({ userId: 1, createdAt: -1 });

const RewardTransaction = mongoose.model('RewardTransaction', rewardTransactionSchema);

module.exports = RewardTransaction;
