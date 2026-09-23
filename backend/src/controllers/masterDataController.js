const Material = require('../models/Material');
const PrivateMaterial = require('../models/PrivateMaterial');
const RawMaterial = require('../models/RawMaterial');
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

const INITIAL_RAW_MATERIALS = [
  {
    name: "Angle 65 × 65 × 6",
    category: "Angles",
    size: "65 × 65 × 6",
    grade: "IS 2062 E250",
    unit: "KG",
    hsn: "7216",
    gstRate: 18,
    defaultRate: 58,
    description: "Standard structural mild steel angle",
    order: 0
  },
  {
    name: "Angle 50 × 50 × 5",
    category: "Angles",
    size: "50 × 50 × 5",
    grade: "IS 2062 E250",
    unit: "KG",
    hsn: "7216",
    gstRate: 18,
    defaultRate: 58,
    description: "Standard structural mild steel angle",
    order: 1
  },
  {
    name: "Channel 100 × 50",
    category: "Channels",
    size: "100 × 50",
    grade: "IS 2062",
    unit: "KG",
    hsn: "7216",
    gstRate: 18,
    defaultRate: 60,
    description: "Medium weight structural steel channel (ISMC 100)",
    order: 2
  },
  {
    name: "Channel 75 × 40",
    category: "Channels",
    size: "75 × 40",
    grade: "IS 2062",
    unit: "KG",
    hsn: "7216",
    gstRate: 18,
    defaultRate: 60,
    description: "Structural steel channel (ISMC 75)",
    order: 3
  },
  {
    name: "Round Bar 20 mm",
    category: "Round Bars",
    size: "20 mm",
    grade: "IS 2062",
    unit: "KG",
    hsn: "7214",
    gstRate: 18,
    defaultRate: 56,
    description: "Mild steel round bar 20mm dia",
    order: 4
  },
  {
    name: "Round Bar 25 mm",
    category: "Round Bars",
    size: "25 mm",
    grade: "IS 2062",
    unit: "KG",
    hsn: "7214",
    gstRate: 18,
    defaultRate: 56,
    description: "Mild steel round bar 25mm dia",
    order: 5
  },
  {
    name: "Round Bar 32 mm",
    category: "Round Bars",
    size: "32 mm",
    grade: "IS 2062",
    unit: "KG",
    hsn: "7214",
    gstRate: 18,
    defaultRate: 56,
    description: "Mild steel round bar 32mm dia",
    order: 6
  },
  {
    name: "Flat 50 × 6",
    category: "Flats",
    size: "50 × 6",
    grade: "IS 2062",
    unit: "KG",
    hsn: "7216",
    gstRate: 18,
    defaultRate: 57,
    description: "MS Flat bar 50x6 mm",
    order: 7
  }
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

    const rawMatCount = await RawMaterial.countDocuments();
    if (rawMatCount === 0) {
      await RawMaterial.insertMany(INITIAL_RAW_MATERIALS);
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
    const { name, code, description, unit, hsn, gstRate, rate } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Material name is required' });
    const count = await PrivateMaterial.countDocuments();
    const newMaterial = new PrivateMaterial({
      name: name.trim(),
      code: code ? code.trim() : '',
      description: description ? description.trim() : '',
      unit: unit || 'Nos',
      hsn: hsn ? hsn.trim() : '',
      gstRate: Number(gstRate) || 0,
      rate: Number(rate) || 0,
      order: count
    });
    await newMaterial.save();
    res.status(201).json(newMaterial);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Material with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to add private material: ' + error.message });
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
    const { name, code, description, unit, hsn, gstRate, rate, order } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (code !== undefined) updateData.code = code.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (unit !== undefined) updateData.unit = unit;
    if (hsn !== undefined) updateData.hsn = hsn.trim();
    if (gstRate !== undefined) updateData.gstRate = Number(gstRate);
    if (rate !== undefined) updateData.rate = Number(rate);
    if (order !== undefined) updateData.order = Number(order);

    const updated = await PrivateMaterial.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Material not found' });
    res.status(200).json(updated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Material with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update private material: ' + error.message });
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
    const { 
      name, contactPerson, phone, email, address, shippingAddress, 
      gst, pan, state, stateCode, city, district, pincode, notes 
    } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Party Name is required' });
    
    let calculatedPan = pan ? pan.trim().toUpperCase() : '';
    const cleanGst = gst ? gst.trim().toUpperCase() : '';
    if (!calculatedPan && cleanGst.length >= 12) {
      calculatedPan = cleanGst.substring(2, 12);
    }

    const newParty = new PrivateParty({
      name: name.trim(),
      contactPerson: contactPerson ? contactPerson.trim() : '',
      phone: phone ? phone.trim() : '',
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      shippingAddress: shippingAddress ? shippingAddress.trim() : '',
      gst: cleanGst,
      pan: calculatedPan,
      state: state ? state.trim() : (cleanGst.startsWith('24') ? 'Gujarat' : 'Other'),
      stateCode: stateCode ? stateCode.trim() : (cleanGst.length >= 2 ? cleanGst.substring(0, 2) : '24'),
      city: city ? city.trim() : '',
      district: district ? district.trim() : '',
      pincode: pincode ? pincode.trim() : '',
      notes: notes ? notes.trim() : ''
    });
    await newParty.save();
    res.status(201).json(newParty);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Party with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to add private party: ' + error.message });
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
    const { 
      name, contactPerson, phone, email, address, shippingAddress, 
      gst, pan, state, stateCode, city, district, pincode, notes 
    } = req.body;
    
    let calculatedPan = pan ? pan.trim().toUpperCase() : '';
    const cleanGst = gst ? gst.trim().toUpperCase() : '';
    if (!calculatedPan && cleanGst.length >= 12) {
      calculatedPan = cleanGst.substring(2, 12);
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (shippingAddress !== undefined) updateData.shippingAddress = shippingAddress.trim();
    if (gst !== undefined) updateData.gst = cleanGst;
    if (pan !== undefined || calculatedPan) updateData.pan = calculatedPan;
    if (state !== undefined) updateData.state = state.trim();
    if (stateCode !== undefined) updateData.stateCode = stateCode.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (district !== undefined) updateData.district = district.trim();
    if (pincode !== undefined) updateData.pincode = pincode.trim();
    if (notes !== undefined) updateData.notes = notes.trim();

    const updated = await PrivateParty.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Party not found' });
    res.status(200).json(updated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Party with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update private party: ' + error.message });
  }
};

// --- Raw Materials (For Purchase Management & Procurement) ---
exports.getRawMaterials = async (req, res) => {
  try {
    let count = await RawMaterial.countDocuments();
    if (count === 0) {
      await RawMaterial.insertMany(INITIAL_RAW_MATERIALS);
    }

    const { category, search, activeOnly } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (activeOnly === 'true') {
      filter.isActive = true;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { size: { $regex: q, $options: 'i' } },
        { grade: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }

    const materials = await RawMaterial.find(filter).sort({ order: 1, category: 1, name: 1 });
    res.status(200).json(materials);
  } catch (error) {
    console.error('Failed to fetch raw materials:', error);
    res.status(500).json({ error: 'Failed to fetch raw materials' });
  }
};

exports.getRawMaterialById = async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ error: 'Raw material not found' });
    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch raw material' });
  }
};

exports.addRawMaterial = async (req, res) => {
  try {
    const { name, category, size, grade, unit, hsn, gstRate, defaultRate, description, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Raw material name is required' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Category is required (e.g. Angles, Channels, Round Bars)' });
    }

    const count = await RawMaterial.countDocuments();
    const newMaterial = new RawMaterial({
      name: name.trim(),
      category: category.trim(),
      size: size ? size.trim() : '',
      grade: grade ? grade.trim() : 'IS 2062',
      unit: unit ? unit.trim() : 'KG',
      hsn: hsn ? hsn.trim() : '7216',
      gstRate: gstRate !== undefined ? Number(gstRate) : 18,
      defaultRate: defaultRate !== undefined ? Number(defaultRate) : 0,
      description: description ? description.trim() : '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      order: count
    });

    await newMaterial.save();
    res.status(201).json(newMaterial);
  } catch (error) {
    console.error('Failed to add raw material:', error);
    res.status(500).json({ error: 'Failed to add raw material: ' + error.message });
  }
};

exports.updateRawMaterial = async (req, res) => {
  try {
    const { name, category, size, grade, unit, hsn, gstRate, defaultRate, description, isActive, order } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (size !== undefined) updateData.size = size.trim();
    if (grade !== undefined) updateData.grade = grade.trim();
    if (unit !== undefined) updateData.unit = unit.trim();
    if (hsn !== undefined) updateData.hsn = hsn.trim();
    if (gstRate !== undefined) updateData.gstRate = Number(gstRate);
    if (defaultRate !== undefined) updateData.defaultRate = Number(defaultRate);
    if (description !== undefined) updateData.description = description.trim();
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (order !== undefined) updateData.order = Number(order);

    const updated = await RawMaterial.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Raw material not found' });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Failed to update raw material:', error);
    res.status(500).json({ error: 'Failed to update raw material: ' + error.message });
  }
};

exports.deleteRawMaterial = async (req, res) => {
  try {
    const deleted = await RawMaterial.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Raw material not found' });
    res.status(200).json({ message: 'Raw material deleted successfully' });
  } catch (error) {
    console.error('Failed to delete raw material:', error);
    res.status(500).json({ error: 'Failed to delete raw material' });
  }
};
