const { sendMessage } = require('./utils/SMS.js');

// Test the function
sendMessage('+923464880929', 'This is a test message')
    .then(() => console.log('Message sent successfully'))
    .catch((error) => console.error('Error sending message:', error));