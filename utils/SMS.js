// sendMessage.js

// Load environment variables from .env file
require('dotenv').config();

// Import the Twilio library
const twilio = require('twilio');

// Retrieve Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

/**
 * Sends an SMS message using Twilio's Messaging Service.
 *
 * @param {string} to - The recipient's phone number in E.164 format (e.g., '+1234567890').
 * @param {string} body - The content of the SMS message.
 * @returns {Promise<void>}
 */
async function sendMessage(to, body) {
    try {
        const message = await client.messages.create({
            to: to,
            body: body,
            messagingServiceSid: messagingServiceSid
            // Alternatively, you can use 'from' if not using a Messaging Service
            // from: '+1234567890'
        });
        console.log(`Message sent successfully! SID: ${message.sid}`);
    } catch (error) {
        console.error('Failed to send message:', error);
    }
}

// Example usage:
// Replace with actual phone number and message
// sendMessage('+923464880929', 'Ahoy 👋');

module.exports = { sendMessage };
