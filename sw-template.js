// v22 service worker (generated at build by the 'chibi-sw' plugin in vite.config.js; __PRECACHE__ / __VERSION__ are filled in).
// Precache the built app; status.json is network-first (live status stays fresh, last copy offline); navigations are network-first
// with the cached shell as the offline fallback; everything else is cache-first. Scope-relative, so it works under /chibi-office/.
const VERSION = '__VERSION__', CACHE = 'chibi-office-' + VERSION, SCOPE = self.registration.scope;
const PRECACHE = __PRECACHE__.map(u => new URL(u, SCOPE).href);
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('chibi-office-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const netFirst = async (req, key) => { const c = await caches.open(CACHE); try { const r = await fetch(req); if (r.ok) c.put(key, r.clone()); return r; } catch (err) { const m = await c.match(key); if (m) return m; throw err; } };
self.addEventListener('fetch', e => { const req = e.request; if (req.method !== 'GET') return; const u = new URL(req.url); if (u.origin !== location.origin || !u.href.startsWith(SCOPE)) return;
  if (u.pathname.endsWith('/status.json')) { e.respondWith(netFirst(req, new URL('status.json', SCOPE).href)); return; }
  if (req.mode === 'navigate') { e.respondWith(netFirst(req, SCOPE).catch(() => caches.match(SCOPE))); return; }
  if (u.pathname.endsWith('/sw.js')) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(m => m || fetch(req).then(r => { if (r.ok && r.type === 'basic') { const cl = r.clone(); caches.open(CACHE).then(c => c.put(req, cl)); } return r; }))); });
