import {useEffect,useRef,useState} from 'react';

/** An explicit click is required to unlock projector audio (browser autoplay policy).
 * Sounds are synthesized locally: no external audio downloads or third-party assets.
 */
export function makeStageEvent(kind,detail={}){
  return {kind,...detail,nonce:Math.random().toString(36).slice(2),stamp:Date.now()};
}
export function playStageCue(kind,context){
  if(!context || context.state!=='running')return;
  const now=context.currentTime+0.018;
  const tone=(frequency,delay,duration,type='sine',volume=.065)=>{
    const oscillator=context.createOscillator(),gain=context.createGain();
    oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,now+delay);
    gain.gain.setValueAtTime(.0001,now+delay);
    gain.gain.exponentialRampToValueAtTime(volume,now+delay+.018);
    gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);
    oscillator.connect(gain);gain.connect(context.destination);
    oscillator.start(now+delay);oscillator.stop(now+delay+duration+.015);
  };
  if(kind==='reveal'){tone(587,0,.12);tone(880,.105,.24);}
  else if(kind==='strike'){tone(220,0,.17,'sawtooth',.032);tone(155,.16,.26,'sawtooth',.028);}
  else if(kind==='award'||kind==='score'){
    tone(392,0,.13);tone(523,.13,.13);tone(659,.26,.15);tone(784,.42,.33,'triangle',.08);
  }else if(kind==='finish'){
    // The final fanfare only plays after the projector operator opts into audio.
    tone(392,0,.13,'triangle',.045);tone(523,.14,.13,'triangle',.053);
    tone(659,.28,.16,'triangle',.063);tone(784,.47,.17,'triangle',.06);
    tone(1046,.66,.45,'triangle',.075);
  }else if(kind==='next'){tone(440,0,.09,'triangle',.033);tone(659,.10,.15,'triangle',.04);}
  else if(kind==='undo'||kind==='subtract'){tone(440,0,.11,'triangle',.024);tone(349,.105,.15,'triangle',.023);}
}
export function useProjectorAudio(lastEvent){
  const [enabled,setEnabled]=useState(false);
  const context=useRef(null);
  const seen=useRef(lastEvent?.nonce||null);
  useEffect(()=>{
    if(!lastEvent?.nonce||seen.current===lastEvent.nonce)return;
    seen.current=lastEvent.nonce;
    if(enabled&&Date.now()-lastEvent.stamp<5000){
      try{playStageCue(lastEvent.kind,context.current);}catch{/* audio is optional */}
    }
  },[lastEvent,enabled]);
  useEffect(()=>()=>{const current=context.current;context.current=null;current?.close?.().catch?.(()=>{});},[]);
  async function toggle(){
    if(enabled){setEnabled(false);return;}
    try{
      const Constructor=window.AudioContext||window.webkitAudioContext;
      if(!Constructor)return;
      const ctx=context.current??new Constructor();
      context.current=ctx;
      await ctx.resume();
      if(ctx.state!=='running')return;
      setEnabled(true);
      playStageCue('next',ctx);
    }catch{setEnabled(false);}
  }
  return [enabled,toggle];
}
/** Ephemeral event-driven visuals. No stale replay after opening/reloading a projector. */
export function useStageMoment(lastEvent,kinds=['award','score'],duration=1900){
  const [moment,setMoment]=useState(null);
  const seen=useRef(lastEvent?.nonce||null);
  useEffect(()=>{
    const event=lastEvent;
    if(!event?.nonce||seen.current===event.nonce)return;
    seen.current=event.nonce;
    if(!kinds.includes(event.kind)||Date.now()-event.stamp>5000)return;
    setMoment(event);
    const timer=setTimeout(()=>setMoment(prev=>prev?.nonce===event.nonce?null:prev),duration);
    return ()=>clearTimeout(timer);
  },[lastEvent, duration, ...kinds]);
  return moment;
}
