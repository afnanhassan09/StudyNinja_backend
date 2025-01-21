const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');

router.post('/sendNotification', NotificationController.sendNotification);

module.exports = router;

