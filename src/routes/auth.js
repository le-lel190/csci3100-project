/**
 * Authentication Routes
 * 
 * This module provides Express routes for user authentication including:
 * - Registration
 * - Login
 * - Email verification
 * - Session management
 * - Admin role assignment
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { JWT_SECRET, auth } = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/email');

const router = express.Router();

/**
 * Check authentication status
 * 
 * @route GET /login
 * @middleware auth - Verifies the user is authenticated
 * @returns {Object} User data (without password) if authenticated
 * @throws {Error} 404 - If user not found
 * @throws {Error} 500 - Server error
 */
router.get('/login', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * User registration
 * 
 * @route POST /register
 * @param {string} username - Min length 3 characters
 * @param {string} email - Valid email address
 * @param {string} password - Min length 6 characters
 * @returns {Object} User data and JWT token in cookie
 * @throws {Error} 400 - Validation errors or user already exists
 * @throws {Error} 500 - Server error
 */
router.post('/register',
  [
    body('username').trim().isLength({ min: 3 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          message: 'User already exists with that email or username' 
        });
      }

      // Generate verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create new user
      const user = new User({ 
        username, 
        email, 
        password, 
        emailVerificationToken,
        emailVerificationExpires
      });
      await user.save();

      // Send verification email
      const emailSent = await sendVerificationEmail(email, username, emailVerificationToken);

      // Generate token
      const token = jwt.sign({ 
        userId: user._id,
        lastActivity: Date.now()
      }, JWT_SECRET, {
        expiresIn: '24h'
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.status(201).json({
        message: 'User created successfully. Please verify your email.',
        verificationEmailSent: emailSent,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * User login
 * 
 * @route POST /login
 * @param {string} identifier - Username or email
 * @param {string} password - User password
 * @returns {Object} User data and JWT token in cookie
 * @throws {Error} 400 - Validation errors
 * @throws {Error} 401 - Invalid credentials
 * @throws {Error} 500 - Server error
 */
router.post('/login',
  [
    body('identifier').trim().notEmpty(),
    body('password').exists()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { identifier, password } = req.body;

      // Find user by email or username
      const user = await User.findOne({
        $or: [
          { email: identifier },
          { username: identifier }
        ]
      });
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign({ 
        userId: user._id,
        lastActivity: Date.now()
      }, JWT_SECRET, {
        expiresIn: '24h'
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({
        message: 'Logged in successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * Email verification
 * 
 * @route GET /verify-email/:token
 * @param {string} token - Email verification token
 * @returns {Redirect} Redirects to homepage with verified flag
 * @throws {Error} 400 - Invalid or expired token
 * @throws {Error} 500 - Server error
 */
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired verification token' 
      });
    }

    // Update user verification status
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Redirect to login with success message
    res.redirect('/?verified=true');
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Resend verification email
 * 
 * @route POST /resend-verification
 * @middleware auth - Verifies the user is authenticated
 * @returns {Object} Success message
 * @throws {Error} 400 - Email already verified
 * @throws {Error} 404 - User not found
 * @throws {Error} 500 - Server error
 */
router.post('/resend-verification', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send email
    const emailSent = await sendVerificationEmail(user.email, user.username, emailVerificationToken);

    res.json({
      message: 'Verification email sent',
      success: emailSent
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Grant admin role to current user
 * Activated by an easter egg in the application
 * 
 * @route POST /users/grant-admin
 * @middleware auth - Verifies the user is authenticated
 * @returns {Object} Updated user data with admin privileges
 * @throws {Error} 404 - User not found
 * @throws {Error} 500 - Server error
 */
router.post('/users/grant-admin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set user as admin
    user.isAdmin = true;
    await user.save();

    res.status(200).json({ 
      message: 'Admin privileges granted successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Error granting admin privileges:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Logout user
 * 
 * @route POST /logout
 * @returns {Object} Success message
 */
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ message: 'Logged out successfully' });
});

module.exports = router; 