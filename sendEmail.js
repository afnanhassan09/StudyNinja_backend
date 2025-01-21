const { sendEmail } = require('./utils/sendEmail.js');

const testEmail = async () => {
    try {
        const recipient = 'i220991@nu.edu.pk'; // Replace with the recipient's email address
        const subject = 'Test Email'; // Add the subject here
        const body = 'This is a test email sent using Gmail SMTP and Nodemailer with a subject.';

        const response = await sendEmail(recipient, subject, body);
        console.log('Test email sent successfully:', response);
    } catch (error) {
        console.error('Test email failed:', error.message);
    }
};



testEmail();
