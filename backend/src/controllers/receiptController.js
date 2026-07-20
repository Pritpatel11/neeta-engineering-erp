const Receipt = require('../models/Receipt');

exports.createReceipt = async (req, res) => {
  try {
    const newReceipt = new Receipt(req.body);
    await newReceipt.save();
    res.status(201).json(newReceipt);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Receipt number already exists' });
    }
    res.status(500).json({ error: 'Failed to create receipt' });
  }
};

exports.getNextReceiptNo = async (req, res) => {
  try {
    const lastReceipt = await Receipt.findOne({ financialYear: req.financialYear }).sort({ createdAt: -1 });
    let nextNo = 1;
    if (lastReceipt && lastReceipt.receiptNo) {
      const numMatch = lastReceipt.receiptNo.match(/\d+$/);
      if (numMatch) {
        nextNo = parseInt(numMatch[0]) + 1;
      }
    }
    res.status(200).json({ nextNo: nextNo.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch next receipt number' });
  }
};

exports.getReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find({ financialYear: req.financialYear }).sort({ createdAt: -1 });
    res.status(200).json(receipts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
};

exports.getReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    res.status(200).json(receipt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
};

exports.updateReceipt = async (req, res) => {
  try {
    const updatedReceipt = await Receipt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedReceipt) return res.status(404).json({ error: 'Receipt not found' });
    res.status(200).json(updatedReceipt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update receipt' });
  }
};

exports.deleteReceipt = async (req, res) => {
  try {
    const deletedReceipt = await Receipt.findByIdAndDelete(req.params.id);
    if (!deletedReceipt) return res.status(404).json({ error: 'Receipt not found' });
    res.status(200).json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
};
