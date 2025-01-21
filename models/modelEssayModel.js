const mongoose = require('mongoose');

const EssayModel = mongoose.Schema({
    tutorID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor',
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    feedback: {
        type: String,
        default: ''
    },
    essayID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Essay',
    },
},
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('EssayModel', EssayModel);
