const express = require('express');
const router = express.Router();
const controller = require('../controllers/privateInvoiceController');

// Next invoice number
router.get('/next-no', controller.getNextInvoiceNo);

// Send email for direct/adhoc invoice without saving
router.post('/send-email', controller.sendInvoiceEmail);

// Send email for existing invoice by ID
router.post('/:id/send-email', controller.sendInvoiceEmail);

// CRUD & PDF Retrieval
router.get('/', controller.getAllInvoices);
router.get('/by-number/:invoiceNo/pdf', controller.getInvoicePdfByNumber);
router.get('/by-number/:invoiceNo', controller.getInvoiceByNumber);
router.get('/:id/pdf', controller.getInvoicePdfById);
router.get('/:id', controller.getInvoiceById);
router.post('/', controller.createInvoice);
router.put('/:id', controller.updateInvoice);
router.delete('/:id', controller.deleteInvoice);

module.exports = router;
