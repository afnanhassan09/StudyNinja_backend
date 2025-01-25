const mongoose = require('mongoose');

const TutoringSchema = new mongoose.Schema({
    tutorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    availability: {
        monday: [{ type: String }],   // Example: ["09:00-10:00", "15:00-16:00"]
        tuesday: [{ type: String }],
        wednesday: [{ type: String }],
        thursday: [{ type: String }],
        friday: [{ type: String }],
        saturday: [{ type: String }],
        sunday: [{ type: String }]
    },
    hourlyRate: {
        type: Number,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Available', 'Unavailable'],
        default: 'Available'
    }
});

module.exports = mongoose.model('Tutoring', TutoringSchema);
