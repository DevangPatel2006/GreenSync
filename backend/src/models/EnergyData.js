const mongoose = require('mongoose');

/**
 * EnergyData Mongoose Schema
 * 
 * Represents point-in-time grid conditions and renewable energy generation metrics.
 * 
 * Contract Rule: Field names are strictly fixed:
 * - timestamp (Date, required, indexed)
 * - renewableAvailability (Number, 0-100, required)
 * - gridDemand (Number, 0-100, required)
 * - price (Number, optional)
 * - source (String, enum ['live', 'simulated'], required)
 */
const energyDataSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: [true, 'Energy data timestamp is required'],
      index: true,
    },
    renewableAvailability: {
      type: Number,
      required: [true, 'Renewable availability percentage is required'],
      min: [0, 'Renewable availability cannot be less than 0%'],
      max: [100, 'Renewable availability cannot exceed 100%'],
    },
    gridDemand: {
      type: Number,
      required: [true, 'Grid demand percentage is required'],
      min: [0, 'Grid demand cannot be less than 0%'],
      max: [100, 'Grid demand cannot exceed 100%'],
    },
    price: {
      type: Number,
      required: false,
    },
    source: {
      type: String,
      required: [true, 'Data source is required'],
      enum: {
        values: ['live', 'simulated'],
        message: 'Source must be either "live" or "simulated"',
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound or single index for optimal time-series range queries and forecast evaluations
energyDataSchema.index({ timestamp: 1, source: 1 });

const EnergyData = mongoose.model('EnergyData', energyDataSchema);

module.exports = EnergyData;
