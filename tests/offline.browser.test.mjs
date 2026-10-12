import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { initializeOfflineSupport, checkForUpdates, getUpdateStatus, setRoundActive, applyPendingContentUpdate } from '../src/lib/offline.ts';

class MemoryCache {
  entries = new Map();
  key(value) { return typeof value === 'string' ? value : value.url; }
  async put(key, response) { this.entries.set(this.key(key), response.clone()); }
  async match(key) { return this.entries.get(this.key(key))?.clone(); }
  async delete(key) { return this.entries.delete(this.key(key)); }
}

class MemoryCacheStorage {
  entries = new Map();
  async open(name) {
    if (!this.entries.has(name)) this.entries.set(name, new MemoryCache());
    return this.entries.get(name);
  }
  async has(name) { return this.entries.has(name); }
  async delete(name) { return this.entries.delete(name); }
  async keys() { return [...this.entries.keys()]; }
}

function installEnvironment() {
  const fakeWindow = new EventTarget();
  fakeWindow.isSecureContext = false;
  fakeWindow.WorldGameNative = {
    getStatus: () => JSON.stringify({ appVersion: '0.1.0', versionCode: 1, contentVersion: '1', updateManifestUrl: 'https://example.com/release.json' }),
  };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: fakeWindow });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { baseURI: 'https://game.example/' } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: true } });
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: new MemoryCacheStorage() });
  return fakeWindow;
}

const manifestUrl = 'https://example.com/release.json';
const resourceUrl = 'https://example.com/japan.json';
const resourcePath = 'content/credits.json';
const activePointerUrl = 'https://game.example/__world-game-active-content__';
const pendingPointerUrl = 'https://game.example/__world-game-pending-content__';
const prefix = 'world-game-_-';

function nextManifest(version, bytes, valid = true) {
  return {
    schemaVersion: 1,
    content: {
      version,
      files: [{ path: resourcePath, url: resourceUrl, sha256: valid ? createHash('sha256').update(bytes).digest('hex') : '0'.repeat(64), bytes: bytes.length }],
    },
  };
}

function responseAt(body, url) {
  const response = new Response(body);
  Object.defineProperty(response, 'url', { value: url });
  return response;
}

test('content download is atomic and waits for the current round to end', async () => {
  const fakeWindow = installEnvironment();
  let activations = 0;
  fakeWindow.addEventListener('journey:content-updated', () => activations++);
  await setRoundActive(true);
  await initializeOfflineSupport();
  delete fakeWindow.WorldGameNative;
  const control = await caches.open(`${prefix}control-v1`);
  const oldCacheName = `${prefix}content-original`;
  const old = await caches.open(oldCacheName);
  await old.put(`https://game.example/${resourcePath}`, new Response('{"version":"old"}'));
  await control.put(activePointerUrl, new Response(JSON.stringify({ cacheName: oldCacheName, version: '1' })));

  let bytes = Buffer.from('{"version":"new"}');
  let candidate = nextManifest('2', bytes);
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async (url) => {
    if (String(url) === manifestUrl) return responseAt(JSON.stringify(candidate), manifestUrl);
    if (String(url) === resourceUrl) return responseAt(bytes, resourceUrl);
    throw new Error(`Unexpected network request ${url}`);
  } });

  const ready = await checkForUpdates(true);
  assert.equal(ready.phase, 'ready');
  assert.equal(ready.contentVersion, '1');
  assert.equal((await (await control.match(activePointerUrl)).json()).cacheName, oldCacheName);
  assert.equal(await applyPendingContentUpdate(), false);
  assert.equal(activations, 0);

  await setRoundActive(false);
  assert.equal(getUpdateStatus().phase, 'updated');
  assert.equal(getUpdateStatus().contentVersion, '2');
  assert.equal(activations, 1);
  const current = await (await control.match(activePointerUrl)).json();
  assert.notEqual(current.cacheName, oldCacheName);
  assert.equal(await control.match(pendingPointerUrl), undefined);
  assert.equal(await (await (await caches.open(current.cacheName)).match(`https://game.example/${resourcePath}`)).text(), '{"version":"new"}');

  // A corrupt later resource must not replace or delete the active generation.
  bytes = Buffer.from('{"version":"corrupt"}');
  candidate = nextManifest('3', bytes, false);
  const cachesBefore = await caches.keys();
  const failed = await checkForUpdates(true);
  assert.equal(failed.phase, 'error');
  assert.equal(failed.contentVersion, '2');
  assert.deepEqual(await (await control.match(activePointerUrl)).json(), current);
  assert.deepEqual(await caches.keys(), cachesBefore);
  assert.equal(activations, 1);
});

test('with no release URL the app remains local and sends no update request', async () => {
  const fakeWindow = installEnvironment();
  delete fakeWindow.WorldGameNative;
  let requests = 0;
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async () => { requests++; throw new Error('Not expected'); } });
  const local = await import('../src/lib/offline.ts?local-only');
  const first = local.checkForUpdates();
  assert.equal(local.checkForUpdates(), first);
  assert.equal((await first).phase, 'local-only');
  assert.equal(requests, 0);
});

test('a native staged update remains ready during a restored round and activates once', async () => {
  const fakeWindow = installEnvironment();
  const bytes = Buffer.from('{"version":"new"}');
  const candidate = nextManifest('2', bytes);
  const dispatch = (detail) => fakeWindow.dispatchEvent(new CustomEvent('journey:native', { detail }));
  fakeWindow.WorldGameNative = {
    getStatus: () => JSON.stringify({ version: '0.1.0', versionCode: 1, contentVersion: '1', readyContentVersion: '2', updateManifestUrl: manifestUrl }),
    getAppInfo: () => JSON.stringify({ versionCode: 1 }),
    setRoundActive: () => {},
    checkUpdates: () => {
      queueMicrotask(() => dispatch({ event: 'update-check', status: 'checked', manifest: candidate, contentUpdateAvailable: false, readyContentVersion: '2' }));
      return '{"status":"started"}';
    },
    activateContent: () => {
      queueMicrotask(() => dispatch({ event: 'content-activation', status: 'active', contentVersion: '2' }));
      return '{"status":"active","contentVersion":"2"}';
    },
  };
  let activations = 0;
  fakeWindow.addEventListener('journey:content-updated', () => activations++);
  const native = await import('../src/lib/offline.ts?native-ready');
  await native.setRoundActive(true);
  await native.initializeOfflineSupport();
  assert.equal(native.getUpdateStatus().phase, 'ready');
  assert.equal((await native.checkForUpdates()).phase, 'ready');
  assert.equal(activations, 0);
  await native.setRoundActive(false);
  await Promise.resolve();
  assert.equal(native.getUpdateStatus().contentVersion, '2');
  assert.equal(activations, 1);
});

test('native connection loss during download keeps bundled play available', async () => {
  const fakeWindow = installEnvironment();
  const candidate = nextManifest('2', Buffer.from('{}'));
  const dispatch = (detail) => fakeWindow.dispatchEvent(new CustomEvent('journey:native', { detail }));
  fakeWindow.WorldGameNative = {
    getStatus: () => JSON.stringify({ contentVersion: '', updateManifestUrl: manifestUrl }),
    getAppInfo: () => '{"versionCode":1}',
    checkUpdates: () => {
      queueMicrotask(() => dispatch({ event: 'update-check', status: 'checked', manifest: candidate, contentUpdateAvailable: true }));
      return '{"status":"started"}';
    },
    downloadContent: () => {
      queueMicrotask(() => dispatch({ event: 'content-download', status: 'offline' }));
      return '{"status":"started"}';
    },
  };
  const native = await import('../src/lib/offline.ts?native-offline');
  const result = await native.checkForUpdates();
  assert.equal(result.phase, 'offline');
  assert.equal(result.contentVersion, '0.1.0');
  assert.equal(result.offlineReady, true);
});
