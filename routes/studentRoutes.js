const express = require('express');

const router = express.Router();
const StudentController = require('../controllers/studentController')
const multer = require('multer');
const upload = multer();
const auth = require('../middleware/auth');

router.post('/uploadEssay', auth, upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'markingScheme', maxCount: 1 }
]), StudentController.uploadEssay)


router.post('/updateProfile', auth, upload.array('files'), StudentController.updateProfile)


router.get('/profile', auth, upload.array('files'), StudentController.getProfile)

router.get('/essays', auth, upload.array('files'), StudentController.getAllEssays)

router.get('/essays/pending', auth, upload.array('files'), StudentController.getPendingEssays)

router.get('/essays/in-progress', auth, upload.array('files'), StudentController.getInProgressEssays)

router.get('/essays/completed', auth, upload.array('files'), StudentController.getCompletedEssays)

router.post('/createTutoringSession', auth, StudentController.createTutoringSession)

router.get('/getDashboard', auth, StudentController.getStudentDashboard)

router.get('/getPendingRating', auth, StudentController.getPendingRating)

router.post('/giveRating', auth, StudentController.giveRating)

router.get("/essay/:id", auth, StudentController.getEssaybyID)

router.get('/getTutoringSessions', auth, StudentController.getTutoringSessions)

router.get('/getUpcomingTutoringSessions', auth, StudentController.getUpcomingTutoringSessions)

router.get('/getCompletedTutoringSessions', auth, StudentController.getCompletedTutoringSessions)

router.get('/getAllContacts', auth, StudentController.getAllChatContacts)

router.get('/messages/:tutorId', auth, StudentController.getMessages)

router.post('/confirmPayment', auth, StudentController.confirmPayment)

module.exports = router