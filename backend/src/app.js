const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse incoming JSON requests

// Basic route for testing
app.get('/', (req, res) => {
  res.send('ERP Backend API is running...');
});

// API Routes
app.use('/api', routes);

// Error Handling Middleware (optional, basic setup)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server Error' });
});

module.exports = app;
