const mongoose = require('mongoose');

/**
 * User Mongoose Schema (Handbook Section 13)
 * 
 * Minimal stub representing the User model owned by Backend A.
 * Read-only from the perspective of scheduling; updated for FlexCoin tracking.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Invalid user role',
      },
      default: 'user',
    },
    flexCoins: {
      type: Number,
      default: 0,
      min: [0, 'FlexCoins balance cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
