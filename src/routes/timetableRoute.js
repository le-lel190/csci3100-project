/**
 * Timetable routes for managing user course selections
 * Provides endpoints to save and retrieve semester timetables
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

/**
 * Save a user's timetable for a specific semester
 * 
 * @route POST /timetable
 * @auth Required
 * @body {string} semester - The semester identifier (e.g., "Fall2023")
 * @body {Array} selectedCourses - Array of course objects the user has selected
 * @returns {Object} Success message or error
 */
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { semester, selectedCourses } = req.body;

    // Validate the data
    if (!semester || !Array.isArray(selectedCourses)) {
      return res.status(400).json({ error: 'Invalid timetable data' });
    }

    // Update the user's timetable in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the timetable map
    user.timetable.set(semester, selectedCourses);
    await user.save();

    res.status(200).json({ message: 'Timetable saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Retrieve a user's timetable for a specific semester
 * 
 * @route GET /timetable/:semester
 * @auth Required
 * @param {string} semester - The semester identifier to retrieve
 * @returns {Array} The selected courses for the specified semester
 */
router.get('/:semester', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { semester } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the selected courses for the specified semester
    const selectedCourses = user.timetable.get(semester) || [];
    res.status(200).json(selectedCourses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 