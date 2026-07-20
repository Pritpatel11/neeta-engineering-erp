const mongoose = require('mongoose');
const DivisionBalance = require('./src/models/DivisionBalance');

const renameMap = {
  '26110000 19 8FT. ANGLE 65*65': '3611000019 9FT. ANGLE 65*65',
  '26030000 07 6 8FT. ANGLE 50*50*6': '2609000076 9FT. ANGLE 50*50*6',
  '26030000 011 4FT ANGLE 65*65*6': '2609000011 4FT ANGLE 65*65*6',
  '26030000 05 2.6FT ANGLE 50*50*6': '2609000005 2.6FT ANGLE 65*65*6',
  '26030000 50 2.6FT ANGLE 50*50*6': '2609000058 2.6FT ANGLE 50*50*6',
  '26010000 69 STAY CLAMP': '2601000069 STAY CLAMP',
  '26140000 02 ANCHOR ROAD': '2614000002 ANCHOR ROAD',
  '2 6FT. Channel 100*50': '2609000086 6FT T-Channel',
  '26030000 034 V-CROSS FITTING': '2609000034 V-CROOS ARM'
};

async function fixBalances() {
  await mongoose.connect('mongodb://127.0.0.1:27017/erp_db');
  const balances = await DivisionBalance.find().lean();
  let updatedCount = 0;
  for (let balance of balances) {
    let changed = false;
    for (let mat of balance.materials) {
      if (renameMap[mat.name]) {
        mat.name = renameMap[mat.name];
        changed = true;
      }
    }
    // merge duplicates if any
    let uniqueMats = {};
    for (let mat of balance.materials) {
        if (!uniqueMats[mat.name]) {
            uniqueMats[mat.name] = { name: mat.name, qty: 0 };
        }
        uniqueMats[mat.name].qty += mat.qty;
    }
    const finalMaterials = Object.values(uniqueMats);
    if (changed || finalMaterials.length !== balance.materials.length) {
      await DivisionBalance.updateOne({ _id: balance._id }, { $set: { materials: finalMaterials } });
      updatedCount++;
    }
  }
  console.log('Updated ' + updatedCount + ' DivisionBalances.');
  process.exit(0);
}

fixBalances().catch(console.error);
