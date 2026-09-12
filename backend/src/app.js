const express = require('express');
const cors = require('cors');
const energyRoutes = require('./routes/energyRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// API Resource Routers
app.use('/api/energy', energyRoutes);

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
