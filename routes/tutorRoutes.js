const express = require('express');
const router = express.Router();
const TutorController = require('../controllers/tutorController');
const multer = require('multer');
const upload = multer();
const auth = require('../middleware/auth');


router.post('/update-info', auth, upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'passportURL', maxCount: 1 },
    { name: 'UkBornOrAdoptedCertificate', maxCount: 1 },
    { name: 'validVisa', maxCount: 1 },
    { name: 'biometricResidencePermit', maxCount: 1 },
    { name: 'certificateFile', maxCount: 1 },
    { name: 'universityDocuments', maxCount: 10 } // allow multiple documents
]), TutorController.requestForTutor);

router.get('/getAvailableEssays', auth, TutorController.getTutorView);

router.get('/getProfile', auth, TutorController.getTutorProfile)

router.patch("/updateTutorProfile", auth, upload.fields([{ name: 'profilePicture', maxCount: 1 }]), TutorController.updateTutorProfile);

router.post('/markEssay', upload.fields([{ name: 'modelAnswerFile', maxCount: 1 }]), auth, TutorController.markEssay);

router.post('/getEssay', auth, TutorController.getEssay);

router.get('/getInProgressEssays', auth, TutorController.getInProgressEssays);

router.get('/getAllEssays', auth, TutorController.getAllEssays);

router.get('/getCompletedEssays', auth, TutorController.getCompletedEssays);

router.get('/getTutorProfilesforTutoring', TutorController.getTutorProfilesforTutoring);

router.post('/updateTutoringProfile', auth, TutorController.updateTutoringProfile);

router.get('/getTutoringProfile', auth, TutorController.getTutoringProfile);

router.get('/getDashboard', auth, TutorController.getDashboard);

router.get('/getPendingTutoringSessions', auth, TutorController.getPendingTutoringSessions);

router.get('/getInProgressTutoringSessions', auth, TutorController.getInProgressTutoringSessions);

router.get('/getCompletedTutoringSessions', auth, TutorController.getCompletedTutoringSessions);

router.get('/getAllContactsForTutor', auth, TutorController.getAllContactsForTutor);

router.get('/messages/:studentId', auth, TutorController.getMessagesForTutor);



module.exports = router;
