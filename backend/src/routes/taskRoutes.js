const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
  addTaskComment,
  deleteTask,
  checkTaskReminders,
  getOwnerSummary,
} = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/owner-summary', getOwnerSummary);
router.post('/check-reminders', checkTaskReminders);
router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.post('/:id/comments', addTaskComment);
router.delete('/:id', deleteTask);

module.exports = router;
