import assert from 'node:assert/strict';
import {PlayLabRoom} from '../workers/worker.mjs';

/** Basic backend protocol tests without needing Cloudflare runtime or secrets. */
const data=new Map();
const ctx={storage:{
 get:async key=>data.get(key),
 put:async(key,value)=>{data.set(key,value)},
 setAlarm:async()=>{},
 deleteAll:async()=>data.clear()
}};
const room=new PlayLabRoom(ctx);
const request=()=>new Request('https://room.internal/quota',{method:'POST'});
for(let i=0;i<24;i++)assert.equal((await room.fetch(request())).status,200,'valid request '+i);
assert.equal((await room.fetch(request())).status,429,'25th room request is rejected');
data.set('quota',{count:24,resetAt:Date.now()-1000});
assert.equal((await room.fetch(request())).status,200,'expired quota window resets');
console.log('Remote session server quota policy passed.');
