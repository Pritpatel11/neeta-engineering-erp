const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const { parse } = require('csv-parse/sync');

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1XlejvG0EQvG4tlp80lu7FDQl4E5Zftn076QzEtvyBn4/export?format=csv&gid=0';

// Get all enquiries
router.get('/', async (req, res) => {
  try {
    const enquiries = await Enquiry.find({ financialYear: req.financialYear }).sort({ _id: -1 });
    res.json(enquiries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Standalone sync function for background polling
const syncEnquiriesFromSheet = async (financialYear = '2025-26') => {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error(`Failed to fetch sheet: ${response.statusText}`);
    const csvData = await response.text();
    
    const records = parse(csvData, { columns: true, skip_empty_lines: true, trim: true });
    const enquiries = records.map(record => ({
      date: record.Date, time: record.Time, name: record.Name,
      email: record.Email, phone: record.Phone, subject: record.Subject, message: record.Message,
      financialYear
    })).filter(e => e.date && e.name);

    let insertedCount = 0;
    try {
      const result = await Enquiry.insertMany(enquiries, { ordered: false });
      insertedCount = result.length;
    } catch (error) {
      if (error.code === 11000) {
        insertedCount = error.insertedDocs ? error.insertedDocs.length : 0;
      } else throw error;
    }
    
    if (insertedCount > 0) {
      console.log(`[Background Sync] ${insertedCount} new enquiries added.`);
    }
    return insertedCount;
  } catch (err) {
    console.error('[Background Sync] Error:', err.message);
    return 0;
  }
};

// Start background polling every 1 minute (60000 ms)
setInterval(syncEnquiriesFromSheet, 60000);

// Get pending count
router.get('/pending-count', async (req, res) => {
  try {
    const count = await Enquiry.countDocuments({ status: 'Pending', financialYear: req.financialYear });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sync from Google Sheets (Manual Trigger)
router.post('/sync', async (req, res) => {
  try {
    const insertedCount = await syncEnquiriesFromSheet(req.financialYear);
    res.json({ message: 'Sync complete', insertedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update enquiry status/remarks
router.put('/:id', async (req, res) => {
  try {
    const updated = await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
