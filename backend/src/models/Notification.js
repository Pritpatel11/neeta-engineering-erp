const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_updated',
        'task_completed',
        'task_reassigned',
        'task_overdue',
        'task_reminder',
        'system',
      ],
      default: 'task_assigned',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
      default: '',
    },
    metadata: {
      priority: { type: String, default: 'medium' },
      dueDate: { type: Date, default: null },
      taskTitle: { type: String, default: '' },
      assignedByName: { type: String, default: 'Owner' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
