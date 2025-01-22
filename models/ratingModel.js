const mongoose = require('mongoose');

const Rating = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor',
        required: true,
    },
    essay: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Essay',
    },
    tutoring: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TutoringSession',
    },
    ratings: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
    },
    feedback: {
        type: String,
        maxlength: 500,
    },
    type: {
        type: String,
        enum: ['essay', 'tutoring'],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});


module.exports = mongoose.model('Rating', Rating);