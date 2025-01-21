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
        required: true,
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
        enum: ['essay', 'interview'],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});


module.exports = mongoose.model('Rating', Rating);