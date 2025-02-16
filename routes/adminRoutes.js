const express = require('express');
const router = express.Router();
const admin = require('../middleware/admin');
const auth = require('../middleware/auth');
const AdminController = require('../controllers/adminController');

router.post('/approveTutor', auth, admin, AdminController.approveTutor);

router.get('/getUnapprovedTutors', auth, admin, AdminController.getUnapprovedTutors);

router.get('/appliedForDBSTutors', auth, admin, AdminController.appliedForDBSTutors);

router.get('/getAllStudents', auth, admin, AdminController.getAllStudents);

router.get('/getStudentById/:id', auth, admin, AdminController.getStudentById);

router.put('/updateStudent/:id', auth, admin, AdminController.updateStudent);

router.get('/getAllTutors', auth, admin, AdminController.getAllTutors);

router.get('/getTutorById/:id', auth, admin, AdminController.getTutorById);

router.put('/updateTutor/:id', auth, admin, AdminController.updateTutor);

router.get('/getRatingbyID', auth, admin, AdminController.getRatingbyID);

router.get('/getAllRatings', auth, admin, AdminController.getAllRatings);

router.delete('/deleteRating/:id', auth, admin, AdminController.deleteRating);

router.get('/getAllratingsOfTutor/:id', auth, admin, AdminController.getAllratingsOfTutor);

module.exports = router;

    