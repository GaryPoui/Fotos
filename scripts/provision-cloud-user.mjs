// Run only for the authorized fotosconailu project; no admin credentials are embedded.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { execFileSync } from 'node:child_process';
try { process.loadEnvFile(); } catch { /* env may be injected */ }
const password = process.env.APP_PASSWORD;
if (!password || password.length < 12 || password.length > 256) throw new Error('APP_PASSWORD debe tener entre 12 y 256 caracteres.');
const email = process.env.VITE_SHARED_EMAIL || 'pareja@fotosconailu.invalid';
const dir = mkdtempSync(join(tmpdir(), 'rincon-auth-'));
const run = args => execFileSync('npx', ['-y', 'firebase-tools@latest', ...args, '--project', 'fotosconailu'], { stdio: 'inherit' });
try {
  const before = join(dir, 'before.json');
  run(['auth:export', before]);
  const users = JSON.parse(readFileSync(before, 'utf8')).users || [];
  if (users.some(u => u.email === email || u.localId === 'rincon-shared')) {
    throw new Error('La cuenta ya existe: no se reemplazó ni cambió su contraseña.');
  }
  const salt = randomBytes(16);
  const file = join(dir, 'user.json');
  writeFileSync(file, JSON.stringify({ users: [{
    localId: 'rincon-shared', email, emailVerified: false,
    displayName: 'Ailu y Tomy',
    passwordHash: pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('base64'),
    salt: salt.toString('base64'),
    customAttributes: JSON.stringify({ rincon: true, role: 'authenticated' }),
  }] }), { mode: 0o600 });
  run(['auth:import', file, '--hash-algo', 'PBKDF2_SHA256', '--rounds', '100000']);
  console.log('Cuenta privada aprovisionada. Contraseña sólo en APP_PASSWORD (.env); no se imprime.');
} finally { rmSync(dir, { recursive: true, force: true }); }
