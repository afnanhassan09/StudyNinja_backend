const mongoose = require('mongoose');


const Student = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        major: {
            type: String,
        },
        university: {
            type: String,
        },
        bio: {
            type: String,
            default: '',
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
