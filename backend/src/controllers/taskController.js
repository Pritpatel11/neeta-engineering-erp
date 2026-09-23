const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendTaskAssignmentEmail } = require('../services/emailService');

/**
 * Helper to check and generate overdue & upcoming due date reminders
 */
const processTaskReminders = async () => {
  try {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const activeTasks = await Task.find({
      status: { $in: ['pending', 'in_progress', 'on_hold'] },
    }).populate('assignedTo', 'name username email');

    const owners = await User.find({ role: 'owner' });

    for (const task of activeTasks) {
      if (!task.assignedTo) continue;

      const isOverdue = task.dueDate && new Date(task.dueDate) < now;
      const isDueSoon = task.dueDate && new Date(task.dueDate) >= now && new Date(task.dueDate) <= next24h;

      if (isOverdue) {
        // Check if overdue notification already sent in past 24 hours
        const recentNotif = await Notification.findOne({
          taskId: task._id,
          type: 'task_overdue',
          createdAt: { $gte: oneDayAgo },
        });

        if (!recentNotif) {
          // 1. Notify Assigned User
          await Notification.create({
            recipient: task.assignedTo._id,
            taskId: task._id,
            title: 'Task Overdue Notice',
            message: `Task "${task.title}" is overdue (Due: ${new Date(task.dueDate).toLocaleDateString()}). Please update status immediately.`,
            type: 'task_overdue',
            link: `/my-tasks?taskId=${task._id}`,
            metadata: { priority: task.priority, dueDate: task.dueDate, taskTitle: task.title },
          });

          // 2. Notify All Owners
          for (const owner of owners) {
            await Notification.create({
              recipient: owner._id,
              taskId: task._id,
              title: `Overdue Task Alert: ${task.title}`,
              message: `Task assigned to ${task.assignedTo.name} has passed its due date (${new Date(task.dueDate).toLocaleDateString()}).`,
              type: 'task_overdue',
              link: `/owner-dashboard?tab=tasks&taskId=${task._id}`,
              metadata: { priority: task.priority, dueDate: task.dueDate, taskTitle: task.title },
            });
          }
        }
      } else if (isDueSoon) {
        // Check if reminder notification already sent in past 24 hours
        const recentReminder = await Notification.findOne({
          taskId: task._id,
          type: 'task_reminder',
          createdAt: { $gte: oneDayAgo },
        });

        if (!recentReminder) {
          await Notification.create({
            recipient: task.assignedTo._id,
            taskId: task._id,
            title: 'Task Due Soon (Within 24 Hours)',
            message: `Task "${task.title}" is due on ${new Date(task.dueDate).toLocaleDateString()}. Please ensure it is completed on time.`,
            type: 'task_reminder',
            link: `/my-tasks?taskId=${task._id}`,
            metadata: { priority: task.priority, dueDate: task.dueDate, taskTitle: task.title },
          });
        }
      }
    }
  } catch (err) {
    console.error('processTaskReminders error:', err.message);
  }
};

// @desc    Get all tasks with role filtering
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    // Process due-date reminders in the background
    processTaskReminders().catch(() => {});

    // STRICT OWNER / USER PERMISSIONS:
    // Admin has NO task assignment / management access
    if (req.user.role === 'admin') {
      return res.status(200).json([]);
    }

    const { status, priority, assignedTo, search, overdue } = req.query;
    const query = {};

    // Team members can ONLY view their assigned tasks
    if (req.user.role !== 'owner') {
      query.assignedTo = req.user._id;
    } else {
      // Owner can filter by any assigned user
      if (assignedTo && assignedTo !== 'all') {
        query.assignedTo = assignedTo;
      }
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (overdue === 'true') {
      query.status = { $nin: ['completed', 'cancelled'] };
      query.dueDate = { $lt: new Date() };
    }

    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ title: reg }, { description: reg }, { relatedModule: reg }, { notes: reg }];
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name username role department designation email phone')
      .populate('assignedBy', 'name username role')
      .populate('comments.user', 'name username role')
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('getTasks error:', error);
    res.status(500).json({ message: 'Failed to fetch tasks: ' + error.message });
  }
};

// @desc    Create new task (STRICTLY OWNER ONLY)
// @route   POST /api/tasks
// @access  Private (Owner Only)
const createTask = async (req, res) => {
  try {
    // STRICT OWNER-ONLY CHECK:
    // "Only the Owner can create and assign tasks. There should be no Admin role or Admin task-assignment functionality."
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        message: 'Access Denied: Only the Owner can create and assign tasks.',
      });
    }

    const {
      title,
      description,
      assignedTo,
      priority,
      startDate,
      dueDate,
      relatedModule,
      notes,
      attachments,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task Title is required' });
    }
    if (!assignedTo) {
      return res.status(400).json({ message: 'Please select a team member to assign the task to' });
    }
    if (!dueDate) {
      return res.status(400).json({ message: 'Due Date is required' });
    }

    const assignee = await User.findById(assignedTo).select('name username email department designation');
    if (!assignee) {
      return res.status(404).json({ message: 'Selected team member does not exist' });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      department: assignee.department || 'general',
      assignedTo: assignee._id,
      assignedBy: req.user._id,
      priority: priority || 'medium',
      status: 'pending',
      progress: 0,
      startDate: startDate || new Date(),
      dueDate: new Date(dueDate),
      relatedModule: relatedModule ? relatedModule.trim() : '',
      notes: notes ? notes.trim() : '',
      attachments: Array.isArray(attachments) ? attachments : [],
      history: [
        {
          action: 'created',
          performedBy: req.user._id,
          performedByName: req.user.name || 'Owner',
          details: `Task created and assigned to ${assignee.name || assignee.username}`,
          timestamp: new Date(),
        },
      ],
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name username role department designation email phone')
      .populate('assignedBy', 'name username role');

    // 1. In-App Notification for Assigned User
    try {
      await Notification.create({
        recipient: assignee._id,
        sender: req.user._id,
        taskId: task._id,
        title: 'New Task Assigned',
        message: `Task: "${task.title}"\nAssigned By: ${req.user.name || 'Owner'}\nPriority: ${(task.priority || 'medium').toUpperCase()}\nDue Date: ${new Date(task.dueDate).toLocaleDateString()}`,
        type: 'task_assigned',
        link: `/my-tasks?taskId=${task._id}`,
        metadata: {
          priority: task.priority,
          dueDate: task.dueDate,
          taskTitle: task.title,
          assignedByName: req.user.name || 'Owner',
        },
      });
    } catch (notifErr) {
      console.warn('Failed to create in-app notification:', notifErr.message);
    }

    // 2. Email Notification to Assigned User
    try {
      const recipientEmail = assignee.email || (assignee.username.includes('@') ? assignee.username : null);
      if (recipientEmail) {
        sendTaskAssignmentEmail({
          to: recipientEmail,
          task: populatedTask,
          assignedBy: req.user,
          assignedToUser: assignee,
        }).catch(err => console.error('[Task Email] Dispatch error:', err.message));
      }
    } catch (emailErr) {
      console.warn('Failed to dispatch assignment email:', emailErr.message);
    }

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('createTask error:', error);
    res.status(500).json({ message: 'Failed to create task: ' + error.message });
  }
};

// @desc    Update task status / details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name username email')
      .populate('assignedBy', 'name username');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isOwner = req.user.role === 'owner';
    const isAssignee = task.assignedTo && task.assignedTo._id.toString() === req.user._id.toString();

    // Check authorization: ONLY Owner or the assigned team member can update
    if (!isOwner && !isAssignee) {
      return res.status(403).json({ message: 'Access Denied: You cannot modify this task' });
    }

    const {
      status,
      progress,
      notes,
      title,
      description,
      priority,
      dueDate,
      startDate,
      assignedTo,
      relatedModule,
    } = req.body;

    const historyEntries = [];

    // --- OWNER PRIVILEGES ---
    if (isOwner) {
      if (title !== undefined && title.trim() !== task.title) {
        historyEntries.push({
          action: 'edited',
          performedBy: req.user._id,
          performedByName: req.user.name || 'Owner',
          details: `Title updated to "${title.trim()}"`,
          timestamp: new Date(),
        });
        task.title = title.trim();
      }

      if (description !== undefined) task.description = description.trim();
      if (notes !== undefined) task.notes = notes.trim();
      if (relatedModule !== undefined) task.relatedModule = relatedModule.trim();
      if (startDate !== undefined) task.startDate = new Date(startDate);

      if (priority !== undefined && priority !== task.priority) {
        historyEntries.push({
          action: 'edited',
          performedBy: req.user._id,
          performedByName: req.user.name || 'Owner',
          details: `Priority changed from ${task.priority.toUpperCase()} to ${priority.toUpperCase()}`,
          timestamp: new Date(),
        });
        task.priority = priority;

        // Notify assignee about priority change
        if (task.assignedTo) {
          Notification.create({
            recipient: task.assignedTo._id,
            sender: req.user._id,
            taskId: task._id,
            title: `Task Priority Updated: ${task.title}`,
            message: `Priority has been changed to ${priority.toUpperCase()} by Owner.`,
            type: 'task_updated',
            link: `/my-tasks?taskId=${task._id}`,
            metadata: { priority, taskTitle: task.title },
          }).catch(() => {});
        }
      }

      if (dueDate !== undefined && new Date(dueDate).getTime() !== new Date(task.dueDate).getTime()) {
        historyEntries.push({
          action: 'edited',
          performedBy: req.user._id,
          performedByName: req.user.name || 'Owner',
          details: `Due date changed to ${new Date(dueDate).toLocaleDateString()}`,
          timestamp: new Date(),
        });
        task.dueDate = new Date(dueDate);

        // Notify assignee about due date change
        if (task.assignedTo) {
          Notification.create({
            recipient: task.assignedTo._id,
            sender: req.user._id,
            taskId: task._id,
            title: `Due Date Changed: ${task.title}`,
            message: `The deadline for "${task.title}" has been updated to ${new Date(dueDate).toLocaleDateString()}.`,
            type: 'task_updated',
            link: `/my-tasks?taskId=${task._id}`,
            metadata: { dueDate: task.dueDate, taskTitle: task.title },
          }).catch(() => {});
        }
      }

      // Reassignment
      if (assignedTo && assignedTo.toString() !== task.assignedTo?._id?.toString()) {
        const newAssignee = await User.findById(assignedTo).select('name username email department designation');
        if (newAssignee) {
          const oldAssigneeName = task.assignedTo?.name || 'Previous User';
          historyEntries.push({
            action: 'reassigned',
            performedBy: req.user._id,
            performedByName: req.user.name || 'Owner',
            details: `Task reassigned from ${oldAssigneeName} to ${newAssignee.name || newAssignee.username}`,
            timestamp: new Date(),
          });

          task.assignedTo = newAssignee._id;
          task.department = newAssignee.department || task.department;

          // Notify new assignee
          Notification.create({
            recipient: newAssignee._id,
            sender: req.user._id,
            taskId: task._id,
            title: 'Task Reassigned to You',
            message: `You have been reassigned task: "${task.title}" by Owner. Due Date: ${new Date(task.dueDate).toLocaleDateString()}.`,
            type: 'task_reassigned',
            link: `/my-tasks?taskId=${task._id}`,
            metadata: { priority: task.priority, dueDate: task.dueDate, taskTitle: task.title },
          }).catch(() => {});

          // Email new assignee
          const newEmail = newAssignee.email || (newAssignee.username.includes('@') ? newAssignee.username : null);
          if (newEmail) {
            sendTaskAssignmentEmail({
              to: newEmail,
              task,
              assignedBy: req.user,
              assignedToUser: newAssignee,
            }).catch(() => {});
          }
        }
      }
    }

    // --- STATUS UPDATE (Both Owner and Assignee) ---
    if (status !== undefined && status !== task.status) {
      const oldStatus = task.status;
      task.status = status;

      const isComplete = status === 'completed';
      if (isComplete) {
        task.completedAt = new Date();
        task.progress = 100;
        historyEntries.push({
          action: 'completed',
          performedBy: req.user._id,
          performedByName: req.user.name || 'User',
          details: `Task marked as COMPLETED by ${req.user.name || req.user.username}`,
          timestamp: new Date(),
        });

        // "When the user marks a task as Completed, the Owner should automatically receive a notification."
        const owners = await User.find({ role: 'owner' });
        for (const owner of owners) {
          Notification.create({
            recipient: owner._id,
            sender: req.user._id,
            taskId: task._id,
            title: `Task Completed: ${task.title}`,
            message: `${req.user.name || 'Team member'} has marked "${task.title}" as Completed on ${new Date().toLocaleDateString()}.`,
            type: 'task_completed',
            link: `/owner-dashboard?tab=tasks&taskId=${task._id}`,
            metadata: { taskTitle: task.title, completedBy: req.user.name },
          }).catch(() => {});
        }
      } else {
        if (task.completedAt && status !== 'completed') {
          task.completedAt = null;
        }
        historyEntries.push({
          action: 'status_changed',
          performedBy: req.user._id,
          performedByName: req.user.name || 'User',
          details: `Status changed from ${oldStatus.toUpperCase()} to ${status.toUpperCase()} by ${req.user.name || req.user.username}`,
          timestamp: new Date(),
        });
      }
    }

    if (progress !== undefined) {
      task.progress = Math.min(100, Math.max(0, Number(progress)));
    }

    if (historyEntries.length > 0) {
      task.history.push(...historyEntries);
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name username role department designation email phone')
      .populate('assignedBy', 'name username role')
      .populate('comments.user', 'name username role');

    res.status(200).json(populated);
  } catch (error) {
    console.error('updateTask error:', error);
    res.status(500).json({ message: 'Failed to update task: ' + error.message });
  }
};

// @desc    Add comment / note to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addTaskComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name username')
      .populate('assignedBy', 'name username');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isOwner = req.user.role === 'owner';
    const isAssignee = task.assignedTo && task.assignedTo._id.toString() === req.user._id.toString();

    if (!isOwner && !isAssignee) {
      return res.status(403).json({ message: 'Access Denied: You cannot comment on this task' });
    }

    const comment = {
      user: req.user._id,
      userName: req.user.name || req.user.username,
      userRole: req.user.role,
      text: text.trim(),
      createdAt: new Date(),
    };

    task.comments.push(comment);
    task.history.push({
      action: 'comment_added',
      performedBy: req.user._id,
      performedByName: req.user.name || req.user.username,
      details: `Comment added: "${text.trim().slice(0, 60)}${text.length > 60 ? '...' : ''}"`,
      timestamp: new Date(),
    });

    await task.save();

    // Notify the other party
    if (isOwner && task.assignedTo) {
      Notification.create({
        recipient: task.assignedTo._id,
        sender: req.user._id,
        taskId: task._id,
        title: `New Comment on: ${task.title}`,
        message: `${req.user.name || 'Owner'}: "${text.trim().slice(0, 100)}"`,
        type: 'task_updated',
        link: `/my-tasks?taskId=${task._id}`,
        metadata: { taskTitle: task.title },
      }).catch(() => {});
    } else if (isAssignee) {
      const owners = await User.find({ role: 'owner' });
      for (const owner of owners) {
        Notification.create({
          recipient: owner._id,
          sender: req.user._id,
          taskId: task._id,
          title: `Comment from ${req.user.name}: ${task.title}`,
          message: `"${text.trim().slice(0, 100)}"`,
          type: 'task_updated',
          link: `/owner-dashboard?tab=tasks&taskId=${task._id}`,
          metadata: { taskTitle: task.title },
        }).catch(() => {});
      }
    }

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name username role department designation email phone')
      .populate('assignedBy', 'name username role')
      .populate('comments.user', 'name username role');

    res.status(201).json(populated);
  } catch (error) {
    console.error('addTaskComment error:', error);
    res.status(500).json({ message: 'Failed to post comment: ' + error.message });
  }
};

// @desc    Delete task (STRICTLY OWNER ONLY)
// @route   DELETE /api/tasks/:id
// @access  Private (Owner Only)
const deleteTask = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access Denied: Only the Owner can delete tasks.' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);
    await Notification.deleteMany({ taskId: req.params.id });

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('deleteTask error:', error);
    res.status(500).json({ message: 'Failed to delete task: ' + error.message });
  }
};

// @desc    Check and trigger due date and reminder notifications
// @route   POST /api/tasks/check-reminders
// @access  Private
const checkTaskReminders = async (req, res) => {
  try {
    await processTaskReminders();
    res.status(200).json({ success: true, message: 'Reminders processed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process reminders: ' + error.message });
  }
};

// @desc    Executive Summary & Task Dashboard Data for Owner Portal
// @route   GET /api/tasks/owner-summary
// @access  Private (Owner Only)
const getOwnerSummary = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access Denied: Owner access required' });
    }

    // Process reminders in background
    processTaskReminders().catch(() => {});

    const tasks = await Task.find({})
      .populate('assignedTo', 'name username role department designation performanceScore email phone')
      .populate('assignedBy', 'name username role')
      .sort({ dueDate: 1, createdAt: -1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const onHoldTasks = tasks.filter(t => t.status === 'on_hold').length;
    const overdueTasks = tasks.filter(t => {
      return t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueDate) < new Date();
    }).length;
    const highPriorityTasks = tasks.filter(t => {
      return (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed' && t.status !== 'cancelled';
    }).length;

    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Department-wise summary
    const departments = ['accounts', 'logistics', 'sales', 'engineering', 'operations'];
    const departmentBreakdown = departments.map(dept => {
      const deptTasks = tasks.filter(t => t.department === dept);
      const done = deptTasks.filter(t => t.status === 'completed').length;
      const total = deptTasks.length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        department: dept,
        total,
        completed: done,
        inProgress: deptTasks.filter(t => t.status === 'in_progress').length,
        overdue: deptTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueDate) < new Date()).length,
        progressRate: progress,
      };
    });

    // Employee task distribution & matrix
    const users = await User.find({ role: { $in: ['user', 'manager'] } })
      .select('name username role department designation performanceScore email phone');

    const employeeMatrix = users.map(user => {
      const userTasks = tasks.filter(t => t.assignedTo && t.assignedTo._id.toString() === user._id.toString());
      const completed = userTasks.filter(t => t.status === 'completed');
      const incomplete = userTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
      const overdue = incomplete.filter(t => new Date(t.dueDate) < new Date());

      return {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        department: user.department,
        designation: user.designation,
        performanceScore: user.performanceScore,
        email: user.email,
        phone: user.phone,
        totalAssigned: userTasks.length,
        completedCount: completed.length,
        incompleteCount: incomplete.length,
        overdueCount: overdue.length,
        completedTasksList: completed.map(t => ({ id: t._id, title: t.title, completedAt: t.completedAt })),
        incompleteTasksList: incomplete.map(t => ({ id: t._id, title: t.title, progress: t.progress, dueDate: t.dueDate, status: t.status, priority: t.priority })),
      };
    });

    res.status(200).json({
      metrics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        onHoldTasks,
        overdueTasks,
        highPriorityTasks,
        overallProgress,
      },
      departmentBreakdown,
      employeeMatrix,
      tasks,
    });
  } catch (error) {
    console.error('getOwnerSummary error:', error);
    res.status(500).json({ message: 'Failed to generate owner summary: ' + error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  addTaskComment,
  deleteTask,
  checkTaskReminders,
  getOwnerSummary,
};
