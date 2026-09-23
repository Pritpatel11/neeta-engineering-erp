const mongoose = require('mongoose');

const taskActivitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['created', 'assigned', 'reassigned', 'status_changed', 'edited', 'comment_added', 'completed', 'cancelled'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    performedByName: {
      type: String,
      default: 'Owner',
    },
    details: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const taskCommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      default: 'User',
    },
    userRole: {
      type: String,
      default: 'user',
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: String,
      default: 'general',
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned team member is required'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'on_hold', 'cancelled', 'overdue'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    completedAt: {
      type: Date,
      default: null,
    },
    relatedModule: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    attachments: [
      {
        name: { type: String, default: '' },
        url: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    history: [taskActivitySchema],
    comments: [taskCommentSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Task', taskSchema);
