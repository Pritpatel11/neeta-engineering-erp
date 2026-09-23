const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { verifyGstin, getGstHistory } = require('../controllers/gstController');

// All GST endpoints are protected with standard ERP authentication
router.use(protect);

router.post('/verify', verifyGstin);
router.get('/history', getGstHistory);

module.exports = router;
