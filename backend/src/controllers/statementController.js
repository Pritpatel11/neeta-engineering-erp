const Statement = require('../models/Statement');
const DivisionBalance = require('../models/DivisionBalance');

exports.createStatement = async (req, res) => {
  try {
    // Pre-check inventory
    let insufficientItems = [];
    if (req.body.divisionName && req.body.materials && req.body.materials.length > 0) {
      const balance = await DivisionBalance.findOne({ divisionName: req.body.divisionName, financialYear: req.financialYear });
      
      if (balance) {
        req.body.materials.forEach(stmtMat => {
          const invMat = balance.materials.find(m => m.name === stmtMat.name);
          const currentQty = invMat ? invMat.qty : 0;
          if (currentQty - stmtMat.qty < 0) {
            insufficientItems.push(`${stmtMat.name} (Balance: ${currentQty - stmtMat.qty})`);
          }
        });
      } else {
        // No balance exists for this division, so any qty > 0 is insufficient
        req.body.materials.forEach(stmtMat => {
          if (stmtMat.qty > 0) {
            insufficientItems.push(`${stmtMat.name} (Balance: -${stmtMat.qty})`);
          }
        });
      }
    }

    const statement = new Statement(req.body);
    const savedStatement = await statement.save();

    // Deduct inventory
    if (savedStatement.divisionName && savedStatement.materials && savedStatement.materials.length > 0) {
      const balance = await DivisionBalance.findOne({ divisionName: savedStatement.divisionName, financialYear: req.financialYear });
      if (balance) {
        savedStatement.materials.forEach(stmtMat => {
          const invMat = balance.materials.find(m => m.name === stmtMat.name);
          if (invMat) {
            invMat.qty -= stmtMat.qty;
          } else {
             balance.materials.push({ name: stmtMat.name, qty: -stmtMat.qty });
          }
        });
        await balance.save();
      } else {
        // Create new balance profile tracking overdraft
        const newBalanceMaterials = savedStatement.materials.map(m => ({ name: m.name, qty: -m.qty }));
        const newBalance = new DivisionBalance({ divisionName: savedStatement.divisionName, materials: newBalanceMaterials, financialYear: req.financialYear });
        await newBalance.save();
      }
    }

    const responseObj = savedStatement.toJSON();
    if (insufficientItems.length > 0) {
      responseObj.warning = 'Statement Generated, but inventory went NEGATIVE for:\n' + insufficientItems.join('\n');
    }
    
    res.status(201).json(responseObj);
  } catch (error) {
    console.error('Error creating statement:', error.message, req.body);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Statement Number already exists. Please use a different number.' });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.getStatements = async (req, res) => {
  try {
    const statements = await Statement.find({ financialYear: req.financialYear }).sort({ createdAt: -1 });
    res.status(200).json(statements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStatement = async (req, res) => {
  try {
    const deletedStatement = await Statement.findByIdAndDelete(req.params.id);
    if (!deletedStatement) {
      return res.status(404).json({ message: 'Statement not found' });
    }

    // Return materials to inventory
    if (deletedStatement.divisionName && deletedStatement.materials) {
      const balance = await DivisionBalance.findOne({ divisionName: deletedStatement.divisionName, financialYear: req.financialYear });
      if (balance) {
        deletedStatement.materials.forEach(oldMat => {
          const invMat = balance.materials.find(m => m.name === oldMat.name);
          if (invMat) {
            invMat.qty += oldMat.qty;
          } else {
            balance.materials.push({ name: oldMat.name, qty: oldMat.qty });
          }
        });
        await balance.save();
      }
    }

    res.status(200).json({ message: 'Statement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStatement = async (req, res) => {
  try {
    const oldStatement = await Statement.findById(req.params.id);
    if (!oldStatement) {
      return res.status(404).json({ message: 'Statement not found' });
    }

    const oldDiv = oldStatement.divisionName;
    const newDiv = req.body.divisionName || oldDiv;
    const oldMats = oldStatement.materials || [];
    const newMats = req.body.materials !== undefined ? req.body.materials : oldMats;

    let insufficientItems = [];

    // Pre-check inventory
    if (oldDiv === newDiv) {
      const balance = await DivisionBalance.findOne({ divisionName: newDiv, financialYear: req.financialYear });
      newMats.forEach(newMat => {
        const oldMat = oldMats.find(m => m.name === newMat.name);
        const oldQty = oldMat ? oldMat.qty : 0;
        const deltaQty = newMat.qty - oldQty;

        if (deltaQty > 0) {
          const invMat = balance ? balance.materials.find(m => m.name === newMat.name) : null;
          const currentQty = invMat ? invMat.qty : 0;
          if (currentQty - deltaQty < 0) {
            insufficientItems.push(`${newMat.name} (Available: ${currentQty}, Need extra: ${deltaQty})`);
          }
        }
      });
    } else {
      // Division changed. Check if new division has enough balance
      const newBalance = await DivisionBalance.findOne({ divisionName: newDiv, financialYear: req.financialYear });
      newMats.forEach(newMat => {
        if (newMat.qty > 0) {
          const invMat = newBalance ? newBalance.materials.find(m => m.name === newMat.name) : null;
          const currentQty = invMat ? invMat.qty : 0;
          if (currentQty - newMat.qty < 0) {
            insufficientItems.push(`${newMat.name} (Available: ${currentQty}, Requested: ${newMat.qty})`);
          }
        }
      });
    }

    const updatedStatement = await Statement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    const responseObj = updatedStatement.toJSON();
    if (insufficientItems.length > 0) {
      responseObj.warning = 'Statement Updated, but inventory went NEGATIVE for:\n' + insufficientItems.join('\n');
    }

    if (oldDiv === newDiv) {
      const balance = await DivisionBalance.findOne({ divisionName: newDiv, financialYear: req.financialYear });
      if (balance) {
        newMats.forEach(newMat => {
          const oldMat = oldMats.find(m => m.name === newMat.name);
          const oldQty = oldMat ? oldMat.qty : 0;
          const deltaQty = newMat.qty - oldQty;

          const invMat = balance.materials.find(m => m.name === newMat.name);
          if (invMat) {
            invMat.qty -= deltaQty;
          } else if (deltaQty !== 0) {
            balance.materials.push({ name: newMat.name, qty: -deltaQty });
          }
        });
        
        // Handle materials removed completely
        oldMats.forEach(oldMat => {
          const stillExists = newMats.find(m => m.name === oldMat.name);
          if (!stillExists) {
            const invMat = balance.materials.find(m => m.name === oldMat.name);
            if (invMat) {
              invMat.qty += oldMat.qty;
            } else {
              balance.materials.push({ name: oldMat.name, qty: oldMat.qty });
            }
          }
        });
        await balance.save();
      }
    } else {
      // Return old materials to old division
      const oldBalance = await DivisionBalance.findOne({ divisionName: oldDiv, financialYear: req.financialYear });
      if (oldBalance) {
        oldMats.forEach(oldMat => {
          const invMat = oldBalance.materials.find(m => m.name === oldMat.name);
          if (invMat) {
            invMat.qty += oldMat.qty;
          } else {
            oldBalance.materials.push({ name: oldMat.name, qty: oldMat.qty });
          }
        });
        await oldBalance.save();
      }

      // Deduct new materials from new division
      const newBalance = await DivisionBalance.findOne({ divisionName: newDiv, financialYear: req.financialYear });
      if (newBalance) {
        newMats.forEach(newMat => {
          const invMat = newBalance.materials.find(m => m.name === newMat.name);
          if (invMat) {
            invMat.qty -= newMat.qty;
          } else {
            newBalance.materials.push({ name: newMat.name, qty: -newMat.qty });
          }
        });
        await newBalance.save();
      }
    }
    res.status(200).json(responseObj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
