import { backupData } from "../server/backup.js";
try {
  process.loadEnvFile();
} catch {
  /* Hosting may provide env directly. */
}
if (process.env.DATABASE_URL)
  throw new Error("El respaldo local no incluye Supabase. Seguí docs/free-hosting.md para respaldar datos remotos.");
const output = await backupData(
  process.env.DATA_DIR || "./data",
  process.env.BACKUP_DIR || "./backups",
);
console.log("Respaldo completo: " + output);
