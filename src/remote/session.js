/** Live pairing is opt-in. Tokens are held in URL fragments (not sent in HTTP
 * request lines) and sent only to the explicit WebSocket endpoint over TLS.
 * No remote room state is written to the offline match keys.
 */
export const REMOTE_API='https://playlab-session-relay.arif-muamar-wahid.workers.dev';
const STORAGE_PREFIX='playlab-remote-organizer-v1:';
export function remoteParams(loc=location){
 const query=new URLSearchParams(loc.search),roomId=query.get('remote');
 const key=new URLSearchParams(loc.hash.replace(/^#/,'' )).get('key');
 return roomId?{roomId,key:key||''}:null;
}
export function remoteLinks(game,roomId,controlKey,viewKey,loc=location){
 const base=new URL(loc.href);base.search='';base.hash='';
 const host=new URL(base.href),display=new URL(base.href);
 host.searchParams.set('game',game);host.searchParams.set('remote',roomId);host.hash=new URLSearchParams({key:controlKey}).toString();
 display.searchParams.set('game',game);display.searchParams.set('view','display');display.searchParams.set('remote',roomId);display.hash=new URLSearchParams({key:viewKey}).toString();
 return {controller:host.href,projector:display.href};
}
export async function createRemoteRoom(game,state,{fetchImpl=fetch}={}){
 const response=await fetchImpl(REMOTE_API+'/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({game,state}),cache:'no-store'});
 const body=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(body.error||'Live service did not accept the session.');
 if(!/^[a-f0-9]{16}$/.test(body.roomId)||!body.controlKey||!body.viewKey)throw Error('Live service returned an invalid room.');
 return {game,roomId:body.roomId,controlKey:body.controlKey,viewKey:body.viewKey,createdAt:Date.now()};
}
export function storeOrganizer(room,storage=sessionStorage){
 storage.setItem(STORAGE_PREFIX+room.roomId,JSON.stringify(room));
}
export function readOrganizer(roomId,storage=sessionStorage){
 try{const value=JSON.parse(storage.getItem(STORAGE_PREFIX+roomId));return value?.roomId===roomId&&['survey','quickfire'].includes(value.game)&&value.controlKey&&value.viewKey?value:null;}catch{return null;}
}
export function remoteSocketUrl({roomId,key}){
 if(!/^[a-f0-9]{16}$/.test(roomId)||!/^([a-f0-9]{48})$/.test(key||''))throw Error('Invalid paired session link.');
 const base=new URL(REMOTE_API);base.protocol=base.protocol==='https:'?'wss:':'ws:';
 base.pathname='/sessions/'+roomId+'/connect';base.searchParams.set('key',key);
 return base.href;
}
