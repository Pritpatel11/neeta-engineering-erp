const DivisionBalance = require('../models/DivisionBalance');

exports.getAllBalances = async (req, res) => {
  try {
    const balances = await DivisionBalance.find({ financialYear: req.financialYear }).sort({ divisionName: 1 });
    res.status(200).json(balances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDivisionBalance = async (req, res) => {
  try {
    const balance = await DivisionBalance.findOne({ divisionName: req.params.divisionName, financialYear: req.financialYear });
    if (!balance) {
      return res.status(404).json({ message: 'Division balance not found' });
    }
    res.status(200).json(balance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateDivisionBalance = async (req, res) => {
  try {
    const { divisionName, materials } = req.body;

    let balance = await DivisionBalance.findOne({ divisionName, financialYear: req.financialYear });
    if (!balance) {
      balance = new DivisionBalance({ divisionName, materials: [], financialYear: req.financialYear });
    }

    // Merge materials: update existing, add new
    materials.forEach(newMat => {
      const existingMat = balance.materials.find(m => m.name === newMat.name);
      if (existingMat) {
        if (newMat.qty !== undefined) existingMat.qty = newMat.qty;
        if (newMat.manualAdjustment !== undefined) existingMat.manualAdjustment = newMat.manualAdjustment;
      } else {
        balance.materials.push({ 
          name: newMat.name, 
          qty: newMat.qty || 0,
          manualAdjustment: newMat.manualAdjustment || 0
        });
      }
    });

    const savedBalance = await balance.save();
    res.status(200).json(savedBalance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
