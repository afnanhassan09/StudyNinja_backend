const express = require('express');
const router = express.Router();
const TutorController = require('../controllers/tutorController');
const multer = require('multer');
const upload = multer();
const auth = require('../middleware/auth');


router.post('/update-info', auth, upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'certificateFile', maxCount: 1 },
    { name: 'universityDocuments', maxCount: 10 } // allow multiple documents
]), TutorController.requestForTutor);

router.get('/getAvailableEssays', auth, TutorController.getTutorView);

router.get('/getProfile', auth, TutorController.getTutorProfile)

router.post('/markEssay', upload.array('modelAnswerFile'), auth, TutorController.markEssay);

router.post('/getEssay', auth, TutorController.getEssay);

router.get('/getInProgressEssays', auth, TutorController.getInProgressEssays);

router.get('/getCompletedEssays', auth, TutorController.getCompletedEssays);

router.get('/getTutorProfilesforTutoring', TutorController.getTutorProfilesforTutoring);

router.post('/updateTutoringProfile', auth, TutorController.updateTutoringProfile);

module.exports = router;
