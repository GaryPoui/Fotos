import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/app.js';
const dir = mkdtempSync(join(tmpdir(), 'rincon-e2e-'));
const runtime = await createApp({ dataDir: dir, password: 'browser-test-password-2026' });
const server = runtime.app.listen(4173, '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.close(() => { runtime.close(); rmSync(dir, { recursive: true, force: true }); process.exit(0); }));
