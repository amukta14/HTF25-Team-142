require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { startScheduler } = require('./utils/scheduler');

const authRoutes = require('./routes/auth');
const capsulesRoutes = require('./routes/capsules');
const sharedRoutes = require('./routes/shared');

const app = express();

// Connect to MongoDB and start scheduler after connection
connectDB()
  .then(() => {
    console.log('✅ MongoDB connected');

    // Start scheduler after DB connection
    startScheduler();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });


// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/capsules', capsulesRoutes);
app.use('/api/shared', sharedRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: err.message || 'Something went wrong!' 
  });
});

// Start scheduler
startScheduler();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});