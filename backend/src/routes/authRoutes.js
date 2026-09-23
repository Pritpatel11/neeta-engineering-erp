const express = require('express');
const router = express.Router();
const { login, getMe, seedAdminEndpoint } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/seed', seedAdminEndpoint);

module.exports = router;
