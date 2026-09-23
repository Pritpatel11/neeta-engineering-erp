const express = require('express');
const router = express.Router();
const {
  chatWithAi,
  getAiAuditLogs,
  saveGroqApiKey,
} = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/chat', chatWithAi);
router.get('/audit-logs', getAiAuditLogs);
router.post('/save-key', saveGroqApiKey);

module.exports = router;
