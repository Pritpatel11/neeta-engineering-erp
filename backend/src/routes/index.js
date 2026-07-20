const express = require('express');
const router = express.Router();

const challanRoutes = require('./challanRoutes');
const statementRoutes = require('./statementRoutes');
const remainingMaterialRoutes = require('./remainingMaterialRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const storeReceiptRoutes = require('./storeReceiptRoutes');
const masterDataRoutes = require('./masterDataRoutes');
const enquiryRoutes = require('./enquiryRoutes');
const quotationRoutes = require('./quotationRoutes');
const receiptRoutes = require('./receiptRoutes');
const financialYearMiddleware = require('../middlewares/financialYear');
const backupDatabase = require('../utils/backup');
const restoreDatabase = require('../utils/restore');
const fs = require('fs');
const path = require('path');

// Example route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is healthy' });
});

router.post('/backup', async (req, res) => {
  try {
    const backupPath = await backupDatabase();
    res.status(200).json({ message: 'Backup completed successfully', path: backupPath });
  } catch (error) {
    console.error('Backup API error:', error);
    res.status(500).json({ message: 'Backup failed: ' + error.message });
  }
});

router.get('/backups', (req, res) => {
  try {
    const defaultDir = process.env.BACKUP_PATH || path.join('E:', 'ERP', 'backups');
    const os = require('os');
    const fallbackDir = path.join(os.homedir(), 'Documents', 'ERP_Backups');
    
    let allFiles = [];

    const getFilesFromDir = (dir) => {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
          return files.map(filename => {
            const filePath = path.join(dir, filename);
            const stats = fs.statSync(filePath);
            return {
              filename,
              filePath, // Add filePath so restore knows where to find it
              createdAt: stats.mtime,
              size: stats.size
            };
          });
        } catch (e) {
          console.warn(`Could not read backups from ${dir}`, e);
          return [];
        }
      }
      return [];
    };

    allFiles = [...getFilesFromDir(defaultDir), ...getFilesFromDir(fallbackDir)];
    
    // Sort by modification time descending
    allFiles.sort((a, b) => b.createdAt - a.createdAt);

    // Deduplicate by filename in case same filename exists in both
    const uniqueFiles = [];
    const seen = new Set();
    for (const file of allFiles) {
      if (!seen.has(file.filename)) {
        seen.add(file.filename);
        uniqueFiles.push(file);
      }
    }

    res.status(200).json(uniqueFiles);
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ message: 'Failed to list backups' });
  }
});

router.post('/restore', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ message: 'Filename is required' });
    await restoreDatabase(filename);
    res.status(200).json({ message: 'Database restored successfully' });
  } catch (error) {
    console.error('Restore API error:', error);
    res.status(500).json({ message: 'Restore failed: ' + error.message });
  }
});

router.use(financialYearMiddleware);

router.use('/challans', challanRoutes);
router.use('/statements', statementRoutes);
router.use('/remaining-materials', remainingMaterialRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/store-receipts', storeReceiptRoutes);
router.use('/master-data', masterDataRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/quotations', quotationRoutes);
router.use('/receipts', receiptRoutes);

module.exports = router;
