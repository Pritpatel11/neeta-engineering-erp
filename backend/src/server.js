require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { autoSeedDefaultAdmin } = require('./controllers/authController');

// Connect to MongoDB and seed default admin once connected
connectDB(() => {
  autoSeedDefaultAdmin();
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

