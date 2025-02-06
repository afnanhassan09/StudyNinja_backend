const mongoose = require('mongoose');


const Student = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        profilePicture: {
            type: String,
            default: null,
        },
        dateOfBirth: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Student', Student);
