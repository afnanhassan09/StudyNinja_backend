const express = require('express');
const router = express.Router();
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const { sendEmail } = require('../utils/sendEmail.js'); // Replace with your email utility function
const { sendSMS } = require('../utils/SMS.js'); // Replace with your SMS utility function

class NotificationController {
    
    async sendNotification(req, res) {
        const { userId, message } = req.body;

        if (!userId || !message) {
            return res.status(400).json({ message: 'User ID and message are required' });
        }

        try {
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const { name, email, phone } = user;

            const [emailResult, smsResult] = await Promise.all([
                sendEmail(email, 'Notification', message),
                sendSMS(phone, message)
            ]);

            // Log the notification in the database
            const notification = new Notification({
                userId,
                name,
                email,
                phone,
                message,
            });

            await notification.save();

            res.status(200).json({
                message: 'Notification sent successfully',
                notification,
                emailResult,
                smsResult,
            });
        } catch (error) {
            console.error('Error sending notification:', error);
            res.status(500).json({
                message: 'Failed to send notification',
                error: error.message,
            });
        }
    }
}

module.exports = new NotificationController();
