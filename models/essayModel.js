const mongoose = require('mongoose');

const EssaySchema = mongoose.Schema({
    studentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed'],
        default: 'Pending'
    },
    title: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    wordCount: {
        type: Number,
        required: true
    },
    studentRequest: {
        type: String,
        enum: ['Feedback Only', 'Feedback and Model Answer'],
        required: true
    },
    academicLevel: {
        type: String,
        enum: ["GCSE", "A-Level", "Bachelor", "Masters", "PhD"],
        required: true
    },
    comments: {
        type: String,
        default: ''
    },
    fileUrl: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        max: 10,
        min: 0,
        default: 0
    },
    feedback: {
        type: String,
        default: ''
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor',
    },
    price: {
        type: Number,
        required: true
    },
    platformCommission: {
        type: Number,
        default: 0 // Calculated when the essay is priced
    },
    bundleID: {
        type: mongoose.Schema.Types.ObjectId, // Optional: To track bundled essays
        ref: 'EssayBundle',
        default: null
    },
    modelURL: {
        type: String,
        default: null
    },
    adjustedWordCount: {
        type: Number, // For storing student's adjusted word count
        default: null
    },
    rated: {
        type: Boolean,
        default: false
    },
    plus_18: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Essay', EssaySchema);
