import React,{useEffect,useState} from 'react';
import {Clock3,Pause,Play,X} from 'lucide-react';
import {COUNTDOWN_PRESETS,countdownFor,secondsRemaining,formatCountdown,startCountdown,pauseCountdown,resumeCountdown,clearCountdown} from './countdown.js';
import './countdown.css';
import {useLanguage} from '../i18n/language.jsx';

function useCountdownSeconds(timer){
  const [now,setNow]=useState(Date.now);
  useEffect(()=>{
    setNow(Date.now());
    if(!timer?.running)return;
    const id=window.setInterval(()=>setNow(Date.now()),250);
    return ()=>window.clearInterval(id);
  },[timer?.deadlineAt,timer?.running,timer?.contextId]);
  return secondsRemaining(timer,now);
}

/** Projector visual only. No sound, auto-reveal or scoring. */
export function CountdownBadge({game,contextId}){
  const {t}=useLanguage();
  const timer=countdownFor(game,contextId);
  const remaining=useCountdownSeconds(timer);
  if(!timer)return null;
  const expired=remaining===0;
  return <div role="timer" aria-live="off" aria-label={expired?'Countdown finished':remaining+' seconds remaining'} className={'playlab-countdown-badge'+(expired?' is-expired':remaining<=5?' is-low':'')}>
    <Clock3 size={18} aria-hidden="true"/><strong>{formatCountdown(remaining)}</strong><span>{t(expired?'TIME UP':timer.running?'TIME LEFT':'PAUSED')}</span>
  </div>;
}

/** Host controls modify only the current question or round's optional countdown. */
export function CountdownControls({game,change,contextId}){
  const {lang}=useLanguage();
  const timer=countdownFor(game,contextId);
  const remaining=useCountdownSeconds(timer);
  return <div className="playlab-countdown-controls">
    <div className="playlab-countdown-status"><Clock3 size={19} aria-hidden="true"/><strong>{timer?formatCountdown(remaining):lang==='id'?'Belum dimulai':'Not started'}</strong><span>{lang==='id'?(!timer?'Pilih durasi':remaining===0?'Waktu habis':timer.running?'Berjalan':'Dijeda'):(!timer?'Choose a duration':remaining===0?'Time is up':timer.running?'Running':'Paused')}</span></div>
    <div className="playlab-countdown-presets" aria-label="Start or restart countdown">
      {COUNTDOWN_PRESETS.map(seconds=><button type="button" key={seconds} onClick={()=>change(old=>startCountdown(old,contextId,seconds))} aria-label={'Start '+seconds+' second countdown'}>{seconds}s</button>)}
    </div>
    {timer&&<div className="playlab-countdown-actions">
      {timer.running&&remaining>0?<button type="button" onClick={()=>change(old=>pauseCountdown(old,contextId))}><Pause size={16}/> {lang==='id'?'Jeda':'Pause countdown'}</button>:remaining>0?<button type="button" onClick={()=>change(old=>resumeCountdown(old,contextId))}><Play size={16}/> {lang==='id'?'Lanjutkan':'Resume countdown'}</button>:null}
      <button type="button" onClick={()=>change(clearCountdown)}><X size={16}/> {lang==='id'?'Hapus waktu':'Clear countdown'}</button>
    </div>}
    <p>{lang==='id'?'Penghitung waktu hanya bantuan visual. Waktu habis tidak otomatis membuka jawaban, menambah kesalahan, atau mengubah skor.':'Optional visual timer on the projector. Time up never reveals answers, adds strikes, or changes scores.'}</p>
  </div>;
}
