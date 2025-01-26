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
const Message = require('./models/messageModel');

dbConnection();

const app = express();
const server = http.createServer(app);

// Configure CORS for both Express and Socket.io
app.use(cors({
    origin: "http://localhost:5173", // Your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Your frontend URL
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Set io as a global variable
global.io = io;

app.use(express.json());

function logRequest(req, res, next) {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
    next();
}
app.use(logRequest);

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

            console.log('Saving message:', { sender, recipient, content });
            
            // Create and save new message
            const message = new Message({
                sender,
                recipient,
                content,
                timestamp: new Date()
            });
            const savedMessage = await message.save();
            console.log('Message saved:', savedMessage);

            // Emit to both sender and recipient
            io.to(sender.toString()).to(recipient.toString()).emit('receiveMessage', {
                _id: savedMessage._id,
                sender: savedMessage.sender,
                recipient: savedMessage.recipient,
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
    const code = req.query.code;
    if (code) {
        console.log('Authorization Code:', code);
        res.send('Authorization code received. You can close this window.');
    } else {
        res.send('No authorization code found.');
    }
});

// Make sure to export both app and server
module.exports = { app, server, io };

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});