import { createApp } from './app.js';
try { process.loadEnvFile(); } catch { /* Environment variables may be provided by hosting. */ }
function mb(name: string, fallback: number) { const value = Number(process.env[name] || fallback); if (!Number.isFinite(value) || value <= 0) throw new Error(name + ' debe ser positivo.'); return Math.round(value * 1024 * 1024); }
const runtime = await createApp({
  dataDir: process.env.DATA_DIR || './data', password: process.env.APP_PASSWORD || '',
  production: process.env.NODE_ENV === 'production', origin: process.env.APP_ORIGIN || undefined,
  trustProxy: Number(process.env.TRUST_PROXY || 0), maxFileBytes: mb('MAX_FILE_MB', 200), maxStorageBytes: mb('MAX_STORAGE_MB', 1024)
});
const port = Number(process.env.PORT || 3001);
const server = runtime.app.listen(port, '0.0.0.0', () => console.log('Nuestro rincón: servidor listo en puerto ' + port));
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.on(signal, () => server.close(() => { runtime.close(); process.exit(0); }));

