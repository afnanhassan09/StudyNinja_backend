const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['student', 'tutor', 'admin'],
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        // Email verification fields
        emailVerificationCode: {
            type: String,
            default: null,
        },
        emailVerificationExpiry: {
            type: Date,
            default: null,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        // 2FA fields
        twoFAToken: {
            type: String,
            default: null,
        },
        twoFATokenExpiry: {
            type: Date,
            default: null,
        },
        // Password reset fields
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordTime: {
            type: Date,
            default: null,
        },
        onboardingCompleted: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true, // Automatically add createdAt and updatedAt fields
    }
);

// Password comparison method
UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
