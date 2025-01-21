const Tutor = require('../models/tutorModel');
const Student = require('../models/studentModel');

class AdminController {
    async approveTutor(req, res) {
        try {
            const { tutorId, studyLevel, premiumEssays } = req.body;
            console.log(tutorId);
            const tutor = await Tutor.findOne({ _id: tutorId });

            if (!tutor) {
                return res.status(404).json({
                    message: 'Tutor not found'
                });
            }

            tutor.approved = true;

            if (studyLevel) {
                tutor.StudyLevel = studyLevel;
            }

            if (premiumEssays !== undefined) {
                tutor.premiumEssays = premiumEssays;
            }

            await tutor.save();

            return res.status(200).json({
                message: 'Tutor updated successfully',
                tutor
            });
        } catch (error) {
            return res.status(500).json({
                message: 'Error updating tutor',
                error: error.message
            });
        }
    }

    async getUnapprovedTutors(req, res) {
        try {
            const unapprovedTutors = await Tutor.find({ approved: false }).select('fullNameDBS university yearsOfExperience StudyLevel profilePicture');

            if (!unapprovedTutors || unapprovedTutors.length === 0) {
                return res.status(404).json({
                    message: 'No unapproved tutors found'
                });
            }

            return res.status(200).json({
                message: 'Unapproved tutors retrieved successfully',
                tutors: unapprovedTutors
            });
        } catch (error) {
            return res.status(500).json({
                message: 'Error fetching unapproved tutors',
                error: error.message
            });
        }
    }
}

module.exports = new AdminController();
