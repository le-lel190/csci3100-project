/**
 * Comment Route Module
 * 
 * This module defines API endpoints for handling course comments:
 * - Fetching comments for specific courses
 * - Adding new comments
 * - Deleting comments (admin only)
 * - Editing existing comments
 */
const express = require('express');
const router = express.Router();
const Comment = require('../models/commentModel');
const { auth, adminAuth } = require('../middleware/auth');

/**
 * @route   GET /api/comments/:courseId
 * @desc    Get all comments for a specific course, sorted by date (newest first)
 * @param   {string} req.params.courseId - The ID of the course to fetch comments for
 * @access  Public
 */
router.get('/api/comments/:courseId', async (req, res) => {
  try {
    const comments = await Comment.find({ courseId: req.params.courseId })
      .sort({ date: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } 
});

/**
 * @route   POST /api/comments
 * @desc    Add a new comment to a course
 * @param   {Object} req.body - Comment data
 * @param   {string} req.body.courseId - The ID of the course being commented on
 * @param   {string} req.body.author - Name of the comment author
 * @param   {string} req.body.content - Text content of the comment
 * @param   {number} req.body.rating - Numeric rating for the course
 * @access  Public
 */
router.post('/api/comments', async (req, res) => {
  try {
    const { courseId, author, content, rating } = req.body;
    
    // Create new comment
    const newComment = new Comment({
      courseId,
      author,
      content,
      rating,
      date: new Date()
    });
    
    // Save to database
    const savedComment = await newComment.save();
    res.status(201).json(savedComment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete a comment by its ID
 * @param   {string} req.params.id - The ID of the comment to delete
 * @access  Admin only
 */
router.delete('/api/comments/:id', adminAuth, async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.status(200).send({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error deleting comment', error });
  }
});

/**
 * @route   PUT /api/comments/:id
 * @desc    Edit an existing comment
 * @param   {string} req.params.id - The ID of the comment to edit
 * @param   {Object} req.body - Updated comment data
 * @param   {string} req.body.content - Updated text content
 * @param   {number} req.body.rating - Updated rating value
 * @access  Public
 */
router.put('/api/comments/:id', async (req, res) => {
  try {
    const { content, rating } = req.body;
    
    // Find and update the comment
    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      { 
        content,
        rating,
        // Add a lastEdited field to track modification time
        lastEdited: new Date()
      },
      { new: true } // Return the updated document
    );
    
    if (!updatedComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    res.status(200).json(updatedComment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


module.exports = router;
