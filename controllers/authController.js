const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const crypto = require('crypto');
const { sendEmail } = require('../utils/sendEmail.js');

class AuthController {
    // User Registration
    register = async (req, res) => {
        try {
            const { name, email, password, role, phone } = req.body;

            if (!name || !email || !password || !role || !phone) {
                return res.status(400).json({
                    message: 'Please provide all required fields: name, email, password, role, and phone',
                });
            }

            let user = await User.findOne({ email: email.toLowerCase() });
            if (user) {
                return res.status(400).json({ message: 'User already registered' });
            }

            if (!['student', 'tutor', 'admin'].includes(role)) {
                return res.status(400).json({ message: 'Invalid role. Must be "Student", "Tutor", or "Admin".' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            console.log("Password", hashedPassword);
            // Generate email verification code
            const emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            user = new User({
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role,
                phone,
                emailVerificationCode: crypto.createHash('sha256').update(emailVerificationCode).digest('hex'),
                emailVerificationExpiry: Date.now() + 1 * 60 * 1000, // 10 minutes
            });

            await user.save();

            // Send email verification code
            try {
                await sendEmail(email, 'Email Verification Code', `Your email verification code is: ${emailVerificationCode}`);
            } catch (emailError) {
                console.error('Error sending Email:', emailError);
            }

            res.status(201).json({
                message: 'User registered successfully. Verification code has been sent to your email.',
                userId: user.id,
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Error during registration', error: error.message });
        }
    };

    // Email Verification
    async verifyEmail(req, res) {
        console.log("Verify Email");
        console.log(req.body);
        try {
            const { email, emailVerificationCode } = req.body;

            if (!email || !emailVerificationCode) {
                return res.status(400).json({ message: 'Email and email verification code are required.' });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            const hashedCode = crypto.createHash('sha256').update(emailVerificationCode).digest('hex');

            if (
                user.emailVerificationCode !== hashedCode ||
                Date.now() > user.emailVerificationExpiry
            ) {
                return res.status(400).json({ message: 'Invalid or expired email verification code.' });
            }
            user.emailVerified = true;
            user.emailVerificationCode = null;
            user.emailVerificationExpiry = null;
            await user.save();

            // Generate JWT token
            // const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET_, { expiresIn: '1h' });

            res.json({ message: 'Email verified successfully.' });
        } catch (error) {
            console.error('Email verification error:', error);
            res.status(500).json({ message: 'Error during email verification.', error: error.message });
        }
    }

    // Resend Email Verification Code
    async resendVerificationCode(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ message: 'Email is required.' });
            }

            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            if (user.emailVerified) {
                return res.status(400).json({ message: 'Email is already verified.' });
            }

            // Generate a new email verification code
            const emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            user.emailVerificationCode = crypto.createHash('sha256').update(emailVerificationCode).digest('hex');
            user.emailVerificationExpiry = Date.now() + 2 * 60 * 1000; // 10 minutes
            await user.save();

            // Send the new verification code via email
            try {
                await sendEmail(
                    user.email,
                    'Resend Email Verification Code',
                    `Your new email verification code is: ${emailVerificationCode}`
                );
            } catch (emailError) {
                console.error('Error sending Email:', emailError);
                return res.status(500).json({ message: 'Error sending email verification code.' });
            }

            res.json({ message: 'Verification code has been resent to your email.' });
        } catch (error) {
            console.error('Resend verification code error:', error);
            res.status(500).json({ message: 'Error resending verification code.', error: error.message });
        }
    };

    // Resend 2FA Code
    async resend2FACode(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ message: 'Email is required.' });
            }

            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            if (!user.emailVerified) {
                return res.status(403).json({ message: 'Email is not verified.' });
            }

            // Generate a new 2FA code
            const twoFAToken = Math.floor(100000 + Math.random() * 900000).toString();
            user.twoFAToken = crypto.createHash('sha256').update(twoFAToken).digest('hex');
            user.twoFATokenExpiry = Date.now() + 1 * 60 * 1000; // 10 minutes
            await user.save();

            // Send the new 2FA code via email
            try {
                await sendEmail(
                    user.email,
                    'Resend 2FA Code',
                    `Your new 2FA code is: ${twoFAToken}`
                );
            } catch (emailError) {
                console.error('Error sending Email:', emailError);
                return res.status(500).json({ message: 'Error sending 2FA code.' });
            }

            res.json({ message: '2FA code has been resent to your email.' });
        } catch (error) {
            console.error('Resend 2FA code error:', error);
            res.status(500).json({ message: 'Error resending 2FA code.', error: error.message });
        }
    }

    // Login Step 1: Validate Email and Password, Send 2FA Code
    login = async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Please provide email and password.' });
            }

            const user = await User.findOne({ email: email });
            if (!user) {
                return res.status(401).json({ message: 'Email does not exist.' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Password is incorrect.' });
            }

            if (!user.emailVerified) {
                return res.status(403).json({ message: 'Email is not verified.' });
            }

            // Generate 2FA code
            const twoFAToken = Math.floor(100000 + Math.random() * 900000).toString();
            user.twoFAToken = crypto.createHash('sha256').update(twoFAToken).digest('hex');
            user.twoFATokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
            await user.save();
            console.log("2FA Token:", twoFAToken);
            // Send 2FA code via email
            try {
                await sendEmail(user.email, 'Your 2FA Code', `Your 2FA code is: ${twoFAToken}`);
            } catch (emailError) {
                console.error('Error sending Email:', emailError);
            }

            res.json({
                message: '2FA code sent to your email.',
                userId: user.id,
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Error during login.', error: error.message });
        }
    };

    // Login Step 2: Verify 2FA Code
    verify2FA = async (req, res) => {
        try {
            const { userId, twoFAToken } = req.body;

            if (!userId || !twoFAToken) {
                return res.status(400).json({ message: 'User ID and 2FA token are required.' });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            const hashedToken = crypto.createHash('sha256').update(twoFAToken).digest('hex');

            if (
                hashedToken !== user.twoFAToken ||
                Date.now() > user.twoFATokenExpiry
            ) {
                return res.status(400).json({ message: 'Invalid or expired 2FA token.' });
            }

            user.twoFAToken = null;
            user.twoFATokenExpiry = null;
            await user.save();

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });

            res.json({
                message: '2FA verified successfully.',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    emailVerified: user.emailVerified,
                    onboardingCompleted: user.onboardingCompleted
                },
            });
        } catch (error) {
            console.error('2FA verification error:', error);
            res.status(500).json({ message: 'Error during 2FA verification.', error: error.message });
        }
    };

    // Request Password Reset
    requestPasswordReset = async (req, res) => {
        try {
            const { email } = req.body;



            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(404).json({ message: 'Email not found.' });
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            user.resetPasswordTime = Date.now() + 30 * 60 * 1000; // 30 minutes expiry
            await user.save();

            const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
            try {
                await sendEmail(user.email, 'Password Reset Request', `Reset your password here: ${resetLink}`);
            } catch (emailError) {
                console.error('Error sending Email:', emailError);
            }

            res.json({ message: 'Password reset link sent to your email.' });
        } catch (error) {
            console.error('Password reset request error:', error);
            res.status(500).json({ message: 'Error requesting password reset.', error: error.message });
        }
    };

    // Reset Password
    resetPassword = async (req, res) => {
        try {
            const { resetToken, newPassword } = req.body;

            if (!resetToken || !newPassword) {
                return res.status(400).json({ message: 'Reset token and new password are required.' });
            }

            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            const user = await User.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordTime: { $gt: Date.now() },
            });

            if (!user) {
                return res.status(400).json({ message: 'Invalid or expired reset token.' });
            }

            user.password = await bcrypt.hash(newPassword, 10);
            user.resetPasswordToken = null;
            user.resetPasswordTime = null;
            await user.save();

            res.json({ message: 'Password reset successfully.' });
        } catch (error) {
            console.error('Password reset error:', error);
            res.status(500).json({ message: 'Error resetting password.', error: error.message });
        }
    };
}

module.exports = new AuthController();
