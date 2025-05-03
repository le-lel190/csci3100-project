/**
 * @fileOverview Comment Model for course-related comments
 * @module models/commentModel
 * @description Defines the Mongoose schema and model for course comments
 */

//models/comment.js
const mongoose = require('mongoose');

/**
 * Comment Schema Definition
 * @typedef {Object} CommentSchema
 * @property {String} courseId - Identifier for the course being commented on
 * @property {String} author - Name or identifier of the comment author
 * @property {String} content - The actual comment text content
 * @property {Number} rating - Numerical rating from 1 to 5
 * @property {Date} date - Timestamp when the comment was created (defaults to current time)
 * @property {Date} lastEdited - Timestamp when the comment was last edited (null if never edited)
 */
const commentSchema = new mongoose.Schema({
  courseId: String,
  author: String,
  content: String,
  rating: { type: Number, min: 1, max: 5 },
  date: { type: Date, default: Date.now },
  lastEdited: { type: Date, default: null } // Add this field
});

/**
 * Comment model compiled from the Comment schema
 * @type {mongoose.Model}
 */
module.exports = mongoose.model('Comment', commentSchema);
