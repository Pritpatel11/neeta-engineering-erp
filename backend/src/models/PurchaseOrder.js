const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PrivateMaterial',
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      default: '',
      trim: true,
    },
    hsn: {
      type: String,
      default: '',
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Quantity must be greater than zero'],
    },
    unit: {
      type: String,
      default: 'Nos',
      trim: true,
    },
    specifications: {
      type: String,
      default: '',
      trim: true,
    },
    receivedQuantity: {
      type: Number,
      default: 0,
    },
    pendingQuantity: {
      type: Number,
      default: function () {
        return this.quantity;
      },
    },
  },
  { _id: true }
);

const vendorEstimateItemSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PrivateMaterial',
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: true }
);

const vendorEstimateSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    vendorName: {
      type: String,
      required: true,
    },
    vendorEmail: {
      type: String,
      default: '',
    },
    vendorPhone: {
      type: String,
      default: '',
    },
    quotationNo: {
      type: String,
      default: '',
      trim: true,
    },
    quotationDate: {
      type: Date,
      default: Date.now,
    },
    validity: {
      type: String,
      default: '15 Days',
    },
    deliveryTime: {
      type: String,
      default: '3-5 Days',
    },
    paymentTerms: {
      type: String,
      default: '30 Days Net',
    },
    materialPrices: [vendorEstimateItemSchema],
    subtotal: {
      type: Number,
      default: 0,
    },
    gstPercentage: {
      type: Number,
      default: 18,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    shippingCharges: {
      type: Number,
      default: 0,
    },
    otherCharges: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const materialReceiptSchema = new mongoose.Schema(
  {
    receiptDate: {
      type: Date,
      default: Date.now,
    },
    challanNo: {
      type: String,
      default: '',
      trim: true,
    },
    receivedItems: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, default: 'Nos' },
      },
    ],
    receivedBy: {
      type: String,
      default: 'Purchase Manager',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    prNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    poNo: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    privatePartyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PrivateParty',
      default: null,
    },
    privatePartyName: {
      type: String,
      required: true,
      trim: true,
    },
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null,
    },
    quotationNo: {
      type: String,
      default: '',
      trim: true,
    },
    requiredDate: {
      type: Date,
      required: true,
    },
    materials: [purchaseItemSchema],
    status: {
      type: String,
      enum: [
        'Draft',
        'Quotation Requested',
        'Estimates Received',
        'Under Comparison',
        'Pending Owner Approval',
        'Approved',
        'Rejected',
        'PO Created',
        'Ordered',
        'Partially Received',
        'Fully Received',
        'Payment Pending',
        'Paid',
        'Cancelled',
      ],
      default: 'Draft',
    },
    vendorQuotationRequests: [
      {
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
        vendorName: { type: String, required: true },
        vendorEmail: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
        status: { type: String, default: 'sent' },
      },
    ],
    vendorEstimates: [vendorEstimateSchema],
    recommendedVendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      default: null,
    },
    recommendationNotes: {
      type: String,
      default: '',
    },
    ownerApproval: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'changes_requested'],
        default: 'pending',
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      approvedByName: {
        type: String,
        default: '',
      },
      approvalDate: {
        type: Date,
        default: null,
      },
      approvedVendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        default: null,
      },
      approvedVendorName: {
        type: String,
        default: '',
      },
      approvedAmount: {
        type: Number,
        default: 0,
      },
      ownerRemarks: {
        type: String,
        default: '',
      },
    },
    purchaseOrderDetails: {
      poDate: { type: Date, default: null },
      deliveryAddress: { type: String, default: 'Neeta Engineering Works, Plot No. 12, GIDC, Mehsana, Gujarat' },
      expectedDeliveryDate: { type: Date, default: null },
      paymentTerms: { type: String, default: '30 Days Net' },
      notes: { type: String, default: '' },
      generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    materialReceipts: [materialReceiptSchema],
    accountsPayment: {
      paymentStatus: {
        type: String,
        enum: ['unpaid', 'partially_paid', 'paid'],
        default: 'unpaid',
      },
      paidAmount: {
        type: Number,
        default: 0,
      },
      balanceAmount: {
        type: Number,
        default: 0,
      },
      payments: [
        {
          paymentDate: { type: Date, default: Date.now },
          amount: { type: Number, required: true },
          paymentMethod: { type: String, default: 'Bank Transfer' },
          reference: { type: String, default: '' },
          notes: { type: String, default: '' },
          recordedBy: { type: String, default: 'Accounts Team' },
        },
      ],
      notifiedAt: { type: Date, default: null },
    },
    history: [
      {
        action: { type: String, required: true },
        performedBy: { type: String, required: true },
        performedByRole: { type: String, default: 'purchase_manager' },
        details: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdByName: {
      type: String,
      default: 'Purchase Manager',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
