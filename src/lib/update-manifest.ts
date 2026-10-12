export interface AppRelease {
  version: string;
  versionCode: number;
  apkUrl: string;
  sha256: string;
}

export interface ContentFile {
  path: string;
  url: string;
  sha256: string;
  bytes?: number;
}

export interface UpdateManifest {
  schemaVersion: 1;
  app?: AppRelease;
  content: {
    version: string;
    minAppVersionCode?: number;
    files: ContentFile[];
  };
}

export const ASSET_MIME_TYPES: Record<string, string> = {
  json: 'application/json',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function version(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(value);
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function digest(value: unknown): value is string {
  return typeof value === 'string' && /^[a-fA-F0-9]{64}$/.test(value);
}

export function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
}

export function contentMimeType(path: string): string | undefined {
  return ASSET_MIME_TYPES[path.split('.').pop()?.toLowerCase() ?? ''];
}

/** Only fixed media/data paths are accepted; updates cannot add executable code. */
export function isContentPath(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 240) return false;
  if (!/^content\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(value)) return false;
  if (value.split('/').some((part) => !part || part === '.' || part === '..')) return false;
  return Boolean(contentMimeType(value));
}

export function validateUpdateManifest(value: unknown): UpdateManifest {
  if (!record(value) || value.schemaVersion !== 1 || !record(value.content)) {
    throw new Error('Unsupported update manifest');
  }
  const source = value.content;
  if (!version(source.version) || !Array.isArray(source.files) || source.files.length === 0 || source.files.length > 10000) {
    throw new Error('Invalid content manifest');
  }
  if (source.minAppVersionCode !== undefined && !positiveInteger(source.minAppVersionCode)) {
    throw new Error('Invalid minimum app version');
  }
  const seen = new Set<string>();
  const files: ContentFile[] = source.files.map((item: unknown) => {
    if (!record(item) || !isContentPath(item.path) || !isHttpsUrl(item.url) || !digest(item.sha256)) {
      throw new Error('Unsafe content resource');
    }
    if (seen.has(item.path)) throw new Error('Duplicate content resource');
    seen.add(item.path);
    if (item.bytes !== undefined && (!positiveInteger(item.bytes) || item.bytes > 1_000_000_000)) {
      throw new Error('Invalid content resource size');
    }
    return { path: item.path, url: item.url, sha256: item.sha256.toLowerCase(), ...(item.bytes !== undefined ? { bytes: item.bytes } : {}) };
  });
  let app: AppRelease | undefined;
  if (value.app !== undefined) {
    if (!record(value.app) || !version(value.app.version) || !positiveInteger(value.app.versionCode)
      || !isHttpsUrl(value.app.apkUrl) || !digest(value.app.sha256)) {
      throw new Error('Invalid app update');
    }
    app = {
      version: value.app.version,
      versionCode: value.app.versionCode,
      apkUrl: value.app.apkUrl,
      sha256: value.app.sha256.toLowerCase(),
    };
  }
  return {
    schemaVersion: 1,
    ...(app ? { app } : {}),
    content: {
      version: source.version,
      ...(source.minAppVersionCode !== undefined ? { minAppVersionCode: source.minAppVersionCode } : {}),
      files,
    },
  };
}

export function contentRequiresNewerApp(manifest: UpdateManifest, appVersionCode: number): boolean {
  return (manifest.content.minAppVersionCode ?? 1) > appVersionCode;
}

/** A catalog must only reference media contained in the same complete batch. */
export function validateCatalogResources(value: unknown, availablePaths: ReadonlySet<string>): void {
  if (!record(value) || value.schemaVersion !== 1 || !Array.isArray(value.countries) || value.countries.length === 0) {
    throw new Error('Invalid country catalog');
  }
  const ids = new Set<string>();
  const validateSource = (source: unknown) => {
    if (typeof source !== 'string') throw new Error('Invalid catalog media');
    const path = source.replace(/^\.\//, '');
    if (!isContentPath(path) || !availablePaths.has(path)) throw new Error('Catalog resource missing from content batch');
  };
  for (const country of value.countries) {
    if (!record(country) || typeof country.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(country.id)
      || ids.has(country.id) || !Array.isArray(country.photos) || country.photos.length === 0 || !record(country.music)) {
      throw new Error('Invalid country entry');
    }
    ids.add(country.id);
    for (const photo of country.photos) {
      if (!record(photo)) throw new Error('Invalid country photo');
      validateSource(photo.src);
    }
    validateSource(country.music.src);
  }
}

export async function verifySha256(bytes: ArrayBuffer, expected: string): Promise<boolean> {
  const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const actual = [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return actual === expected.toLowerCase();
}
