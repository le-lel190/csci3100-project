// routes/commentRoute.js
const express = require('express');
const router = express.Router();
const Comment = require('../models/commentModel');

// Get all comments for a specific course
router.get('/api/comments/:courseId', async (req, res) => {
  try {
    const comments = await Comment.find({ courseId: req.params.courseId })
      .sort({ date: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } 
});

// Add a new comment
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

router.delete('/api/comments/:id', async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.status(200).send({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error deleting comment', error });
  }
});

module.exports = router;
