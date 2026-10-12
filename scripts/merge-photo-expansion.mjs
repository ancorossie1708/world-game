import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { parseCatalogue } from '../src/catalog.ts';

const root=resolve(import.meta.dirname,'..');
const stagedPaths=process.argv.slice(2);
if(!stagedPaths.length)throw new Error('Provide staged photo metadata JSON files.');
const sourcePath=resolve(root,'src/data/countries.ts');
const catalogPath=resolve(root,'public/content/catalog.json');
const creditsPath=resolve(root,'public/content/credits.json');
const originals=await Promise.all([sourcePath,catalogPath,creditsPath].map(path=>readFile(path,'utf8')));
let source=originals[0].replaceAll('\r\n','\n');
const catalog=JSON.parse(originals[1]);
const credits=JSON.parse(originals[2]);
const staged=(await Promise.all(stagedPaths.map(async path=>JSON.parse(await readFile(resolve(root,path),'utf8'))))).flat();
if(!staged.every(item=>item&&typeof item.countryId==='string'))throw new Error('Invalid staging format.');
const fields=['id','src','caption','category','sourceURL','creator','license','licenseURL','changes'];
const existingIds=new Set(catalog.countries.flatMap(country=>country.photos.map(photo=>photo.id)));
for(const item of staged){
  const country=catalog.countries.find(country=>country.id===item.countryId);
  if(!country||existingIds.has(item.id))throw new Error(`Unknown country or duplicate photo: ${item.id}`);
  const photo=Object.fromEntries(fields.map(field=>[field,item[field]]));
  country.photos.push(photo);existingIds.add(photo.id);
}
if(!parseCatalogue(catalog)||catalog.countries.some(country=>country.photos.length!==20))throw new Error('The final catalogue must contain 20 valid photographs for every country.');
const hashes=new Set();
const sources=new Set();
for(const country of catalog.countries){
  for(const photo of country.photos){
    const file=resolve(root,'public',photo.src.slice(2));
    const bytes=await readFile(file);
    if(bytes[0]!==0xff||bytes[1]!==0xd8||bytes.length<1000)throw new Error(`Invalid local JPEG: ${photo.id}`);
    const hash=createHash('sha256').update(bytes).digest('hex');
    const primarySource=decodeURIComponent(new URL(photo.sourceURL).pathname).replaceAll(' ','_');
    if(hashes.has(hash)||sources.has(primarySource))throw new Error(`Duplicate photograph: ${photo.id}`);
    hashes.add(hash);sources.add(primarySource);
  }
  const countryStart=source.indexOf(`    id: '${country.id}',`);
  const arrayStart=source.indexOf('    photos: [\n',countryStart);
  const arrayEnd=source.indexOf('\n    ],\n    music:',arrayStart);
  if(countryStart<0||arrayStart<0||arrayEnd<0)throw new Error(`Country source boundary missing: ${country.id}`);
  const added=staged.filter(item=>item.countryId===country.id).map(item=>Object.fromEntries(fields.map(field=>[field,item[field]])));
  const lines=added.map(photo=>`      ${JSON.stringify(photo)},`).join('\n');
  source=source.slice(0,arrayEnd)+`\n${lines}`+source.slice(arrayEnd);
}
credits.photos=catalog.countries.flatMap(country=>country.photos);
const backup=resolve(root,'.work/pre-photo-expansion');
await mkdir(backup,{recursive:true});
await Promise.all(['countries.ts','catalog.json','credits.json'].map((name,index)=>writeFile(resolve(backup,name),originals[index])));
await writeFile(sourcePath,source);
await writeFile(catalogPath,JSON.stringify(catalog,null,2)+'\n');
await writeFile(creditsPath,JSON.stringify(credits,null,2)+'\n');
console.log(`Merged ${staged.length} additions: ${hashes.size} distinct local photographs with synchronized credits.`);
