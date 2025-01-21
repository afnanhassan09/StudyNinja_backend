const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables from .env file

/**
 * Sends an email using Gmail SMTP.
 *
 * @param {string} to - Recipient's email address.
 * @param {string} subject - Email subject.
 * @param {string} body - Email body text.
 * @returns {Promise<string>} - Confirmation message if email is sent successfully.
 */
const sendEmail = async (to, subject, body) => {
    try {
        // Create a transporter object using Gmail SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Your Gmail address from the environment variable
                pass: process.env.EMAIL_PASS, // Your Gmail App Password from the environment variable
            },
        });

        // Define the email options
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to: to, // Recipient address
            subject: subject, // Subject line
            text: body, // Plain text body
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return info.response;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

module.exports = { sendEmail };
