import fs from 'node:fs';
import path from 'node:path';
const dir=path.resolve('dist');
const walk=(d)=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.relative(dir,path.join(d,e.name)).replaceAll('\\','/')]);
const files=walk(dir).filter(p=>!p.endsWith('.map') && p!=='sw.js');
const cacheName='playlab-offline-v6';
const script=`const CACHE=${JSON.stringify(cacheName)};\nconst FILES=${JSON.stringify(['./',...files.map(f=>'./'+f)])};\nself.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});\nself.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE && k.startsWith('playlab-offline')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});\nself.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{if(r.ok){const clone=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,clone))}return r})))})`;
fs.writeFileSync(path.join(dir,'sw.js'),script);
console.log('Built offline service worker for', files.length,'files.');
