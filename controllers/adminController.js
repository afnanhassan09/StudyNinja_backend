const Tutor = require('../models/tutorModel');
const Student = require('../models/studentModel');

class AdminController {
    async approveTutor(req, res) {
        try {
            const { tutorId, studyLevel, premiumEssays, hasDBS } = req.body;
            console.log(tutorId);

            if (!tutorId) {
                return res.status(400).json({
                    message: 'Tutor ID is required'
                });
            }

            const tutor = await Tutor.findOne({ _id: tutorId });

            if (!tutor) {
                return res.status(404).json({
                    message: 'Tutor not found'
                });
            }

            tutor.approved = true;

            if (studyLevel !== undefined) {
                tutor.StudyLevel = studyLevel;
            }

            if (premiumEssays !== undefined) {
                tutor.premiumEssays = premiumEssays;
            }

            if (hasDBS !== undefined) {
                tutor.hasDBS = hasDBS;
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

    async getAllStudents(req, res) {
        try {
            const students = await Student.find().select('name email university course yearOfStudy profilePicture');

            if (!students || students.length === 0) {
                return res.status(404).json({
                    message: 'No students found'
                });
            }

            return res.status(200).json({
                message: 'Students retrieved successfully',
                students
            });
        } catch (error) {
            return res.status(500).json({
                message: 'Error fetching students',
                error: error.message
            });
        }
    }

    async getStudentById(req, res) {
        const { id } = req.params;
        const student = await Student.findById(id);
        return res.status(200).json({ student });
    }

    async updateStudent(req, res) {
        const { id } = req.params;
        const updateFields = {};

        const fields = ['name', 'email', 'university', 'course', 'yearOfStudy', 'profilePicture'];
        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateFields[field] = req.body[field];
            }
        });

        const student = await Student.findByIdAndUpdate(id, updateFields, { new: true });
        return res.status(200).json({ student });
    }

    async getAllTutors(req, res) {
        try {
            const tutors = await Tutor.find().select('fullNameDBS university yearsOfExperience StudyLevel profilePicture');

            if (!tutors || tutors.length === 0) {
                return res.status(404).json({
                    message: 'No tutors found'
                });
            }

            return res.status(200).json({
                message: 'Tutors retrieved successfully',
                tutors
            });
        } catch (error) {
            return res.status(500).json({
                message: 'Error fetching tutors',
                error: error.message
            });
        }
    }

    async getTutorById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: 'Tutor ID is required' });
            }

            const tutor = await Tutor.findById(id);
            if (!tutor) {
                return res.status(404).json({ message: 'Tutor not found' });
            }

            return res.status(200).json({ tutor });
        } catch (error) {
            return res.status(500).json({
                message: 'Error fetching tutor',
                error: error.message
            });
        }
    }

    async updateTutor(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: 'Tutor ID is required' });
            }

            const updateFields = req.body;
            if (Object.keys(updateFields).length === 0) {
                return res.status(400).json({ message: 'No fields to update' });
            }

            const validFields = ['fullNameDBS', 'university', 'yearsOfExperience', 'StudyLevel', 'profilePicture'];
            const fieldsToUpdate = {};

            for (const key in updateFields) {
                if (validFields.includes(key)) {
                    fieldsToUpdate[key] = updateFields[key];
                }
            }

            if (Object.keys(fieldsToUpdate).length === 0) {
                return res.status(400).json({ message: 'No valid fields to update' });
            }

            const tutor = await Tutor.findByIdAndUpdate(id, fieldsToUpdate, { new: true });
            if (!tutor) {
                return res.status(404).json({ message: 'Tutor not found' });
            }

            return res.status(200).json({ message: 'Tutor updated successfully', tutor });
        } catch (error) {
            return res.status(500).json({ message: 'Error updating tutor', error: error.message });
        }
    }

    async getAllRatings(req, res) {
        try {
            const ratings = await Rating.find();
            if (!ratings || ratings.length === 0) {
                return res.status(404).json({ message: 'No ratings found' });
            }
            return res.status(200).json({ ratings });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error fetching ratings', error: error.message });
        }
    }

    async deleteRating(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: 'Rating ID is required' });
            }

            const rating = await Rating.findByIdAndDelete(id);
            if (!rating) {
                return res.status(404).json({ message: 'Rating not found' });
            }

            return res.status(200).json({ message: 'Rating deleted successfully', rating });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error deleting rating', error: error.message });
        }
    }

    
}

module.exports = new AdminController();
