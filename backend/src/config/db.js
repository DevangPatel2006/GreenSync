const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/greensync');
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
