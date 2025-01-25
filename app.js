const mongoose = require('mongoose');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dbConnection = require('./config/dbConnection.js');

const authRoutes = require('./routes/authRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const Message = require('./models/messageModel'); // Assuming you have a Message model

dbConnection();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173', // Replace with your frontend URL
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    },
});

app.use(express.json());

function logRequest(req, res, next) {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
    next();
}
app.use(logRequest);
app.use(cors());

// WebSocket setup
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a user-specific room
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User with ID ${userId} joined their room`);
    });

    // Handle sending messages
    socket.on('sendMessage', async ({ sender, recipient, content }) => {
        try {
            const message = new Message({ sender, recipient, content });
            await message.save();

            // Send message to the recipient in real time
            io.to(recipient).emit('receiveMessage', message);
            console.log(`Message sent from ${sender} to ${recipient}: ${content}`);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notification', notificationRoutes);

app.get('/', (req, res) => {
    const code = req.query.code;
    if (code) {
        console.log('Authorization Code:', code);
        res.send('Authorization code received. You can close this window.');
    } else {
        res.send('No authorization code found.');
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running at ${process.env.BASE_URL || 'http://localhost'}:${PORT}`);
});
