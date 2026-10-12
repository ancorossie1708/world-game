import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {countries,continents} from '../src/data/countries.ts';
import {parseCatalogue} from '../src/catalog.ts';

test('all six continents offer at least two countries in the default familiar group',()=>{
 assert.equal(countries.length,14);
 for(const continent of continents){
  assert.equal(continent.enabled,true,continent.id);
  assert.ok(countries.filter(c=>c.continentId===continent.id&&c.familiarity==='familiar').length>=2,continent.id);
 }
});

test('all 280 photos are distinct local JPEGs and every country covers cities, landmarks and landscapes',async()=>{
 const hashes=new Set();
 for(const country of countries){
  assert.equal(country.photos.length,20,country.id);
  assert.deepEqual([...new Set(country.photos.map(p=>p.category))].sort(),['capital','city','landmark','landscape']);
  for(const photo of country.photos){
   const bytes=await readFile(new URL(`../public/${photo.src.slice(2)}`,import.meta.url));
   assert.ok(bytes.length>1000,photo.id);
   assert.equal(bytes[0],0xff,photo.id);assert.equal(bytes[1],0xd8,photo.id);
   const hash=createHash('sha256').update(bytes).digest('hex');
   assert.ok(!hashes.has(hash),`Duplicate image: ${photo.id}`);hashes.add(hash);
  }
 }
 assert.equal(hashes.size,280);
});

test('all fourteen countries have their own local MP3 soundtrack ready for offline playback',async()=>{
 const hashes=new Set();
 for(const country of countries){
  assert.ok(!country.music.pending,country.id);
  assert.equal(country.music.src,`./content/audio/${country.id}.mp3`);
  const bytes=await readFile(new URL(`../public/${country.music.src.slice(2)}`,import.meta.url));
  assert.ok(bytes.length>1000,country.id);
  assert.ok(bytes.subarray(0,3).toString('ascii')==='ID3'||(bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0),country.id);
  const hash=createHash('sha256').update(bytes).digest('hex');
  assert.ok(!hashes.has(hash),`Duplicate soundtrack: ${country.id}`);hashes.add(hash);
 }
 const catalog=JSON.parse(await readFile(new URL('../public/content/catalog.json',import.meta.url)));
 assert.equal(parseCatalogue(catalog).length,14);
});
