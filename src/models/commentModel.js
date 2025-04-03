//models/comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  courseId: String,
  author: String,
  content: String,
  rating: { type: Number, min: 1, max: 5 },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);
