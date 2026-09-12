const express = require('express');
const cors = require('cors');

// Teammate routes
const energyRoutes = require('./routes/energyRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const rewardsRoutes = require('./routes/rewardsRoutes');
const impactRoutes = require('./routes/impactRoutes');

// Auth, Device, User & Health routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

// Global Middlewares
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Teammate API Resource Routers
app.use('/api/energy', energyRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/impact', impactRoutes);

// Auth, User, Device & Health API Routers
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);

// 404 Handler for undefined routes
app.use((req, res, next) => {
  next(new AppError(`Resource not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
});

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
