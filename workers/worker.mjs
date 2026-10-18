/** PlayLab anonymous, short-lived presenter rooms; deploy via workers/wrangler.jsonc.
 * Authority lives here, not in the browser. The audience key is read-only.
 * No recordings, accounts or analytics. Rooms expire 12h after creation.
 */
const ALLOWED_ORIGINS=new Set(['https://arifmuamardev.github.io','http://localhost:4173','http://127.0.0.1:4173','http://localhost:5173','http://127.0.0.1:5173']);
const TTL=12*60*60*1000,MAX_JSON=150_000;
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer',...headers}});
const fail=(msg,status=400)=>json({error:msg},status);
const random=(bytes=16)=>Array.from(crypto.getRandomValues(new Uint8Array(bytes)),x=>x.toString(16).padStart(2,'0')).join('');
function valid(game,state){
 if(!['survey','quickfire'].includes(game)||!state||state.version!==1||
 !Array.isArray(state.teamNames)||state.teamNames.length!==2||
 state.teamNames.some(x=>typeof x!=='string'||!x.trim()||x.length>45)||
 !Array.isArray(state.questions)||!state.questions.length||state.questions.length>60||
 state.questions.some(q=>!q||typeof q.id!=='string'||q.id.length>100||typeof q.question!=='string'||!q.question.trim()||q.question.length>260))return false;
 if(game==='survey')return Number.isInteger(state.roundIndex)&&state.roundIndex>=0&&state.roundIndex<state.questions.length&&
 state.questions.every(q=>Array.isArray(q.answers)&&q.answers.length>=2&&q.answers.length<=8&&q.answers.every(a=>typeof a.text==='string'&&a.text.length<=120&&Number.isFinite(a.points)&&a.points>=0))&&state.progress&&typeof state.progress==='object';
 return Number.isInteger(state.questionIndex)&&state.questionIndex>=0&&state.questionIndex<state.questions.length&&
 Array.isArray(state.scores)&&state.scores.length===2&&state.scores.every(x=>Number.isFinite(x)&&x>=0)&&
 state.questions.every(q=>Array.isArray(q.options)&&q.options.length===4&&q.options.every(x=>typeof x==='string'&&x.length<=130)&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4)&&
 state.revealed&&typeof state.revealed==='object';
}
function cors(origin){return ALLOWED_ORIGINS.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'content-type','Vary':'Origin'}:{};}
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  if(!ALLOWED_ORIGINS.has(origin))return fail('Origin not allowed.',403);
  const url=new URL(request.url);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
  if(url.pathname==='/sessions'&&request.method==='POST'){
   let raw='';try{raw=await request.text();}catch{return fail('Invalid request body.')}
   if(raw.length>MAX_JSON)return fail('Question bank is too large.',413);
   let input;try{input=JSON.parse(raw)}catch{return fail('Invalid JSON.')}
   if(!valid(input.game,input.state))return fail('Invalid game or question bank.');
   const roomId=random(8),controlKey=random(24),viewKey=random(24);
   const room=env.PLAYLAB_ROOMS.get(env.PLAYLAB_ROOMS.idFromName(roomId));
   const started=await room.fetch('https://room.internal/init',{method:'POST',body:JSON.stringify({
    game:input.game,state:input.state,controlKey,viewKey,createdAt:Date.now(),expiresAt:Date.now()+TTL
   })});
   if(!started.ok)return fail('Room creation failed.',502);
   return json({roomId,controlKey,viewKey,expiresIn:TTL/1000},201,cors(origin));
  }
  const match=url.pathname.match(/^\/sessions\/([a-f0-9]{16})\/connect$/);
  if(match&&request.method==='GET'&&request.headers.get('Upgrade')?.toLowerCase()==='websocket'){
   const room=env.PLAYLAB_ROOMS.get(env.PLAYLAB_ROOMS.idFromName(match[1]));
   return room.fetch(new Request('https://room.internal/connect?key='+encodeURIComponent(url.searchParams.get('key')||''),request));
  }
  return fail('Not found.',404);
 }
};
export class PlayLabRoom {
 constructor(ctx){this.ctx=ctx;}
 async fetch(request){
  const url=new URL(request.url);
  if(url.pathname==='/init'&&request.method==='POST'){
   if(await this.ctx.storage.get('room'))return fail('Already initialized.',409);
   const room=await request.json();
   await this.ctx.storage.put('room',{...room,revision:0});
   await this.ctx.storage.setAlarm(room.expiresAt);
   return json({ok:true});
  }
  if(url.pathname==='/connect'&&request.headers.get('Upgrade')?.toLowerCase()==='websocket'){
   const room=await this.ctx.storage.get('room');
   if(!room||Date.now()>room.expiresAt)return fail('Room expired or unavailable.',410);
   const key=url.searchParams.get('key'),role=key===room.controlKey?'controller':key===room.viewKey?'viewer':null;
   if(!role)return fail('Access denied.',403);
   const pair=new WebSocketPair(),client=pair[0],server=pair[1];
   this.ctx.acceptWebSocket(server);
   server.serializeAttachment({role});
   server.send(JSON.stringify({type:'snapshot',state:room.state,revision:room.revision,role}));
   return new Response(null,{status:101,webSocket:client});
  }
  return fail('Not found.',404);
 }
 async webSocketMessage(socket,message){
  const meta=socket.deserializeAttachment();
  if(meta?.role!=='controller'||typeof message!=='string'||message.length>MAX_JSON)return;
  let input;try{input=JSON.parse(message);}catch{return;}
  if(input.type!=='set'||!Number.isInteger(input.revision))return;
  const room=await this.ctx.storage.get('room');
  if(!room||Date.now()>room.expiresAt){socket.close(1008,'Room expired');return;}
  if(input.revision!==room.revision||!valid(room.game,input.state)){
   socket.send(JSON.stringify({type:'snapshot',revision:room.revision,state:room.state,role:'controller',error:'Update rejected: state is stale or invalid.'}));return;
  }
  const next={...room,state:input.state,revision:room.revision+1};
  await this.ctx.storage.put('room',next);
  const packet=JSON.stringify({type:'snapshot',state:next.state,revision:next.revision});
  for(const peer of this.ctx.getWebSockets()){try{peer.send(packet);}catch{try{peer.close();}catch{}}}
 }
 async alarm(){
  for(const peer of this.ctx.getWebSockets()){try{peer.close(1000,'Session expired');}catch{}}
  await this.ctx.storage.deleteAll();
 }
}
