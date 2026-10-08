import { ZodError } from 'zod';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, getIdTokenResult } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocFromServer, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import type { Library, Media, Note } from '../../shared/types';
import { firebaseConfig, cloudEmail, storageUrl, storageKey, bucket, maxFile, maxStorage } from './config';
import { inspect, thumbnail, mediaInput, noteInput, settingsInput } from './media';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const store = storageUrl && storageKey ? createClient(storageUrl, storageKey, {
  accessToken: async () => auth.currentUser?.getIdToken() ?? null,
}) : null;
const uploadIds = new WeakMap<File, string>();
const mediaCache = new Map<string, Media & { ext: string; storedBytes: number }>();
const ref = (kind: string, id: string) => doc(db, 'rincon_' + kind, id);
const defaults = { names: 'Ailu y Tomy', title: 'Nuestro rincón', since: '' };
const missingStorage = () => new Error('El álbum online todavía se está configurando. Tus cartas y ajustes sí están disponibles.');
let bridgeReady: Promise<void> | undefined;
function bridge() {
  return bridgeReady ??= (async () => {
    if (!('serviceWorker' in navigator)) throw new Error('Este navegador no permite abrir los archivos privados. Probá con uno actualizado.');
    navigator.serviceWorker.addEventListener('message', async event => {
      if (event.data?.type !== 'private-media' || !event.ports[0]) return;
      try {
        const user = auth.currentUser;
        if (!user || !store) throw missingStorage();
        const id = String(event.data.path).split('/').pop()!;
        let media = mediaCache.get(id);
        if (!media) {
          const snapshot = await getDoc(ref('media', id));
          if (!snapshot.exists()) throw new Error('Archivo eliminado');
          media = mapMedia(snapshot.id, snapshot.data());
        }
        const thumb = event.data.thumb && media.kind === 'photo';
        event.ports[0].postMessage({
          token: await user.getIdToken(), key: storageKey,
          url: storageUrl + '/storage/v1/object/authenticated/' + bucket + '/' + id + '/' + (thumb ? 'thumb.webp' : 'original.' + media.ext),
          mime: thumb ? 'image/webp' : media.mime,
          size: thumb ? media.storedBytes - media.size : media.size,
        });
      } catch { event.ports[0].postMessage(null); }
    });
    await navigator.serviceWorker.register('/private-media-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Recargá la página para abrir el álbum privado.')), 10000);
      navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timer); resolve(); }, { once: true });
    });
  })();
}
async function member() {
  await auth.authStateReady();
  if (!auth.currentUser) throw new Error('Ingresá para abrir nuestro rincón.');
  const token = await getIdTokenResult(auth.currentUser);
  if (token.claims.rincon !== true || token.claims.role !== 'authenticated') {
    await signOut(auth);
    throw new Error('Esta cuenta no tiene acceso a nuestro rincón.');
  }
  return auth.currentUser;
}
function createdAt(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toISOString() : String(value || '');
}
function mapMedia(id: string, row: Record<string, unknown>) {
  return { ...row, id, createdAt: createdAt(row.createdAt) } as Media & { ext: string; storedBytes: number };
}
function mapNote(id: string, row: Record<string, unknown>) {
  return { ...row, id, createdAt: createdAt(row.createdAt) } as Note;
}
async function settings() {
  const snapshot = await getDoc(ref('settings', 'main'));
  return snapshot.exists() ? snapshot.data() : defaults;
}
async function used() {
  if (!store) return 0;
  const { data, error } = await store.rpc('rincon_used');
  if (error) throw new Error('No pudimos consultar el espacio del álbum. Intentá nuevamente.');
  return Number(data);
}
async function library(): Promise<Library> {
  const [media, notes, currentSettings, bytes] = await Promise.all([
    getDocs(collection(db, 'rincon_media')), getDocs(collection(db, 'rincon_notes')), settings(), used(),
  ]);
  const rows = media.docs.map(s => mapMedia(s.id, s.data()));
  mediaCache.clear();
  rows.forEach(row => mediaCache.set(row.id, row));
  const order = (a: {date: string; createdAt: string}, b: {date: string; createdAt: string}) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
  return {
    media: rows.sort(order), notes: notes.docs.map(s => mapNote(s.id, s.data())).sort(order),
    settings: currentSettings as Library['settings'], storage: { used: bytes, limit: maxStorage, maxFile },
  };
}
async function cleanup(id: string, ext: string, photo: boolean) {
  if (!store) throw missingStorage();
  const paths = [id + '/original.' + ext, ...(photo ? [id + '/thumb.webp'] : [])];
  const { error } = await store.storage.from(bucket).remove(paths);
  if (error) throw new Error('No pudimos eliminar los archivos del álbum. Volvé a intentar.');
  const released = await store.rpc('rincon_release', { asset_id: id });
  if (released.error) throw new Error('Los archivos se borraron; falta liberar su espacio. Volvé a intentar.');
}
export async function cloudApi<T>(path: string, method: string, body?: unknown): Promise<T> {
  try {
    if (path === '/session') {
      await auth.authStateReady();
      if (!auth.currentUser) return { authenticated: false } as T;
      await member();
      await bridge();
      return { authenticated: true } as T;
    }
    if (path === '/login' && method === 'POST') {
      const password = (body as { password: string }).password;
      await signInWithEmailAndPassword(auth, cloudEmail, password);
      await member();
      await bridge();
      return { authenticated: true } as T;
    }
    if (path === '/logout' && method === 'POST') {
      await signOut(auth);
      mediaCache.clear();
      return undefined as T;
    }
    await member();
    if (path === '/library') return await library() as T;
    if (path === '/settings') {
      if (method === 'GET') return await settings() as T;
      const data = settingsInput.parse(body);
      await setDoc(ref('settings', 'main'), data);
      return data as T;
    }
    const [kind, id] = path.slice(1).split('/');
    if (!['media', 'notes'].includes(kind)) throw new Error('Ruta no encontrada.');
    if (!id && method === 'GET') return (await library())[kind as 'media' | 'notes'] as T;
    if (kind === 'notes' && method === 'POST') {
      const data = noteInput.parse(body), newId = crypto.randomUUID();
      const target = ref(kind, newId);
      await setDoc(target, { ...data, createdAt: serverTimestamp() });
      return mapNote(newId, (await getDoc(target)).data()!) as T;
    }
    if (!id) throw new Error('Falta el recuerdo.');
    const target = ref(kind, id), snapshot = await getDoc(target);
    if (!snapshot.exists()) throw new Error('Este recuerdo ya no está.');
    const row = snapshot.data();
    if (method === 'DELETE') {
      if (kind === 'media') await cleanup(id, String(row.ext), row.kind === 'photo');
      await deleteDoc(target);
      mediaCache.delete(id);
      return undefined as T;
    }
    if (method === 'PATCH') {
      const keys = kind === 'notes' ? ['type','title','body','author','date','favorite'] : ['title','date','album','tags','favorite','artist'];
      const current = Object.fromEntries(keys.map(k => [k, row[k]]));
      const input = kind === 'notes' ? noteInput : mediaInput;
      await updateDoc(target, input.parse({ ...current, ...body as object }));
      const updated = (await getDoc(target)).data()!;
      return (kind === 'notes' ? mapNote(id, updated) : mapMedia(id, updated)) as T;
    }
    throw new Error('Operación no permitida.');
  } catch (error) {
    if (error instanceof ZodError) throw new Error('Revisá los campos: hay datos vacíos, inválidos o demasiado largos.');
    const code = (error as { code?: string }).code || '';
    if (code.startsWith('auth/')) {
      if (path !== '/login') window.dispatchEvent(new Event('session-expired'));
      throw new Error(code === 'auth/too-many-requests' ? 'Demasiados intentos. Esperá unos minutos.' : 'No pudimos ingresar. Revisá la contraseña y tu conexión.');
    }
    if (code === 'permission-denied') throw new Error('No tenés permiso para abrir este contenido. Volvé a ingresar.');
    throw error;
  }
}
function put(path: string, blob: Blob, mime: string, token: string, progress: (n: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', storageUrl + '/storage/v1/object/' + bucket + '/' + path);
    xhr.timeout = 120000;
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.setRequestHeader('apikey', storageKey);
    xhr.setRequestHeader('Content-Type', mime);
    xhr.setRequestHeader('Cache-Control', 'no-store');
    xhr.upload.onprogress = e => { if (e.lengthComputable) progress(Math.round(e.loaded / e.total * 90)); };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('No pudimos subir el archivo. Revisá el espacio disponible y volvé a intentar.'));
    xhr.onerror = xhr.ontimeout = () => reject(new Error('Se cortó la subida. Volvé a intentar.'));
    xhr.send(blob);
  });
}
export async function cloudUpload(file: File, fields: Record<string, string>, progress: (n: number) => void) {
  const user = await member();
  if (!store) throw missingStorage();
  if (!file.size || file.size > maxFile) throw new Error('El archivo supera el límite de 50 MB o está vacío.');
  const data = mediaInput.parse({ ...fields, tags: JSON.parse(fields.tags || '[]') });
  const detected = await inspect(file);
  const thumb = detected.kind === 'photo' ? await thumbnail(file) : null;
  const previousId = uploadIds.get(file);
  const id = previousId || crypto.randomUUID();
  uploadIds.set(file, id);
  // A lost network response can follow a successful Firestore commit. Reuse the ID.
  if ((await getDocFromServer(ref('media', id))).exists()) { progress(100); return; }
  if (previousId) await cleanup(id, detected.ext, Boolean(thumb));
  const reservation = await store.rpc('rincon_reserve', { asset_id: id, original_bytes: file.size, thumbnail_bytes: thumb?.size || 0, extension: detected.ext, content_mime: detected.mime });
  if (reservation.error) throw new Error('No pudimos reservar espacio. El álbum puede estar lleno o sin conexión.');
  let committed = false;
  let metadataAttempted = false;
  try {
    const token = await user.getIdToken();
    await put(id + '/original.' + detected.ext, file, detected.mime, token, progress);
    if (thumb) await put(id + '/thumb.webp', thumb, 'image/webp', token, () => progress(95));
    metadataAttempted = true;
    await setDoc(ref('media', id), { ...data, id, kind: detected.kind, mime: detected.mime, size: file.size, ext: detected.ext, storedBytes: file.size + (thumb?.size || 0), createdAt: serverTimestamp() });
    committed = true;
    progress(100);
  } finally {
    if (!committed && !metadataAttempted) {
      try { await cleanup(id, detected.ext, Boolean(thumb)); }
      catch { console.warn('Una subida incompleta conserva su reserva. Revisar el álbum antes de liberar espacio.'); }
    }
  }
}
