const RemainingMaterial = require('../models/RemainingMaterial');

exports.createRemainingMaterial = async (req, res) => {
  try {
    const record = new RemainingMaterial(req.body);
    const savedRecord = await record.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getRemainingMaterials = async (req, res) => {
  try {
    const records = await RemainingMaterial.find({ financialYear: req.financialYear }).sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteRemainingMaterial = async (req, res) => {
  try {
    const deletedRecord = await RemainingMaterial.findByIdAndDelete(req.params.id);
    if (!deletedRecord) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRemainingMaterial = async (req, res) => {
  try {
    const updatedRecord = await RemainingMaterial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRecord) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.status(200).json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
