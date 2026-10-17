import {useCallback,useEffect,useRef,useState} from 'react';

/** Local-first host/projector state. Both views must use the same origin and browser profile.
 * This does not provide authenticated remote multiplayer or conflict arbitration between hosts.
 */
export function useSyncedSession(config){
  const {storageKey,channelName,messageType,readInitial,isValid}=config;
  const [state,setState]=useState(readInitial);
  const latest=useRef(state);
  const channel=useRef(null);
  useEffect(()=>{
    const nextChannel=typeof BroadcastChannel==='function'?new BroadcastChannel(channelName):null;
    channel.current=nextChannel;
    const apply=next=>{
      if(!isValid(next))return;
      latest.current=next;
      setState(next);
    };
    const onMessage=e=>{if(e.data?.type===messageType)apply(e.data.state);};
    const onStorage=e=>{
      if(e.key!==storageKey || !e.newValue)return;
      try{apply(JSON.parse(e.newValue));}catch{ /* ignore malformed external storage */ }
    };
    nextChannel?.addEventListener('message',onMessage);
    window.addEventListener('storage',onStorage);
    return ()=>{
      nextChannel?.removeEventListener('message',onMessage);
      nextChannel?.close();
      window.removeEventListener('storage',onStorage);
      if(channel.current===nextChannel)channel.current=null;
    };
  },[storageKey,channelName,messageType,isValid]);
  const change=useCallback(update=>{
    const previous=latest.current;
    const next=update(previous);
    if(next===previous || !isValid(next))return;
    latest.current=next;
    setState(next);
    try{localStorage.setItem(storageKey,JSON.stringify(next));}catch(error){console.warn('Session persistence unavailable.',error);}
    channel.current?.postMessage({type:messageType,state:next});
  },[storageKey,messageType,isValid]);
  return [state,change];
}
