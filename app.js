const mongoose = require('mongoose');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dbConnection = require('./config/dbConnection.js');
const Student = require('./models/studentModel');
const Tutor = require('./models/tutorModel');
const authRoutes = require('./routes/authRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const Message = require('./models/messageModel');
const cron = require('node-cron');
const axios = require('axios');

dbConnection();

const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: "*", // Your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

const io = new Server(server, {
    cors: {
        origin: "*", // Your frontend URL
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

global.io = io;

app.use(express.json());

// function logRequest(req, res, next) {
//     console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
//     next();
// }
// app.use(logRequest);

// WebSocket setup
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Authenticate socket connection
    const token = socket.handshake.auth.token;
    if (!token) {
        console.log('No token provided, disconnecting socket');
        socket.disconnect();
        return;
    }

    // Join user to their room
    socket.on('join', (userId) => {
        if (userId) {
            socket.join(userId.toString());
            console.log(`User ${userId} joined their room`);
        }
    });

    // Handle new messages
    socket.on('sendMessage', async ({ sender, recipient, content }) => {
        try {
            if (!sender || !recipient || !content) {
                console.error('Missing required message fields:', { sender, recipient, content });
                return;
            }

            console.log('Fetching sender and recipient details...');

            // Assuming users exist in separate Student and Tutor collections
            const senderStudent = await Student.findOne({ userId: sender });
            const senderTutor = await Tutor.findOne({ userId: sender });
            const recipientStudent = await Student.findOne({ _id: recipient });
            const recipientTutor = await Tutor.findOne({ _id: recipient });

            let senderModel, recipientModel;

            if (senderStudent) senderModel = 'Student';
            else if (senderTutor) senderModel = 'Tutor';
            else throw new Error(`Sender with ID ${sender} not found in Student or Tutor collection.`);

            if (recipientStudent) recipientModel = 'Student';
            else if (recipientTutor) recipientModel = 'Tutor';
            else throw new Error(`Recipient with ID ${recipient} not found in Student or Tutor collection.`);

            console.log('Sender Model:', senderModel, '| Recipient Model:', recipientModel);

            // Create and save new message
            const message = new Message({
                sender,
                senderModel,
                recipient,
                recipientModel,
                content,
                timestamp: new Date()
            });

            const savedMessage = await message.save();
            console.log('Message saved:', savedMessage);

            // Emit to both sender and recipient
            io.to(sender.toString()).to(recipient.toString()).emit('receiveMessage', {
                _id: savedMessage._id,
                sender: savedMessage.sender,
                senderModel: savedMessage.senderModel,
                recipient: savedMessage.recipient,
                recipientModel: savedMessage.recipientModel,
                content: savedMessage.content,
                timestamp: savedMessage.timestamp
            });

        } catch (error) {
            console.error('Error handling message:', error);
        }
    });


    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notification', notificationRoutes);

app.get('/', (req, res) => {
    res.send("Welcome to studyNinja")
});

cron.schedule('*/10 * * * *', async () => {
    try {
        console.log('🔄 Making a GET request to keep the server alive...');
        const response = await axios.get('https://studyninja-backend.onrender.com/');
        console.log('✅ Server response:', response.status, response.statusText);
    } catch (error) {
        console.error('❌ Error making GET request:', error.message);
    }
});

// app.use((req, res, next) => {
//     console.log(`Request Type: ${req.method}`);
//     console.log(`Request Route: ${req.originalUrl}`);
//     next();
// });


// Make sure to export both app and server
module.exports = { app, server, io };

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});