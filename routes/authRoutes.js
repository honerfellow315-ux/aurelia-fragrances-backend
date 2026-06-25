// routes/authRoutes.js

const express = require('express');
const router = express.Router();

const {
  register,
  login,
  verifyOTP,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  deleteAccount
} = require('../controllers/authController');


const { protect } = require('../middleware/authMiddleware');


// Auth
router.post('/register', register);
router.post('/login', login);


// OTP
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


// Protected
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.post('/delete-account', protect, deleteAccount);


module.exports = router;
