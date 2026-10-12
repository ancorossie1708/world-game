import {createHash} from 'node:crypto';
import {readdir,readFile,writeFile,appendFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {pathToFileURL} from 'node:url';

export function releasePlan({repository,sha,runNumber,runAttempt=1,requestedVersion=''}){
 if(!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repository||''))throw new Error('Invalid repository.');
 if(!/^[a-f0-9]{40}$/.test(sha||''))throw new Error('Release content must use a full immutable commit SHA.');
 const run=Number(runNumber),attempt=Number(runAttempt),code=run*100+attempt;
 if(!Number.isSafeInteger(run)||run<1||!Number.isSafeInteger(attempt)||attempt<1||attempt>99||code>2147483647)throw new Error('Invalid increasing version code.');
 const version=requestedVersion||`0.1.${run}`;
 if(typeof version!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,59}$/.test(version))throw new Error('Invalid app version.');
 const tag=`v${version}-build.${code}`;
 const base=`https://github.com/${repository}`;
 return {version,code,tag,manifestUrl:`${base}/releases/latest/download/release-manifest.json`,
  apkUrl:`${base}/releases/download/${tag}/world-game.apk`,contentBase:`https://raw.githubusercontent.com/${repository}/${sha}/public/content/`};
}

export async function contentVersion(directory){
 const files=[];
 async function walk(folder){
  for(const entry of await readdir(folder,{withFileTypes:true})){
   const path=resolve(folder,entry.name);
   if(entry.isDirectory())await walk(path);
   else if(entry.isFile()){
    const name=relative(directory,path).replaceAll('\\','/');
    if(name==='fonts/Heebo.ttf'||name==='fonts/OFL.txt')continue;
    files.push({name,path});
   }
  }
 }
 await walk(directory);files.sort((a,b)=>a.name.localeCompare(b.name));
 const hash=createHash('sha256');
 for(const file of files){
  let bytes=await readFile(file.path);
  if(file.name==='catalog.json'){
   const catalog=JSON.parse(bytes);delete catalog.version;
   bytes=Buffer.from(JSON.stringify(catalog));
  }
  hash.update(file.name+'\0');hash.update(bytes);
 }
 return 'content-'+hash.digest('hex').slice(0,16);
}

async function main(){
 const plan=releasePlan({repository:process.env.GITHUB_REPOSITORY,sha:process.env.GITHUB_SHA,
  runNumber:process.env.GITHUB_RUN_NUMBER,runAttempt:process.env.GITHUB_RUN_ATTEMPT,requestedVersion:process.env.REQUESTED_VERSION||''});
 const version=await contentVersion(resolve('public/content'));
 const variables={APP_VERSION:plan.version,APP_VERSION_CODE:plan.code,APP_RELEASE_TAG:plan.tag,CONTENT_VERSION:version,
  CONTENT_BASE_URL:plan.contentBase,APK_RELEASE_URL:plan.apkUrl,WORLD_GAME_MANIFEST_URL:plan.manifestUrl,
  VITE_UPDATE_MANIFEST_URL:plan.manifestUrl,VITE_APP_VERSION:plan.version,VITE_APP_VERSION_CODE:plan.code,VITE_CONTENT_VERSION:version};
 await appendFile(process.env.GITHUB_ENV,Object.entries(variables).map(([key,value])=>`${key}=${value}\n`).join(''));
 await appendFile(process.env.GITHUB_OUTPUT,`version=${plan.version}\nversion_code=${plan.code}\ntag=${plan.tag}\ncontent_version=${version}\n`);
 console.log('App and bundled content versions prepared for a signed release.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
