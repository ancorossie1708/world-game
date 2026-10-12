import {
  contentMimeType,
  contentRequiresNewerApp,
  isContentPath,
  isHttpsUrl,
  validateUpdateManifest,
  validateCatalogResources,
  verifySha256,
} from './update-manifest.ts';
import type { UpdateManifest } from './update-manifest.ts';

export type UpdatePhase = 'local-only' | 'idle' | 'checking' | 'downloading' | 'ready' | 'updated' | 'up-to-date' | 'offline' | 'error' | 'requires-app-update';

export interface UpdateStatus {
  phase: UpdatePhase;
  appVersion: string;
  contentVersion: string;
  appUpdateAvailable: boolean;
  newAppVersion?: string;
  pendingContentVersion?: string;
  downloadedFiles?: number;
  totalFiles?: number;
  checkedAt?: string;
  message?: string;
  offlineReady: boolean;
}

interface NativeBridge {
  getStatus?: () => string;
  getAppInfo?: () => string;
  checkUpdates?: (url: string) => string;
  checkForUpdates?: () => string;
  downloadContent?: (url: string) => string;
  activateContent?: () => string;
  setRoundActive?: (active: boolean) => void;
  openApkUpdate?: (url?: string, sha256?: string) => string | void;
}

declare global {
  interface Window { WorldGameNative?: NativeBridge }
}

interface CachePointer {
  cacheName: string;
  version: string;
}

const APP_VERSION = '0.1.0';
const APP_VERSION_CODE = 1;
const BUNDLED_CONTENT_VERSION = '0.1.0';
const PACKAGED_FONT_PATHS = new Set(['content/fonts/Heebo.ttf', 'content/fonts/OFL.txt']);
let status: UpdateStatus = {
  phase: 'local-only',
  appVersion: APP_VERSION,
  contentVersion: BUNDLED_CONTENT_VERSION,
  appUpdateAvailable: false,
  offlineReady: false,
};
const listeners = new Set<(value: UpdateStatus) => void>();
let roundActive = false;
let initialized: Promise<void> | undefined;
let checkPromise: Promise<UpdateStatus> | undefined;
let manifest: UpdateManifest | undefined;
let nativeManifestUrl = '';
let nativeCheckResolve: ((value: UpdateStatus) => void) | undefined;
let nativeTimeout: ReturnType<typeof setTimeout> | undefined;
let browserShellReady = false;

function bridge(): NativeBridge | undefined { return window.WorldGameNative; }
function baseUrl(): URL { return new URL('./', document.baseURI); }
function scopeTag(): string { return baseUrl().pathname.replace(/[^a-zA-Z0-9]/g, '_') || 'root'; }
function cachePrefix(): string { return `world-game-${scopeTag()}-`; }
function controlCacheName(): string { return `${cachePrefix()}control-v1`; }
function pointerUrl(pending: boolean): string {
  return new URL(pending ? '__world-game-pending-content__' : '__world-game-active-content__', baseUrl()).href;
}

function publish(patch: Partial<UpdateStatus>): UpdateStatus {
  status = { ...status, ...patch };
  for (const listener of listeners) {
    try { listener({ ...status }); } catch { /* A consumer cannot break a download. */ }
  }
  return getUpdateStatus();
}

export function getUpdateStatus(): UpdateStatus { return { ...status }; }

export function subscribeToUpdateStatus(listener: (value: UpdateStatus) => void): () => void {
  listeners.add(listener);
  listener(getUpdateStatus());
  return () => listeners.delete(listener);
}

function configuredManifestUrl(): string {
  const configured = String(import.meta.env?.VITE_UPDATE_MANIFEST_URL ?? '').trim();
  return configured || nativeManifestUrl;
}

function parseNativeJson(value: string | undefined): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value ?? '{}');
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {};
  } catch { return {}; }
}

async function readPointer(pending = false): Promise<CachePointer | undefined> {
  const control = await caches.open(controlCacheName());
  const response = await control.match(pointerUrl(pending));
  if (!response) return undefined;
  try {
    const data: unknown = await response.json();
    if (typeof data !== 'object' || !data) return undefined;
    const candidate = data as Partial<CachePointer>;
    if (typeof candidate.cacheName !== 'string' || !candidate.cacheName.startsWith(`${cachePrefix()}content-`)
      || typeof candidate.version !== 'string') return undefined;
    if (!(await caches.has(candidate.cacheName))) return undefined;
    return candidate as CachePointer;
  } catch { return undefined; }
}

function finishNativeCheck(): void {
  if (nativeTimeout) clearTimeout(nativeTimeout);
  nativeTimeout = undefined;
  nativeCheckResolve?.(getUpdateStatus());
  nativeCheckResolve = undefined;
}

function announceActivation(version: string): void {
  if (status.phase === 'updated' && status.contentVersion === version && !status.pendingContentVersion) return;
  publish({ phase: 'updated', contentVersion: version, pendingContentVersion: undefined, offlineReady: Boolean(bridge()) || browserShellReady });
  window.dispatchEvent(new CustomEvent('journey:content-updated'));
}

function nativeEvent(event: Event): void {
  const detail = (event as CustomEvent<Record<string, unknown>>).detail;
  if (!detail || typeof detail !== 'object') return;
  const eventName = detail.event;
  const eventStatus = detail.status;
  if (eventStatus === 'offline') {
    publish({ phase: 'offline', message: 'אין חיבור לרשת. התוכן המקומי זמין למשחק.' });
    finishNativeCheck();
    return;
  }
  if (eventStatus === 'error' || eventStatus === 'failed') {
    publish({ phase: navigator.onLine ? 'error' : 'offline', message: 'לא ניתן להשלים את העדכון. התוכן הקיים נשמר.' });
    finishNativeCheck();
    return;
  }
  if (eventName === 'update-check' && detail.manifest) {
    try {
      manifest = validateUpdateManifest(detail.manifest);
      publish({
        checkedAt: new Date().toISOString(),
        appUpdateAvailable: detail.appUpdateAvailable === true,
        newAppVersion: detail.appUpdateAvailable === true ? manifest.app?.version : undefined,
      });
      const info = parseNativeJson(bridge()?.getAppInfo?.());
      const code = typeof info.versionCode === 'number' ? info.versionCode : APP_VERSION_CODE;
      if (contentRequiresNewerApp(manifest, code)) {
        publish({ phase: 'requires-app-update', message: 'התוכן החדש דורש גרסה חדשה של האפליקציה.' });
        finishNativeCheck();
      } else if (detail.contentUpdateAvailable === true && bridge()?.downloadContent) {
        publish({ phase: 'downloading', pendingContentVersion: manifest.content.version });
        const started = parseNativeJson(bridge()?.downloadContent?.(configuredManifestUrl()));
        if (started.status === 'error' || started.status === 'not-configured') {
          publish({ phase: 'error', message: 'לא ניתן להוריד את העדכון כרגע. התוכן הקיים נשמר.' });
          finishNativeCheck();
        }
      } else if (detail.readyContentVersion === manifest.content.version && detail.readyContentVersion !== status.contentVersion) {
        publish({ phase: 'ready', pendingContentVersion: manifest.content.version });
        if (!roundActive) void applyPendingContentUpdate();
        finishNativeCheck();
      } else {
        publish({ phase: 'up-to-date' });
        finishNativeCheck();
      }
    } catch {
      publish({ phase: 'error', message: 'קובץ העדכון אינו תקין. התוכן הקיים נשמר.' });
      finishNativeCheck();
    }
  } else if (eventName === 'update-check' && (eventStatus === 'not-configured' || eventStatus === 'offline')) {
    publish({ phase: eventStatus === 'offline' ? 'offline' : 'local-only' });
    finishNativeCheck();
  } else if (eventName === 'content-download' && eventStatus === 'ready') {
    publish({ phase: 'ready', pendingContentVersion: String(detail.contentVersion ?? manifest?.content.version ?? '') });
    if (!roundActive) void applyPendingContentUpdate();
    finishNativeCheck();
  } else if (eventName === 'content-download' && eventStatus === 'progress') {
    publish({
      phase: 'downloading',
      downloadedFiles: typeof detail.completedFiles === 'number' ? detail.completedFiles : typeof detail.downloadedFiles === 'number' ? detail.downloadedFiles : undefined,
      totalFiles: typeof detail.totalFiles === 'number' ? detail.totalFiles : undefined,
    });
  } else if (eventName === 'content-activation' && eventStatus === 'active') {
    announceActivation(String(detail.contentVersion ?? status.pendingContentVersion ?? status.contentVersion));
  }
}

/** Installs offline support without delaying the first game screen. */
export function initializeOfflineSupport(): Promise<void> {
  initialized ??= (async () => {
    if (bridge()) {
      window.addEventListener('journey:native', nativeEvent);
      const info = parseNativeJson(bridge()?.getStatus?.() ?? bridge()?.getAppInfo?.());
      nativeManifestUrl = typeof info.updateManifestUrl === 'string' ? info.updateManifestUrl : '';
      publish({
        appVersion: String(info.appVersion ?? info.version ?? APP_VERSION),
        contentVersion: String(info.contentVersion || BUNDLED_CONTENT_VERSION),
        phase: configuredManifestUrl() ? 'idle' : 'local-only',
        offlineReady: true,
      });
      if (typeof info.readyContentVersion === 'string' && info.readyContentVersion && info.readyContentVersion !== status.contentVersion) {
        publish({ phase: 'ready', pendingContentVersion: info.readyContentVersion });
        if (!roundActive) await applyPendingContentUpdate();
      }
      return;
    }
    publish({ phase: configuredManifestUrl() ? 'idle' : 'local-only' });
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    try {
      // Listen before registration: install/activate can complete before ready resolves.
      navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
        if (event.data?.type === 'SHELL_READY') {
          browserShellReady = true;
          publish({ offlineReady: true });
        }
      });
      await navigator.serviceWorker.register(new URL('sw.js', baseUrl()), { scope: baseUrl().pathname });
      const registration = await navigator.serviceWorker.ready;
      const urls = [baseUrl().href, ...performance.getEntriesByType('resource')
        .map((entry) => entry.name).filter((url) => url.startsWith(baseUrl().href))];
      (navigator.serviceWorker.controller ?? registration.active)?.postMessage({ type: 'WARM_SHELL', urls });
      (navigator.serviceWorker.controller ?? registration.active)?.postMessage({ type: 'CHECK_OFFLINE_READY' });
      const active = await readPointer();
      const pending = await readPointer(true);
      publish({ contentVersion: active?.version ?? BUNDLED_CONTENT_VERSION, pendingContentVersion: pending?.version });
      if (pending) {
        publish({ phase: 'ready' });
        if (!roundActive) await applyPendingContentUpdate();
      }
    } catch {
      publish({ offlineReady: false });
    }
  })();
  return initialized;
}

/** Cache the locally bundled country media after the first browser visit. */
export async function cacheLocalResources(paths: readonly string[]): Promise<boolean> {
  await initializeOfflineSupport();
  if (bridge()) return true;
  if (!('caches' in globalThis)) return false;
  const local = await caches.open(`${cachePrefix()}bundled-content-v1`);
  try {
    for (const path of paths) {
      const normalized = path.replace(/^\.\//, '');
      if (!isContentPath(normalized) && !PACKAGED_FONT_PATHS.has(normalized)) throw new Error('Invalid local resource');
      const url = new URL(normalized, baseUrl()).href;
      if (await local.match(url)) continue;
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok || response.type === 'opaque') throw new Error('Resource unavailable');
      await local.put(url, response);
    }
    publish({ offlineReady: browserShellReady });
    return true;
  } catch {
    return false;
  }
}

async function stageBrowserContent(candidate: UpdateManifest): Promise<void> {
  if (!('caches' in globalThis) || !globalThis.crypto?.subtle) throw new Error('Offline storage unavailable');
  const pending = await readPointer(true);
  if (pending?.version === candidate.content.version) {
    publish({ phase: 'ready', pendingContentVersion: pending.version });
    return;
  }
  const cacheName = `${cachePrefix()}content-${Date.now().toString(36)}-${crypto.randomUUID()}`;
  const staging = await caches.open(cacheName);
  const controller = new AbortController();
  const availablePaths = new Set(candidate.content.files.map((file) => file.path));
  let nextFile = 0;
  let downloadedFiles = 0;
  publish({ phase: 'downloading', pendingContentVersion: candidate.content.version, downloadedFiles: 0, totalFiles: candidate.content.files.length });
  const worker = async () => {
    while (nextFile < candidate.content.files.length) {
      const file = candidate.content.files[nextFile++];
      const response = await fetch(file.url, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(120000)]), cache: 'no-store', redirect: 'follow' });
      if (!response.ok || response.type === 'opaque' || !isHttpsUrl(response.url)) throw new Error('Download failed');
      const bytes = await response.arrayBuffer();
      if ((file.bytes !== undefined && bytes.byteLength !== file.bytes) || !await verifySha256(bytes, file.sha256)) {
        throw new Error('Resource integrity mismatch');
      }
      if (file.path.endsWith('.json')) {
        const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
        if (file.path === 'content/catalog.json') validateCatalogResources(data, availablePaths);
      }
      const storedResponse = new Response(bytes, {
        headers: { 'Content-Type': contentMimeType(file.path) ?? 'application/octet-stream', 'Cache-Control': 'no-cache' },
      });
      await staging.put(new URL(file.path, baseUrl()).href, storedResponse);
      publish({ downloadedFiles: ++downloadedFiles });
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(3, candidate.content.files.length) }, worker));
    const control = await caches.open(controlCacheName());
    await control.put(pointerUrl(true), new Response(JSON.stringify({ cacheName, version: candidate.content.version } satisfies CachePointer)));
    if (pending && pending.cacheName !== cacheName) await caches.delete(pending.cacheName);
    publish({ phase: 'ready' });
  } catch (error) {
    controller.abort();
    await caches.delete(cacheName);
    throw error;
  }
}

async function checkBrowserUpdates(url: string): Promise<UpdateStatus> {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
  if (!response.ok || !isHttpsUrl(response.url)) throw new Error('Manifest unavailable');
  const text = await response.text();
  if (text.length > 2_000_000) throw new Error('Manifest too large');
  manifest = validateUpdateManifest(JSON.parse(text));
  const appUpdateAvailable = Boolean(manifest.app && manifest.app.versionCode > APP_VERSION_CODE);
  publish({ checkedAt: new Date().toISOString(), appUpdateAvailable, newAppVersion: appUpdateAvailable ? manifest.app?.version : undefined });
  if (contentRequiresNewerApp(manifest, APP_VERSION_CODE)) {
    return publish({ phase: 'requires-app-update', message: 'התוכן החדש דורש גרסה חדשה של האפליקציה.' });
  }
  if (manifest.content.version === status.contentVersion) return publish({ phase: 'up-to-date' });
  await stageBrowserContent(manifest);
  if (!roundActive) await applyPendingContentUpdate();
  return getUpdateStatus();
}

/** The default call is once per launch; caregiver retry can pass true. */
export function checkForUpdates(force = false): Promise<UpdateStatus> {
  if (checkPromise && !force) return checkPromise;
  if (status.phase === 'checking' || status.phase === 'downloading') return checkPromise ?? Promise.resolve(getUpdateStatus());
  checkPromise = (async () => {
    await initializeOfflineSupport();
    const url = configuredManifestUrl();
    if (!url) return publish({ phase: 'local-only' });
    if (!isHttpsUrl(url)) return publish({ phase: 'error', message: 'כתובת העדכון חייבת להיות כתובת HTTPS תקינה.' });
    if (!navigator.onLine) return publish({ phase: 'offline' });
    publish({ phase: 'checking', message: undefined });
    if (bridge()) {
      return new Promise<UpdateStatus>((resolve) => {
        nativeCheckResolve = resolve;
        nativeTimeout = setTimeout(() => {
          publish({ phase: 'error', message: 'בדיקת העדכון לא הסתיימה. אפשר להמשיך לשחק.' });
          finishNativeCheck();
        }, 120000);
        try {
          const started = parseNativeJson(bridge()?.checkUpdates?.(url) ?? bridge()?.checkForUpdates?.());
          if (started.status === 'not-configured') {
            publish({ phase: 'local-only' });
            finishNativeCheck();
          } else if (started.status === 'error' || started.status === 'offline') {
            publish({ phase: started.status === 'offline' ? 'offline' : 'error', message: 'לא ניתן לבדוק עדכונים כרגע.' });
            finishNativeCheck();
          }
        } catch {
          publish({ phase: 'error', message: 'לא ניתן לבדוק עדכונים כרגע.' });
          finishNativeCheck();
        }
      });
    }
    try {
      return await checkBrowserUpdates(url);
    } catch {
      return publish({ phase: navigator.onLine ? 'error' : 'offline', message: 'העדכון לא הושלם. התוכן הקיים נשמר ואפשר להמשיך לשחק.' });
    }
  })();
  return checkPromise;
}

/** A caller marks the beginning/end of each round, including restored rounds. */
export async function setRoundActive(active: boolean): Promise<void> {
  roundActive = active;
  bridge()?.setRoundActive?.(active);
  if (!active) await applyPendingContentUpdate();
}

export async function applyPendingContentUpdate(): Promise<boolean> {
  if (roundActive) return false;
  if (bridge()) {
    if (status.phase !== 'ready') return false;
    const result = parseNativeJson(bridge()?.activateContent?.());
    if (result.status === 'active') {
      announceActivation(String(result.contentVersion ?? status.pendingContentVersion ?? status.contentVersion));
    }
    return result.status === 'active' || result.status === 'started';
  }
  if (!('caches' in globalThis)) return false;
  const pending = await readPointer(true);
  if (!pending) return false;
  const previous = await readPointer();
  const control = await caches.open(controlCacheName());
  // This single pointer replacement is the activation boundary. Incomplete caches never become active.
  await control.put(pointerUrl(false), new Response(JSON.stringify(pending)));
  await control.delete(pointerUrl(true));
  announceActivation(pending.version);
  navigator.serviceWorker?.controller?.postMessage({ type: 'CONTENT_ACTIVATED' });
  if (previous && previous.cacheName !== pending.cacheName) {
    try { await caches.delete(previous.cacheName); } catch { /* Cleanup cannot undo a successful activation. */ }
  }
  return true;
}

/** Only called by the caregiver after reviewing the available APK update. */
export function requestAppUpdate(): boolean {
  if (!manifest?.app || !status.appUpdateAvailable) return false;
  if (bridge()?.openApkUpdate) {
    bridge()?.openApkUpdate?.(manifest.app.apkUrl, manifest.app.sha256);
    return true;
  }
  window.open(manifest.app.apkUrl, '_blank', 'noopener,noreferrer');
  return true;
}
