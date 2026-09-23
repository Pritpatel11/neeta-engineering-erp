const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterDataController');

// Seed
router.post('/seed', masterDataController.seedMasterData);

// Materials
router.get('/materials', masterDataController.getMaterials);
router.post('/materials', masterDataController.addMaterial);
router.put('/materials/:id', masterDataController.updateMaterial);
router.delete('/materials/:id', masterDataController.deleteMaterial);

// Private Materials
router.get('/private-materials', masterDataController.getPrivateMaterials);
router.post('/private-materials', masterDataController.addPrivateMaterial);
router.put('/private-materials/:id', masterDataController.updatePrivateMaterial);
router.delete('/private-materials/:id', masterDataController.deletePrivateMaterial);

// Divisions
router.get('/divisions', masterDataController.getDivisions);
router.post('/divisions', masterDataController.addDivision);
router.put('/divisions/:id', masterDataController.updateDivision);
router.delete('/divisions/:id', masterDataController.deleteDivision);

// Contractors
router.get('/contractors', masterDataController.getContractors);
router.post('/contractors', masterDataController.addContractor);
router.put('/contractors/:id', masterDataController.updateContractor);
router.delete('/contractors/:id', masterDataController.deleteContractor);

// Invoice Divisions
router.get('/invoice-divisions', masterDataController.getInvoiceDivisions);
router.post('/invoice-divisions', masterDataController.addInvoiceDivision);
router.put('/invoice-divisions/:id', masterDataController.updateInvoiceDivision);
router.delete('/invoice-divisions/:id', masterDataController.deleteInvoiceDivision);

// Receipt Parties
router.get('/receipt-parties', masterDataController.getReceiptParties);
router.post('/receipt-parties', masterDataController.addReceiptParty);
router.put('/receipt-parties/:id', masterDataController.updateReceiptParty);
router.delete('/receipt-parties/:id', masterDataController.deleteReceiptParty);

// Financial Years
router.get('/financial-years', masterDataController.getFinancialYears);
router.post('/financial-years', masterDataController.addFinancialYear);
router.put('/financial-years/:id', masterDataController.updateFinancialYear);
router.delete('/financial-years/:id', masterDataController.deleteFinancialYear);

// Private Parties
router.get('/private-parties', masterDataController.getPrivateParties);
router.post('/private-parties', masterDataController.addPrivateParty);
router.put('/private-parties/:id', masterDataController.updatePrivateParty);
router.delete('/private-parties/:id', masterDataController.deletePrivateParty);

// Raw Materials (For Purchase Management & Procurement)
router.get('/raw-materials', masterDataController.getRawMaterials);
router.get('/raw-materials/:id', masterDataController.getRawMaterialById);
router.post('/raw-materials', masterDataController.addRawMaterial);
router.put('/raw-materials/:id', masterDataController.updateRawMaterial);
router.delete('/raw-materials/:id', masterDataController.deleteRawMaterial);

module.exports = router;
