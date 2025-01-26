const io = require('socket.io-client');

const tutorId = '678fc0f7dff12e6adea22c65'; // Replace with a real tutor ID
const studentId = '678421b5835a8bb4750b3f28'; // Replace with a real student ID
const socket = io('http://localhost:9001', {
    auth: { token: "your_auth_token" } // Replace with a valid auth token if needed
});

socket.on('connect', () => {
    console.log(`✅ Tutor connected to WebSocket server with ID: ${tutorId}`);

    // Join the tutor's room
    socket.emit('join', tutorId);

    // Send a test message to a student after 5 seconds
    setTimeout(() => {
        sendMessage(studentId, "Hello Student! I am your Tutor.");
    }, 5000);
});

// Listen for incoming messages
socket.on('receiveMessage', (message) => {
    console.log(`📩 Received message from ${message.sender}: ${message.content}`);
});

// Function to send a message
function sendMessage(recipient, content) {
    const messageData = {
        sender: tutorId,
        recipient: recipient,
        content: content
    };
    socket.emit('sendMessage', messageData);
    console.log(`📤 Sent message to ${recipient}: ${content}`);
}

// Disconnect event
socket.on('disconnect', () => {
    console.log('❌ Tutor disconnected from WebSocket server');
});
