const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const PrivateParty = require('../models/PrivateParty');

// Sync verified customer details into PrivateParty master collection
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

// Helper function to find next available quotation number
const getNextNumber = async (financialYear) => {
  const quotations = await Quotation.find({ financialYear });
  let maxNum = 0;
  for (const q of quotations) {
    if (q.quotationNo) {
      const match = q.quotationNo.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }
  let candidateNum = maxNum + 1;
  let candidateNo = `P/${candidateNum}`;
  while (await Quotation.exists({ quotationNo: candidateNo, financialYear })) {
    candidateNum++;
    candidateNo = `P/${candidateNum}`;
  }
  return candidateNo;
};

// Get all quotations
router.get('/', async (req, res) => {
  try {
    const quotations = await Quotation.find({ financialYear: req.financialYear }).sort({ _id: -1 });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get next quotation number
router.get('/next-no', async (req, res) => {
  try {
    const nextNo = await getNextNumber(req.financialYear);
    res.json({ nextNo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get specific quotation
router.get('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create quotation
router.post('/', async (req, res) => {
  try {
    if (!req.body.quotationNo) {
      req.body.quotationNo = await getNextNumber(req.financialYear);
    }
    const quotation = new Quotation(req.body);
    const newQuotation = await quotation.save();
    await syncPrivateParty(req.body);
    res.status(201).json(newQuotation);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Quotation number already exists for this financial year.' });
    }
    res.status(400).json({ message: err.message });
  }
});

// Update quotation
router.put('/:id', async (req, res) => {
  try {
    const { _id, createdAt, updatedAt, __v, ...updateData } = req.body;
    const updated = await Quotation.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    await syncPrivateParty(req.body);
    res.json(updated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Quotation number already exists for this financial year.' });
    }
    res.status(400).json({ message: err.message });
  }
});

// Delete quotation
router.delete('/:id', async (req, res) => {
  try {
    await Quotation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quotation deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

