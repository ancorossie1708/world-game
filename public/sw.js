/* The game shell and packaged media remain available after the first visit.
 * Content generations are selected through one atomic CacheStorage pointer. */
const BASE = new URL('./', self.registration.scope);
const TAG = BASE.pathname.replace(/[^a-zA-Z0-9]/g, '_') || 'root';
const PREFIX = `world-game-${TAG}-`;
// The build script injects a digest, so a new HTML/JS bundle gets an isolated cache.
const BUILD = self.WORLD_GAME_BUILD || 'development';
const SHELL = `${PREFIX}shell-${BUILD}`;
const BUNDLED = `${PREFIX}bundled-content-${BUILD}`;
const LEGACY_BUNDLED = `${PREFIX}bundled-content-v1`;
const CONTROL = `${PREFIX}control-v1`;
const POINTER = new URL('__world-game-active-content__', BASE).href;
const ALLOWED_MEDIA = /^content\/[a-zA-Z0-9][a-zA-Z0-9._/-]*\.(json|jpg|jpeg|png|webp|wav|mp3)$/i;
const PACKAGED_FONT_PATHS = new Set(['content/fonts/Heebo.ttf', 'content/fonts/OFL.txt']);

function withinScope(url) {
  return url.origin === BASE.origin && url.pathname.startsWith(BASE.pathname);
}

function localContent(url) {
  if (!withinScope(url)) return false;
  const path = url.pathname.slice(BASE.pathname.length);
  return (ALLOWED_MEDIA.test(path) || PACKAGED_FONT_PATHS.has(path)) && !path.split('/').some((part) => part === '..' || part === '.');
}

async function cacheResponse(url) {
  const parsed = new URL(url, BASE);
  if (!withinScope(parsed)) return;
  const cache = await caches.open(localContent(parsed) ? BUNDLED : SHELL);
  const response = await fetch(parsed.href, { cache: 'no-cache' });
  if (!response.ok || response.type === 'opaque') throw new Error('Offline resource unavailable');
  if (!parsed.pathname.endsWith('/') && !parsed.pathname.endsWith('.html') && response.headers.get('Content-Type')?.includes('text/html')) {
    throw new Error('Offline resource resolved to an HTML error page');
  }
  await cache.put(parsed.href, response);
}

async function cacheUrls(urls) {
  const queue = [...new Set(urls)].filter((url) => withinScope(new URL(url, BASE)));
  let index = 0;
  const worker = async () => {
    while (index < queue.length) await cacheResponse(queue[index++]);
  };
  await Promise.all(Array.from({ length: Math.min(4, queue.length) }, worker));
}

function catalogAssets(value, output = new Set()) {
  if (typeof value === 'string') {
    const path = value.replace(/^\.\//, '');
    if (ALLOWED_MEDIA.test(path) || PACKAGED_FONT_PATHS.has(path)) output.add(new URL(path, BASE).href);
  } else if (Array.isArray(value)) {
    for (const item of value) catalogAssets(item, output);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) catalogAssets(item, output);
  }
  return output;
}

async function announceReady() {
  for (const client of await self.clients.matchAll({ type: 'window' })) {
    client.postMessage({ type: 'SHELL_READY' });
  }
}

async function precachePackagedFiles() {
  const response = await fetch(new URL('offline-precache.json', BASE), { cache: 'no-cache' });
  if (response.ok && response.headers.get('Content-Type')?.includes('application/json')) {
    const list = await response.json();
    if (!Array.isArray(list.files) || !list.files.includes('index.html') || !list.files.every((file) => typeof file === 'string' && !file.startsWith('/') && !file.includes('..'))) {
      throw new Error('Invalid precache index');
    }
    // Any failed resource rejects installation, preserving the previous complete generation.
    await cacheUrls(list.files.map((file) => new URL(file, BASE).href));
    const shell = await caches.open(SHELL);
    const index = await shell.match(new URL('index.html', BASE).href);
    if (!index) throw new Error('Missing offline app shell');
    await shell.put(BASE.href, index);
  } else {
    // Vite development has no build index. Cache the bundled catalog and all its media.
    await cacheResponse(BASE.href);
    const catalogUrl = new URL('content/catalog.json', BASE).href;
    await cacheResponse(catalogUrl);
    const catalog = await (await (await caches.open(BUNDLED)).match(catalogUrl)).json();
    await cacheUrls([...catalogAssets(catalog), ...[...PACKAGED_FONT_PATHS].map((path) => new URL(path, BASE).href)]);
  }
  await announceReady();
}

self.addEventListener('install', (event) => {
  event.waitUntil(precachePackagedFiles().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim().then(announceReady));
});

async function activeContent(url) {
  const response = await (await caches.open(CONTROL)).match(POINTER);
  if (!response) return undefined;
  try {
    const pointer = await response.json();
    if (typeof pointer.cacheName !== 'string' || !pointer.cacheName.startsWith(`${PREFIX}content-`)) return undefined;
    if (!await caches.has(pointer.cacheName)) return undefined;
    return (await caches.open(pointer.cacheName)).match(url);
  } catch {
    return undefined;
  }
}

async function contentResponse(request, url) {
  const active = await activeContent(url.href);
  if (active) return active;
  const bundled = await caches.open(BUNDLED);
  const existing = await bundled.match(url.href);
  if (existing) return existing;
  if (await caches.has(LEGACY_BUNDLED)) {
    const warmed = await (await caches.open(LEGACY_BUNDLED)).match(url.href);
    if (warmed) return warmed;
  }
  const response = await fetch(request);
  if (response.ok && response.type !== 'opaque') await bundled.put(url.href, response.clone());
  return response;
}

async function navigationResponse(request) {
  const shell = await caches.open(SHELL);
  // HTML and its hashed code are activated together by service-worker installation.
  // A navigation never replaces the working HTML with an unprepared network build.
  const cached = await shell.match(BASE.href);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) await shell.put(BASE.href, response.clone());
    return response;
  } catch {
    return await shell.match(BASE.href) ?? new Response('האפליקציה אינה זמינה עדיין ללא רשת. יש לפתוח אותה פעם אחת עם חיבור לרשת.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function shellResponse(request) {
  const shell = await caches.open(SHELL);
  const cached = await shell.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type !== 'opaque') await shell.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!withinScope(url)) return;
  if (localContent(url)) {
    event.respondWith(contentResponse(request, url));
  } else if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(request));
  } else if (['script', 'style', 'font', 'image'].includes(request.destination)) {
    event.respondWith(shellResponse(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'WARM_SHELL' && Array.isArray(event.data.urls)) {
    const urls = event.data.urls.filter((url) => url !== BASE.href && url !== new URL('index.html', BASE).href);
    event.waitUntil(cacheUrls(urls).then(announceReady).catch(() => {}));
  } else if (event.data?.type === 'CHECK_OFFLINE_READY') {
    event.waitUntil((async () => {
      const shell = await caches.open(SHELL);
      if (await shell.match(BASE.href)) event.source?.postMessage({ type: 'SHELL_READY' });
    })());
  }
});
