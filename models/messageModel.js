const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, refPath: 'senderModel', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, refPath: 'recipientModel', required: true },
    senderModel: { type: String, required: true, enum: ['Student', 'Tutor'] }, // Determines sender type
    recipientModel: { type: String, required: true, enum: ['Student', 'Tutor'] }, // Determines recipient type
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', MessageSchema);
