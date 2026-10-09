import { createApp } from "./app.js";
import { acquireLock } from "./lifecycle.js";
import { resolve } from "node:path";
import { cloudStorage } from "./cloud-storage.js";
try {
  process.loadEnvFile();
} catch {
  /* Environment variables may be provided by hosting. */
}
function mb(name: string, fallback: number) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(name + " debe ser positivo.");
  return Math.round(value * 1024 * 1024);
}
const release = await acquireLock(resolve(process.env.DATA_DIR || "./data"));
const remoteKeys = [
  process.env.DATABASE_URL,
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
];
const remote = remoteKeys.some(Boolean);
if (remote && !remoteKeys.every(Boolean))
  throw new Error(
    "Configurar DATABASE_URL, SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY juntos.",
  );
if (process.env.RENDER && !remote)
  throw new Error(
    "Render requiere persistencia remota; no usar SQLite en disco efímero.",
  );
const runtime = await createApp({
  dataDir: process.env.DATA_DIR || "./data",
  password: process.env.APP_PASSWORD || "",
  production: process.env.NODE_ENV === "production",
  origin:
    process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || undefined,
  trustProxy: Number(process.env.TRUST_PROXY || 0),
  maxFileBytes: remote ? 50_000_000 : mb("MAX_FILE_MB", 200),
  maxStorageBytes: remote ? 900_000_000 : mb("MAX_STORAGE_MB", 1024),
  databaseUrl: process.env.DATABASE_URL,
  databaseCa: process.env.DATABASE_CA,
  objectStorage: remote
    ? cloudStorage(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        process.env.SUPABASE_BUCKET,
      )
    : undefined,
});
const port = Number(process.env.PORT || 3001);
const server = runtime.app.listen(port, "0.0.0.0", () =>
  console.log("Nuestro rincón: servidor listo en puerto " + port),
);
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.on(signal, () =>
    server.close(async () => {
      await runtime.close();
      await release();
      process.exit(0);
    }),
  );
