/**
 * Main Server Application
 * 
 * This file is the entry point for the Course Planner application.
 * It sets up Express server, connects to MongoDB, and configures all routes.
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const commentRoutes = require('./routes/commentRoute');
const studyPlanRoute = require('./routes/studyPlanRoute');
const timetableRoute = require('./routes/timetableRoute');
const path = require('path');
const { auth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Middleware Configuration
 * - JSON parsing for request bodies
 * - URL-encoded data parsing
 * - Cookie parsing for authentication
 * - Static file serving from public directory
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * MongoDB Connection
 * Uses environment variables for connection string
 */
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

/**
 * Route Definitions
 */

// Serve main application frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Protected timetable route - requires authentication
app.get('/timetable', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'timetable.html'));
});

// Authentication routes for login, signup, etc.
app.use('/api/auth', authRoutes);

// Course information API endpoints
app.use('/api/courses', coursesRoutes);

/**
 * Admin route to fetch registered users
 * Protected by authentication middleware
 */
app.get('/api/users', auth, async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Course comment routes for reviews and feedback
app.use(commentRoutes);

// Study plan creation and management routes
app.use(studyPlanRoute);

// Timetable generation and management routes
app.use('/api/timetable', timetableRoute);

/**
 * Development-only route for debugging
 * WARNING: This should be removed in production
 */
app.get('/api/debug/users', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

/**
 * Global error handling middleware
 * Catches any errors thrown during request processing
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

/**
 * Server Initialization
 * Listens on all interfaces on the specified port
 */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});