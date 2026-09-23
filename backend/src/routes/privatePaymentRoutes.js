const express = require('express');
const router = express.Router();
const controller = require('../controllers/privatePaymentController');

// List payments with filters
router.get('/', controller.getAllPayments);

// All parties ledger overview summary
router.get('/summary', controller.getAllPartiesLedgerSummary);

// Specific party ledger and statement
router.get('/party/:id', controller.getPartyLedger);

// Send ledger statement via email
router.post('/party/:id/send-email', controller.sendLedgerEmail);

// Record a payment against an invoice
router.post('/', controller.recordPayment);

// Delete/revert a payment entry
router.delete('/:id', controller.deletePayment);

module.exports = router;
