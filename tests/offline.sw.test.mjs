import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
class Cache {
  entries = new Map();
  key(value) { return typeof value === 'string' ? value : value.url; }
  async put(key, value) { this.entries.set(this.key(key), value.clone()); }
  async match(key) { return this.entries.get(this.key(key))?.clone(); }
}
class CacheStorage {
  entries = new Map();
  async has(name) { return this.entries.has(name); }
  async open(name) { if (!this.entries.has(name)) this.entries.set(name, new Cache()); return this.entries.get(name); }
}
function worker(build, cacheStorage, network) {
  const handlers = new Map();
  const self = {
    WORLD_GAME_BUILD: build,
    registration: { scope: 'https://game.example/app/' },
    addEventListener: (name, listener) => handlers.set(name, listener),
    skipWaiting: () => {},
    clients: { matchAll: async () => [], claim: async () => {} },
  };
  vm.runInNewContext(source, { self, caches: cacheStorage, fetch: network, URL, Response, Set, Array, Object, Error });
  return {
    async install() {
      let work;
      handlers.get('install')({ waitUntil: (promise) => { work = promise; } });
      await work;
    },
    async navigation() {
      let work;
      handlers.get('fetch')({ request: { method: 'GET', url: self.registration.scope, mode: 'navigate' }, respondWith: (promise) => { work = promise; } });
      return work;
    },
    async warm(urls) {
      let work;
      handlers.get('message')({ data: { type: 'WARM_SHELL', urls }, waitUntil: (promise) => { work = promise; } });
      await work;
    },
  };
}
function release(build, failAsset = false) {
  return async (request) => {
    const url = typeof request === 'string' ? request : request.href ?? request.url;
    if (url.endsWith('offline-precache.json')) return new Response(JSON.stringify({ files: ['index.html', `assets/game-${build}.js`, 'content/catalog.json'] }), { headers: { 'Content-Type': 'application/json' } });
    if (url.endsWith('index.html') || url === 'https://game.example/app/') return new Response(`<html><script src="./assets/game-${build}.js"></script></html>`, { headers: { 'Content-Type': 'text/html' } });
    if (url.endsWith(`game-${build}.js`)) {
      if (failAsset) throw new Error('Interrupted new app download');
      return new Response(`console.log('${build}')`, { headers: { 'Content-Type': 'text/javascript' } });
    }
    if (url.endsWith('catalog.json')) return new Response('{"schemaVersion":1,"countries":[]}', { headers: { 'Content-Type': 'application/json' } });
    throw new Error(`Unexpected request ${url}`);
  };
}

test('an installed shell serves its matching HTML and script without network', async () => {
  const cacheStorage = new CacheStorage();
  const current = worker('A', cacheStorage, release('A'));
  await current.install();
  const offline = worker('A', cacheStorage, async () => { throw new Error('Offline'); });
  assert.match(await (await offline.navigation()).text(), /game-A\.js/);
  const shell = await cacheStorage.open('world-game-_app_-shell-A');
  assert.equal(await (await shell.match('https://game.example/app/assets/game-A.js')).text(), "console.log('A')");
});

test('an interrupted later build cannot replace a working shell HTML', async () => {
  const cacheStorage = new CacheStorage();
  await worker('A', cacheStorage, release('A')).install();
  const incomplete = worker('B', cacheStorage, release('B', true));
  await assert.rejects(incomplete.install(), /Interrupted/);
  const previous = worker('A', cacheStorage, release('B'));
  assert.match(await (await previous.navigation()).text(), /game-A\.js/);
  await previous.warm(['https://game.example/app/']);
  assert.match(await (await previous.navigation()).text(), /game-A\.js/);
});

test('a complete new build has a separate shell generation', async () => {
  const cacheStorage = new CacheStorage();
  await worker('A', cacheStorage, release('A')).install();
  const latest = worker('B', cacheStorage, release('B'));
  await latest.install();
  assert.match(await (await latest.navigation()).text(), /game-B\.js/);
  const old = await cacheStorage.open('world-game-_app_-shell-A');
  assert.match(await (await old.match('https://game.example/app/')).text(), /game-A\.js/);
});
