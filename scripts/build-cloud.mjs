import { build } from 'vite';
try { process.loadEnvFile('.env.cloud'); } catch { /* public config may come from CI */ }
process.env.VITE_CLOUD = 'firebase';
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if ((!url || !key) && !process.argv.includes('--allow-pending-storage')) {
 throw new Error('Falta configurar Supabase en .env.cloud. No se construyó una publicación completa.');
}
if (url) {
 const parsed = new URL(url);
 if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co') || parsed.pathname !== '/') throw new Error('VITE_SUPABASE_URL debe ser el origen HTTPS de Supabase.');
 process.env.VITE_SUPABASE_URL = parsed.origin;
}
if (key?.startsWith('sb_secret_')) throw new Error('Nunca usar una clave secreta en el frontend.');
if (key?.split('.').length === 3) {
 const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
 if (claims.role !== 'anon') throw new Error('El cliente sólo admite la clave pública anon/publishable.');
}
if (!url || !key) console.log('Publicación parcial: cartas y ajustes disponibles; álbum marcado pendiente.');
await build({ build: { outDir: 'dist-cloud' } });
