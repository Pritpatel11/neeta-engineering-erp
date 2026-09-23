const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name username role');

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications: ' + error.message });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error('markNotificationRead error:', error);
    res.status(500).json({ message: 'Failed to update notification: ' + error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllNotificationsRead error:', error);
    res.status(500).json({ message: 'Failed to mark notifications read: ' + error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('deleteNotification error:', error);
    res.status(500).json({ message: 'Failed to delete notification: ' + error.message });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
