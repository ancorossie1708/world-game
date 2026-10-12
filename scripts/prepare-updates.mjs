import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, relative, sep, extname } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const separator = arg.indexOf('=');
  return separator < 0 ? [arg.replace(/^--/, ''), true] : [arg.slice(0, separator).replace(/^--/, ''), arg.slice(separator + 1)];
}));
if (args.help || !args['base-url'] || !args['content-version']) {
  console.log('Usage: node scripts/prepare-updates.mjs --base-url=https://example.com/releases/content/ --content-version=2 [--output=release-manifest.json] [--content-dir=public/content] [--app-version=0.1.0 --app-version-code=1 --apk=path/to/app.apk --apk-url=https://example.com/app.apk]');
  process.exit(args.help ? 0 : 1);
}

function https(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) throw new Error('Release URLs must use HTTPS without credentials or query parameters.');
  return url;
}
function validVersion(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(value)) throw new Error('Invalid version.');
  return value;
}

const base = https(args['base-url']);
if (!base.pathname.endsWith('/')) base.pathname += '/';
const directory = resolve(args['content-dir'] || 'public/content');
const allowed = new Set(['.json', '.jpg', '.jpeg', '.png', '.webp', '.wav', '.mp3']);
const files = [];
async function walk(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = resolve(folder, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile()) {
      const name = relative(directory, path).split(sep).join('/');
      // Font code and its license are bundled application assets, updated through an APK.
      if (name === 'fonts/Heebo.ttf' || name === 'fonts/OFL.txt') continue;
      if (!allowed.has(extname(entry.name).toLowerCase())) throw new Error(`Unsupported content file: ${entry.name}`);
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(name)) throw new Error(`Unsafe content filename: ${name}`);
      const bytes = await readFile(path);
      files.push({ path: `content/${name}`, url: new URL(name, base).href, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
    }
  }
}
await stat(directory);
await walk(directory);
if (!files.length) throw new Error('No content resources found.');
files.sort((left, right) => left.path.localeCompare(right.path));
const manifest = { schemaVersion: 1, content: { version: validVersion(args['content-version']), files } };
if (args['min-app-version-code']) {
  const code = Number(args['min-app-version-code']);
  if (!Number.isSafeInteger(code) || code < 1) throw new Error('Invalid minimum app version code.');
  manifest.content.minAppVersionCode = code;
}
if (args.apk || args['apk-url'] || args['app-version'] || args['app-version-code']) {
  if (!args.apk || !args['apk-url'] || !args['app-version'] || !args['app-version-code']) throw new Error('App releases require --apk, --apk-url, --app-version, and --app-version-code together.');
  const code = Number(args['app-version-code']);
  if (!Number.isSafeInteger(code) || code < 1) throw new Error('Invalid app version code.');
  const bytes = await readFile(resolve(args.apk));
  manifest.app = { version: validVersion(args['app-version']), versionCode: code, apkUrl: https(args['apk-url']).href, sha256: createHash('sha256').update(bytes).digest('hex') };
}
const output = resolve(args.output || 'release-manifest.json');
await writeFile(output, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Prepared ${files.length} content resources at ${output}`);
