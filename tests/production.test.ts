import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../server/app.js';
describe('Production configuration', () => {
  it('fails closed when a secure password or HTTPS origin is missing', async () => {
    await expect(createApp({ dataDir: './unused', password: '', production: true })).rejects.toThrow('APP_PASSWORD');
    await expect(createApp({ dataDir: './unused', password: 'a-strong-private-password', production: true })).rejects.toThrow('APP_ORIGIN');
    await expect(createApp({ dataDir: './unused', password: 'a-strong-private-password', production: true, origin: 'http://example.com' })).rejects.toThrow('APP_ORIGIN');
  });
  it('uses Secure cookies and trusts only the configured origin', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rincon-production-'));
    const runtime = await createApp({ dataDir: dir, password: 'a-strong-private-password', production: true, origin: 'https://rincon.example', trustProxy: 1 });
    try {
      await request(runtime.app).post('/api/login').set('X-Requested-With', 'NuestroRincon').set('Origin', 'https://other.example').send({ password: 'a-strong-private-password' }).expect(403);
      const result = await request(runtime.app).post('/api/login').set('X-Requested-With', 'NuestroRincon').set('Origin', 'https://rincon.example').send({ password: 'a-strong-private-password' }).expect(200);
      expect(result.headers['set-cookie'][0]).toContain('Secure');
      expect(result.headers['set-cookie'][0]).toContain('SameSite=Strict');
      await request(runtime.app).get('/api/health').expect(200);
      await request(runtime.app).get('/api/library').expect(401);
      const cookie = result.headers['set-cookie'][0].split(';')[0];
      await request(runtime.app).get('/api/library').set('Cookie', cookie).expect(200);
    } finally { runtime.close(); rmSync(dir, { recursive: true, force: true }); }
  });
});
