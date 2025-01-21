const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AuthController = require('../controllers/authController');

// User Registration
router.post('/register', AuthController.register);

// User Login (Step 1: Validate email and password, send 2FA code)
router.post('/login', AuthController.login);

// Email Verification
router.post('/verifyEmail', AuthController.verifyEmail);

// 2FA Verification (Step 2: Verify 2FA code and log in)
router.post('/verify2FA', AuthController.verify2FA);

// Request Password Reset
router.post('/requestPasswordReset', auth, AuthController.requestPasswordReset);

// Reset Password
router.post('/resetPassword', AuthController.resetPassword);

module.exports = router;
