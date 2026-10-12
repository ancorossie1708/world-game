import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const supportedCountries = new Set(['japan', 'france', 'italy', 'germany', 'ukraine', 'israel']);
const metadataFields = ['title', 'inspiration', 'creator', 'license'];

export async function replaceMusic({ root, countryId, file, metadata, dryRun = false }) {
  if (!supportedCountries.has(countryId)) throw new Error('Unknown country. Use japan, france, italy, germany, ukraine, or israel.');
  const extension = extname(file || '').toLowerCase();
  if (!['.mp3', '.wav'].includes(extension)) throw new Error('The local audio file must be MP3 or WAV.');
  for (const field of metadataFields) {
    if (typeof metadata?.[field] !== 'string' || !metadata[field].trim() || metadata[field].length > 500) {
      throw new Error(`Provide a nonempty ${field} (maximum 500 characters).`);
    }
  }
  if (metadata.licenseURL) {
    const url = new URL(metadata.licenseURL);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('licenseURL must be an HTTPS URL without credentials.');
  }
  const bytes = await readFile(resolve(file));
  if (bytes.length < 12 || bytes.length > 30 * 1024 * 1024) throw new Error('Audio must be between 12 bytes and 30 MB.');
  const wave = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WAVE';
  const mp3 = bytes.toString('ascii', 0, 3) === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  if ((extension === '.wav' && !wave) || (extension === '.mp3' && !mp3)) throw new Error('Audio header does not match its filename extension.');

  const projectRoot = resolve(root);
  const sourcePath = resolve(projectRoot, 'src/data/countries.ts');
  const catalogPath = resolve(projectRoot, 'public/content/catalog.json');
  const creditsPath = resolve(projectRoot, 'public/content/credits.json');
  const [source, catalogText, creditsText] = await Promise.all([readFile(sourcePath, 'utf8'), readFile(catalogPath, 'utf8'), readFile(creditsPath, 'utf8')]);
  const catalog = JSON.parse(catalogText);
  const credits = JSON.parse(creditsText);
  const catalogMatches = catalog.countries?.filter(country => country.id === countryId) || [];
  const creditMatches = credits.music?.filter(item => item.countryId === countryId) || [];
  if (catalogMatches.length !== 1 || creditMatches.length !== 1) throw new Error('Catalogue and music credits must each contain exactly one matching country.');

  // Country music is kept on one line so replacing it cannot alter flag or photo data.
  const countryStart = new RegExp(`^    id: '${countryId}',`, 'm').exec(source);
  if (!countryStart) throw new Error('Country source entry was not found.');
  const countryEnd = source.indexOf('\n  },', countryStart.index);
  if (countryEnd < 0) throw new Error('Country source boundary was not found.');
  const countryBlock = source.slice(countryStart.index, countryEnd);
  const musicLines = [...countryBlock.matchAll(/^    music: [^\r\n]+,\r?$/gm)];
  if (musicLines.length !== 1) throw new Error('Expected one single-line music entry in the source; no files were changed.');
  const music = { src: `./content/audio/${countryId}${extension}` };
  for (const field of metadataFields) music[field] = metadata[field].trim();
  const musicMatch = musicLines[0];
  const lineStart = countryStart.index + musicMatch.index;
  const lineEnding = musicMatch[0].endsWith('\r') ? '\r' : '';
  const newSource = source.slice(0, lineStart) + `    music: ${JSON.stringify(music)},${lineEnding}` + source.slice(lineStart + musicMatch[0].length);
  catalogMatches[0].music = music;
  const credit = { countryId, ...music };
  if (metadata.licenseURL) credit.licenseURL = metadata.licenseURL;
  credits.music = credits.music.map(item => item.countryId === countryId ? credit : item);
  credits.note = 'Music credits and photo licenses are listed per item.';
  const destination = resolve(projectRoot, `public/content/audio/${countryId}${extension}`);
  const report = { countryId, destination, bytes: bytes.length, music, dryRun };
  if (dryRun) return report;

  // Validate every input before making any changes. Old audio is retained as a fallback.
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
  await writeFile(sourcePath, newSource);
  await writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  await writeFile(creditsPath, JSON.stringify(credits, null, 2) + '\n');
  return report;
}

async function main() {
  const args = {};
  for (const argument of process.argv.slice(2)) {
    if (!argument.startsWith('--')) throw new Error('Arguments must use --name=value.');
    const separator = argument.indexOf('=');
    const name = argument.slice(2, separator < 0 ? undefined : separator);
    if (!['help', 'country', 'file', 'title', 'inspiration', 'creator', 'license', 'license-url', 'dry-run', 'root'].includes(name)) throw new Error(`Unknown argument: ${name}`);
    args[name] = separator < 0 ? true : argument.slice(separator + 1);
  }
  if (args.help) {
    console.log('node scripts/replace-music.mjs --country=israel --file="C:/Music/israel.mp3" --title="..." --inspiration="..." --creator="..." --license="..." [--license-url=https://...] [--dry-run]');
    return;
  }
  const report = await replaceMusic({
    root: args.root || resolve(dirname(fileURLToPath(import.meta.url)), '..'),
    countryId: args.country, file: args.file,
    metadata: { title: args.title, inspiration: args.inspiration, creator: args.creator, license: args.license, licenseURL: args['license-url'] },
    dryRun: args['dry-run'] === true,
  });
  console.log(JSON.stringify(report, null, 2));
  console.log(report.dryRun ? 'Validation passed. No files were changed.' : 'Audio, source catalogue, downloadable catalogue, and credits updated. Rebuild the app and prepare a new content release before publishing.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
