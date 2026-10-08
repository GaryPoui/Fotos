/* Private media proxy. No token, URL or content is cached or persisted. */
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
const failure = status => new Response('', { status, headers: { 'Cache-Control': 'no-store' } });
async function proxy(event) {
  const client = await self.clients.get(event.clientId);
  if (!client) return failure(401);
  const channel = new MessageChannel();
  const credential = await new Promise(resolve => {
    const timer = setTimeout(() => { channel.port1.close(); resolve(null); }, 10000);
    channel.port1.onmessage = e => { clearTimeout(timer); channel.port1.close(); resolve(e.data); };
    client.postMessage({ type: 'private-media', path: new URL(event.request.url).pathname, thumb: new URL(event.request.url).searchParams.get('thumb') === '1' }, [channel.port2]);
  });
  if (!credential?.token) return failure(401);
  try {
    const url = new URL(credential.url);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co') || !url.pathname.startsWith('/storage/v1/object/authenticated/rincon/')) return failure(403);
    const headers = { Authorization: 'Bearer ' + credential.token, apikey: credential.key };
    const range = event.request.headers.get('Range');
    if (range) headers.Range = range;
    const remote = await fetch(url.href, { headers, cache: 'no-store', redirect: 'error', signal: event.request.signal });
    if (![200, 206, 416].includes(remote.status)) {
      await remote.body?.cancel();
      return failure([401, 403, 404].includes(remote.status) ? remote.status : 502);
    }
    const forwarded = new Headers({ 'Cache-Control': 'no-store', 'Content-Type': credential.mime, 'Content-Disposition': 'inline', 'X-Content-Type-Options': 'nosniff' });
    for (const key of ['Content-Length', 'Content-Range', 'Accept-Ranges']) if (remote.headers.has(key)) forwarded.set(key, remote.headers.get(key));
    // Storage's CORS response can hide Content-Range from the browser. Reconstruct
    // the single requested range from immutable file metadata, checking body length.
    forwarded.set('Accept-Ranges', 'bytes');
    if (remote.status === 416 && Number.isSafeInteger(credential.size)) forwarded.set('Content-Range', 'bytes */' + credential.size);
    if (remote.status === 206 && !forwarded.has('Content-Range')) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range || '');
      const total = credential.size;
      if (!match || !Number.isSafeInteger(total) || total <= 0 || (!match[1] && !match[2])) {
        await remote.body?.cancel(); return failure(502);
      }
      const start = match[1] ? Number(match[1]) : Math.max(0, total - Number(match[2]));
      const end = match[1] && match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
      if (start > end || Number(remote.headers.get('Content-Length')) !== end - start + 1) {
        await remote.body?.cancel(); return failure(502);
      }
      forwarded.set('Content-Range', 'bytes ' + start + '-' + end + '/' + total);
    }
    return new Response(remote.body, { status: remote.status, headers: forwarded });
  } catch { return failure(502); }
}
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && /^\/api\/files\/[a-f0-9-]+$/.test(url.pathname) && event.request.method === 'GET') event.respondWith(proxy(event));
});
