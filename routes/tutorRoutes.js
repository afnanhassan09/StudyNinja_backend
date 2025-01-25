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

router.post('/markEssay', upload.fields([{ name: 'modelAnswerFile', maxCount: 1 }]), auth, TutorController.markEssay);

router.post('/getEssay', auth, TutorController.getEssay);

router.get('/getInProgressEssays', auth, TutorController.getInProgressEssays);

router.get('/getCompletedEssays', auth, TutorController.getCompletedEssays);

router.get('/getTutorProfilesforTutoring', TutorController.getTutorProfilesforTutoring);

router.post('/updateTutoringProfile', auth, TutorController.updateTutoringProfile);

router.get('/getTutoringProfile', auth, TutorController.getTutoringProfile);

router.get('/getDashboard', auth, TutorController.getDashboard);

router.get('/getPendingTutoringSessions', auth, TutorController.getPendingTutoringSessions);

router.get('/getInProgressTutoringSessions', auth, TutorController.getInProgressTutoringSessions);

router.get('/getCompletedTutoringSessions', auth, TutorController.getCompletedTutoringSessions);



module.exports = router;
