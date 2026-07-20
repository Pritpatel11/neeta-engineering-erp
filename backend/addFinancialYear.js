const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');
const modelsToUpdate = [
  'Challan.js', 'Statement.js', 'RemainingMaterial.js', 
  'StoreReceipt.js', 'Receipt.js', 'Quotation.js', 
  'Enquiry.js', 'DivisionBalance.js'
];

modelsToUpdate.forEach(file => {
  const filePath = path.join(modelsDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Add financialYear field to schema definition
  // Find the last property before `}, { timestamps: true });`
  if (!content.includes('financialYear: { type: String')) {
    content = content.replace(/}(,\s*\{\s*timestamps:\s*true\s*\}\s*\);)/, 
      `  financialYear: { type: String, required: true, default: '2025-26' }\n}$1`);
  }

  // 2. Find unique constraints and remove them from fields
  const uniqueFields = [];
  const regex = /(\w+):\s*\{[^}]*unique:\s*true[^}]*\}/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    uniqueFields.push(match[1]);
  }
  
  // Remove unique: true from field definitions
  content = content.replace(/unique:\s*true,?\s*/g, '');
  
  // 3. Add compound index
  // E.g., challanSchema.index({ challanNo: 1, financialYear: 1 }, { unique: true });
  if (uniqueFields.length > 0) {
    const schemaNameMatch = content.match(/const\s+(\w+Schema)\s*=\s*new\s+mongoose\.Schema/);
    if (schemaNameMatch) {
      const schemaName = schemaNameMatch[1];
      uniqueFields.forEach(field => {
        const indexStr = `${schemaName}.index({ ${field}: 1, financialYear: 1 }, { unique: true });`;
        if (!content.includes(indexStr)) {
          // Add it right before module.exports
          content = content.replace(/module\.exports/, `${indexStr}\n\nmodule.exports`);
        }
      });
    }
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
