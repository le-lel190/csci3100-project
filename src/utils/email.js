const nodemailer = require('nodemailer');

// Configure mail transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@example.com',
    pass: process.env.EMAIL_PASS || 'your-password'
  }
});

/**
 * Send verification email to user
 * @param {string} to - Recipient email
 * @param {string} username - User's username
 * @param {string} token - Verification token
 * @returns {Promise<boolean>} - Success status
 */
const sendVerificationEmail = async (to, username, token) => {
  try {
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/verify-email/${token}`;
    
    await transporter.sendMail({
      from: `"Course Planner" <${process.env.EMAIL_FROM || 'noreply@example.com'}>`,
      to,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Welcome to Course Planner, ${username}!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create this account, please ignore this email.</p>
        </div>
      `
    });
    
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail
}; 