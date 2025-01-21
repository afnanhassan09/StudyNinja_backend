const express = require('express');
const router = express.Router();
const admin = require('../middleware/admin');
const auth = require('../middleware/auth');
const AdminController = require('../controllers/adminController');

router.post('/approveTutor', auth, admin, AdminController.approveTutor);

router.get('/getUnapprovedTutors', auth, admin, AdminController.getUnapprovedTutors);

module.exports = router;

    