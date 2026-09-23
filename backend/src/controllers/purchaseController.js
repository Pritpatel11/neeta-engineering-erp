const PurchaseOrder = require('../models/PurchaseOrder');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendVendorQuotationRequestEmail } = require('../services/emailService');

// Helper to auto-generate PR number: PR-YYYY-XXXX
const generateNextPRNumber = async () => {
  const currentYear = new Date().getFullYear();
  const count = await PurchaseOrder.countDocuments({
    prNo: new RegExp(`^PR-${currentYear}-`),
  });
  const seq = String(count + 1).padStart(4, '0');
  return `PR-${currentYear}-${seq}`;
};

// @desc    Get all purchase requirements / orders
// @route   GET /api/purchases
// @access  Private
const getPurchaseOrders = async (req, res) => {
  try {
    const { status, party, vendor, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (party && party !== 'all') {
      query.privatePartyId = party;
    }

    if (vendor && vendor !== 'all') {
      query.$or = [
        { recommendedVendorId: vendor },
        { 'ownerApproval.approvedVendorId': vendor },
      ];
    }

    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { prNo: reg },
        { poNo: reg },
        { privatePartyName: reg },
        { quotationNo: reg },
        { 'materials.name': reg },
      ];
    }

    const purchases = await PurchaseOrder.find(query)
      .populate('privatePartyId', 'name contactPerson phone email gst city')
      .populate('quotationId', 'quotationNo clientName companyName')
      .populate('recommendedVendorId', 'name contactPerson phone email gst bankDetails paymentTerms')
      .populate('ownerApproval.approvedVendorId', 'name contactPerson phone email gst bankDetails paymentTerms')
      .populate('vendorEstimates.vendorId', 'name contactPerson phone email gst bankDetails paymentTerms')
      .populate('createdBy', 'name username role')
      .sort({ createdAt: -1 });

    res.status(200).json(purchases);
  } catch (error) {
    console.error('getPurchaseOrders error:', error);
    res.status(500).json({ message: 'Failed to fetch purchase orders: ' + error.message });
  }
};

// @desc    Get single purchase order by ID
// @route   GET /api/purchases/:id
// @access  Private
const getPurchaseOrderById = async (req, res) => {
  try {
    const purchase = await PurchaseOrder.findById(req.params.id)
      .populate('privatePartyId', 'name contactPerson phone email gst city address pincode')
      .populate('quotationId', 'quotationNo clientName companyName date items subTotal totalAmount')
      .populate('recommendedVendorId', 'name contactPerson phone email gst city address pincode bankDetails paymentTerms')
      .populate('ownerApproval.approvedVendorId', 'name contactPerson phone email gst city address pincode bankDetails paymentTerms')
      .populate('vendorEstimates.vendorId', 'name contactPerson phone email gst city address pincode bankDetails paymentTerms')
      .populate('createdBy', 'name username role');

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase record not found' });
    }

    res.status(200).json(purchase);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch purchase record: ' + error.message });
  }
};

// @desc    Create new purchase requirement (PR)
// @route   POST /api/purchases
// @access  Private (Purchase Manager / Admin / Owner)
const createPurchaseRequirement = async (req, res) => {
  try {
    const {
      privatePartyId,
      privatePartyName,
      quotationId,
      quotationNo,
      requiredDate,
      materials,
      notes,
    } = req.body;

    if (!privatePartyName || !privatePartyName.trim()) {
      return res.status(400).json({ message: 'Private Party / Client Name is required' });
    }
    if (!requiredDate) {
      return res.status(400).json({ message: 'Required Date is required' });
    }
    if (!Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({ message: 'At least one material item is required' });
    }

    const prNo = await generateNextPRNumber();

    const formattedMaterials = materials.map(m => ({
      materialId: m.materialId || null,
      name: m.name ? m.name.trim() : 'Material',
      code: m.code ? m.code.trim() : '',
      hsn: m.hsn ? m.hsn.trim() : '',
      quantity: Number(m.quantity) || 1,
      unit: m.unit || 'Nos',
      specifications: m.specifications ? m.specifications.trim() : '',
      receivedQuantity: 0,
      pendingQuantity: Number(m.quantity) || 1,
    }));

    const purchase = await PurchaseOrder.create({
      prNo,
      privatePartyId: privatePartyId || null,
      privatePartyName: privatePartyName.trim(),
      quotationId: quotationId || null,
      quotationNo: quotationNo ? quotationNo.trim() : '',
      requiredDate: new Date(requiredDate),
      materials: formattedMaterials,
      notes: notes ? notes.trim() : '',
      status: 'Draft',
      createdBy: req.user._id,
      createdByName: req.user.name || 'Purchase Manager',
      history: [
        {
          action: 'created',
          performedBy: req.user.name || req.user.username,
          performedByRole: req.user.role,
          details: `Purchase requirement ${prNo} created for client "${privatePartyName.trim()}" (${formattedMaterials.length} materials requested)`,
          timestamp: new Date(),
        },
      ],
    });

    res.status(201).json(purchase);
  } catch (error) {
    console.error('createPurchaseRequirement error:', error);
    res.status(500).json({ message: 'Failed to create purchase requirement: ' + error.message });
  }
};

// @desc    Send quotation request (RFQ) email to multiple vendors
// @route   POST /api/purchases/:id/send-rfq
// @access  Private
const sendQuotationRequests = async (req, res) => {
  try {
    const { vendorIds, customNotes } = req.body;
    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ message: 'Please select at least one vendor' });
    }

    const purchase = await PurchaseOrder.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase record not found' });
    }

    const vendors = await Vendor.find({ _id: { $in: vendorIds } });
    if (vendors.length === 0) {
      return res.status(400).json({ message: 'Selected vendors not found' });
    }

    const sentRequests = [];
    for (const vendor of vendors) {
      // Dispatch email
      try {
        await sendVendorQuotationRequestEmail({
          to: vendor.email,
          vendorName: vendor.name,
          prNo: purchase.prNo,
          requiredDate: purchase.requiredDate,
          materials: purchase.materials,
          notes: customNotes || purchase.notes,
          requestedByName: req.user.name || 'Purchase Manager',
        });
      } catch (emailErr) {
        console.warn(`[RFQ] Could not email vendor ${vendor.name}:`, emailErr.message);
      }

      // Check if already in vendorQuotationRequests
      const existingIdx = purchase.vendorQuotationRequests.findIndex(
        r => r.vendorId?.toString() === vendor._id.toString()
      );

      if (existingIdx >= 0) {
        purchase.vendorQuotationRequests[existingIdx].sentAt = new Date();
        purchase.vendorQuotationRequests[existingIdx].status = 'sent';
      } else {
        purchase.vendorQuotationRequests.push({
          vendorId: vendor._id,
          vendorName: vendor.name,
          vendorEmail: vendor.email,
          sentAt: new Date(),
          status: 'sent',
        });
      }
      sentRequests.push(vendor.name);
    }

    purchase.status = 'Quotation Requested';
    purchase.history.push({
      action: 'rfq_sent',
      performedBy: req.user.name || req.user.username,
      performedByRole: req.user.role,
      details: `RFQ sent to ${vendors.length} vendor(s): ${sentRequests.join(', ')}`,
      timestamp: new Date(),
    });

    await purchase.save();
    res.status(200).json({ success: true, message: `RFQ dispatched to ${vendors.length} vendors`, purchase });
  } catch (error) {
    console.error('sendQuotationRequests error:', error);
    res.status(500).json({ message: 'Failed to send RFQ: ' + error.message });
  }
};

// @desc    Record or update vendor estimate / quotation
// @route   POST /api/purchases/:id/estimates
// @access  Private
const recordVendorEstimate = async (req, res) => {
  try {
    const {
      vendorId,
      quotationNo,
      quotationDate,
      validity,
      deliveryTime,
      paymentTerms,
      materialPrices,
      subtotal,
      gstPercentage,
      gstAmount,
      shippingCharges,
      otherCharges,
      totalAmount,
      notes,
    } = req.body;

    if (!vendorId) {
      return res.status(400).json({ message: 'Vendor selection is required' });
    }

    const purchase = await PurchaseOrder.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase record not found' });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor does not exist' });
    }

    const calcSubtotal = Number(subtotal) || 0;
    const calcGstAmt = Number(gstAmount) || 0;
    const calcShipping = Number(shippingCharges) || 0;
    const calcOther = Number(otherCharges) || 0;
    const calcTotal = Number(totalAmount) || (calcSubtotal + calcGstAmt + calcShipping + calcOther);

    const estimateData = {
      vendorId: vendor._id,
      vendorName: vendor.name,
      vendorEmail: vendor.email,
      vendorPhone: vendor.phone,
      quotationNo: quotationNo ? quotationNo.trim() : '',
      quotationDate: quotationDate ? new Date(quotationDate) : new Date(),
      validity: validity || '15 Days',
      deliveryTime: deliveryTime || '3-5 Days',
      paymentTerms: paymentTerms || vendor.paymentTerms || '30 Days Net',
      materialPrices: Array.isArray(materialPrices) ? materialPrices : [],
      subtotal: calcSubtotal,
      gstPercentage: Number(gstPercentage) || 18,
      gstAmount: calcGstAmt,
      shippingCharges: calcShipping,
      otherCharges: calcOther,
      totalAmount: calcTotal,
      notes: notes ? notes.trim() : '',
      recordedAt: new Date(),
    };

    // Replace if estimate from this vendor already exists
    const existingIdx = purchase.vendorEstimates.findIndex(
      e => e.vendorId?.toString() === vendor._id.toString()
    );

    if (existingIdx >= 0) {
      purchase.vendorEstimates[existingIdx] = estimateData;
    } else {
      purchase.vendorEstimates.push(estimateData);
    }

    if (purchase.status === 'Draft' || purchase.status === 'Quotation Requested') {
      purchase.status = 'Estimates Received';
    }

    purchase.history.push({
      action: 'estimate_recorded',
      performedBy: req.user.name || req.user.username,
      performedByRole: req.user.role,
      details: `Estimate recorded from ${vendor.name} — Quote #${quotationNo || 'N/A'}: Total ₹${calcTotal.toLocaleString('en-IN')}`,
      timestamp: new Date(),
    });

    await purchase.save();
    res.status(200).json(purchase);
  } catch (error) {
    console.error('recordVendorEstimate error:', error);
    res.status(500).json({ message: 'Failed to record vendor estimate: ' + error.message });
  }
};

// @desc    Submit vendor comparison & recommendation for Owner Approval
// @route   POST /api/purchases/:id/submit-approval
// @access  Private (Purchase Manager)
const submitForOwnerApproval = async (req, res) => {
  try {
    const { recommendedVendorId, recommendationNotes } = req.body;
    if (!recommendedVendorId) {
      return res.status(400).json({ message: 'Please select a recommended vendor' });
    }

    const purchase = await PurchaseOrder.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase record not found' });
    }

    const recommendedEstimate = purchase.vendorEstimates.find(
      e => e.vendorId?.toString() === recommendedVendorId.toString()
    );

    if (!recommendedEstimate) {
      return res.status(400).json({ message: 'No recorded estimate found for the recommended vendor' });
    }

    // Mark recommendation
    purchase.vendorEstimates.forEach(e => {
      e.isRecommended = e.vendorId?.toString() === recommendedVendorId.toString();
    });

    purchase.recommendedVendorId = recommendedVendorId;
    purchase.recommendationNotes = recommendationNotes ? recommendationNotes.trim() : '';
    purchase.status = 'Pending Owner Approval';
    purchase.ownerApproval.status = 'pending';

    purchase.history.push({
      action: 'submitted_for_approval',
      performedBy: req.user.name || req.user.username,
      performedByRole: req.user.role,
      details: `Submitted for Owner Approval. Recommended: ${recommendedEstimate.vendorName} (₹${recommendedEstimate.totalAmount.toLocaleString('en-IN')}). Remarks: "${recommendationNotes || 'None'}"`,
      timestamp: new Date(),
    });

    await purchase.save();

    // Notify All Owners
    try {
      const owners = await User.find({ role: 'owner' });
      for (const owner of owners) {
        await Notification.create({
          recipient: owner._id,
          sender: req.user._id,
          title: `Purchase Approval Required: ${purchase.prNo}`,
          message: `Purchase Manager recommended ${recommendedEstimate.vendorName} (₹${recommendedEstimate.totalAmount.toLocaleString('en-IN')}) for Private Client "${purchase.privatePartyName}". Please review and approve.`,
          type: 'system',
          link: `/owner-dashboard?tab=purchase-approvals&prId=${purchase._id}`,
          metadata: {
            taskTitle: `Purchase ${purchase.prNo}`,
            priority: 'high',
          },
        });
      }
    } catch (notifErr) {
      console.warn('Owner approval notification error:', notifErr.message);
    }

    res.status(200).json({ success: true, message: 'Submitted to Owner for approval', purchase });
  } catch (error) {
    console.error('submitForOwnerApproval error:', error);
    res.status(500).json({ message: 'Failed to submit for approval: ' + error.message });
  }
};

// @desc    Owner Approval Action (Approve / Reject / Request Changes)
// @route   POST /api/purchases/:id/owner-action
// @access  Private (STRICTLY OWNER ONLY)
const ownerApprovalAction = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access Denied: Only the Owner can approve purchases' });
    }

    const { action, approvedVendorId, ownerRemarks, rejectionReason } = req.body;
    if (!['approve', 'reject', 'request_changes'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be approve, reject, or request_changes' });
    }

    const purchase = await PurchaseOrder.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase record not found' });
    }

    if (action === 'approve') {
      const targetVendorId = approvedVendorId || purchase.recommendedVendorId;
      const estimate = purchase.vendorEstimates.find(
        e => e.vendorId?.toString() === targetVendorId?.toString()
      );

      if (!estimate) {
        return res.status(400).json({ message: 'Estimate details for approved vendor not found' });
      }

      // Generate PO Number
      const poNo = 'PO-' + purchase.prNo.replace('PR-', '');

      purchase.poNo = poNo;
      purchase.status = 'Approved';
      purchase.ownerApproval = {
        status: 'approved',
        approvedBy: req.user._id,
        approvedByName: req.user.name || 'Owner',
        approvalDate: new Date(),
        approvedVendorId: estimate.vendorId,
        approvedVendorName: estimate.vendorName,
        approvedAmount: estimate.totalAmount,
        ownerRemarks: ownerRemarks ? ownerRemarks.trim() : '',
      };

      purchase.purchaseOrderDetails = {
        poDate: new Date(),
        deliveryAddress: 'Neeta Engineering Works, Plot No. 12, GIDC, Mehsana, Gujarat',
        expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        paymentTerms: estimate.paymentTerms || '30 Days Net',
        notes: ownerRemarks || '',
        generatedBy: req.user._id,
      };

      purchase.accountsPayment.balanceAmount = estimate.totalAmount;
      purchase.accountsPayment.notifiedAt = new Date();

      purchase.history.push({
        action: 'approved',
        performedBy: req.user.name || 'Owner',
        performedByRole: 'owner',
        details: `Purchase APPROVED by Owner. PO Number: ${poNo}. Approved Vendor: ${estimate.vendorName}. Approved Amount: ₹${estimate.totalAmount.toLocaleString('en-IN')}`,
        timestamp: new Date(),
      });

      await purchase.save();

      // 1. Notify Purchase Manager
      try {
        if (purchase.createdBy) {
          await Notification.create({
            recipient: purchase.createdBy,
            sender: req.user._id,
            title: `Purchase Approved by Owner: ${poNo}`,
            message: `Owner has approved purchase ${poNo} for ${estimate.vendorName} (₹${estimate.totalAmount.toLocaleString('en-IN')}). You can now issue the Purchase Order.`,
            type: 'system',
            link: `/purchase-management?poId=${purchase._id}`,
          });
        }
      } catch (err) {}

      // 2. Notify Accounts Team
      try {
        const accountsUsers = await User.find({
          $or: [{ department: 'accounts' }, { role: 'admin' }],
        });
        for (const acc of accountsUsers) {
          await Notification.create({
            recipient: acc._id,
            sender: req.user._id,
            title: `New Approved PO for Payment: ${poNo}`,
            message: `Approved PO for ${estimate.vendorName} (₹${estimate.totalAmount.toLocaleString('en-IN')}). Terms: ${estimate.paymentTerms}. Client Ref: ${purchase.privatePartyName}.`,
            type: 'system',
            link: `/purchase-management?poId=${purchase._id}`,
          });
        }
      } catch (err) {}

      return res.status(200).json({ success: true, message: `Purchase approved! PO #${poNo} generated.`, purchase });
    }

    if (action === 'reject') {
      purchase.status = 'Rejected';
      purchase.ownerApproval.status = 'rejected';
      purchase.ownerApproval.rejectionReason = rejectionReason || 'Rejected by Owner';

      purchase.history.push({
        action: 'rejected',
        performedBy: req.user.name || 'Owner',
        performedByRole: 'owner',
        details: `Purchase REJECTED by Owner. Reason: ${rejectionReason || 'No reason provided'}`,
        timestamp: new Date(),
      });

      await purchase.save();

      // Notify Purchase Manager
      if (purchase.createdBy) {
        Notification.create({
          recipient: purchase.createdBy,
          sender: req.user._id,
          title: `Purchase Rejected by Owner: ${purchase.prNo}`,
          message: `Owner rejected purchase request ${purchase.prNo}. Reason: "${rejectionReason || 'Not approved'}".`,
          type: 'system',
          link: `/purchase-management?prId=${purchase._id}`,
        }).catch(() => {});
      }

      return res.status(200).json({ success: true, message: 'Purchase rejected by Owner', purchase });
    }

    if (action === 'request_changes') {
      purchase.status = 'Under Comparison';
      purchase.ownerApproval.status = 'changes_requested';
      purchase.ownerApproval.ownerRemarks = ownerRemarks || 'Changes requested by Owner';

      purchase.history.push({
        action: 'changes_requested',
        performedBy: req.user.name || 'Owner',
        performedByRole: 'owner',
        details: `Owner REQUESTED CHANGES. Remarks: "${ownerRemarks || 'Please negotiate or re-evaluate'}"`,
        timestamp: new Date(),
      });

      await purchase.save();

      // Notify Purchase Manager
      if (purchase.createdBy) {
        Notification.create({
          recipient: purchase.createdBy,
          sender: req.user._id,
          title: `Changes Requested on Purchase: ${purchase.prNo}`,
          message: `Owner requested modifications on ${purchase.prNo}: "${ownerRemarks || 'Review rates'}".`,
          type: 'system',
          link: `/purchase-management?prId=${purchase._id}`,
        }).catch(() => {});
      }

      return res.status(200).json({ success: true, message: 'Changes requested by Owner', purchase });
    }
  } catch (error) {
    console.error('ownerApprovalAction error:', error);
    res.status(500).json({ message: 'Approval action failed: ' + error.message });
  }
};

// @desc    Record Material Receiving (GRN)
// @route   POST /api/purchases/:id/receive-material
// @access  Private (Purchase Manager / Store / Admin)
const recordMaterialReceipt = async (req, res) => {
  try {
    const { challanNo, receiptDate, receivedItems, remarks } = req.body;
    if (!Array.isArray(receivedItems) || receivedItems.length === 0) {
      return res.status(400).json({ message: 'No material received items provided' });
    }

    const purchase = await PurchaseOrder.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // Update material quantities
    receivedItems.forEach(item => {
      const targetMat = purchase.materials.find(
        m => m.name.toLowerCase() === item.name.toLowerCase() || m._id.toString() === item.materialId
      );
      if (targetMat) {
        const qty = Number(item.quantity) || 0;
        targetMat.receivedQuantity = (targetMat.receivedQuantity || 0) + qty;
        targetMat.pendingQuantity = Math.max(0, targetMat.quantity - targetMat.receivedQuantity);
      }
    });

    purchase.materialReceipts.push({
      receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
      challanNo: challanNo ? challanNo.trim() : '',
      receivedItems,
      receivedBy: req.user.name || 'Purchase Manager',
      remarks: remarks ? remarks.trim() : '',
    });

    const isFullyReceived = purchase.materials.every(m => m.pendingQuantity <= 0);
    purchase.status = isFullyReceived ? 'Fully Received' : 'Partially Received';

    purchase.history.push({
      action: 'material_received',
      performedBy: req.user.name || req.user.username,
      performedByRole: req.user.role,
      details: `Material received under Challan #${challanNo || 'N/A'}. Status: ${purchase.status}. Remarks: ${remarks || 'None'}`,
      timestamp: new Date(),
    });

    await purchase.save();
    res.status(200).json({ success: true, message: 'Material receipt recorded', purchase });
  } catch (error) {
    console.error('recordMaterialReceipt error:', error);
    res.status(500).json({ message: 'Failed to record material receipt: ' + error.message });
  }
};

// @desc    Record Accounts Payment
// @route   POST /api/purchases/:id/payments
// @access  Private (Accounts / Admin / Owner)
const recordAccountsPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, reference, notes } = req.body;
    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    const purchase = await PurchaseOrder.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    const currentBalance = purchase.accountsPayment?.balanceAmount || purchase.ownerApproval?.approvedAmount || 0;
    if (payAmount > currentBalance) {
      return res.status(400).json({
        message: `Payment amount (₹${payAmount}) exceeds remaining balance (₹${currentBalance})`,
      });
    }

    const paymentEntry = {
      paymentDate: new Date(),
      amount: payAmount,
      paymentMethod: paymentMethod || 'Bank Transfer',
      reference: reference ? reference.trim() : '',
      notes: notes ? notes.trim() : '',
      recordedBy: req.user.name || 'Accounts Team',
    };

    if (!purchase.accountsPayment) {
      purchase.accountsPayment = { paidAmount: 0, balanceAmount: currentBalance, payments: [] };
    }

    purchase.accountsPayment.payments.push(paymentEntry);
    purchase.accountsPayment.paidAmount += payAmount;
    purchase.accountsPayment.balanceAmount = Math.max(0, currentBalance - payAmount);

    if (purchase.accountsPayment.balanceAmount <= 0) {
      purchase.accountsPayment.paymentStatus = 'paid';
      purchase.status = 'Paid';
    } else {
      purchase.accountsPayment.paymentStatus = 'partially_paid';
      purchase.status = 'Payment Pending';
    }

    purchase.history.push({
      action: 'payment_recorded',
      performedBy: req.user.name || 'Accounts',
      performedByRole: req.user.role,
      details: `Payment recorded: ₹${payAmount.toLocaleString('en-IN')} via ${paymentMethod || 'Bank Transfer'} (Ref: ${reference || 'N/A'}). Balance: ₹${purchase.accountsPayment.balanceAmount.toLocaleString('en-IN')}`,
      timestamp: new Date(),
    });

    await purchase.save();
    res.status(200).json({ success: true, message: 'Payment recorded successfully', purchase });
  } catch (error) {
    console.error('recordAccountsPayment error:', error);
    res.status(500).json({ message: 'Failed to record payment: ' + error.message });
  }
};

// @desc    Delete purchase record (Draft or Cancelled only)
// @route   DELETE /api/purchases/:id
// @access  Private
const deletePurchaseOrder = async (req, res) => {
  try {
    const purchase = await PurchaseOrder.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (purchase.status === 'Approved' && req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only the Owner can delete an approved purchase order' });
    }

    await PurchaseOrder.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Purchase record deleted' });
  } catch (error) {
    console.error('deletePurchaseOrder error:', error);
    res.status(500).json({ message: 'Failed to delete purchase record: ' + error.message });
  }
};

module.exports = {
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
};
