const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.put('/mark-all-read', markAllNotificationsRead);
router.put('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

module.exports = router;
