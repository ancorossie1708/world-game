import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateUpdateManifest, validateCatalogResources, isContentPath, isHttpsUrl, contentRequiresNewerApp, verifySha256 } from '../src/lib/update-manifest.ts';

function manifest(path = 'content/photos/japan-capital.jpg') {
  return { schemaVersion: 1, content: { version: '2', files: [{ path, url: 'https://example.com/japan.jpg', sha256: 'a'.repeat(64), bytes: 12 }] } };
}

test('manifests permit media and data, but reject code, traversal, and insecure URLs', () => {
  assert.equal(isContentPath('content/photos/japan-capital.jpg'), true);
  for (const path of ['content/../app.js', 'content/flags.svg', 'content/app.js', 'content/a.html', '/content/a.png', 'content//a.png', 'content/%2e%2e/a.png']) {
    assert.equal(isContentPath(path), false, path);
    assert.throws(() => validateUpdateManifest(manifest(path)));
  }
  assert.equal(isHttpsUrl('http://example.com/a.jpg'), false);
  assert.equal(isHttpsUrl('https://name:password@example.com/a.jpg'), false);
  const insecure = manifest();
  insecure.content.files[0].url = 'http://example.com/a.jpg';
  assert.throws(() => validateUpdateManifest(insecure));
});

test('duplicate paths and invalid checksum prevent partial content staging', () => {
  const duplicate = manifest();
  duplicate.content.files.push({ ...duplicate.content.files[0] });
  assert.throws(() => validateUpdateManifest(duplicate), /Duplicate/);
  const checksum = manifest();
  checksum.content.files[0].sha256 = 'broken';
  assert.throws(() => validateUpdateManifest(checksum));
});

test('new content can require a newer app, and app releases need a checked APK', () => {
  const value = manifest();
  value.content.minAppVersionCode = 2;
  assert.equal(contentRequiresNewerApp(validateUpdateManifest(value), 1), true);
  assert.equal(contentRequiresNewerApp(validateUpdateManifest(value), 2), false);
  value.app = { version: '0.2.0', versionCode: 2, apkUrl: 'https://example.com/app.apk', sha256: 'B'.repeat(64) };
  assert.equal(validateUpdateManifest(value).app.sha256, 'b'.repeat(64));
  value.app.apkUrl = 'javascript:alert(1)';
  assert.throws(() => validateUpdateManifest(value));
});

test('SHA-256 verification detects a single changed byte', async () => {
  const bytes = new TextEncoder().encode('downloaded country resource');
  const hash = createHash('sha256').update(bytes).digest('hex');
  assert.equal(await verifySha256(bytes.buffer, hash), true);
  bytes[0] ^= 1;
  assert.equal(await verifySha256(bytes.buffer, hash), false);
});

test('a new catalog cannot activate with missing or external country media', () => {
  const photoPath = 'content/photos/japan-capital.jpg';
  const musicPath = 'content/audio/japan.wav';
  const value = { schemaVersion: 1, countries: [{ id: 'japan', photos: [{ src: `./${photoPath}` }], music: { src: `./${musicPath}` } }] };
  const all = new Set([photoPath, musicPath]);
  assert.doesNotThrow(() => validateCatalogResources(value, all));
  assert.throws(() => validateCatalogResources(value, new Set([photoPath])), /missing/);
  value.countries[0].music.src = 'https://external.example/japan.mp3';
  assert.throws(() => validateCatalogResources(value, all), /missing/);
});
