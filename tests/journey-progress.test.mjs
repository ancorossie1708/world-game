import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseUnvisitedCountry, continentProgress, getRemainingCountries } from '../src/game.ts';

const countries=[{id:'a'},{id:'b'},{id:'c'},{id:'d'}];

test('continent selection draws randomly only from countries absent from the album',()=>{
  const visited=['a','c'];
  assert.equal(chooseUnvisitedCountry(countries,visited,()=>0).id,'b');
  assert.equal(chooseUnvisitedCountry(countries,visited,()=>.49).id,'b');
  assert.equal(chooseUnvisitedCountry(countries,visited,()=>.5).id,'d');
  assert.equal(chooseUnvisitedCountry(countries,visited,()=>.999).id,'d');
  assert.deepEqual(getRemainingCountries(countries,new Set(visited)),[{id:'b'},{id:'d'}]);
  assert.deepEqual(visited,['a','c'],'selection does not change the album');
  assert.deepEqual(countries,[{id:'a'},{id:'b'},{id:'c'},{id:'d'}],'selection does not shuffle the catalogue');
});

test('a completed or empty pool never silently replays a visited country',()=>{
  assert.equal(chooseUnvisitedCountry(countries,['a','b','c','d']),undefined);
  assert.equal(chooseUnvisitedCountry([],[]),undefined);
  assert.deepEqual(continentProgress(countries,['a','b','c','d']),{total:4,visited:4,remaining:0,complete:true});
  assert.deepEqual(continentProgress([],['unknown']),{total:0,visited:0,remaining:0,complete:false});
});

test('album reset restores all countries without any hidden selection history',()=>{
  assert.equal(chooseUnvisitedCountry(countries,['a','b','c','d']),undefined);
  assert.equal(chooseUnvisitedCountry(countries,[],()=>0).id,'a');
  assert.equal(chooseUnvisitedCountry(countries,[],()=>.999).id,'d');
  assert.deepEqual(continentProgress(countries,[]),{total:4,visited:0,remaining:4,complete:false});
});

test('progress ignores duplicate visits and IDs outside the eligible pool',()=>{
  const visited=['a','a','outside','c','c'];
  assert.deepEqual(continentProgress(countries,visited),{total:4,visited:2,remaining:2,complete:false});
  const filtered=[countries[1],countries[3]];
  assert.deepEqual(continentProgress(filtered,visited),{total:2,visited:0,remaining:2,complete:false});
  assert.equal(chooseUnvisitedCountry(filtered,visited,()=>0).id,'b');
});

test('duplicate catalogue entries neither inflate totals nor weight random country selection',()=>{
  const repeated=[countries[0],countries[0],countries[1],countries[1],countries[2]];
  assert.deepEqual(continentProgress(repeated,['a']),{total:3,visited:1,remaining:2,complete:false});
  assert.deepEqual(getRemainingCountries(repeated,['a']),[{id:'b'},{id:'c'}]);
  assert.equal(chooseUnvisitedCountry(repeated,[],()=>.4).id,'b');
  assert.equal(chooseUnvisitedCountry(repeated,['a'],()=>.5).id,'c');
});
