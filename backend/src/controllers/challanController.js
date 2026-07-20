const Challan = require('../models/Challan');
const Statement = require('../models/Statement');
const DivisionBalance = require('../models/DivisionBalance');

exports.createChallan = async (req, res) => {
  try {
    const challan = new Challan(req.body);
    const savedChallan = await challan.save();
    res.status(201).json(savedChallan);
  } catch (error) {
    console.error('Error creating challan:', error.message, req.body);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Challan Number already exists. Please use a different number.' });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.getChallans = async (req, res) => {
  try {
    const challans = await Challan.find({ financialYear: req.financialYear }).sort({ createdAt: -1 });
    res.status(200).json(challans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteChallan = async (req, res) => {
  try {
    const deletedChallan = await Challan.findByIdAndDelete(req.params.id);
    if (!deletedChallan) {
      return res.status(404).json({ message: 'Challan not found' });
    }
    res.status(200).json({ message: 'Challan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateChallan = async (req, res) => {
  try {
    const oldChallan = await Challan.findById(req.params.id);
    if (!oldChallan) {
      return res.status(404).json({ message: 'Challan not found' });
    }

    const oldMaterials = oldChallan.materials || [];
    const newMaterials = req.body.materials !== undefined ? req.body.materials : oldMaterials;

    const updatedChallan = await Challan.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Check if this Challan is part of any Statement
    const statement = await Statement.findOne({ 
      mrNumbers: updatedChallan.challanNo, 
      financialYear: req.financialYear || updatedChallan.financialYear 
    });

    if (statement) {
      // Calculate deltas: newQty - oldQty
      // Positive delta means Challan has MORE qty (so inventory must DECREASE further)
      // Negative delta means Challan has LESS qty (so inventory must INCREASE)
      let deltas = {};

      newMaterials.forEach(newMat => {
        const oldMat = oldMaterials.find(m => m.name === newMat.name);
        const oldQty = oldMat ? oldMat.qty : 0;
        deltas[newMat.name] = newMat.qty - oldQty;
      });

      oldMaterials.forEach(oldMat => {
        if (!newMaterials.find(m => m.name === oldMat.name)) {
          deltas[oldMat.name] = -oldMat.qty;
        }
      });

      // Update Statement
      let statementChanged = false;
      Object.keys(deltas).forEach(matName => {
        const delta = deltas[matName];
        if (delta === 0) return;

        let stmtMat = statement.materials.find(m => m.name === matName);
        if (stmtMat) {
          // It exists in statement
          const currentChallanQty = stmtMat.mrQuantities?.get(updatedChallan.challanNo) || 0;
          const newChallanQty = currentChallanQty + delta;
          
          if (!stmtMat.mrQuantities) {
            stmtMat.mrQuantities = new Map();
          }
          
          if (newChallanQty > 0) {
            stmtMat.mrQuantities.set(updatedChallan.challanNo, newChallanQty);
          } else {
            stmtMat.mrQuantities.delete(updatedChallan.challanNo);
          }
          
          stmtMat.qty += delta;
          statementChanged = true;
        } else if (delta > 0) {
          // Material doesn't exist in statement, add it
          const newChallanMat = newMaterials.find(m => m.name === matName);
          const mrQuantities = new Map();
          mrQuantities.set(updatedChallan.challanNo, delta);
          
          statement.materials.push({
            name: matName,
            unit: newChallanMat.unit,
            qty: delta,
            mrQuantities: mrQuantities
          });
          statementChanged = true;
        }
      });

      if (statementChanged) {
        // Remove materials with qty <= 0
        statement.materials = statement.materials.filter(m => m.qty > 0);
        await statement.save();

        // Update DivisionBalance
        const division = updatedChallan.divisionName;
        const balance = await DivisionBalance.findOne({ 
          divisionName: division, 
          financialYear: req.financialYear || updatedChallan.financialYear 
        });

        if (balance) {
          Object.keys(deltas).forEach(matName => {
            const delta = deltas[matName];
            if (delta === 0) return;

            const invMat = balance.materials.find(m => m.name === matName);
            if (invMat) {
              invMat.qty -= delta; // Statement deducts inventory, so positive delta -> less inventory
            } else if (delta !== 0) {
              balance.materials.push({ name: matName, qty: -delta });
            }
          });
          await balance.save();
        } else {
          // If no balance exists, create one with negative balances
          const newBalanceMaterials = [];
          Object.keys(deltas).forEach(matName => {
            if (deltas[matName] !== 0) {
              newBalanceMaterials.push({ name: matName, qty: -deltas[matName] });
            }
          });
          if (newBalanceMaterials.length > 0) {
            const newBalance = new DivisionBalance({
              divisionName: division,
              financialYear: req.financialYear || updatedChallan.financialYear,
              materials: newBalanceMaterials
            });
            await newBalance.save();
          }
        }
      }
    }

    res.status(200).json(updatedChallan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
