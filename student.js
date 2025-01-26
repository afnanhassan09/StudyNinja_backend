const io = require('socket.io-client');

const studentId = '678421b5835a8bb4750b3f28'; // Replace with a real student ID
const tutorId = '678fc0f7dff12e6adea22c65'; // Replace with a real tutor ID
const socket = io('http://localhost:9001', {
    auth: { token: "your_auth_token" } // Replace with a valid auth token if needed
});

socket.on('connect', () => {
    console.log(`✅ Student connected to WebSocket server with ID: ${studentId}`);

    // Join the student's room
    socket.emit('join', studentId);

    // Send a test message to a tutor after 7 seconds
    setTimeout(() => {
        sendMessage(tutorId, "Hello Tutor! This is the Student.");
    }, 7000);
});

// Listen for incoming messages
socket.on('receiveMessage', (message) => {
    console.log(`📩 Received message from ${message.sender}: ${message.content}`);
});

// Function to send a message
function sendMessage(recipient, content) {
    const messageData = {
        sender: studentId,
        recipient: recipient,
        content: content
    };
    socket.emit('sendMessage', messageData);
    console.log(`📤 Sent message to ${recipient}: ${content}`);
}

// Disconnect event
socket.on('disconnect', () => {
    console.log('❌ Student disconnected from WebSocket server');
});
