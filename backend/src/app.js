const express = require('express');
const cors = require('cors');
const energyRoutes = require('./routes/energyRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const rewardsRoutes = require('./routes/rewardsRoutes');
const impactRoutes = require('./routes/impactRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// API Resource Routers
app.use('/api/energy', energyRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/impact', impactRoutes);

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
