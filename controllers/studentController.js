const { uploadFile } = require('../utils/AWS');
const Student = require('../models/studentModel');
const Tutor = require('../models/tutorModel');
const TutoringSession = require("../models/tutoringSessionModel")
const Tutoring = require("../models/tutoringModel")
const Essay = require('../models/essayModel');
const OpenAI = require("openai");
const pdfParse = require('pdf-parse');
const { createInstantMeeting } = require('../utils/createZoomMeeting');
const schedule = require('node-schedule');
const Rating = require('../models/ratingModel');
const User = require('../models/userModel');
const Message = require('../models/messageModel');



require('dotenv').config(); // Load environment variables from .env

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


class StudentController {

    async updateProfile(req, res) {
        console.log('Updating student profile');
        try {
            const files = req.files;
            const user = await User.findOne({ _id: req.user._id });
            const { major, university, bio, dateOfBirth } = req.body; // Extract profile fields

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
                existingStudent.dateOfBirth = dateOfBirth || existingStudent.dateOfBirth;
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
                    dateOfBirth,
                });
                user.onboardingCompleted = true;
                user.save();
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

    async getMessages(req, res) {
        try {
            const tutorId = req.params.tutorId;
            const student = await Student.findOne({ userId: req.user._id });

            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            const messages = await Message.find({
                $or: [
                    { sender: req.user._id, recipient: tutorId },
                    { sender: tutorId, recipient: student._id }
                ],
            })
                .populate('sender', '_id')
                .populate('recipient', '_id')
                .sort({ timestamp: 1 })
                .lean();

            if (messages.length === 0) {
                return res.status(200).json({ messages: [] });
            }

            const studentIdStr = req.user._id.toString();
            const formattedMessages = [];
            for (let msg of messages) {
                formattedMessages.push({
                    _id: msg._id,
                    sender: msg.senderModel ? msg.senderModel.toLowerCase() : "student",
                    content: msg.content,
                    timestamp: msg.timestamp
                });
            }

            return res.status(200).json({ messages: formattedMessages });
        } catch (error) {
            console.error('❌ Error fetching messages:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }



    async getAllChatContacts(req, res) {
        try {
            const student = await Student.findOne({ userId: req.user._id });
            
            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            const messagePartners = await Message.distinct('sender', {
                recipient: student._id
            });

            const additionalPartners = await Message.distinct('recipient', {
                sender: student._id
            });

            const uniqueTutorIds = Array.from(new Set([...messagePartners, ...additionalPartners]));
            const tutorIds = uniqueTutorIds.filter(id => id.toString() !== student._id.toString());

            const tutors = await Tutor.find({ _id: { $in: tutorIds } })
                .populate('userId', 'name email profilePicture');

            const formattedTutors = tutors.map(tutor => ({
                _id: tutor._id,
                name: tutor.userId.name,
                profilePicture: tutor.profilePicture || tutor.userId.profilePicture
            }));

            return res.status(200).json({ tutors: formattedTutors });
        } catch (error) {
            console.error('Error fetching chat contacts:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getAllContacts(req, res) {
        try {
            const student = await Student.findOne({ userId: req.user._id }); 

            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            const tutorIds = await Message.distinct('sender', {
                recipient: student._id,
            });

            const additionalTutorIds = await Message.distinct('recipient', {
                sender: student._id,
            });

            const uniqueTutorIds = Array.from(new Set([...tutorIds, ...additionalTutorIds]));

            const tutors = await Tutor.find({ _id: { $in: uniqueTutorIds } });

            return res.status(200).json({ tutors });
        } catch (error) {
            console.error('Error fetching tutors:', error);
            return res.status(500).json({ error: 'Internal server error' });
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

            const file = files.file[0];
            const markingScheme = files.markingScheme ? files.markingScheme[0] : null;

            let uploadedFile = null
            let uploadedMarkingScheme = null;


            await Promise.all([
                file ? uploadFile(file.buffer, file.originalname, file.mimetype).then(url => uploadedFile = url) : null,
                markingScheme ? uploadFile(markingScheme.buffer, markingScheme.originalname, markingScheme.mimetype).then(url => uploadedMarkingScheme = url) : null,
            ]);
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
            const student = await Student.findOne({ userId: req.user._id });
            // Save essay to the database
            const dateOfBirth = student.dateOfBirth;
            const isPlus18 = dateOfBirth && new Date(dateOfBirth).getFullYear() < new Date().getFullYear() - 18;
            const essay = await Essay.create({
                studentID: student._id, // Assuming authenticated user ID is available in req.user
                title,
                subject,
                academicLevel,
                studentRequest,
                comments: comments || '',
                wordCount,
                price,
                markingScheme: uploadedMarkingScheme,
                platformCommission,
                fileUrl: uploadedFile, // Set the AWS file URL
                plus_18: isPlus18,
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
            const student = await Student.findOne({ userId: req.user._id });
            const essays = await Essay.find({ studentID: student._id })

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
            const student = await Student.findOne({ userId: req.user._id });
            const essays = await Essay.find({
                studentID: student._id, // Filter by student ID
                status: "Pending",
            })

            if (essays.length === 0) {
                return res.status(200).json({ message: `No prending essays found for the given student.` });
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

    async createTutoringSession(req, res) {
        try {
            console.log('Creating tutoring session, req.body:', req.body);
            const student = await Student.findOne({ userId: req.user._id });
            if (!student) {
                return res.status(401).json({ message: 'Student not found.' });
            }

            const { tutorId, purpose, startTime, endTime } = req.body;

            if (!tutorId || !startTime || !endTime) {
                return res.status(401).json({ message: 'Missing required fields: tutorId, startTime, and endTime.' });
            }

            const tutor = await Tutor.findOne({ _id: tutorId });
            if (!tutor) {
                return res.status(401).json({ message: 'Tutor not found.' });
            }

            const startTimeObj = new Date(startTime);
            const endTimeObj = new Date(endTime);

            // Determine the day of the week (e.g., 'monday')
            const dayOfWeek = startTimeObj.toLocaleString('en-us', { weekday: 'long' }).toLowerCase();
            console.log("Day of Week", dayOfWeek);
            // Format the time range as "HH:mm-HH:mm"
            const timeRange = `${startTimeObj.toISOString().slice(11, 16)}-${endTimeObj.toISOString().slice(11, 16)}`;
            console.log(timeRange);
            console.log(tutor._id);
            // Check and remove the availability from TutoringSession
            const existingSession = await Tutoring.findOne({ tutorId: tutor._id });
            const dayAvailability = existingSession.availability[dayOfWeek];
            if (!dayAvailability.includes(timeRange)) {
                return res.status(401).json({ message: `Time slot ${timeRange} is not available on ${dayOfWeek}.` });
            }
            // Remove the time slot
            existingSession.availability[dayOfWeek] = existingSession.availability[dayOfWeek].filter(slot => slot !== timeRange);
            await existingSession.save();

            const tutoringSession = await TutoringSession.create({
                tutorId: tutor._id,
                studentId: student._id,
                purpose,
                startTime,
                endTime
            });

            // Schedule Zoom meeting creation
            const duration = (endTimeObj - startTimeObj) / (1000 * 60); // Calculate duration in minutes
            const topic = `Tutoring Session for ${purpose}`;

            schedule.scheduleJob(startTimeObj, async () => {
                try {
                    const meetingDetails = await createInstantMeeting(topic, duration);
                    tutoringSession.meetingLink = meetingDetails.join_url;
                    await tutoringSession.save();

                    // Restore availability in TutoringSession
                    existingSession.availability[dayOfWeek].push(timeRange);
                    existingSession.availability[dayOfWeek].sort(); // Optional: Keep availability sorted
                    await existingSession.save();

                    console.log(`Zoom meeting created and availability restored for session ID: ${tutoringSession._id}`);
                } catch (error) {
                    console.error(`Failed to create Zoom meeting for session ID: ${tutoringSession._id}`, error.message);
                }
            });

            res.status(200).json({ tutoringSession });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'An error occurred while creating tutoring session.' });
        }
    }

    async getStudentDashboard(req, res) {
        try {
            // Fetch the student associated with the logged-in user
            const student = await Student.findOne({ userId: req.user._id });
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }

            // Get all submitted essays for the student
            const submittedEssays = await Essay.find({ studentID: student._id });
            const essaysSubmitted = submittedEssays.length;
            console.log(essaysSubmitted);

            // Get all interviews completed by the student
            const completedInterviews = await TutoringSession.find({
                studentId: student._id,
                endDateTime: { $lte: new Date() }, // Only include sessions that have ended
            });
            const interviewsCompleted = completedInterviews.length;

            // Calculate the average percentage score for submitted essays
            const totalPercentage = submittedEssays.reduce((sum, essay) => sum + (essay.percentage || 0), 0);
            const averagePercentage = essaysSubmitted > 0 ? (totalPercentage / essaysSubmitted).toFixed(1) : 0;

            // Prepare the response object
            const dashboardData = {
                essaysSubmitted,
                interviewsCompleted,
                averagePercentage: `${averagePercentage} %`
            };

            // Send the response
            return res.status(200).json(dashboardData);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    };

    async giveRating(req, res) {
        try {
            const student = await Student.findOne({ userId: req.user._id });
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
            const { type, ratings, feedback, essayId, tutoringId } = req.body;

            if (!['essay', 'tutoring'].includes(type)) {
                return res.status(400).json({ message: 'Invalid rating type. Must be either "essay" or "tutoring".' });
            }

            if (type === 'essay' && !essayId) {
                return res.status(400).json({ message: 'Essay ID is required for essay ratings.' });
            }
            if (type === 'tutoring' && !tutoringId) {
                return res.status(400).json({ message: 'Tutoring session ID is required for tutoring ratings.' });
            }

            let relatedObject;
            let tutorId;

            if (type === 'essay') {
                relatedObject = await Essay.findById(essayId).populate('markedBy'); // Fetch tutor details
                if (!relatedObject) {
                    return res.status(404).json({ message: 'Essay not found.' });
                }
                tutorId = relatedObject.markedBy;
            } else if (type === 'tutoring') {
                relatedObject = await TutoringSession.findById(tutoringId);
                if (!relatedObject) {
                    return res.status(404).json({ message: 'Tutoring session not found.' });
                }
                tutorId = relatedObject.tutorId;
            }

            // Check if relatedObject has a student field
            if (!relatedObject.studentID) {
                return res.status(400).json({ message: 'The related object is missing a student field.' });
            }

            if (relatedObject.studentID.toString() !== student._id.toString()) {
                return res.status(403).json({ message: 'You are not authorized to rate this item.' });
            }

            if (relatedObject.rated) {
                return res.status(400).json({ message: 'This item has already been rated.' });
            }

            const newRating = new Rating({
                student: student._id,
                teacher: tutorId,
                essay: type === 'essay' ? essayId : undefined,
                tutoring: type === 'tutoring' ? tutoringId : undefined,
                ratings,
                feedback,
                type,
            });

            await newRating.save();
            relatedObject.rated = true;
            await relatedObject.save();

            return res.status(201).json({ message: 'Rating submitted successfully.', rating: newRating });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }

    async getPendingRating(req, res) {
        try {
            const student = await Student.findOne({ userId: req.user._id });
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
            const essay = await Essay.find({ studentID: student._id, rated: false });
            const tutoring = await TutoringSession.find({ student: student._id, rated: false });
            return res.status(200).json({ essay, tutoring });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }

    async getEssaybyID(req, res) {
        try {
            const student = await Student.findOne({ userId: req.user._id });
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
            const essay = await Essay.findById(req.params.id);
            if (!essay) {
                return res.status(404).json({ message: 'Essay not found' });
            }
            if (essay.studentID.toString() !== student._id.toString()) {
                return res.status(403).json({ message: 'You are not authorized to view this essay.' });
            }
            return res.status(200).json({ essay });

        }

        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }


    }

    async getTutoringSessions(req, res) {
        try {
            // Check if user is authenticated
            if (!req.user || !req.user._id) {
                return res.status(401).json({ message: 'Unauthorized access.' });
            }

            const student = await Student.findOne({ userId: req.user._id });
            if (!student) {
                return res.status(404).json({ message: 'Student not found.' });
            }

            // Check if student has any tutoring sessions
            const tutoringSessions = await TutoringSession.find({ studentId: student._id });
            if (!tutoringSessions || tutoringSessions.length === 0) {
                return res.status(404).json({ message: 'No tutoring sessions found.' });
            }

            return res.status(200).json({ tutoringSessions });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'An error occurred while fetching tutoring sessions.' });
        }
    }

    async getCompletedTutoringSessions(req, res) {
        try {
            // Check if user is authenticated
            if (!req.user || !req.user._id) {
                return res.status(401).json({ message: 'Unauthorized access.' });
            }

            const student = await Student.findOne({ userId: req.user._id });
            if (!student) {
                return res.status(404).json({ message: 'Student not found.' });
            }

            // Check if student has any completed tutoring sessions
            const tutoringSessions = await TutoringSession.find({ studentId: student._id, endTime: { $lte: new Date() } });
            if (!tutoringSessions || tutoringSessions.length === 0) {
                return res.status(404).json({ message: 'No completed tutoring sessions found.' });
            }

            return res.status(200).json({ tutoringSessions });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'An error occurred while fetching tutoring sessions.' });
        }
    }

    async getUpcomingTutoringSessions(req, res) {
        try {
            const student = await Student.findOne({ userId: req.user._id });
            if (!student) {
                return res.status(404).json({ message: 'Student not found.' });
            }

            const tutoringSessions = await TutoringSession.find({ studentId: student._id, startTime: { $gte: new Date() } });
            if (!tutoringSessions || tutoringSessions.length === 0) {
                return res.status(404).json({ message: 'No upcoming tutoring sessions found.' });
            }

            return res.status(200).json({ tutoringSessions });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'An error occurred while fetching tutoring sessions.' });
        }
    }

}

module.exports = new StudentController();