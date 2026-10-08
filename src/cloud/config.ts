// Public SDK configuration only. Never add service-role or admin credentials here.
export const firebaseConfig = {
  projectId: 'fotosconailu',
  appId: '1:779560436915:web:e7c1a1d937717997335cc6',
  apiKey: 'AIzaSyDNQVAhb3Tg0_WY7sra2Vgs1O_ghvwnm7E',
  authDomain: 'fotosconailu.firebaseapp.com',
};
export const cloudEnabled = import.meta.env.VITE_CLOUD === 'firebase';
export const cloudEmail = import.meta.env.VITE_SHARED_EMAIL || 'pareja@fotosconailu.invalid';
export const storageUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const storageKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const storageReady = Boolean(storageUrl && storageKey);
export const bucket = 'rincon';
export const maxFile = 50_000_000;
export const maxStorage = 900_000_000;
