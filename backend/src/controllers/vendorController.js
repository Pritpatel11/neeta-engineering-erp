const Vendor = require('../models/Vendor');

// @desc    Get all vendors with search/filter
// @route   GET /api/vendors
// @access  Private
const getVendors = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: reg },
        { contactPerson: reg },
        { phone: reg },
        { email: reg },
        { gst: reg },
        { city: reg },
      ];
    }

    const vendors = await Vendor.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name username role');

    res.status(200).json(vendors);
  } catch (error) {
    console.error('getVendors error:', error);
    res.status(500).json({ message: 'Failed to fetch vendors: ' + error.message });
  }
};

// @desc    Get single vendor by ID
// @route   GET /api/vendors/:id
// @access  Private
const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vendor: ' + error.message });
  }
};

// @desc    Create new vendor (Purchase Manager / Admin / Owner)
// @route   POST /api/vendors
// @access  Private
const createVendor = async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      phone,
      email,
      address,
      city,
      state,
      stateCode,
      pincode,
      gst,
      pan,
      bankDetails,
      paymentTerms,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Vendor Name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required for sending RFQs' });
    }

    const cleanName = name.trim();
    const existing = await Vendor.findOne({ name: { $regex: new RegExp(`^${cleanName}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: `Vendor "${cleanName}" already exists.` });
    }

    const vendor = await Vendor.create({
      name: cleanName,
      contactPerson: contactPerson ? contactPerson.trim() : '',
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      address: address ? address.trim() : '',
      city: city ? city.trim() : '',
      state: state || 'Gujarat',
      stateCode: stateCode || '24',
      pincode: pincode ? pincode.trim() : '',
      gst: gst ? gst.trim().toUpperCase() : '',
      pan: pan ? pan.trim().toUpperCase() : (gst && gst.length >= 12 ? gst.substring(2, 12).toUpperCase() : ''),
      bankDetails: bankDetails || {},
      paymentTerms: paymentTerms || '30 Days Net',
      status: 'active',
      notes: notes ? notes.trim() : '',
      createdBy: req.user._id,
    });

    res.status(201).json(vendor);
  } catch (error) {
    console.error('createVendor error:', error);
    res.status(500).json({ message: 'Failed to create vendor: ' + error.message });
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private
const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const {
      name,
      contactPerson,
      phone,
      email,
      address,
      city,
      state,
      stateCode,
      pincode,
      gst,
      pan,
      bankDetails,
      paymentTerms,
      status,
      notes,
    } = req.body;

    if (name) vendor.name = name.trim();
    if (contactPerson !== undefined) vendor.contactPerson = contactPerson.trim();
    if (phone) vendor.phone = phone.trim();
    if (email) vendor.email = email.trim().toLowerCase();
    if (address !== undefined) vendor.address = address.trim();
    if (city !== undefined) vendor.city = city.trim();
    if (state !== undefined) vendor.state = state;
    if (stateCode !== undefined) vendor.stateCode = stateCode;
    if (pincode !== undefined) vendor.pincode = pincode.trim();
    if (gst !== undefined) vendor.gst = gst.trim().toUpperCase();
    if (pan !== undefined) vendor.pan = pan.trim().toUpperCase();
    if (bankDetails !== undefined) vendor.bankDetails = bankDetails;
    if (paymentTerms !== undefined) vendor.paymentTerms = paymentTerms;
    if (status !== undefined) vendor.status = status;
    if (notes !== undefined) vendor.notes = notes;

    await vendor.save();
    res.status(200).json(vendor);
  } catch (error) {
    console.error('updateVendor error:', error);
    res.status(500).json({ message: 'Failed to update vendor: ' + error.message });
  }
};

// @desc    Delete / deactivate vendor
// @route   DELETE /api/vendors/:id
// @access  Private
const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    await Vendor.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('deleteVendor error:', error);
    res.status(500).json({ message: 'Failed to delete vendor: ' + error.message });
  }
};

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
};
