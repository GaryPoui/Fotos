import { mkdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
export function assertStopped(dir: string) {
  const path = join(dir, 'server.pid');
  if (!existsSync(path)) return;
  const pid = Number(readFileSync(path, 'utf8'));
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('server.pid inválido: verificar manualmente antes de continuar.');
  try { process.kill(pid, 0); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') { unlinkSync(path); return; }
    throw error;
  }
  throw new Error('El servidor está activo. Detenelo antes de respaldar o iniciar otra instancia.');
}
export function acquireLock(dir: string) {
  mkdirSync(dir, { recursive: true }); assertStopped(dir);
  const path = join(dir, 'server.pid'); writeFileSync(path, String(process.pid), { flag: 'wx' });
  return () => { if (existsSync(path) && readFileSync(path, 'utf8') === String(process.pid)) unlinkSync(path); };
}

