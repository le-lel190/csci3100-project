/**
 * Study Plan Router
 * Handles API endpoints for managing user study plans
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth'); // Import the auth middleware

/**
 * @route POST /api/studyplan
 * @desc Save a user's study plan
 * @access Private - requires authentication
 * @param {Array} req.body.studyPlan - The study plan data to save
 * @returns {Object} - Success message or error
 */
router.post('/api/studyplan', auth, async (req, res) => {
  try {
    const userId = req.userId; // Use req.userId set by the auth middleware
    const { studyPlan } = req.body;

    // Validate the study plan data
    if (!Array.isArray(studyPlan)) {
      return res.status(400).json({ error: 'Study plan must be an array' });
    }

    // Update the user's study plan in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.studyPlan = studyPlan; // Replace the existing study plan with the new one
    await user.save();

    res.status(200).json({ message: 'Study plan saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/studyplan
 * @desc Retrieve a user's study plan
 * @access Private - requires authentication
 * @returns {Array} - The user's study plan or empty array if none exists
 */
router.get('/api/studyplan', auth, async (req, res) => {
  // console.log('GET /api/studyplan called');
  // console.log('User ID from auth middleware:', req.userId);
  try {
      const userId = req.userId;
      // console.log('Finding user with ID:', userId);
      const user = await User.findById(userId);

      if (!user) {
          // console.log('User not found for ID:', userId);
          return res.status(404).json({ error: 'User not found' });
      }

      // console.log('User study plan:', user.studyPlan || []);
      res.status(200).json(user.studyPlan || []);
  } catch (error) {
      // console.error('Error in GET /api/studyplan:', error);
      res.status(500).json({ error: error.message });
  }
});

module.exports = router;