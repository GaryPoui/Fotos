import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, terminate, type Firestore } from 'firebase/firestore';
const suite = process.env.FIRESTORE_EMULATOR_HOST ? describe : describe.skip;
suite('Firestore private membership and schema (emulator)', () => {
 const apps: FirebaseApp[] = [], clients: Firestore[] = [];
 let member: Firestore, outsider: Firestore, publicDb: Firestore;
 const id = '11111111-1111-4111-8111-111111111111';
 const note = () => ({ type: 'letter', title: 'Para vos', body: 'Una carta\nprivada', author: 'Yo', date: '2026-10-08', favorite: false, createdAt: serverTimestamp() });
 function client(name: string, claims?: Record<string, unknown>) {
  const app = initializeApp({ projectId: 'demo-fotosconailu', apiKey: 'demo' }, name); apps.push(app);
  const db = getFirestore(app); clients.push(db);
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST!.split(':');
  connectFirestoreEmulator(db, host, Number(port), claims ? { mockUserToken: { sub: name, ...claims } } : undefined);
  return db;
 }
 beforeAll(async () => {
  member = client('member', { rincon: true, role: 'authenticated' });
  outsider = client('outsider', { role: 'authenticated' });
  publicDb = client('public');
  await setDoc(doc(member, 'rincon_notes', id), note());
 });
 afterAll(async () => { await Promise.all(clients.map(terminate)); await Promise.all(apps.map(deleteApp)); });
 it('allows actual collection queries, edits and private settings', async () => {
  expect((await getDocs(collection(member, 'rincon_notes'))).size).toBe(1);
  await updateDoc(doc(member, 'rincon_notes', id), { favorite: true });
  expect((await getDoc(doc(member, 'rincon_notes', id))).data()?.favorite).toBe(true);
  await setDoc(doc(member, 'rincon_settings', 'main'), { names: 'Ailu y Tomy', title: 'Nuestro rincón', since: '' });
 });
 it('denies public lists and all outsider CRUD', async () => {
  for (const db of [publicDb, outsider]) {
   await expect(getDocs(collection(db, 'rincon_notes'))).rejects.toThrow();
   await expect(getDoc(doc(db, 'rincon_notes', id))).rejects.toThrow();
   await expect(setDoc(doc(db, 'rincon_notes', 'attacker'), note())).rejects.toThrow();
   await expect(updateDoc(doc(db, 'rincon_notes', id), { title: 'stolen' })).rejects.toThrow();
   await expect(deleteDoc(doc(db, 'rincon_notes', id))).rejects.toThrow();
  }
 });
 it('rejects update bypass, oversized strings, missing fields, type juggling and schema pollution', async () => {
  for (const patch of [{body:'x'.repeat(30001)}, {title:42}, {body:''}, {isAdmin:true}, {author:'x'.repeat(101)}])
   await expect(updateDoc(doc(member, 'rincon_notes', id), patch)).rejects.toThrow();
  await expect(setDoc(doc(member, 'rincon_notes', id), { title:'missing fields' })).rejects.toThrow();
  await expect(setDoc(doc(member, 'rincon_settings', 'main'), { names:'Ailu', title:'ok', since:'', role:'admin' })).rejects.toThrow();
 });
 it('rejects timestamp manipulation, role self-escalation and orphan subcollections', async () => {
  await expect(updateDoc(doc(member, 'rincon_notes', id), {createdAt:Timestamp.fromMillis(0)})).rejects.toThrow();
  await expect(setDoc(doc(member, 'rincon_notes', 'past'), {...note(),createdAt:Timestamp.fromMillis(0)})).rejects.toThrow();
  await expect(setDoc(doc(outsider, 'users', 'outsider'), {rincon:true,role:'authenticated'})).rejects.toThrow();
  await expect(setDoc(doc(member, 'rincon_notes', id, 'private', 'leak'), {body:'leak'})).rejects.toThrow();
 });
 it('validates immutable media fields, scoped IDs, each tag and numeric bounds', async () => {
  const media = {id,kind:'photo',title:'Cielo',date:'2026-10-08',album:'',tags:['juntos'],favorite:false,artist:'',mime:'image/png',size:100,storedBytes:150,ext:'png',createdAt:serverTimestamp()};
  await setDoc(doc(member, 'rincon_media', id), media);
  await updateDoc(doc(member, 'rincon_media', id), {title:'Nuestro cielo'});
  for (const patch of [{ext:'html'}, {size:-1}, {storedBytes:900000001}, {tags:[42]}, {tags:['x'.repeat(31)]}, {kind:'audio'}, {id:'../other'}])
   await expect(updateDoc(doc(member, 'rincon_media', id), patch)).rejects.toThrow();
  await expect(setDoc(doc(member, 'rincon_media', 'bad'), {...media,id:'bad'})).rejects.toThrow();
  await deleteDoc(doc(member, 'rincon_media', id));
 });
});
