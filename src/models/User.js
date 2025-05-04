/**
 * User Model
 * 
 * Defines the schema and methods for user accounts in the course planner application.
 * Includes authentication functionality and study plan management.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * 
 * Defines the structure and validation rules for user documents in the database.
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
  },
  emailVerificationExpires: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  /**
   * Study Plan
   * 
   * Array of courses the user plans to take, organized by year and semester.
   */
  studyPlan: [
    {
      courseId: {
        type: String,
        required: true
      },
      year: {
        type: Number,
        required: true
      },
      semester: {
        type: Number,
        required: true
      }
    }
  ],
  /**
   * Timetable
   * 
   * Maps semesters to arrays of course IDs that the user has scheduled.
   */
  timetable: {
    type: Map,
    of: [String], // Array of course IDs for each semester
    default: {}
  }
});

/**
 * Password Hashing Middleware
 * 
 * Automatically hashes the user's password before saving to the database.
 * Only runs when the password field has been modified.
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare Password Method
 * 
 * Securely compares a candidate password with the user's hashed password.
 * Used during login authentication.
 * 
 * @param {string} candidatePassword - The plain text password to compare
 * @returns {Promise<boolean>} - Promise resolving to true if passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 