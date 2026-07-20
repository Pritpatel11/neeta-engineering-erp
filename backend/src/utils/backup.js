const fs = require('fs');
const path = require('path');

const backupDatabase = async () => {
    try {
        let backupDir = process.env.BACKUP_PATH || path.join('E:', 'ERP', 'backups');
        
        try {
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
        } catch (dirError) {
            console.warn(`Failed to create backup directory at ${backupDir}. Falling back to Documents folder.`, dirError);
            const os = require('os');
            backupDir = path.join(os.homedir(), 'Documents', 'ERP_Backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
        }

        // Format: erp_backup_2026-06-11_12-30-45.json (add time to prevent overwrites on same day)
        const dateStr = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const backupPath = path.join(backupDir, `erp_backup_${dateStr}.json`);

        const modelsPath = path.join(__dirname, '../models');
        const files = fs.readdirSync(modelsPath);
        
        const backupData = {};

        for (const file of files) {
            if (file.endsWith('.js')) {
                const model = require(path.join(modelsPath, file));
                const modelName = model.modelName;
                if (modelName) {
                    const data = await model.find({});
                    backupData[modelName] = data;
                }
            }
        }

        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        console.log(`Database backup completed successfully at ${backupPath}`);
        return backupPath;
        
    } catch (error) {
        console.error('Database backup failed:', error);
        throw error;
    }
};

module.exports = backupDatabase;
