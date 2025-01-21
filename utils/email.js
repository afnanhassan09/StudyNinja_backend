// sendEmail.js

// Load environment variables from .env file
require('dotenv').config();
const mailgun = require('mailgun-js');

// Initialize Mailgun with your API key and domain
const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
});

/**
 * Sends an email using Mailgun's API.
 *
 * @param {string} to - Recipient's email address.
 * @param {string} subject - Subject of the email.
 * @param {string} text - Plain text content of the email.
 * @param {string} [html] - (Optional) HTML content of the email.
 * @returns {Promise<void>}
 */
async function sendEmail(to, subject, text, html = null) {
    const data = {
        from: process.env.FROM_EMAIL,
        to: to,
        subject: subject,
        text: text,
    };

    if (html) {
        data.html = html;
    }

    try {
        const body = await mg.messages().send(data);
        console.log(`Email sent successfully! ID: ${body.id}`);
    } catch (error) {
        console.error('Failed to send email:', error);
        if (error.response) {
            console.error(error.response.body);
        }
    }
}

module.exports = sendEmail;
