const fs = require('fs');
const path = require('path');

const restoreDatabase = async (filename) => {
    const defaultDir = process.env.BACKUP_PATH || path.join('E:', 'ERP', 'backups');
    const os = require('os');
    const fallbackDir = path.join(os.homedir(), 'Documents', 'ERP_Backups');

    let backupFilePath = path.join(defaultDir, filename);

    if (!fs.existsSync(backupFilePath)) {
        backupFilePath = path.join(fallbackDir, filename);
        if (!fs.existsSync(backupFilePath)) {
            throw new Error(`Backup file not found at default or fallback path for: ${filename}`);
        }
    }

    console.log(`Reading backup file: ${backupFilePath}`);
    const backupDataRaw = fs.readFileSync(backupFilePath, 'utf-8');
    const backupData = JSON.parse(backupDataRaw);

    const modelsPath = path.join(__dirname, '../models');
    const files = fs.readdirSync(modelsPath);

    // Map model names to actual Mongoose models
    const modelsMap = {};
    for (const file of files) {
        if (file.endsWith('.js')) {
            const model = require(path.join(modelsPath, file));
            if (model.modelName) {
                modelsMap[model.modelName] = model;
            }
        }
    }

    console.log('--- WARNING: This will overwrite current database data ---');
    console.log('Starting data restoration...');

    for (const [modelName, documents] of Object.entries(backupData)) {
        const Model = modelsMap[modelName];
        
        if (!Model) {
            console.warn(`Warning: Model "${modelName}" found in backup but not in current system. Skipping.`);
            continue;
        }

        if (documents && documents.length > 0) {
            console.log(`Restoring ${documents.length} records to collection: ${modelName}...`);
            
            // Clear existing data in collection before restoring
            await Model.deleteMany({});
            
            // Insert backup data
            await Model.insertMany(documents);
            console.log(`✓ ${modelName} restored.`);
        } else {
            console.log(`Skipped ${modelName} (No data in backup).`);
            // We should still clear it if backup has no data, so it matches exactly
            if (Model) {
                await Model.deleteMany({});
            }
        }
    }

    console.log('\n=============================================');
    console.log('🎉 RESTORE COMPLETED SUCCESSFULLY!');
    console.log('=============================================');
    
    return true;
};

module.exports = restoreDatabase;
