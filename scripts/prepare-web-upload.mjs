import {readdir,readFile,mkdir,copyFile,writeFile,stat} from 'node:fs/promises';
import {resolve,relative,dirname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=resolve(root,'GITHUB_WEB_UPLOAD');
try{if((await readdir(output)).length)throw new Error('Upload folder already exists; keep it intact and choose a fresh snapshot.');}
catch(error){if(error.code!=='ENOENT')throw error;}
const rootFiles=['.gitignore','.env.example','index.html','package.json','package-lock.json','tsconfig.json','vite.config.ts','Open-Game.cmd','README.md'];
const files=[...rootFiles];
async function collect(folder){
  for(const entry of await readdir(resolve(root,folder),{withFileTypes:true})){
    const name=`${folder}/${entry.name}`;
    if(entry.isSymbolicLink())continue;
    if(entry.isDirectory()){
      if(['build','.gradle','node_modules'].includes(entry.name)||name==='android/app/src/main/assets/www')continue;
      await collect(name);
    }else if(entry.isFile()&&entry.name!=='local.properties'&&!/\.(?:jks|keystore)$/i.test(entry.name))files.push(name);
  }
}
for(const folder of ['src','scripts','tests','android','public','docs','.github'])await collect(folder);
const photos=files.filter(name=>name.startsWith('public/content/photos/')).sort();
const finishing=files.filter(name=>name.startsWith('.github/')||name.startsWith('docs/screenshots/')||/^(?:docs\/audio\/).+\.(?:wav|mp3)$/.test(name)).sort();
const reserved=new Set([...photos,...finishing]);
const core=files.filter(name=>!reserved.has(name)).sort();
const groups=[{name:'01_GAME_FILES',files:core},{name:'02_PHOTOS',files:photos.slice(0,60)},{name:'03_PHOTOS',files:photos.slice(60)},{name:'04_FINISH',files:finishing}];
for(const group of groups){
  if(group.files.length>100)throw new Error(`${group.name} exceeds GitHub's 100-file upload limit.`);
  for(const name of group.files){
    if((await stat(resolve(root,name))).size>25*1024*1024)throw new Error(`${name} exceeds GitHub's per-file browser limit.`);
  }
}
const manifest=[];
for(const group of groups){
  for(const name of group.files){
    const destination=resolve(output,group.name,name);
    if(relative(output,destination).startsWith('..'+sep))throw new Error('Unsafe destination');
    await mkdir(dirname(destination),{recursive:true});
    await copyFile(resolve(root,name),destination);
    const bytes=await readFile(destination);
    manifest.push({group:group.name,path:name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
  }
}
await writeFile(resolve(output,'upload-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(resolve(output,'START_HERE.txt'),`העלאה דרך אתר GitHub בלבד\n\nהמאגר: https://github.com/ancorossie1708/world-game\n\nהעלו את ארבע הקבוצות לפי הסדר. לכל קבוצה:\n1. פתחו את המאגר ובחרו Upload files.\n2. פתחו בסייר הקבצים את תיקיית הקבוצה.\n3. סמנו את כל התוכן שבתוכה (Ctrl+A) וגררו אותו לאזור ההעלאה.\n4. חשוב: גוררים את התוכן, ולא את תיקיית הקבוצה עצמה.\n5. ודאו ששמות הקבצים מתחילים ב-src/, public/, android/ וכדומה; ללא 01_GAME_FILES לפני הנתיב.\n6. לחצו Commit changes.\n7. לקבוצה הבאה בחרו Add file → Upload files.\n\nקבוצת 04_FINISH כוללת את תהליך הבנייה ותעלה אחרונה, אחרי שכל התמונות הועלו.\n\nאין להעלות את START_HERE.txt או upload-manifest.json מהתיקייה הראשית. אלה הוראות ורשימת בדיקה בלבד.\n\n${groups.map(group=>`${group.name}: ${group.files.length} קבצים`).join('\n')}\n`);
console.log(JSON.stringify({output,groups:groups.map(group=>({name:group.name,files:group.files.length})),total:manifest.length}));
