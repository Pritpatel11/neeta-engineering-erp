const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');

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
    const lastQuotation = await Quotation.findOne({ financialYear: req.financialYear }).sort({ _id: -1 });
    let nextNo = 1;
    if (lastQuotation && lastQuotation.quotationNo) {
      const match = lastQuotation.quotationNo.match(/\/(\d+)$/);
      if (match) {
        nextNo = parseInt(match[1], 10) + 1;
      }
    }
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const nextYear = (parseInt(currentYear) + 1).toString().padStart(2, '0');
    res.json({ nextNo: `P/${nextNo}` });
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
  const quotation = new Quotation(req.body);
  try {
    const newQuotation = await quotation.save();
    res.status(201).json(newQuotation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update quotation
router.put('/:id', async (req, res) => {
  try {
    const updated = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
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
