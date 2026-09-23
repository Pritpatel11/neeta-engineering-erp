const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseRequirement,
  sendQuotationRequests,
  recordVendorEstimate,
  submitForOwnerApproval,
  ownerApprovalAction,
  recordMaterialReceipt,
  recordAccountsPayment,
  deletePurchaseOrder,
} = require('../controllers/purchaseController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrderById);
router.post('/', createPurchaseRequirement);
router.post('/:id/send-rfq', sendQuotationRequests);
router.post('/:id/estimates', recordVendorEstimate);
router.post('/:id/submit-approval', submitForOwnerApproval);
router.post('/:id/owner-action', ownerApprovalAction);
router.post('/:id/receive-material', recordMaterialReceipt);
router.post('/:id/payments', recordAccountsPayment);
router.delete('/:id', deletePurchaseOrder);

module.exports = router;
