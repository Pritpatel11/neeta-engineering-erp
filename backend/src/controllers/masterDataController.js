const Material = require('../models/Material');
const PrivateMaterial = require('../models/PrivateMaterial');
const Division = require('../models/Division');
const Contractor = require('../models/Contractor');
const InvoiceDivision = require('../models/InvoiceDivision');
const ReceiptParty = require('../models/ReceiptParty');
const FinancialYear = require('../models/FinancialYear');
const PrivateParty = require('../models/PrivateParty');

const INITIAL_FINANCIAL_YEARS = ["2025-26", "2026-27"];

const INITIAL_MATERIALS = [
  "3611000019 9FT. ANGLE 65*65*6",
  "2609000076 9FT. ANGLE 50*50*5",
  "2609000011 4FT ANGLE 65*65*6",
  "2609000005 2.6FT ANGLE 65*65*6",
  "2609000058 2.6FT ANGLE 50*50*5",
  "2609000080 DO ANGLE",
  "2601000049 SIDE CLAMP",
  "2601000069 STAY CLAMP",
  "2601000040 U-CLAMP",
  "2609000034 V-CROOS ARM",
  "2601000084 TOP FITTING",
  "2614000002 ANCHOR ROAD",
  "2614000009 TURN BUCKLE",
  "2614000012 EYE BOLT",
  "0901000024 Earthing Coil",
  "2613000002 Three Hol Patti",
  "2609000086 6FT T-Channel"
];

const INITIAL_DIVISIONS = ["Deesa", "Mehsana", "Palanpur", "Patan", "Radhanpur"];

const INITIAL_PRIVATE_MATERIALS = [
  "9FT. ANGLE 65*65*6",
  "9FT. ANGLE 50*50*5",
  "4FT ANGLE 65*65*6",
  "2.6FT ANGLE 65*65*6",
  "2.6FT ANGLE 50*50*5",
  "DO ANGLE",
  "SIDE CLAMP",
  "STAY CLAMP",
  "U-CLAMP",
  "V-CROOS ARM",
  "TOP FITTING",
  "ANCHOR ROAD",
  "TURN BUCKLE",
  "EYE BOLT",
  "Earthing Coil",
  "Three Hol Patti",
  "6FT T-Channel"
];

const INITIAL_INVOICE_DIVISIONS = ["Deesa-1", "Deesa-2", "Sidhpur", "Radhanpur", "Palanpur", "Palanpur-2"];

const INITIAL_RECEIPT_PARTIES = [
  "The Ex Eng.O&M Division-1 UGVCL Palanpur",
  "The Ex Eng.O&M Division-2 UGVCL Palanpur",
  "The Ex Eng.O&M Division-2 UGVCL Deesa",
  "The Ex Eng.O&M Division-1 UGVCL Deesa",
  "The Ex Eng.O&M Division UGVCL Radhanpur",
  "The Ex Eng.O&M Division UGVCL Sidhpur"
];

// Setup / Seed Initial Data
exports.seedMasterData = async (req, res) => {
  try {
    const matCount = await Material.countDocuments();
    if (matCount === 0) {
      const materialDocs = INITIAL_MATERIALS.map((name, index) => ({ name, order: index }));
      await Material.insertMany(materialDocs);
    }

    const divCount = await Division.countDocuments();
    if (divCount === 0) {
      const divisionDocs = INITIAL_DIVISIONS.map(name => ({ name }));
      await Division.insertMany(divisionDocs);
    }

    const privateMatCount = await PrivateMaterial.countDocuments();
    if (privateMatCount === 0) {
      const privateMatDocs = INITIAL_PRIVATE_MATERIALS.map((name, index) => ({ name, order: index }));
      await PrivateMaterial.insertMany(privateMatDocs);
    }

    const invDivCount = await InvoiceDivision.countDocuments();
    if (invDivCount === 0) {
      const invDivDocs = INITIAL_INVOICE_DIVISIONS.map(name => ({ name }));
      await InvoiceDivision.insertMany(invDivDocs);
    }

    const rpCount = await ReceiptParty.countDocuments();
    if (rpCount === 0) {
      const rpDocs = INITIAL_RECEIPT_PARTIES.map(name => ({ name }));
      await ReceiptParty.insertMany(rpDocs);
    }

    const fyCount = await FinancialYear.countDocuments();
    if (fyCount === 0) {
      const fyDocs = INITIAL_FINANCIAL_YEARS.map(year => ({ year }));
      await FinancialYear.insertMany(fyDocs);
    }

    res.status(200).json({ message: 'Master data seeded successfully' });
  } catch (error) {
    console.error('Error seeding master data:', error);
    res.status(500).json({ error: 'Failed to seed master data' });
  }
};

// --- Materials ---
exports.getMaterials = async (req, res) => {
  try {
    const materials = await Material.find().sort({ order: 1 });
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
};

exports.addMaterial = async (req, res) => {
  try {
    const { name } = req.body;
    const count = await Material.countDocuments();
    const newMaterial = new Material({ name, order: count });
    await newMaterial.save();
    res.status(201).json(newMaterial);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add material' });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    await Material.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete material' });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const { name } = req.body;
    const updated = await Material.findByIdAndUpdate(req.params.id, { name }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update material' });
  }
};

// --- Private Materials ---
exports.getPrivateMaterials = async (req, res) => {
  try {
    const materials = await PrivateMaterial.find().sort({ order: 1 });
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch private materials' });
  }
};

exports.addPrivateMaterial = async (req, res) => {
  try {
    const { name } = req.body;
    const count = await PrivateMaterial.countDocuments();
    const newMaterial = new PrivateMaterial({ name, order: count });
    await newMaterial.save();
    res.status(201).json(newMaterial);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add private material' });
  }
};

exports.deletePrivateMaterial = async (req, res) => {
  try {
    await PrivateMaterial.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Private Material deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete private material' });
  }
};

exports.updatePrivateMaterial = async (req, res) => {
  try {
    const { name } = req.body;
    const updated = await PrivateMaterial.findByIdAndUpdate(req.params.id, { name }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update private material' });
  }
};

// --- Divisions ---
exports.getDivisions = async (req, res) => {
  try {
    const divisions = await Division.find().sort({ name: 1 });
    res.status(200).json(divisions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch divisions' });
  }
};

exports.addDivision = async (req, res) => {
  try {
    const { name } = req.body;
    const newDivision = new Division({ name });
    await newDivision.save();
    res.status(201).json(newDivision);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add division' });
  }
};

exports.deleteDivision = async (req, res) => {
  try {
    await Division.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Division deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete division' });
  }
};

exports.updateDivision = async (req, res) => {
  try {
    const { name } = req.body;
    const updated = await Division.findByIdAndUpdate(req.params.id, { name }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update division' });
  }
};

// --- Contractors ---
exports.getContractors = async (req, res) => {
  try {
    const contractors = await Contractor.find().sort({ name: 1 });
    res.status(200).json(contractors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contractors' });
  }
};

exports.addContractor = async (req, res) => {
  try {
    const { name } = req.body;
    const newContractor = new Contractor({ name });
    await newContractor.save();
    res.status(201).json(newContractor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add contractor' });
  }
};

exports.deleteContractor = async (req, res) => {
  try {
    await Contractor.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Contractor deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contractor' });
  }
};

exports.updateContractor = async (req, res) => {
  try {
    const { name } = req.body;
    const updated = await Contractor.findByIdAndUpdate(req.params.id, { name }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contractor' });
  }
};

// --- Invoice Divisions ---
exports.getInvoiceDivisions = async (req, res) => {
  try {
    const divisions = await InvoiceDivision.find().sort({ name: 1 });
    res.status(200).json(divisions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice divisions' });
  }
};

exports.addInvoiceDivision = async (req, res) => {
  try {
    const { name } = req.body;
    const newDivision = new InvoiceDivision({ name });
    await newDivision.save();
    res.status(201).json(newDivision);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add invoice division' });
  }
};

exports.deleteInvoiceDivision = async (req, res) => {
  try {
    await InvoiceDivision.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Invoice Division deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice division' });
  }
};

exports.updateInvoiceDivision = async (req, res) => {
  try {
    const { name } = req.body;
    const updated = await InvoiceDivision.findByIdAndUpdate(req.params.id, { name }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice division' });
  }
};

// --- Receipt Parties ---
exports.getReceiptParties = async (req, res) => {
  try {
    const parties = await ReceiptParty.find().sort({ name: 1 });
    res.status(200).json(parties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch receipt parties' });
  }
};

exports.addReceiptParty = async (req, res) => {
  try {
    const { name } = req.body;
    const newParty = new ReceiptParty({ name });
    await newParty.save();
    res.status(201).json(newParty);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add receipt party' });
  }
};

exports.deleteReceiptParty = async (req, res) => {
  try {
    await ReceiptParty.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Receipt Party deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete receipt party' });
  }
};

exports.updateReceiptParty = async (req, res) => {
  try {
    const { name } = req.body;
    const updated = await ReceiptParty.findByIdAndUpdate(req.params.id, { name }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update receipt party' });
  }
};


// --- Financial Years ---
exports.getFinancialYears = async (req, res) => {
  try {
    const years = await FinancialYear.find().sort({ year: 1 });
    res.status(200).json(years);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch financial years' });
  }
};

exports.addFinancialYear = async (req, res) => {
  try {
    const { year } = req.body;
    const newYear = new FinancialYear({ year });
    await newYear.save();
    res.status(201).json(newYear);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add financial year' });
  }
};

exports.deleteFinancialYear = async (req, res) => {
  try {
    await FinancialYear.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Financial Year deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete financial year' });
  }
};

exports.updateFinancialYear = async (req, res) => {
  try {
    const { year } = req.body;
    const updated = await FinancialYear.findByIdAndUpdate(req.params.id, { year }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update financial year' });
  }
};

// --- Private Parties ---
exports.getPrivateParties = async (req, res) => {
  try {
    const parties = await PrivateParty.find().sort({ name: 1 });
    res.status(200).json(parties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch private parties' });
  }
};

exports.addPrivateParty = async (req, res) => {
  try {
    const { name, phone, email, address, gst } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const newParty = new PrivateParty({ name, phone, email, address, gst });
    await newParty.save();
    res.status(201).json(newParty);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add private party' });
  }
};

exports.deletePrivateParty = async (req, res) => {
  try {
    await PrivateParty.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Private Party deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete private party' });
  }
};

exports.updatePrivateParty = async (req, res) => {
  try {
    const { name, phone, email, address, gst } = req.body;
    const updated = await PrivateParty.findByIdAndUpdate(req.params.id, { name, phone, email, address, gst }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update private party' });
  }
};
