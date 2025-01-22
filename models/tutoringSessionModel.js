const mongoose = require('mongoose');

const TutoringSessionSchema = new mongoose.Schema({
    tutorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    purpose: {
        type: String,
    },
    meetingLink: {
        type: String,
        default: ''
    },
    startTime: {
        type: Date,
    },
    endTime: {
        type: Date,
    },
    rated: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const TutoringSession = mongoose.model('TutoringSession', TutoringSessionSchema);

module.exports = TutoringSession;


