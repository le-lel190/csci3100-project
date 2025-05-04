/**
 * Authentication Middleware
 * 
 * This module provides middleware functions for user authentication and authorization.
 * It uses JSON Web Tokens (JWT) to authenticate requests and maintain user sessions.
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Configuration constants
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, always use environment variable
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Standard authentication middleware
 * 
 * Verifies the JWT token from cookies or Authorization header,
 * checks if the session is still valid, and refreshes the token.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const auth = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token validity
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token has a lastActivity timestamp
    if (!decoded.lastActivity || Date.now() - decoded.lastActivity > SESSION_TIMEOUT) {
      // Session expired or no activity timestamp
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }
    
    // Update the token with a new lastActivity timestamp
    const updatedToken = jwt.sign({ 
      userId: decoded.userId,
      lastActivity: Date.now() 
    }, JWT_SECRET, {
      expiresIn: '24h'
    });
    
    // Set the updated token in the cookie
    res.cookie('token', updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    // Make user ID available for route handlers
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Admin authentication middleware
 * 
 * Extends the standard authentication by also verifying that
 * the authenticated user has admin privileges.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const adminAuth = async (req, res, next) => {
  try {
    // First run the standard auth middleware
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token validity
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token has a lastActivity timestamp
    if (!decoded.lastActivity || Date.now() - decoded.lastActivity > SESSION_TIMEOUT) {
      // Session expired or no activity timestamp
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }
    
    // Update the token with a new lastActivity timestamp
    const updatedToken = jwt.sign({ 
      userId: decoded.userId,
      lastActivity: Date.now() 
    }, JWT_SECRET, {
      expiresIn: '24h'
    });
    
    // Set the updated token in the cookie
    res.cookie('token', updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    // Make user ID available for route handlers
    req.userId = decoded.userId;
    
    // Perform additional admin role verification
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token or insufficient permissions' });
  }
};

module.exports = {
  auth,
  adminAuth,
  JWT_SECRET
}; 