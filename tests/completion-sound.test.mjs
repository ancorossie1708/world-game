import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

let importId=0;
const fresh=()=>import(`../src/lib/completion-sound.ts?test=${++importId}`);
function install(Constructor){
  const original=Object.getOwnPropertyDescriptor(globalThis,'Audio');
  Object.defineProperty(globalThis,'Audio',{configurable:true,value:Constructor});
  return ()=>{if(original)Object.defineProperty(globalThis,'Audio',original);else delete globalThis.Audio;};
}
function mock(){
  const players=[];
  class Player{
    currentTime=0; paused=true;
    constructor(src){this.src=src;players.push(this);}
    play(){this.paused=false;return new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});}
    pause(){this.paused=true;}
    removeAttribute(name){if(name==='src')this.src='';}
    load(){}
  }
  return {Player,players};
}

test('victory uses the bundled MP3 at reduced volume and lets the complete clip play',async()=>{
  const {Player,players}=mock();const restore=install(Player);
  try{
    const {playCompletionSound}=await fresh();playCompletionSound();
    const player=players[0];assert.equal(player.src,'./content/audio/victory.mp3');assert.equal(player.volume,0.3);
    player.resolve();await Promise.resolve();assert.equal(player.paused,false);
    player.onended();assert.equal(player.paused,true);assert.equal(player.src,'');
    const bytes=await readFile(new URL('../public/content/audio/victory.mp3',import.meta.url));
    assert.ok(bytes.length>1000);
  }finally{restore();}
});

test('repeated wins replace the old clip and a late old promise cannot stop the new one',async()=>{
  const {Player,players}=mock();const restore=install(Player);
  try{
    const {playCompletionSound}=await fresh();playCompletionSound();playCompletionSound();
    assert.equal(players[0].paused,true);assert.equal(players[1].paused,false);
    players[0].resolve();await Promise.resolve();assert.equal(players[1].paused,false);
    players[1].resolve();await Promise.resolve();assert.equal(players[1].paused,false);
  }finally{restore();}
});

test('leaving cancels pending playback and resets the clip',async()=>{
  const {Player,players}=mock();const restore=install(Player);
  try{
    const {playCompletionSound,stopCompletionSound}=await fresh();playCompletionSound();
    stopCompletionSound();players[0].resolve();await Promise.resolve();
    assert.equal(players[0].paused,true);assert.equal(players[0].currentTime,0);assert.equal(players[0].src,'');
  }finally{restore();}
});

test('missing media support or rejected playback do not interrupt play',async()=>{
  for(const Constructor of [undefined,class{constructor(){throw new Error('Unavailable');}}]){
    const restore=install(Constructor);try{const sound=await fresh();assert.doesNotThrow(sound.playCompletionSound);assert.doesNotThrow(sound.stopCompletionSound);}finally{restore();}
  }
  const {Player,players}=mock();const restore=install(Player);
  try{const sound=await fresh();sound.playCompletionSound();players[0].reject(new Error('Denied'));await Promise.resolve();await Promise.resolve();assert.equal(players[0].paused,true);}finally{restore();}
});
