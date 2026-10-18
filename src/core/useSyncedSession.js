import {useCallback,useEffect,useRef,useState} from 'react';
import {remoteParams,remoteSocketUrl} from '../remote/session.js';

/** Local: BroadcastChannel/localStorage. Paired: authoritative WebSocket room.
 * Never write a remote state into the local (offline) session storage keys.
 */
export function useSyncedSession(config){
  const {storageKey,channelName,messageType,readInitial,isValid}=config;
  const remote=remoteParams();
  const [state,setState]=useState(readInitial);
  const latest=useRef(state),channel=useRef(null),socket=useRef(null);
  const revision=useRef(-1),pending=useRef(false),connected=useRef(false),role=useRef(null);
  const [connection,setConnection]=useState(remote?{mode:'remote',state:'connecting',role:null}:null);
  useEffect(()=>{
    if(remote)return;
    const nextChannel=typeof BroadcastChannel==='function'?new BroadcastChannel(channelName):null;
    channel.current=nextChannel;
    const apply=next=>{if(!isValid(next))return;latest.current=next;setState(next);};
    const onMessage=e=>{if(e.data?.type===messageType)apply(e.data.state);};
    const onStorage=e=>{if(e.key!==storageKey||!e.newValue)return;try{apply(JSON.parse(e.newValue));}catch{/* ignore malformed */}};
    nextChannel?.addEventListener('message',onMessage);
    window.addEventListener('storage',onStorage);
    return ()=>{nextChannel?.removeEventListener('message',onMessage);nextChannel?.close();window.removeEventListener('storage',onStorage);if(channel.current===nextChannel)channel.current=null;};
  },[storageKey,channelName,messageType,isValid,remote?.roomId]);
  useEffect(()=>{
    if(!remote)return;
    let dead=false,retries=0,timer=null;
    const apply=(packet)=>{
      if(packet?.type!=='snapshot'||!isValid(packet.state)||!Number.isInteger(packet.revision))return;
      revision.current=packet.revision;pending.current=false;
      if(packet.role)role.current=packet.role;
      latest.current=packet.state;setState(packet.state);
      connected.current=true;
      setConnection({mode:'remote',state:'connected',role:role.current,error:packet.error||null});
      retries=0;
    };
    function connect(){
      if(dead)return;
      let url;try{url=remoteSocketUrl(remote);}
      catch(e){setConnection({mode:'remote',state:'invalid',role:null,error:e.message});return;}
      setConnection({mode:'remote',state:'connecting',role:role.current});
      const ws=new WebSocket(url);socket.current=ws;
      ws.onmessage=ev=>{try{apply(JSON.parse(ev.data));}catch{/* malformed */}};
      ws.onerror=()=>{try{ws.close();}catch{}};
      ws.onclose=()=>{
        if(dead)return;
        socket.current=null;pending.current=false;connected.current=false;
        revision.current=-1;
        setConnection({mode:'remote',state:'disconnected',role:role.current,error:'Connection unavailable. Check your internet connection and room link.'});
        retries++;
        timer=setTimeout(connect,Math.min(750*Math.pow(1.6,retries),9000));
      };
    }
    connect();
    return ()=>{dead=true;clearTimeout(timer);socket.current?.close(1000,'Left session');socket.current=null;connected.current=false;};
  },[remote?.roomId,remote?.key,isValid]);
  const change=useCallback(update=>{
    if(remote){
      if(!connected.current||role.current!=='controller'||pending.current||socket.current?.readyState!==WebSocket.OPEN||revision.current<0)return;
      const previous=latest.current;
      const next=update(previous);
      if(next===previous||!isValid(next))return;
      pending.current=true;
      socket.current.send(JSON.stringify({type:'set',revision:revision.current,state:next}));
      return;
    }
    const previous=latest.current,next=update(previous);
    if(next===previous||!isValid(next))return;
    latest.current=next;setState(next);
    try{localStorage.setItem(storageKey,JSON.stringify(next));}catch(error){console.warn('Session persistence unavailable.',error);}
    channel.current?.postMessage({type:messageType,state:next});
  },[storageKey,messageType,isValid,remote?.roomId,remote?.key]);
  return [state,change,connection];
}
