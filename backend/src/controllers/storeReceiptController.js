const StoreReceipt = require('../models/StoreReceipt');
const DivisionBalance = require('../models/DivisionBalance');

// Create a new CR / Store Receipt and Add to Inventory Balance
exports.createReceipt = async (req, res) => {
  try {
    const { releaseNo, receiptNo, conName, oNo, poNo, divisionName, materials } = req.body;

    // Check if CR already exists
    const existingCR = await StoreReceipt.findOne({ receiptNo, financialYear: req.financialYear });
    if (existingCR) {
      return res.status(400).json({ error: 'Receipt Number already exists' });
    }

    // 1. Create the new Store Receipt
    const newReceipt = new StoreReceipt({
      releaseNo,
      receiptNo,
      conName,
      oNo,
      poNo,
      divisionName,
      materials,
      financialYear: req.financialYear
    });

    await newReceipt.save();

    // 2. Update Division Balance (Add materials to inventory)
    let divisionBalance = await DivisionBalance.findOne({ divisionName, financialYear: req.financialYear });
    
    // If division doesn't exist in balance, create it
    if (!divisionBalance) {
      divisionBalance = new DivisionBalance({
        divisionName,
        materials: [],
        financialYear: req.financialYear
      });
    }

    // Iterate through received materials and add quantities
    materials.forEach(receivedMat => {
      // Find matching material in division balance (using trim for safety)
      const existingMatIndex = divisionBalance.materials.findIndex(
        m => m.name.trim() === receivedMat.name.trim()
      );

      if (existingMatIndex > -1) {
        // Material exists, add quantity
        divisionBalance.materials[existingMatIndex].qty += (receivedMat.qty || 0);
      } else {
        // Material doesn't exist, push new
        divisionBalance.materials.push({
          name: receivedMat.name.trim(),
          qty: receivedMat.qty || 0
        });
      }
    });

    await divisionBalance.save();

    res.status(201).json(newReceipt);
  } catch (error) {
    console.error('Error creating store receipt:', error);
    res.status(500).json({ error: error.message || 'Failed to create store receipt' });
  }
};

// Get all Store Receipts
exports.getReceipts = async (req, res) => {
  try {
    const receipts = await StoreReceipt.find({ financialYear: req.financialYear }).sort({ createdAt: -1 });
    res.status(200).json(receipts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
};

// Get a single Store Receipt
exports.getReceiptById = async (req, res) => {
  try {
    const receipt = await StoreReceipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.status(200).json(receipt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
};

// Delete Store Receipt (and optionally subtract balances back)
exports.deleteReceipt = async (req, res) => {
  try {
    const receipt = await StoreReceipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Subtract from Division Balance
    const divisionBalance = await DivisionBalance.findOne({ divisionName: receipt.divisionName, financialYear: req.financialYear });
    if (divisionBalance) {
      receipt.materials.forEach(receivedMat => {
        const matIndex = divisionBalance.materials.findIndex(m => m.name.trim() === receivedMat.name.trim());
        if (matIndex > -1) {
          divisionBalance.materials[matIndex].qty -= (receivedMat.qty || 0);
        }
      });
      await divisionBalance.save();
    }

    await StoreReceipt.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
};

// Update Store Receipt (including materials)
exports.updateReceipt = async (req, res) => {
  try {
    const { releaseNo, receiptNo, conName, oNo, poNo, divisionName, materials } = req.body;
    
    // Check if receipt number already exists and belongs to another receipt
    if (receiptNo) {
      const existingCR = await StoreReceipt.findOne({ receiptNo, financialYear: req.financialYear });
      if (existingCR && existingCR._id.toString() !== req.params.id) {
        return res.status(400).json({ error: 'Receipt Number already exists' });
      }
    }

    const oldReceipt = await StoreReceipt.findById(req.params.id);
    if (!oldReceipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const oldDiv = oldReceipt.divisionName;
    const newDiv = divisionName || oldDiv;
    const oldMats = oldReceipt.materials || [];
    const newMats = materials !== undefined ? materials : oldMats;

    const updatedReceipt = await StoreReceipt.findByIdAndUpdate(
      req.params.id,
      { releaseNo, receiptNo, conName, oNo, poNo, divisionName, materials: newMats },
      { new: true }
    );

    // Update DivisionBalance logic (Store Receipts ADD to balance)
    if (oldDiv === newDiv) {
      const balance = await DivisionBalance.findOne({ divisionName: newDiv, financialYear: req.financialYear });
      if (balance) {
        newMats.forEach(newMat => {
          const oldMat = oldMats.find(m => m.name.trim() === newMat.name.trim());
          const oldQty = oldMat ? oldMat.qty : 0;
          const deltaQty = (newMat.qty || 0) - oldQty;

          const invMat = balance.materials.find(m => m.name.trim() === newMat.name.trim());
          if (invMat) {
            invMat.qty += deltaQty;
          } else if (deltaQty !== 0) {
            balance.materials.push({ name: newMat.name, qty: deltaQty });
          }
        });
        
        // Handle materials removed completely
        oldMats.forEach(oldMat => {
          const stillExists = newMats.find(m => m.name.trim() === oldMat.name.trim());
          if (!stillExists) {
            const invMat = balance.materials.find(m => m.name.trim() === oldMat.name.trim());
            if (invMat) {
              invMat.qty -= oldMat.qty;
            } else {
              balance.materials.push({ name: oldMat.name, qty: -oldMat.qty });
            }
          }
        });
        await balance.save();
      }
    } else {
      // Return old materials from old division (Deduct them)
      const oldBalance = await DivisionBalance.findOne({ divisionName: oldDiv, financialYear: req.financialYear });
      if (oldBalance) {
        oldMats.forEach(oldMat => {
          const invMat = oldBalance.materials.find(m => m.name.trim() === oldMat.name.trim());
          if (invMat) {
            invMat.qty -= oldMat.qty;
          } else {
            oldBalance.materials.push({ name: oldMat.name, qty: -oldMat.qty });
          }
        });
        await oldBalance.save();
      }

      // Add new materials to new division
      let newBalance = await DivisionBalance.findOne({ divisionName: newDiv, financialYear: req.financialYear });
      if (!newBalance) {
        newBalance = new DivisionBalance({ divisionName: newDiv, materials: [], financialYear: req.financialYear });
      }
      
      newMats.forEach(newMat => {
        const invMat = newBalance.materials.find(m => m.name.trim() === newMat.name.trim());
        if (invMat) {
          invMat.qty += (newMat.qty || 0);
        } else {
          newBalance.materials.push({ name: newMat.name, qty: newMat.qty || 0 });
        }
      });
      await newBalance.save();
    }

    res.status(200).json(updatedReceipt);
  } catch (error) {
    console.error('Error updating store receipt:', error);
    res.status(500).json({ error: 'Failed to update receipt' });
  }
};
