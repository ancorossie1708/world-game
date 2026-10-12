import {readFile,writeFile,appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export function signingConfiguration(environment){
 if(environment.WORLD_GAME_SIGNING){
  let value;
  try{value=JSON.parse(environment.WORLD_GAME_SIGNING);}catch{throw new Error('WORLD_GAME_SIGNING must contain the complete signing JSON.');}
  if(value.schemaVersion!==1||value.storeType!=='PKCS12'||!/^[a-zA-Z0-9_-]{1,80}$/.test(value.alias||'')
   ||typeof value.password!=='string'||value.password.length<16||/[\r\n]/.test(value.password)
   ||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value.keystoreBase64||'')
   ||Buffer.from(value.keystoreBase64,'base64').length<1000||!/^[a-f0-9]{64}$/.test(value.certificateSha256||''))
    throw new Error('WORLD_GAME_SIGNING is incomplete or invalid. Copy the original JSON again.');
  return {base64:value.keystoreBase64,password:value.password,keyPassword:value.password,alias:value.alias,storeType:'PKCS12',fingerprint:value.certificateSha256};
 }
 const names=['ANDROID_KEYSTORE_BASE64','ANDROID_KEYSTORE_PASSWORD','ANDROID_KEY_ALIAS','ANDROID_KEY_PASSWORD'];
 const supplied=names.filter(name=>environment[name]);
 if(!supplied.length)return null;
 if(supplied.length!==names.length)throw new Error('The legacy signing configuration is incomplete.');
 if(names.some(name=>/[\r\n]/.test(environment[name])))throw new Error('Signing values must be single line.');
 return {base64:environment.ANDROID_KEYSTORE_BASE64,password:environment.ANDROID_KEYSTORE_PASSWORD,keyPassword:environment.ANDROID_KEY_PASSWORD,alias:environment.ANDROID_KEY_ALIAS,storeType:'JKS'};
}

async function main(){
 const configuration=signingConfiguration(process.env);
 if(!configuration){
  await appendFile(process.env.GITHUB_OUTPUT,'ready=false\n');
  await appendFile(process.env.GITHUB_STEP_SUMMARY,'Test APK only: add the WORLD_GAME_SIGNING repository secret once to enable signed automatic releases.\n');
  return;
 }
 for(const value of [configuration.base64,configuration.password,configuration.keyPassword])process.stdout.write(`::add-mask::${value}\n`);
 const path=resolve(process.env.RUNNER_TEMP,'world-game-release.'+(configuration.storeType==='PKCS12'?'p12':'jks'));
 await writeFile(path,Buffer.from(configuration.base64,'base64'),{mode:0o600,flag:'wx'});
 const variables={ANDROID_KEYSTORE_PATH:path,ANDROID_KEYSTORE_TYPE:configuration.storeType,
  ANDROID_KEYSTORE_PASSWORD:configuration.password,ANDROID_KEY_PASSWORD:configuration.keyPassword,
  ANDROID_KEY_ALIAS:configuration.alias,ANDROID_SIGNING_CERT_SHA256:configuration.fingerprint||''};
 await appendFile(process.env.GITHUB_ENV,Object.entries(variables).map(([key,value])=>`${key}=${value}\n`).join(''));
 await appendFile(process.env.GITHUB_OUTPUT,'ready=true\n');
 // Certificate fingerprints are public; private keys and passwords never become build artifacts.
 console.log('Permanent release signing configured.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
