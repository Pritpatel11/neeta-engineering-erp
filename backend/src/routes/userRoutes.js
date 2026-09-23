const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// Middleware to restrict to admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Administrator privileges required' });
};

router.use(protect);

router.get('/', getUsers);
router.post('/', requireAdmin, createUser);
router.put('/:id', requireAdmin, updateUser);
router.delete('/:id', requireAdmin, deleteUser);

module.exports = router;
