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
        approved: {
            type: Boolean,
            default: false
        },
        universityDocuments: {
            type: [String],
        },
        hasDBS: {
            type: Boolean,
            default: false,
        },
        dbsDetails: {
            fullName: {
                type: String,
                default: null,
            },
            certificateNumber: {
                type: String,
                default: null,
            },
            certificateFileUrl: {
                type: String,
                default: null,
            },
        },
        rightToWork: {
            type: Boolean,
            default: false,
        },
        eligibility: {
            type: String,
            enum: ['BritishIrish', 'EuEeaSwiss', 'NonEuEea'],
        },
        documents: {
            BritishIrish: {
                passportURL: { type: String, default: null },
                NINumber: { type: String, default: null },
                UkBornOrAdoptedCertificateURL: { type: String, default: null },
            },
            EuEeaSwiss: {
                shareCode: { type: String, default: null },
                DOB: { type: Date, default: null },
                passportURL: { type: String, default: null },
            },
            NonEuEea: {
                biometricResidencePermitURL: { type: String, default: null },
                validVisaURL: { type: String, default: null },
            },
        },
        appliedForDBS: {
            type: Boolean,
            default: false
        },
        dbsApplicationDetails: {
            fullName: {
                type: String,
                default: null,
            },
            phone: {
                type: String,
                default: null,
            },
            email: {
                type: String,
                default: null,
            },
        },

    },
    {
        timestamps: true,
    }
);


module.exports = mongoose.model('Tutor', Tutor);
