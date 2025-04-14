const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, always use environment variable
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

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
    
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    // First run the standard auth middleware
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

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
    
    req.userId = decoded.userId;
    
    // Check if user is admin
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