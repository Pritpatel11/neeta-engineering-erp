const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const routes = require('./routes');

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parse form data

const { isDbConnected } = require('./config/db');

// Basic route for testing
app.get('/', (req, res) => {
  res.send('ERP Backend API is running...');
});

// Database readiness check for API routes
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (!isDbConnected()) {
    return res.status(503).json({
      message: 'Database service (MongoDB) is not connected. Please ensure MongoDB is started (e.g. net start MongoDB).',
      code: 'DB_NOT_CONNECTED',
    });
  }
  next();
});

// API Routes
app.use('/api', routes);


// Error Handling Middleware (optional, basic setup)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server Error' });
});

module.exports = app;
