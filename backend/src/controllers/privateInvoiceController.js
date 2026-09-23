const PrivateInvoice = require('../models/PrivateInvoice');
const PrivateParty = require('../models/PrivateParty');
const { sendInvoiceEmail } = require('../services/emailService');
const PDFDocument = require('pdfkit');

// Helper to sync client details into PrivateParty master collection
const syncPrivateParty = async (body) => {
  const name = (body.clientName || body.companyName || '').trim();
  const gst = (body.clientGST || '').trim().toUpperCase();
  if (!name) return;
  try {
    let party = null;
    if (gst) {
      party = await PrivateParty.findOne({ gst: new RegExp(`^${gst}$`, 'i') });
    }
    if (!party) {
      party = await PrivateParty.findOne({ name });
    }
    if (party) {
      let changed = false;
      if (!party.gst && gst) { party.gst = gst; changed = true; }
      if (!party.address && body.clientAddress) { party.address = body.clientAddress; changed = true; }
      if (!party.phone && body.clientPhone) { party.phone = body.clientPhone; changed = true; }
      if (!party.email && body.clientEmail) { party.email = body.clientEmail; changed = true; }
      if (changed) await party.save();
    } else {
      await PrivateParty.create({
        name,
        gst,
        address: body.clientAddress || '',
        phone: body.clientPhone || '',
        email: body.clientEmail || ''
      });
    }
  } catch (err) {
    console.warn('PrivateParty sync notice:', err.message);
  }
};

// Helper function to find next available invoice number for a financial year
const getNextNumber = async (financialYear) => {
  const invoices = await PrivateInvoice.find({ financialYear });
  let maxNum = 0;
  for (const inv of invoices) {
    if (inv.invoiceNo) {
      const match = inv.invoiceNo.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }
  let candidateNum = maxNum + 1;
  let candidateNo = `PI-${String(candidateNum).padStart(3, '0')}`;
  while (await PrivateInvoice.exists({ invoiceNo: candidateNo, financialYear })) {
    candidateNum++;
    candidateNo = `PI-${String(candidateNum).padStart(3, '0')}`;
  }
  return candidateNo;
};

// Generate a fallback PDF using pdfkit matching the invoice details if frontend didn't supply one
const generateFallbackPdfBuffer = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Document Title
      doc.fontSize(16).font('Helvetica-Bold').text(invoice.documentType || 'TAX INVOICE', { align: 'center' });
      doc.moveDown(0.5);

      // Company Info & Details
      doc.fontSize(12).font('Helvetica-Bold').text('Neeta Engineering Works');
      doc.fontSize(9).font('Helvetica').text('179, GIDC Main Road, Navadisa Road, Chandisar, Banaskantha, Gujarat 385510');
      doc.text('GSTIN: 24ABHPP5386L1Z3 | E-Mail: neeta5788@gmail.com');
      doc.moveDown();

      // Buyer Info & Invoice Details
      const topY = doc.y;
      doc.rect(40, topY, 250, 90).stroke();
      doc.rect(290, topY, 265, 90).stroke();

      doc.fontSize(8).font('Helvetica-Bold').text('BUYER (BILL TO):', 45, topY + 5);
      doc.fontSize(10).font('Helvetica-Bold').text(invoice.clientName || 'N/A', 45, topY + 18);
      doc.fontSize(8).font('Helvetica').text(invoice.clientAddress || '', 45, topY + 32, { width: 240 });
      if (invoice.clientGST) doc.text(`GSTIN: ${invoice.clientGST}`, 45, topY + 68);

      doc.fontSize(8).font('Helvetica-Bold').text(`Invoice No: ${invoice.invoiceNo}`, 295, topY + 5);
      doc.font('Helvetica').text(`Date: ${invoice.date || 'N/A'}`, 295, topY + 20);
      doc.text(`Due Date: ${invoice.dueDate || 'N/A'}`, 295, topY + 35);
      doc.text(`PO Ref: ${invoice.poNumber || 'N/A'}`, 295, topY + 50);
      doc.text(`Contact: ${invoice.clientPhone || 'N/A'}`, 295, topY + 65);

      doc.y = topY + 105;

      // Table Header
      const tableY = doc.y;
      doc.rect(40, tableY, 515, 20).fillAndStroke('#f1f5f9', '#000000');
      doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold');
      doc.text('SI', 45, tableY + 5, { width: 20 });
      doc.text('Description of Goods', 70, tableY + 5, { width: 230 });
      doc.text('HSN', 305, tableY + 5, { width: 45 });
      doc.text('Qty', 355, tableY + 5, { width: 45, align: 'right' });
      doc.text('Rate', 405, tableY + 5, { width: 65, align: 'right' });
      doc.text('Amount', 475, tableY + 5, { width: 75, align: 'right' });

      let currentY = tableY + 20;
      (invoice.items || []).forEach((item, idx) => {
        doc.rect(40, currentY, 515, 20).stroke();
        doc.fontSize(8).font('Helvetica');
        doc.text(String(idx + 1), 45, currentY + 5, { width: 20 });
        doc.text(item.description || '', 70, currentY + 5, { width: 230 });
        doc.text(item.hsn || '', 305, currentY + 5, { width: 45 });
        doc.text(`${item.quantity} ${item.unit || ''}`, 355, currentY + 5, { width: 45, align: 'right' });
        doc.text(Number(item.rate || 0).toFixed(2), 405, currentY + 5, { width: 65, align: 'right' });
        doc.text(Number(item.amount || 0).toFixed(2), 475, currentY + 5, { width: 75, align: 'right' });
        currentY += 20;
      });

      // Totals
      doc.rect(40, currentY, 515, 20).stroke();
      doc.font('Helvetica-Bold').text('Sub-Total:', 405, currentY + 5, { width: 65, align: 'right' });
      doc.text(Number(invoice.subTotal || 0).toFixed(2), 475, currentY + 5, { width: 75, align: 'right' });
      currentY += 20;

      if (invoice.taxPercentage > 0) {
        doc.rect(40, currentY, 515, 20).stroke();
        doc.font('Helvetica').text(`GST (${invoice.taxPercentage}%):`, 405, currentY + 5, { width: 65, align: 'right' });
        doc.text(Number(invoice.taxAmount || 0).toFixed(2), 475, currentY + 5, { width: 75, align: 'right' });
        currentY += 20;
      }

      doc.rect(40, currentY, 515, 22).fillAndStroke('#f8fafc', '#000000');
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);
      doc.text('Total Amount Payable:', 320, currentY + 6, { width: 150, align: 'right' });
      doc.text(`INR ${Number(invoice.totalAmount || 0).toFixed(2)}`, 475, currentY + 6, { width: 75, align: 'right' });
      currentY += 30;

      // Bank Details
      doc.fontSize(8).font('Helvetica-Bold').text("Company's Bank Details:", 45, currentY);
      doc.font('Helvetica').text('Bank: The Mehsana Urban Co-operative Bank Ltd. | A/c No: 00141101001022', 45, currentY + 12);
      doc.text('IFSC: MSNU0000014 | Branch: Deesa Branch', 45, currentY + 24);

      // Signatory
      doc.font('Helvetica-Bold').text('for Neeta Engineering Works', 380, currentY, { align: 'right' });
      doc.font('Helvetica').text('Authorised Signatory', 380, currentY + 45, { align: 'right' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// GET /api/private-invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const query = {};
    if (req.financialYear) {
      query.financialYear = req.financialYear;
    }
    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }
    if (req.query.search) {
      const s = req.query.search.trim();
      query.$or = [
        { invoiceNo: new RegExp(s, 'i') },
        { clientName: new RegExp(s, 'i') },
        { poNumber: new RegExp(s, 'i') },
        { clientGST: new RegExp(s, 'i') }
      ];
    }
    const invoices = await PrivateInvoice.find(query).sort({ _id: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/private-invoices/next-no
exports.getNextInvoiceNo = async (req, res) => {
  try {
    const nextNo = await getNextNumber(req.financialYear || '2025-26');
    res.json({ nextNo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/private-invoices/:id
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await PrivateInvoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Private invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/private-invoices
exports.createInvoice = async (req, res) => {
  try {
    if (!req.body.invoiceNo) {
      req.body.invoiceNo = await getNextNumber(req.financialYear || '2025-26');
    }
    if (!req.body.financialYear) {
      req.body.financialYear = req.financialYear || '2025-26';
    }
    const invoice = new PrivateInvoice(req.body);
    const savedInvoice = await invoice.save();
    await syncPrivateParty(req.body);
    res.status(201).json(savedInvoice);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Invoice number already exists for this financial year.' });
    }
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/private-invoices/:id
exports.updateInvoice = async (req, res) => {
  try {
    const { _id, createdAt, updatedAt, __v, ...updateData } = req.body;
    const updated = await PrivateInvoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Private invoice not found' });
    }
    await syncPrivateParty(req.body);
    res.json(updated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Invoice number already exists for this financial year.' });
    }
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/private-invoices/:id
exports.deleteInvoice = async (req, res) => {
  try {
    const deleted = await PrivateInvoice.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Private invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/private-invoices/:id/send-email (or POST /api/private-invoices/send-email)
exports.sendInvoiceEmail = async (req, res) => {
  try {
    const { email, subject, note, pdfBase64 } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Recipient email address is required' });
    }

    let invoice = null;
    if (req.params.id && req.params.id !== 'direct') {
      invoice = await PrivateInvoice.findById(req.params.id);
    }
    if (!invoice && req.body.invoice) {
      invoice = req.body.invoice;
    }

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice data not found' });
    }

    // Prepare PDF buffer: use provided base64 if available, otherwise generate with pdfkit
    let pdfBuffer = null;
    if (pdfBase64) {
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      pdfBuffer = Buffer.from(cleanBase64, 'base64');
    } else {
      pdfBuffer = await generateFallbackPdfBuffer(invoice);
    }

    // Send email with nodemailer
    const emailResult = await sendInvoiceEmail({
      to: email,
      subject,
      note,
      invoice,
      pdfBuffer
    });

    // If invoice is in database, update status to 'Sent' and add emailHistory entry
    if (req.params.id && req.params.id !== 'direct') {
      await PrivateInvoice.findByIdAndUpdate(req.params.id, {
        status: 'Sent',
        $push: {
          emailHistory: {
            sentTo: email,
            sentAt: new Date(),
            status: 'Delivered',
            messageId: emailResult.messageId
          }
        }
      });
    }

    res.json({
      success: true,
      message: `Invoice successfully sent to ${email}`,
      ...emailResult
    });
  } catch (err) {
    console.error('Error sending invoice email:', err);
    res.status(500).json({ message: 'Failed to send invoice email: ' + err.message });
  }
};

// GET /api/private-invoices/by-number/:invoiceNo
exports.getInvoiceByNumber = async (req, res) => {
  try {
    const rawNo = req.params.invoiceNo.trim();
    const invoice = await PrivateInvoice.findOne({
      invoiceNo: { $regex: new RegExp(`^${rawNo}$`, 'i') }
    });
    if (!invoice) {
      return res.status(404).json({ message: `Invoice "${rawNo}" not found.` });
    }
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/private-invoices/:id/pdf
exports.getInvoicePdfById = async (req, res) => {
  try {
    const invoice = await PrivateInvoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }
    const pdfBuffer = await generateFallbackPdfBuffer(invoice);
    const fileName = `Invoice_${(invoice.invoiceNo || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    if (req.query.format === 'base64' || req.query.format === 'json') {
      return res.json({
        success: true,
        invoiceNo: invoice.invoiceNo,
        fileName,
        sizeBytes: pdfBuffer.length,
        base64: pdfBuffer.toString('base64'),
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('getInvoicePdfById error:', err);
    res.status(500).json({ message: 'Failed to generate invoice PDF: ' + err.message });
  }
};

// GET /api/private-invoices/by-number/:invoiceNo/pdf
exports.getInvoicePdfByNumber = async (req, res) => {
  try {
    const rawNo = req.params.invoiceNo.trim();
    const invoice = await PrivateInvoice.findOne({
      invoiceNo: { $regex: new RegExp(`^${rawNo}$`, 'i') }
    });
    if (!invoice) {
      return res.status(404).json({ message: `Invoice "${rawNo}" not found.` });
    }
    const pdfBuffer = await generateFallbackPdfBuffer(invoice);
    const fileName = `Invoice_${(invoice.invoiceNo || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    if (req.query.format === 'base64' || req.query.format === 'json') {
      return res.json({
        success: true,
        invoiceNo: invoice.invoiceNo,
        fileName,
        sizeBytes: pdfBuffer.length,
        base64: pdfBuffer.toString('base64'),
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('getInvoicePdfByNumber error:', err);
    res.status(500).json({ message: 'Failed to generate invoice PDF: ' + err.message });
  }
};

