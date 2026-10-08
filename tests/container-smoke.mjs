// CI only: synthetic data in a disposable Docker volume, never the personal data/ directory.
const base = 'http://127.0.0.1:3002';
let ready = false;
for (let i = 0; i < 40; i++) {
  try { const health = await fetch(base + '/api/health'); if (health.ok) { ready = true; break; } } catch {}
  await new Promise(resolve => setTimeout(resolve, 500));
}
if (!ready) throw new Error('Container did not become healthy.');
const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'NuestroRincon', Origin: 'https://rincon.example' };
const login = await fetch(base + '/api/login', { method: 'POST', headers, body: JSON.stringify({ password: 'ci-container-test-password' }) });
if (!login.ok) throw new Error('Container login failed.');
const cookie = login.headers.get('set-cookie')?.split(';')[0];
if (!cookie || !login.headers.get('set-cookie')?.includes('Secure')) throw new Error('Missing secure session.');
const authenticated = { ...headers, Cookie: cookie };
if (process.argv[2] === 'write') {
  const response = await fetch(base + '/api/notes', { method: 'POST', headers: authenticated, body: JSON.stringify({ type: 'letter', title: 'CI persistent smoke', body: 'Synthetic persistence check', author: 'CI', date: '2026-10-08' }) });
  if (response.status !== 201) throw new Error('Container write failed: ' + await response.text());
} else {
  const response = await fetch(base + '/api/library', { headers: authenticated });
  const library = await response.json();
  if (!library.notes?.some(note => note.title === 'CI persistent smoke')) throw new Error('Data did not survive container replacement.');
}
const unauthorized = await fetch(base + '/api/library');
if (unauthorized.status !== 401) throw new Error('Private data exposed.');
console.log('Container smoke ' + process.argv[2] + ': PASS');
