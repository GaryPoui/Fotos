import { backupData } from '../server/backup.js';
try { process.loadEnvFile(); } catch { /* Hosting may provide env directly. */ }
const output = backupData(process.env.DATA_DIR || './data', process.env.BACKUP_DIR || './backups');
console.log('Respaldo completo: ' + output);

