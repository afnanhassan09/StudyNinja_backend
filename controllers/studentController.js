const { uploadFile } = require('../utils/AWS');
const Student = require('../models/studentModel');
const Essay = require('../models/essayModel');
const OpenAI = require("openai");
const pdfParse = require('pdf-parse');
// const pdfParse = require('pdf-parse');
require('dotenv').config(); // Load environment variables from .env

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


class StudentController {

    async updateProfile(req, res) {
        console.log('Updating student profile');
        try {
            const files = req.files;
            const { major, university, bio, profilePicture } = req.body; // Extract profile fields

            let profilePictureUrl = null;

            // Handle profile picture upload if provided
            if (files && files.length > 0) {
                const file = files[0]; // Assuming only one profile picture file
                const uploadedFile = await uploadFile(file.buffer, file.originalname, file.mimetype);

                if (uploadedFile) {
                    console.log('Profile picture uploaded: ', uploadedFile);
                    profilePictureUrl = uploadedFile;
                } else {
                    console.log('Failed to upload profile picture');
                    return res.status(500).json({ message: 'Error uploading profile picture.' });
                }
            }

            // Find existing student profile
            const existingStudent = await Student.findOne({ userId: req.user._id });

            if (existingStudent) {
                // Update existing student profile fields
                existingStudent.major = major || existingStudent.major;
                existingStudent.university = university || existingStudent.university;
                existingStudent.bio = bio || existingStudent.bio;
                existingStudent.profilePicture = profilePictureUrl || existingStudent.profilePicture;

                const updatedStudent = await existingStudent.save();

                return res.status(200).json({
                    message: 'Student profile updated successfully!',
                    updatedStudent
                });
            } else {
                // Create a new student profile if none exists
                const newStudent = await Student.create({
                    userId: req.user._id,
                    major,
                    university,
                    bio,
                    profilePicture: profilePictureUrl,
                });

                return res.status(200).json({
                    message: 'Student profile created successfully!',
                    newStudent
                });
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                message: 'Internal server error',
                error: err.message
            });
        }
    }

    async uploadEssay(req, res) {
        try {
            const { title, subject, academicLevel, studentRequest, comments } = req.body;
            const files = req.files;

            // Validate required inputs
            if (!title || !subject || !academicLevel || !studentRequest || files.length === 0) {
                return res.status(400).json({
                    message: 'All fields are required, including the essay file.',
                });
            }

            // Check if the provided academicLevel and studentRequest are valid
            const validAcademicLevels = ["GCSE", "A-Level", "Bachelor", "Masters", "PhD"];
            const validStudentRequests = ['Feedback Only', 'Feedback and Model Answer'];

            if (!validAcademicLevels.includes(academicLevel)) {
                return res.status(400).json({
                    message: `Invalid academic level. Allowed values are: ${validAcademicLevels.join(', ')}`,
                });
            }

            if (!validStudentRequests.includes(studentRequest)) {
                return res.status(400).json({
                    message: `Invalid student request. Allowed values are: ${validStudentRequests.join(', ')}`,
                });
            }

            const file = files[0];

            // Upload the essay file to AWS
            const uploadedFile = await uploadFile(file.buffer, file.originalname, file.mimetype);
            if (!uploadedFile) {
                return res.status(500).json({ message: 'Error uploading essay file to AWS.' });
            }

            // Extract text content from the PDF file
            const fileContent = await pdfParse(file.buffer).then((data) => data.text);

            // Calculate word count
            const wordCount = fileContent.split(/\s+/).filter((word) => word).length;

            // Calculate price based on word count
            let price = 0;
            if (wordCount <= 1000) {
                price = wordCount * 0.05;
            } else if (wordCount <= 3000) {
                price = 1000 * 0.05 + (wordCount - 1000) * 0.03;
            } else {
                price = 1000 * 0.05 + 2000 * 0.03 + (wordCount - 3000) * 0.01;
            }
            price = Math.round(price * 100) / 100; // Round to 2 decimal places

            // Calculate platform commission
            const platformCommission = Math.round(price * 0.1 * 100) / 100; // 10% commission

            // Save essay to the database
            const essay = await Essay.create({
                studentID: req.user._id, // Assuming authenticated user ID is available in req.user
                title,
                subject,
                academicLevel,
                studentRequest,
                comments: comments || '',
                wordCount,
                price,
                platformCommission,
                fileUrl: uploadedFile, // Set the AWS file URL
            });

            return res.status(200).json({
                message: 'Essay uploaded successfully!',
                essay,
            });
        } catch (error) {
            console.error('Error uploading essay:', error);
            return res.status(500).json({
                message: 'Internal server error',
                error: error.message,
            });
        }
    }


    async getProfile(req, res) {
        console.log('Fetching student profile');
        try {
            const student = await Student.findOne({ userId: req.user._id }).populate('userId', 'name email');

            if (!student) {
                return res.status(404).json({
                    message: 'Student profile not found',
                });
            }

            return res.status(200).json({
                message: 'Student profile retrieved successfully',
                student,
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                message: 'Internal server error',
                error: err.message,

            });
        }
    };

    async getAllEssays(req, res) {
        try {
            const essays = await Essay.find({ studentID: req.user._id })

            if (essays.length === 0) {
                return res.status(404).json({ message: 'No essays found for the given student.' });
            }

            res.status(200).json({ essays });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'An error occurred while fetching essays.' });
        }
    }

    async getPendingEssays(req, res) {
        try {
            const essays = await Essay.find({
                studentID: req.user._id, // Filter by student ID
                status: "Pending",
            })

            if (essays.length === 0) {
                return res.status(404).json({ message: `No prending essays found for the given student.` });
            }

            res.status(200).json({ essays });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'An error occurred while fetching essays.' });
        }
    }

    async getInProgressEssays(req, res) {
        try {
            const essays = await Essay.find({
                studentID: req.user._id, // Filter by student ID
                status: "In Progress",
            })

            if (essays.length === 0) {
                return res.status(404).json({ message: `No In Progress essays found for the given student.` });
            }

            res.status(200).json({ essays });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'An error occurred while fetching essays.' });
        }
    }

    async getCompletedEssays(req, res) {
        try {
            const essays = await Essay.find({
                studentID: req.user._id, // Filter by student ID
                status: "Completed",
            })

            if (essays.length === 0) {
                return res.status(404).json({ message: `No Completed essays found for the given student.` });
            }

            res.status(200).json({ essays });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'An error occurred while fetching essays.' });
        }
    }

}

module.exports = new StudentController();