import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptRegion,chooseCountry,makeAnswers } from '../src/game.ts';

test('a tap paints only its region, never other regions with the same number',()=>{
  const regions=[{id:'top',colorId:2},{id:'bottom',colorId:2},{id:'center',colorId:3}];
  assert.deepEqual(acceptRegion([],'top',2,regions),['top']);
  assert.deepEqual(acceptRegion(['top'],'bottom',2,regions),['top','bottom']);
  assert.deepEqual(acceptRegion(['top'],'center',2,regions),['top']);
  assert.deepEqual(acceptRegion(['top'],'top',2,regions),['top']);
  assert.deepEqual(acceptRegion([],'invalid',2,regions),[]);
});
test('country selection handles an empty selection and avoids immediate repeats',()=>{
  const countries=[{id:'a'},{id:'b'},{id:'c'}];
  assert.equal(chooseCountry([],undefined,()=>0),null);
  assert.equal(chooseCountry(countries,'a',()=>0).id,'b');
  assert.equal(chooseCountry([{id:'a'}],'a',()=>0).id,'a');
});
test('quiz has exactly four different countries including the correct one',()=>{
  const countries=Array.from({length:6},(_,index)=>({id:String(index)}));
  const answers=makeAnswers(countries[2],countries,()=>.5);
  assert.equal(answers.length,4);
  assert.equal(new Set(answers.map(c=>c.id)).size,4);
  assert.ok(answers.some(c=>c.id==='2'));
});
