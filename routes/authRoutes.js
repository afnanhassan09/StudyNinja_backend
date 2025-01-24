const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AuthController = require('../controllers/authController');

// User Registration
router.post('/register', AuthController.register);

router.post('/resendCode', AuthController.resendVerificationCode);

// User Login (Step 1: Validate email and password, send 2FA code)
router.post('/login', AuthController.login);

// Email Verification
router.post('/verifyEmail', AuthController.verifyEmail);

// 2FA Verification (Step 2: Verify 2FA code and log in)
router.post('/verify2FA', AuthController.verify2FA);

// Request code Reset
router.post('/resend2FA', AuthController.resend2FACode);

// Request Password Reset
router.post('/requestPasswordReset', AuthController.requestPasswordReset);

// Reset Password
router.post('/resetPassword', AuthController.resetPassword);

module.exports = router;
