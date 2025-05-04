/**
 * User Verification Utility
 * 
 * This script connects to MongoDB and retrieves all registered users in the system.
 * It displays basic user information (username, email, creation date) to the console.
 * Useful for administrative verification and debugging purposes.
 * 
 * Usage: 
 *   node src/scripts/check-users.js
 * 
 * Environment variables:
 *   MONGODB_URI - MongoDB connection string
 */
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB connected successfully');
  
  // Query the users
  return User.find().select('-password');
})
.then(users => {
  console.log('==== Registered Users ====');
  if (users.length === 0) {
    console.log('No users found in the database.');
  } else {
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`Username: ${user.username}, Email: ${user.email}, Created: ${user.createdAt}`);
    });
  }
})
.catch(err => {
  console.error('Error:', err);
})
.finally(() => {
  // Close the connection
  mongoose.connection.close();
  console.log('MongoDB connection closed');
}); 