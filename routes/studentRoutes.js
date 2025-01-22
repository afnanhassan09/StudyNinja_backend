const express = require('express');

const router = express.Router();

const multer = require('multer');
const upload = multer();
const auth = require('../middleware/auth');
const StudentController = require('../controllers/studentController')

router.post('/updateProfile', auth, upload.array('files'), StudentController.updateProfile)

router.post('/uploadEssay', auth, upload.array('files'), StudentController.uploadEssay)

router.get('/profile', auth, upload.array('files'), StudentController.getProfile)

router.get('/essays', auth, upload.array('files'), StudentController.getAllEssays)

router.get('/essays/pending', auth, upload.array('files'), StudentController.getPendingEssays)

router.get('/essays/in-progress', auth, upload.array('files'), StudentController.getInProgressEssays)

router.get('/essays/completed', auth, upload.array('files'), StudentController.getCompletedEssays)

router.post('/createTutoringSession', auth, StudentController.createTutoringSession)

module.exports = router