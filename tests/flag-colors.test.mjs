import test from 'node:test';
import assert from 'node:assert/strict';
import { countries, palette } from '../src/data/countries.ts';
import { flagPalette } from '../src/lib/flag-colors.ts';
import { acceptRegion } from '../src/game.ts';

test('every flag palette starts at one with no gaps and one number per color', () => {
  for (const country of countries) {
    const colors = flagPalette(country.flag.regions);
    assert.deepEqual(colors.map(color => color.number), Array.from({length:colors.length}, (_,index)=>index+1), country.id);
    assert.equal(colors.length, new Set(country.flag.regions.map(region=>region.colorId)).size);
    assert.ok(country.flag.regions.every(region=>colors.some(color=>color.id===region.colorId)));
  }
});

test('Israel uses blue 1 and white 2 without changing stored color identifiers', () => {
  const before = structuredClone(palette);
  const israel = countries.find(country=>country.id==='israel');
  const colors = flagPalette(israel.flag.regions);
  assert.deepEqual(colors.map(color=>({id:color.id,number:color.number})),[{id:2,number:1},{id:3,number:2}]);
  assert.deepEqual(palette,before);
  assert.deepEqual(flagPalette(israel.flag.regions),colors);
});

test('renumbering still selects only matching regions and paints one region per touch', () => {
  const israel = countries.find(country=>country.id==='israel');
  const blue = flagPalette(israel.flag.regions).find(color=>color.number===1);
  const white = flagPalette(israel.flag.regions).find(color=>color.number===2);
  const blueRegions = israel.flag.regions.filter(region=>region.colorId===blue.id);
  const whiteRegion = israel.flag.regions.find(region=>region.colorId===white.id);
  assert.deepEqual(acceptRegion([],blueRegions[0].id,blue.id,israel.flag.regions),[blueRegions[0].id]);
  assert.deepEqual(acceptRegion([],whiteRegion.id,blue.id,israel.flag.regions),[]);
  assert.deepEqual(acceptRegion([],blueRegions[0].id,white.id,israel.flag.regions),[]);
});
