const mongoose = require('mongoose');


const Tutor = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        yearsOfExperience: {
            type: Number,
            required: true,
        },
        university: {
            type: String,
            required: true,
        },
        motivation: {
            type: String,
            default: '',
        },
        profilePicture: {
            type: String,
            default: null,
        },
        subjects: [
            {
                name: {
                    type: String,
                    required: true,
                },
                levels: {
                    type: [String],
                    enum: ["GCSE", "A-Level", "Bachelor", "Masters", "PhD"],
                    required: true,
                },
            },
        ],
        StudyLevel: {
            type: String,
            enum: ["GCSE", "A-Level", "Bachelor", "Masters", "PhD"],
            default: null
        },
        premiumEssays: {
            type: Boolean,
            default: false,
        },
        hasDBS: {
            type: Boolean,
            default: false
        },
        fullNameDBS: {
            type: String,
            default: null
        },
        certificateNumber: {
            type: String,
            default: null
        },
        certificateFileUrl: {
            type: String,
            default: null
        },
        universityDocuments: {
            type: [String],
        },
        approved: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);


module.exports = mongoose.model('Tutor', Tutor);
