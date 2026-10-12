import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const dist = resolve(process.argv[2] || 'dist');
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile() && entry.name !== 'offline-precache.json' && !entry.name.endsWith('.map')) {
      const name = relative(dist, path).split(sep).join('/');
      if (name === 'sw.js' || name.endsWith('.apk')) continue;
      files.push(name);
    }
  }
}
await stat(dist);
await walk(dist);
files.sort();
await writeFile(resolve(dist, 'offline-precache.json'), JSON.stringify({ schemaVersion: 1, files }, null, 2) + '\n');
const buildHash = createHash('sha256');
for (const file of files) {
  buildHash.update(file + '\0');
  buildHash.update(await readFile(resolve(dist, file)));
}
const buildId = buildHash.digest('hex').slice(0, 16);
const swPath = resolve(dist, 'sw.js');
const worker = (await readFile(swPath, 'utf8')).replace(/^self\.WORLD_GAME_BUILD = "[a-f0-9]+";\r?\n/, '');
await writeFile(swPath, `self.WORLD_GAME_BUILD = "${buildId}";\n${worker}`);
console.log(`Offline index includes ${files.length} packaged files.`);
