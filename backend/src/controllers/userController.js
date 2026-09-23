const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin / Manager)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .populate('managerId', 'name username role department')
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ message: 'Failed to fetch users: ' + error.message });
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res) => {
  try {
    const {
      username,
      password,
      name,
      role,
      department,
      designation,
      managerId,
      assignedModules,
      performanceScore,
      hasAiAccess,
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const user = await User.create({
      username: cleanUsername,
      password,
      name: name || 'ERP User',
      role: role || 'user',
      department: department || 'all',
      designation: designation || 'Staff',
      managerId: managerId || null,
      assignedModules: Array.isArray(assignedModules) ? assignedModules : [],
      performanceScore: performanceScore ? Number(performanceScore) : 85,
      hasAiAccess: !!hasAiAccess,
    });

    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('managerId', 'name username');

    res.status(201).json(populatedUser);
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ message: 'Failed to create user: ' + error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      name,
      role,
      department,
      designation,
      managerId,
      assignedModules,
      performanceScore,
      hasAiAccess,
      isActive,
      password,
    } = req.body;

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (department !== undefined) user.department = department;
    if (designation !== undefined) user.designation = designation;
    if (managerId !== undefined) user.managerId = managerId || null;
    if (assignedModules !== undefined) user.assignedModules = assignedModules;
    if (performanceScore !== undefined) user.performanceScore = Number(performanceScore);
    if (hasAiAccess !== undefined) user.hasAiAccess = hasAiAccess;
    if (isActive !== undefined) user.isActive = isActive;

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('managerId', 'name username');

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ message: 'Failed to update user: ' + error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Protect master admin from accidental deletion
    if (user.username === 'admin') {
      return res.status(400).json({ message: 'Primary Administrator account cannot be deleted' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ message: 'Failed to delete user: ' + error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
