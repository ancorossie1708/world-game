import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {releasePlan,contentVersion} from '../scripts/prepare-release.mjs';
import {signingConfiguration} from '../scripts/configure-signing.mjs';

const base={repository:'ancorossie1708/world-game',sha:'a'.repeat(40),runNumber:10};

test('signed releases always increase Android version codes, including retries',()=>{
 const first=releasePlan(base),retry=releasePlan({...base,runAttempt:2}),next=releasePlan({...base,runNumber:11});
 assert.ok(first.code<retry.code&&retry.code<next.code);
 assert.notEqual(first.tag,retry.tag);
 assert.notEqual(first.tag,next.tag);
 assert.equal(first.manifestUrl,'https://github.com/ancorossie1708/world-game/releases/latest/download/release-manifest.json');
 assert.ok(first.apkUrl.includes(`/releases/download/${first.tag}/world-game.apk`));
 assert.ok(first.contentBase.includes('/'+'a'.repeat(40)+'/public/content/'));
});

test('invalid version values and mutable media refs cannot enter a release',()=>{
 for(const patch of [{runNumber:0},{runAttempt:100},{runNumber:21474837},{sha:'main'},{requestedVersion:'x\nAPP=evil'},{requestedVersion:'$(command)'},{repository:'owner/repo?token=x'}])assert.throws(()=>releasePlan({...base,...patch}));
});

test('content hashes ignore the bundled version stamp but change with actual content',async()=>{
 const prefix=resolve(tmpdir(),'world-game-release-tests-');const directory=await mkdtemp(prefix);
 try{
  await writeFile(resolve(directory,'catalog.json'),JSON.stringify({schemaVersion:1,version:'0.1.0',countries:[{id:'egypt'}]}));
  await mkdir(resolve(directory,'fonts'));await writeFile(resolve(directory,'fonts/Heebo.ttf'),'old font');
  await writeFile(resolve(directory,'photo.jpg'),'original content');
  const first=await contentVersion(directory);
  await writeFile(resolve(directory,'catalog.json'),JSON.stringify({schemaVersion:1,version:first,countries:[{id:'egypt'}]}));
  assert.equal(await contentVersion(directory),first,'stamping the APK must not force a redundant content download');
  await writeFile(resolve(directory,'fonts/Heebo.ttf'),'new font');
  assert.equal(await contentVersion(directory),first,'fonts are changed through APKs');
  await writeFile(resolve(directory,'photo.jpg'),'replacement content');
  assert.notEqual(await contentVersion(directory),first);
 }finally{
  assert.ok(directory.startsWith(prefix));await rm(directory,{recursive:true,force:true});
 }
});

function secret(patch={}){return JSON.stringify({schemaVersion:1,storeType:'PKCS12',alias:'world-game',password:'test-password-with-enough-characters',keystoreBase64:Buffer.alloc(1500,1).toString('base64'),certificateSha256:'a'.repeat(64),...patch});}

test('one signing secret supplies a fixed PKCS12 identity and never silently falls back',()=>{
 assert.equal(signingConfiguration({}),null);
 const config=signingConfiguration({WORLD_GAME_SIGNING:secret()});
 assert.equal(config.storeType,'PKCS12');assert.equal(config.alias,'world-game');
 assert.equal(config.password,config.keyPassword);assert.equal(config.fingerprint,'a'.repeat(64));
 for(const patch of [{schemaVersion:2},{alias:'unsafe\nvalue'},{password:'short'},{certificateSha256:''},{keystoreBase64:'bad data'}])assert.throws(()=>signingConfiguration({WORLD_GAME_SIGNING:secret(patch)}));
 assert.throws(()=>signingConfiguration({WORLD_GAME_SIGNING:'broken',ANDROID_KEYSTORE_BASE64:'legacy'}));
 assert.throws(()=>signingConfiguration({ANDROID_KEYSTORE_BASE64:'partial'}));
});
