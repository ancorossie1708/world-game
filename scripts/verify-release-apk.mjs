import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {X509Certificate} from 'node:crypto';

const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;
if(!sdk)throw new Error('Android SDK is unavailable.');
const apk=resolve('apk-artifacts/release/world-game.apk');
const certificate=new X509Certificate(await readFile(resolve(process.env.RUNNER_TEMP,'world-game-release-cert.pem')));
const expected=certificate.fingerprint256.replaceAll(':','').toLowerCase();
const permanent=(await readFile('android/signing-certificate.sha256','utf8')).trim();
if(!/^[a-f0-9]{64}$/.test(permanent)||permanent!==expected)throw new Error('The signing identity changed. The permanent certificate must be retained for Android updates.');
if(process.env.ANDROID_SIGNING_CERT_SHA256&&process.env.ANDROID_SIGNING_CERT_SHA256!==expected)throw new Error('The signing certificate does not match the permanent identity.');
const verification=spawnSync(resolve(sdk,'build-tools/35.0.0/apksigner'),['verify','--verbose','--print-certs',apk],{encoding:'utf8'});
if(verification.status!==0)throw new Error('APK signature verification failed.');
const actual=/Signer #1 certificate SHA-256 digest: ([a-f0-9]{64})/i.exec(verification.stdout)?.[1].toLowerCase();
if(actual!==expected)throw new Error('The APK was signed by a different identity.');
console.log('APK signature verified against the permanent certificate: '+expected);
