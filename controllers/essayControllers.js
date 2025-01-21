const { uploadFile } = require('../utils/AWS');
const { Configuration, OpenAIApi } = require('openai');
const Essay = require('../models/essayModel');

require('dotenv').config();

const configuration = new Configuration({
    apiKey: process.env.CHATGPT_API_KEY,
});
const openai = new OpenAIApi(configuration);

class EssayController {
    // Route to calculate word count
    async calculateWordCount(req, res) {
        try {
            const files = req.files;

            if (!files || files.length === 0) {
                return res.status(400).json({ message: 'No file uploaded.' });
            }

            const file = files[0];
            const fileBuffer = file.buffer.toString(); // Convert to string for word count analysis

            let totalWordCount = 0;
            const counts = [];

            // Use ChatGPT to count words 5 times
            for (let i = 0; i < 5; i++) {
                const response = await openai.createCompletion({
                    model: 'text-davinci-003',
                    prompt: `Please calculate the word count for the following text:\n\n${fileBuffer}`,
                    max_tokens: 50,
                });

                const wordCount = parseInt(response.data.choices[0].text.trim(), 10);
                if (isNaN(wordCount)) {
                    return res.status(500).json({ message: 'Error calculating word count.' });
                }

                counts.push(wordCount);
                totalWordCount += wordCount;
            }

            // Calculate average word count
            const averageWordCount = Math.round(totalWordCount / 5);

            return res.status(200).json({
                message: 'Word count calculated successfully.',
                wordCount: averageWordCount,
                counts,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }

    async getTutorView(req, res) {
        try {
            const tutor = await Tutor.findById(req.user._id).select('StudyLevel');

            if (!tutor) {
                return res.status(404).json({ message: 'Tutor not found.' });
            }

            const studyLevels = ["GCSE", "A-Level", "Bachelor", "Masters", "PhD"];

            const tutorLevelIndex = studyLevels.indexOf(tutor.StudyLevel);

            if (tutorLevelIndex === -1) {
                return res.status(400).json({ message: 'Invalid tutor study level.' });
            }

            const essays = await Essay.find({
                status: 'Pending',
                academicLevel: { $in: studyLevels.slice(0, tutorLevelIndex + 1) }
            }).select(
                'title subject wordCount adjustedWordCount studentRequest academicLevel price'
            );

            if (!essays || essays.length === 0) {
                return res.status(404).json({ message: 'No essays available.' });
            }

            return res.status(200).json({
                message: 'Essays retrieved successfully.',
                essays,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }


    // Update Essay Status (for tutors to mark progress)
    async updateEssayStatus(req, res) {
        try {
            const { essayId, status, feedback, score } = req.body;

            // Validate inputs
            if (!essayId || !status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
                return res.status(400).json({ message: 'Invalid inputs.' });
            }

            const essay = await Essay.findById(essayId);
            if (!essay) {
                return res.status(404).json({ message: 'Essay not found.' });
            }

            // Update fields
            essay.status = status;
            if (feedback) essay.feedback = feedback;
            if (score) essay.score = score;

            const updatedEssay = await essay.save();

            return res.status(200).json({
                message: 'Essay status updated successfully.',
                updatedEssay,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }
}

module.exports = new EssayController();
