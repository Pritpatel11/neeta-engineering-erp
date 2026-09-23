const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const PrivateInvoice = require('../models/PrivateInvoice');
const PrivateParty = require('../models/PrivateParty');
const PrivatePayment = require('../models/PrivatePayment');
const { sendEmail } = require('../services/emailService');

/**
 * @desc    Record a payment against a private invoice
 * @route   POST /api/private-payments
 * @access  Private
 */
const recordPayment = async (req, res) => {
  try {
    const {
      invoiceId,
      amount,
      paymentDate,
      paymentMethod = 'NEFT',
      reference = '',
      bankDetails = '',
      notes = ''
    } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ success: false, message: 'Invoice ID is required' });
    }

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    const invoice = await PrivateInvoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Private Invoice not found' });
    }

    const currentBalance = typeof invoice.balanceAmount === 'number' 
      ? invoice.balanceAmount 
      : Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0));

    if (payAmount > currentBalance + 0.01) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${payAmount.toLocaleString('en-IN')}) cannot exceed remaining balance (₹${currentBalance.toLocaleString('en-IN')})`
      });
    }

    // Identify or link PrivateParty
    let party = null;
    if (invoice.partyId) {
      party = await PrivateParty.findById(invoice.partyId);
    }
    if (!party && invoice.clientName) {
      party = await PrivateParty.findOne({
        $or: [
          { name: new RegExp(`^${invoice.clientName.trim()}$`, 'i') },
          { gst: invoice.clientGST ? new RegExp(`^${invoice.clientGST.trim()}$`, 'i') : '__none__' }
        ]
      });
      if (party) {
        invoice.partyId = party._id;
      }
    }

    const partyName = party ? party.name : invoice.clientName;
    const finalPaymentDate = paymentDate || new Date().toISOString().split('T')[0];

    // Create payment transaction
    const payment = new PrivatePayment({
      invoiceId: invoice._id,
      partyId: party ? party._id : undefined,
      partyName: partyName,
      invoiceNo: invoice.invoiceNo,
      amount: payAmount,
      paymentDate: finalPaymentDate,
      paymentMethod,
      reference,
      bankDetails,
      notes,
      financialYear: invoice.financialYear || '2025-26',
      recordedBy: req.user?._id
    });

    await payment.save();

    // Recalculate invoice payment totals
    const newPaidAmount = Number(((invoice.paidAmount || 0) + payAmount).toFixed(2));
    const newBalanceAmount = Number(Math.max(0, invoice.totalAmount - newPaidAmount).toFixed(2));

    let newStatus = 'Unpaid';
    if (newBalanceAmount <= 0.01) {
      newStatus = 'Fully Paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'Partially Paid';
    }

    invoice.paidAmount = newPaidAmount;
    invoice.balanceAmount = newBalanceAmount;
    invoice.paymentStatus = newStatus;

    if (!invoice.payments) invoice.payments = [];
    invoice.payments.push({
      paymentId: payment._id,
      amount: payAmount,
      date: finalPaymentDate,
      method: paymentMethod,
      reference,
      bankDetails,
      notes,
      recordedAt: new Date()
    });

    await invoice.save();

    return res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmount.toLocaleString('en-IN')} recorded successfully`,
      payment,
      invoice: {
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        balanceAmount: invoice.balanceAmount,
        paymentStatus: invoice.paymentStatus
      }
    });
  } catch (error) {
    console.error('Error recording private payment:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to record payment' });
  }
};

/**
 * @desc    Delete a payment and restore invoice balance
 * @route   DELETE /api/private-payments/:id
 * @access  Private
 */
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await PrivatePayment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const invoice = await PrivateInvoice.findById(payment.invoiceId);
    await PrivatePayment.findByIdAndDelete(id);

    if (invoice) {
      // Filter out deleted payment
      invoice.payments = (invoice.payments || []).filter(
        p => p.paymentId?.toString() !== id && p._id?.toString() !== id
      );

      // Re-sum actual remaining payments
      const remainingPayments = await PrivatePayment.find({ invoiceId: invoice._id });
      const recalculatedPaid = remainingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const recalculatedBalance = Math.max(0, invoice.totalAmount - recalculatedPaid);

      let newStatus = 'Unpaid';
      if (recalculatedBalance <= 0.01 && recalculatedPaid > 0) {
        newStatus = 'Fully Paid';
      } else if (recalculatedPaid > 0) {
        newStatus = 'Partially Paid';
      }

      invoice.paidAmount = Number(recalculatedPaid.toFixed(2));
      invoice.balanceAmount = Number(recalculatedBalance.toFixed(2));
      invoice.paymentStatus = newStatus;
      await invoice.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Payment removed successfully',
      deletedPaymentId: id
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete payment' });
  }
};

/**
 * @desc    Get complete ledger and transaction statement for a private party
 * @route   GET /api/private-parties/:id/ledger
 * @access  Private
 */
const getPartyLedger = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch party
    let party = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      party = await PrivateParty.findById(id);
    }
    if (!party) {
      party = await PrivateParty.findOne({ name: id });
    }

    if (!party) {
      return res.status(404).json({ success: false, message: 'Private Party not found' });
    }

    // 2. Fetch all invoices for this party
    const partyQuery = {
      $or: [
        { partyId: party._id },
        { clientName: new RegExp(`^${party.name.trim()}$`, 'i') }
      ]
    };
    if (party.gst) {
      partyQuery.$or.push({ clientGST: new RegExp(`^${party.gst.trim()}$`, 'i') });
    }

    const invoices = await PrivateInvoice.find(partyQuery).sort({ date: 1, createdAt: 1 });
    const invoiceIds = invoices.map(inv => inv._id);

    // 3. Fetch all payments
    const payments = await PrivatePayment.find({
      $or: [
        { partyId: party._id },
        { partyName: new RegExp(`^${party.name.trim()}$`, 'i') },
        { invoiceId: { $in: invoiceIds } }
      ]
    }).sort({ paymentDate: 1, createdAt: 1 });

    // 4. Calculate total metrics
    const totalInvoicesAmount = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalPaidAmount = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
    const totalOutstandingAmount = Math.max(0, Number((totalInvoicesAmount - totalPaidAmount).toFixed(2)));

    // 5. Build Unified Chronological Statement of Account (Running Balance)
    const transactions = [];

    // Invoices as DEBIT entries
    invoices.forEach(inv => {
      transactions.push({
        id: inv._id,
        date: inv.date,
        type: 'INVOICE',
        refNo: inv.invoiceNo,
        description: `Tax Invoice #${inv.invoiceNo} (${inv.items?.length || 0} item${inv.items?.length === 1 ? '' : 's'})`,
        debit: Number(inv.totalAmount.toFixed(2)),
        credit: 0,
        paymentMethod: '—',
        reference: inv.poNumber ? `PO: ${inv.poNumber}` : '—',
        notes: inv.notes || '',
        invoiceStatus: inv.paymentStatus || 'Unpaid',
        timestamp: new Date(inv.date).getTime() || new Date(inv.createdAt).getTime()
      });
    });

    // Payments as CREDIT entries
    payments.forEach(pay => {
      transactions.push({
        id: pay._id,
        date: pay.paymentDate,
        type: 'PAYMENT',
        refNo: pay.invoiceNo ? `Inv #${pay.invoiceNo}` : 'Direct Receipt',
        description: `Payment Received via ${pay.paymentMethod}${pay.reference ? ` (Ref: ${pay.reference})` : ''}`,
        debit: 0,
        credit: Number(pay.amount.toFixed(2)),
        paymentMethod: pay.paymentMethod,
        reference: pay.reference || '—',
        bankDetails: pay.bankDetails || '',
        notes: pay.notes || '',
        invoiceId: pay.invoiceId,
        timestamp: (new Date(pay.paymentDate).getTime() || new Date(pay.createdAt).getTime()) + 1 // Ensure payment comes after invoice if same date
      });
    });

    // Sort chronologically ascending
    transactions.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.timestamp - b.timestamp;
    });

    // Compute Running Balance (Debit increases balance, Credit reduces balance)
    let currentRunningBalance = 0;
    const chronologicalStatement = transactions.map(t => {
      currentRunningBalance += (t.debit - t.credit);
      return {
        ...t,
        runningBalance: Number(currentRunningBalance.toFixed(2))
      };
    });

    return res.status(200).json({
      success: true,
      party: {
        _id: party._id,
        name: party.name,
        contactPerson: party.contactPerson,
        phone: party.phone,
        email: party.email,
        address: party.address,
        gst: party.gst,
        pan: party.pan,
        state: party.state,
        stateCode: party.stateCode,
        city: party.city,
        pincode: party.pincode
      },
      summary: {
        totalInvoicesAmount: Number(totalInvoicesAmount.toFixed(2)),
        totalPaidAmount: Number(totalPaidAmount.toFixed(2)),
        totalOutstandingAmount,
        totalInvoicesCount: invoices.length,
        totalPaymentsCount: payments.length,
        fullyPaidInvoicesCount: invoices.filter(i => (i.paymentStatus || 'Unpaid') === 'Fully Paid').length,
        unpaidInvoicesCount: invoices.filter(i => (i.paymentStatus || 'Unpaid') === 'Unpaid').length,
        partiallyPaidInvoicesCount: invoices.filter(i => (i.paymentStatus || 'Unpaid') === 'Partially Paid').length
      },
      statement: chronologicalStatement,
      invoices: invoices.map(i => ({
        _id: i._id,
        invoiceNo: i.invoiceNo,
        date: i.date,
        totalAmount: i.totalAmount,
        paidAmount: i.paidAmount || 0,
        balanceAmount: typeof i.balanceAmount === 'number' ? i.balanceAmount : Math.max(0, i.totalAmount - (i.paidAmount || 0)),
        paymentStatus: i.paymentStatus || 'Unpaid',
        itemsCount: i.items?.length || 0,
        payments: i.payments || []
      })),
      payments
    });
  } catch (error) {
    console.error('Error fetching party ledger:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch party ledger' });
  }
};

/**
 * @desc    Get summary balances across all private parties
 * @route   GET /api/private-parties/ledger-summary
 * @access  Private
 */
const getAllPartiesLedgerSummary = async (req, res) => {
  try {
    const parties = await PrivateParty.find().sort({ name: 1 });
    const invoices = await PrivateInvoice.find();
    const payments = await PrivatePayment.find();

    const summaryList = parties.map(party => {
      const partyInvoices = invoices.filter(inv => 
        (inv.partyId && inv.partyId.toString() === party._id.toString()) ||
        (inv.clientName && inv.clientName.trim().toLowerCase() === party.name.trim().toLowerCase()) ||
        (party.gst && inv.clientGST && inv.clientGST.trim().toUpperCase() === party.gst.trim().toUpperCase())
      );

      const invIds = new Set(partyInvoices.map(i => i._id.toString()));
      const partyPayments = payments.filter(pay =>
        (pay.partyId && pay.partyId.toString() === party._id.toString()) ||
        (pay.partyName && pay.partyName.trim().toLowerCase() === party.name.trim().toLowerCase()) ||
        (pay.invoiceId && invIds.has(pay.invoiceId.toString()))
      );

      const totalInvoiced = partyInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
      const totalPaid = partyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const balance = Math.max(0, Number((totalInvoiced - totalPaid).toFixed(2)));

      return {
        partyId: party._id,
        partyName: party.name,
        contactPerson: party.contactPerson,
        phone: party.phone,
        email: party.email,
        gst: party.gst,
        city: party.city,
        state: party.state,
        totalInvoiced: Number(totalInvoiced.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        outstandingBalance: balance,
        invoicesCount: partyInvoices.length,
        paymentsCount: partyPayments.length,
        status: balance <= 0 ? 'Clear' : (totalPaid > 0 ? 'Partial' : 'Due')
      };
    });

    const totalOverallInvoiced = summaryList.reduce((sum, p) => sum + p.totalInvoiced, 0);
    const totalOverallPaid = summaryList.reduce((sum, p) => sum + p.totalPaid, 0);
    const totalOverallOutstanding = summaryList.reduce((sum, p) => sum + p.outstandingBalance, 0);

    return res.status(200).json({
      success: true,
      overall: {
        totalInvoiced: Number(totalOverallInvoiced.toFixed(2)),
        totalPaid: Number(totalOverallPaid.toFixed(2)),
        totalOutstanding: Number(totalOverallOutstanding.toFixed(2)),
        totalParties: parties.length
      },
      parties: summaryList
    });
  } catch (error) {
    console.error('Error fetching all parties ledger summary:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch summary' });
  }
};

/**
 * @desc    Generate PDF and send Ledger Statement via NodeMailer
 * @route   POST /api/private-parties/:id/ledger/send-email
 * @access  Private
 */
const sendLedgerEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientEmail, subject, message } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: 'Recipient email is required' });
    }

    const party = await PrivateParty.findById(id);
    if (!party) {
      return res.status(404).json({ success: false, message: 'Private party not found' });
    }

    // Fetch invoices and payments
    const invoices = await PrivateInvoice.find({
      $or: [{ partyId: party._id }, { clientName: party.name }]
    }).sort({ date: 1 });

    const invoiceIds = invoices.map(i => i._id);
    const payments = await PrivatePayment.find({
      $or: [{ partyId: party._id }, { invoiceId: { $in: invoiceIds } }]
    }).sort({ paymentDate: 1 });

    const totalInvoiced = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const balance = Math.max(0, totalInvoiced - totalPaid);

    // Build PDF Buffer
    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 36, size: 'A4' });
      const buffers = [];
      doc.on('data', b => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(16).fillColor('#0059bb').text('NEETA ENGINEERING WORKS', { align: 'center' });
      doc.fontSize(9).fillColor('#475569')
        .text('Industrial Machinery, Electrical Contracting & Fabrication Works', { align: 'center' })
        .text('GIDC Industrial Area, Deesa / Banaskantha, Gujarat | GSTIN: 24ABHPP5386L1Z3', { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(13).fillColor('#0f172a').text('STATEMENT OF ACCOUNT / PARTY LEDGER', { align: 'center', underline: true });
      doc.moveDown(0.5);

      // Party details
      doc.fontSize(10).fillColor('#0f172a')
        .text(`Client Name: ${party.name}`)
        .text(`GSTIN: ${party.gst || 'N/A'} | PAN: ${party.pan || 'N/A'}`)
        .text(`Address: ${party.address || 'N/A'}, ${party.city || ''}, ${party.state || 'Gujarat'}`)
        .text(`Date of Statement: ${new Date().toLocaleDateString('en-IN')}`);
      doc.moveDown(1);

      // Summary Box
      doc.fontSize(10).fillColor('#0059bb')
        .text(`TOTAL INVOICES: Rs. ${totalInvoiced.toLocaleString('en-IN')}`)
        .text(`TOTAL PAYMENT RECEIVED: Rs. ${totalPaid.toLocaleString('en-IN')}`)
        .fillColor('#dc2626')
        .text(`OUTSTANDING BALANCE DUE: Rs. ${balance.toLocaleString('en-IN')}`);
      doc.moveDown(1);

      // Transaction Table Header
      doc.fillColor('#0f172a').fontSize(9);
      doc.text('Date          Particulars / Ref No.          Debit (Rs.)     Credit (Rs.)     Balance (Rs.)');
      doc.text('-----------------------------------------------------------------------------------------');

      // Transactions
      const txs = [
        ...invoices.map(i => ({ date: i.date, desc: `Invoice #${i.invoiceNo}`, debit: i.totalAmount, credit: 0 })),
        ...payments.map(p => ({ date: p.paymentDate, desc: `Receipt via ${p.paymentMethod}`, debit: 0, credit: p.amount }))
      ].sort((a, b) => a.date.localeCompare(b.date));

      let runBal = 0;
      txs.forEach(t => {
        runBal += (t.debit - t.credit);
        const line = `${t.date}    ${t.desc.padEnd(28)}    ${(t.debit ? t.debit.toFixed(2) : '-').padStart(10)}    ${(t.credit ? t.credit.toFixed(2) : '-').padStart(10)}    ${runBal.toFixed(2).padStart(12)}`;
        doc.text(line);
      });

      doc.moveDown(1);
      doc.fontSize(8).fillColor('#64748b').text('This is a computer generated statement of account.', { align: 'center' });
      doc.end();
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="background-color: #0059bb; padding: 20px; text-align: center; color: white;">
          <h2 style="margin:0;">Neeta Engineering Works</h2>
          <p style="margin:5px 0 0 0; font-size: 13px;">Party Ledger Statement / Khata</p>
        </div>
        <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <p>Dear <strong>${party.name}</strong>,</p>
          <p>${message || 'Please find attached your updated Statement of Account / Khata ledger.'}</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #cbd5e1;">
            <p style="margin: 4px 0;"><strong>Total Invoiced:</strong> ₹${totalInvoiced.toLocaleString('en-IN')}</p>
            <p style="margin: 4px 0;"><strong>Total Payments Received:</strong> ₹${totalPaid.toLocaleString('en-IN')}</p>
            <p style="margin: 4px 0; font-size: 16px; color: #dc2626;"><strong>Outstanding Balance:</strong> ₹${balance.toLocaleString('en-IN')}</p>
          </div>
          <p>Please feel free to contact us for any clarification.</p>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: recipientEmail,
      subject: subject || `Statement of Account - ${party.name} | Neeta Engineering Works`,
      html: emailHtml,
      attachments: [{
        filename: `Ledger_${party.name.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    return res.status(200).json({
      success: true,
      message: `Statement of Account emailed successfully to ${recipientEmail}`,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending ledger email:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to send ledger email' });
  }
};

/**
 * @desc    Get all payment records with filters (invoiceNo, partyName, paymentMethod, date range)
 * @route   GET /api/private-payments
 * @access  Private
 */
const getAllPayments = async (req, res) => {
  try {
    const query = {};
    if (req.financialYear) {
      query.financialYear = req.financialYear;
    }
    if (req.query.invoiceNo) {
      query.invoiceNo = new RegExp(req.query.invoiceNo.trim(), 'i');
    }
    if (req.query.partyName) {
      query.partyName = new RegExp(req.query.partyName.trim(), 'i');
    }
    if (req.query.partyId) {
      query.partyId = req.query.partyId;
    }
    if (req.query.invoiceId) {
      query.invoiceId = req.query.invoiceId;
    }
    if (req.query.paymentMethod) {
      query.paymentMethod = req.query.paymentMethod;
    }
    if (req.query.startDate || req.query.endDate) {
      query.paymentDate = {};
      if (req.query.startDate) query.paymentDate.$gte = req.query.startDate;
      if (req.query.endDate) query.paymentDate.$lte = req.query.endDate;
    }
    const limit = parseInt(req.query.limit, 10) || 100;
    const payments = await PrivatePayment.find(query)
      .sort({ paymentDate: -1, _id: -1 })
      .limit(limit);
    return res.status(200).json(payments);
  } catch (error) {
    console.error('getAllPayments error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPayments,
  recordPayment,
  deletePayment,
  getPartyLedger,
  getAllPartiesLedgerSummary,
  sendLedgerEmail
};

