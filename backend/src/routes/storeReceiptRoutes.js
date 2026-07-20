const express = require('express');
const router = express.Router();
const storeReceiptController = require('../controllers/storeReceiptController');

router.post('/', storeReceiptController.createReceipt);
router.get('/', storeReceiptController.getReceipts);
router.get('/:id', storeReceiptController.getReceiptById);
router.delete('/:id', storeReceiptController.deleteReceipt);
router.put('/:id', storeReceiptController.updateReceipt);

module.exports = router;
