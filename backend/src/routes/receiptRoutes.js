const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');

router.get('/next-no', receiptController.getNextReceiptNo);
router.get('/', receiptController.getReceipts);
router.post('/', receiptController.createReceipt);
router.get('/:id', receiptController.getReceipt);
router.put('/:id', receiptController.updateReceipt);
router.delete('/:id', receiptController.deleteReceipt);

module.exports = router;
