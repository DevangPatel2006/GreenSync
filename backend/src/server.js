const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Connect Database
connectDB();

const { startScheduleWorker } = require('./services/scheduling/scheduleWorker');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`GreenSync backend server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  startScheduleWorker(30000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = server;
