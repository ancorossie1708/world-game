import {readFile,writeFile} from 'node:fs/promises';
const version=process.env.CONTENT_VERSION;
if(!/^content-[a-f0-9]{16}$/.test(version||''))throw new Error('Prepared content version is required.');
const path='dist/content/catalog.json';
const catalog=JSON.parse(await readFile(path,'utf8'));catalog.version=version;
await writeFile(path,JSON.stringify(catalog,null,2)+'\n');
console.log('Bundled catalogue stamped; the public source stays unchanged for immutable content downloads.');
