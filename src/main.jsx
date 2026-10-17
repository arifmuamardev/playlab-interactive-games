import React, {useCallback,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowLeft,ArrowRight,ArrowUpRight,Check,CheckCheck,ChevronDown,ChevronLeft,ChevronRight,CircleHelp,Copy,Download,Edit3,Expand,Eye,EyeOff,FileUp,Gamepad2,Headphones,Keyboard,Lock,Maximize,Minus,MonitorPlay,Plus,RotateCcw,Save,Settings2,ShieldAlert,SkipForward,Sparkles,Trash2,Trophy,Volume2,VolumeX,X} from 'lucide-react';
import {CHANNEL,STORAGE_KEY,getScores,makeInitialState,normalizeQuestions,progressFor,readSavedState,sampleQuestions,sumBank} from './data.js';
import './styles.css';

const IS_DISPLAY=new URLSearchParams(location.search).get('view')==='display';
function uid(){return `r-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;}
function dispatchEvent(kind,detail=''){return {kind,detail,stamp:Date.now(),nonce:Math.random().toString(36).slice(2)};}
function useGame(){
  const [game,setGame]=useState(readSavedState);
  const ref=useRef(game);
  const channelRef=useRef(null);
  useEffect(()=>{
    const channel=typeof BroadcastChannel==='function'?new BroadcastChannel(CHANNEL):null;
    channelRef.current=channel;
    const receive=e=>{
      if(e.data?.type!=='state')return;
      if(!e.data.state||e.data.state.version!==1)return;
      ref.current=e.data.state;
      setGame(e.data.state);
    };
    const onStorage=e=>{
      if(e.key!==STORAGE_KEY||!e.newValue)return;
      try {const next=JSON.parse(e.newValue);if(next.version!==1)return;ref.current=next;setGame(next);} catch{}
    };
    channel?.addEventListener('message',receive);
    window.addEventListener('storage',onStorage);
    return ()=>{channel?.removeEventListener('message',receive);channel?.close();window.removeEventListener('storage',onStorage)};
  },[]);
  const change=useCallback(fn=>{
    const old=ref.current;
    const next=fn(old);
    if(next===old)return;
    ref.current=next;
    setGame(next);
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify(next));} catch(e){console.warn('Cannot persist game state.',e);}
    channelRef.current?.postMessage({type:'state',state:next});
  },[]);
  return [game,change];
}
function updateProgress(game, patch, eventKind){
  const q=game.questions[game.roundIndex];if(!q)return game;
  const old=progressFor(game,q.id);
  return {...game,progress:{...game.progress,[q.id]:{...old,...patch}},lastEvent:eventKind?dispatchEvent(eventKind):game.lastEvent};
}
function playCue(kind,ctx){
  if(!ctx)return;
  const now=ctx.currentTime+0.025;
  const note=(freq,start,duration,shape='sine',volume=.09)=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=shape;osc.frequency.setValueAtTime(freq,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.02);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain);gain.connect(ctx.destination);osc.start(start);osc.stop(start+duration+.03);
  };
  if(kind==='reveal'){note(523,now,.18);note(784,now+.12,.28);}
  if(kind==='strike'){note(196,now,.21,'sawtooth',.06);note(147,now+.18,.30,'sawtooth',.06);}
  if(kind==='award'){note(392,now,.18);note(523,now+.16,.18);note(659,now+.32,.18);note(784,now+.48,.42);}
  if(kind==='next'){note(392,now,.09,'triangle',.05);}
}
function useCue(lastEvent){
  const [enabled,setEnabled]=useState(false);
  const audio=useRef(null),lastSeen=useRef(lastEvent?.nonce||null);
  useEffect(()=>{
    if(!lastEvent?.nonce || lastSeen.current===lastEvent.nonce)return;
    lastSeen.current=lastEvent.nonce;
    if(Date.now()-lastEvent.stamp<6000 && enabled){try{playCue(lastEvent.kind,audio.current)}catch{}}
  },[lastEvent,enabled]);
  async function toggle(){
    if(enabled){setEnabled(false);return;}
    try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;const ctx=audio.current??new Ctx();audio.current=ctx;await ctx.resume();setEnabled(true);playCue('next',ctx)}catch{setEnabled(false)}
  }
  return [enabled,toggle];
}
function PlayLabBrand({onDark=false}) {return <div className={'brand '+(onDark?'brand--dark':'')}><div className="brand-mark">P<span>✦</span></div><div><strong>PLAYLAB</strong><small>GAMES FOR EVERY GATHERING</small></div></div>}
function RoundPill({current,total,multiplier}){return <div className="round-pill">RONDE <b>{String(current+1).padStart(2,'0')}</b> <span>/ {String(total).padStart(2,'0')}</span><i>·</i> <strong>{multiplier}× POIN</strong></div>}
function Stage({game,preview=false,fullscreenAction,soundAction,soundEnabled}){
  const q=game.questions[game.roundIndex];const p=progressFor(game,q?.id);
  const scores=getScores(game);const bank=p.awardedTeam===null?sumBank(q,p):p.awardedAmount;
  const revealed=p.revealed||[];
  const [flair,setFlair]=useState(null);const flairTimer=useRef();const seen=useRef(game.lastEvent?.nonce);
  useEffect(()=>{
    const ev=game.lastEvent;if(!ev?.nonce||seen.current===ev.nonce)return;
    seen.current=ev.nonce;
    if(ev.kind==='award' && Date.now()-ev.stamp<5000){
      setFlair({team:game.teamNames[p.awardedTeam],points:p.awardedAmount,nonce:ev.nonce});
      clearTimeout(flairTimer.current);
      flairTimer.current=setTimeout(()=>setFlair(null),2700);
    }
    return ()=>clearTimeout(flairTimer.current);
  },[game.lastEvent]);
  if(!q)return <div className="stage">No questions yet.</div>;
  return <div className={'stage '+(preview?'stage--preview':'stage--full')}>
    <div className="stage-glow stage-glow-left"/><div className="stage-glow stage-glow-right"/>
    <div className="stage-inner">
      <div className="stage-top">
        <div className="stage-event-label"><span className="stage-mini-star">✦</span><span>PLAYLAB · LIVE GAMES</span></div>
        <div className="stage-headline">SURVEY <em>SHOWDOWN</em><span className="stage-accent">✦</span></div>
        <RoundPill current={game.roundIndex} total={game.questions.length} multiplier={q.multiplier}/>
        {!preview&&<div className="display-actions"><button className="display-tool" onClick={soundAction} title="Enable sound on this screen">{soundEnabled?<Volume2 size={18}/>:<VolumeX size={18}/>}<span>{soundEnabled?'Sound on':'Enable sound'}</span></button><button className="display-tool" onClick={fullscreenAction} title="Go fullscreen"><Maximize size={18}/><span>Fullscreen</span></button></div>}
      </div>
      <div className="score-ribbon">
        {[0,1].map(team=><div className={'team-score team-score--'+team+(p.activeTeam===team&&p.awardedTeam===null?' is-active':'')+(p.awardedTeam===team?' is-winner':'')} key={team}>
          <div className="team-label"><span className="team-dot"/><span>{game.teamNames[team]}</span>{p.activeTeam===team&&p.awardedTeam===null&&<span className="playing-pill">MAIN</span>}{p.awardedTeam===team&&<Trophy size={17}/>}</div>
          <div className="team-number">{scores[team].toLocaleString('id-ID')}</div>
        </div>)}
      </div>
      <div className="stage-question"><span>PERTANYAAN {String(game.roundIndex+1).padStart(2,'0')}</span><h1>{q.question}</h1></div>
      <div className={'stage-answer-grid '+(q.answers.length>=7?'stage-answer-grid--dense':'')}>
        {q.answers.map((a,i)=><div key={q.id+'-'+i} className={'stage-answer '+(revealed.includes(i)?'is-revealed':'is-hidden')}>
          <div className="answer-number">{String(i+1).padStart(2,'0')}</div>
          {revealed.includes(i)?<div className="answer-content" key={'show-'+q.id+'-'+i}>{a.text}</div>:<div className="answer-mask"><span/><span/><span/><span/><span/></div>}
          <div className="answer-value">{revealed.includes(i)?a.points:'?'}</div>
        </div>)}
      </div>
      <div className="stage-foot">
        <div className="strikes"><span className="foot-label">KESALAHAN</span><div className="strikes-set">{[0,1,2].map(i=><div className={'strike '+(i<p.strikes?'is-strike':'')} key={i}>✕</div>)}</div></div>
        <div className="phase-indicator">{p.awardedTeam!==null?'RONDE SELESAI':p.phase==='steal'?'KESEMPATAN MEREBUT POIN':'TEBAK JAWABAN TERPOPULER'}</div>
        <div className="bank"><span className="foot-label">{p.awardedTeam===null?'POIN TERKUMPUL':'POIN DIBERIKAN'}</span><div className="bank-number">{bank.toLocaleString('id-ID')}</div></div>
      </div>
      <div className="stage-bottom-brand">A GAME BY PLAYLAB <span>✦</span> BUILT FOR CLASSROOMS & LIVE EVENTS</div>
    </div>
    {flair&&<div className="award-overlay" key={flair.nonce}><div className="award-burst">✦ ✦ ✦</div><Trophy size={60}/><span>SELAMAT!</span><strong>{flair.team}</strong><b>+{flair.points} POIN</b></div>}
  </div>
}
function ControlCard({title,description,children,extra}){return <section className="control-card"><div className="card-head"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div>{extra}</div>{children}</section>}
function IconButton({icon:Icon,children,onClick,disabled=false,title='',variant=''}){return <button type="button" title={title} disabled={disabled} onClick={onClick} className={'btn '+variant}><Icon size={17}/>{children&&<span>{children}</span>}</button>}
function HostApp({game,change}){
  const q=game.questions[game.roundIndex];const p=progressFor(game,q?.id),scores=getScores(game),bank=sumBank(q,p);const locked=p.awardedTeam!==null;
  const [editing,setEditing]=useState(false),[showHelp,setShowHelp]=useState(false),[notice,setNotice]=useState('');
  const fileRef=useRef(null);
  const notify=msg=>{setNotice(msg);setTimeout(()=>setNotice(''),3600)};
  const goRound=i=>change(old=>({...old,roundIndex:Math.max(0,Math.min(old.questions.length-1,i)),lastEvent:dispatchEvent('next')}));
  const reveal=i=>change(old=>{
    const qq=old.questions[old.roundIndex],pp=progressFor(old,qq.id);if(pp.awardedTeam!==null)return old;
    const revealed=pp.revealed.includes(i)?pp.revealed.filter(k=>k!==i):[...pp.revealed,i];return updateProgress(old,{revealed},'reveal');
  });
  const strike=(delta=1)=>change(old=>{
    const qq=old.questions[old.roundIndex],pp=progressFor(old,qq.id);if(pp.awardedTeam!==null)return old;
    const strikes=Math.max(0,Math.min(3,pp.strikes+delta));
    const phase=strikes>=3?'steal':'play';
    return updateProgress(old,{strikes,phase},delta>0?'strike':null);
  });
  const chooseTeam=team=>change(old=>updateProgress(old,{activeTeam:team}));
  const award=team=>change(old=>{
    const qq=old.questions[old.roundIndex],pp=progressFor(old,qq.id);if(pp.awardedTeam!==null)return old;
    return updateProgress(old,{awardedTeam:team,awardedAmount:sumBank(qq,pp)},'award');
  });
  const undoAward=()=>{
    if(!window.confirm('Undo this round’s award? The assigned points will be removed.'))return;
    change(old=>updateProgress(old,{awardedTeam:null,awardedAmount:0},'next'));
  };
  const resetRound=()=>{
    if(!window.confirm('Reset current round? Revealed answers, strikes and its awarded score will be lost.'))return;
    change(old=>{const id=old.questions[old.roundIndex].id;const progress={...old.progress};delete progress[id];return {...old,progress,lastEvent:dispatchEvent('next')}});
  };
  const resetMatch=()=>{
    if(!window.confirm('Reset the ENTIRE match? All team scores and round progress will be cleared. Questions and team names are kept.'))return;
    change(old=>({...old,roundIndex:0,progress:{},lastEvent:dispatchEvent('next')}));notify('Match scores and rounds reset.');
  };
  const revealAll=()=>change(old=>{const qq=old.questions[old.roundIndex],pp=progressFor(old,qq.id);return updateProgress(old,{revealed:qq.answers.map((_,i)=>i)},'reveal')});
  const exportData=()=>{
    const blob=new Blob([JSON.stringify({questions:game.questions},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='playlab-survey-questions.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Question bank exported.');
  };
  const importData=async event=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    try {
      const raw=JSON.parse(await file.text());const questions=normalizeQuestions(raw);
      if(!window.confirm(`Import ${questions.length} questions? This replaces the existing question bank and clears all scores.`))return;
      change(old=>({...old,questions,roundIndex:0,progress:{},lastEvent:dispatchEvent('next')}));notify(`${questions.length} questions imported.`);
    }catch(e){window.alert('Could not import questions: '+e.message)}
  };
  useEffect(()=>{
    const handle=e=>{
      if(editing || showHelp || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)||e.altKey||e.ctrlKey||e.metaKey)return;
      if(/^[1-8]$/.test(e.key)){const i=Number(e.key)-1;if(i<q.answers.length){e.preventDefault();reveal(i)}}
      if(e.key.toLowerCase()==='x'){e.preventDefault();strike()}
      if(e.key.toLowerCase()==='z'){e.preventDefault();strike(-1)}
    };
    window.addEventListener('keydown',handle);return ()=>window.removeEventListener('keydown',handle);
  },[q,editing,showHelp]);
  const [copyOkay,setCopyOkay]=useState(false);
  const displayUrl=new URL(location.href);displayUrl.searchParams.set('view','display');
  const openDisplay=()=>window.open(displayUrl.toString(),'playlab-survey-display');
  const copyDisplay=async()=>{try{await navigator.clipboard.writeText(displayUrl.toString());setCopyOkay(true);setTimeout(()=>setCopyOkay(false),1500)}catch{window.prompt('Copy the display link:',displayUrl.toString())}};
  return <div className="host-shell">
    <header className="host-header"><PlayLabBrand/><div className="host-header-right"><a className="home-link" href="./">← Game library</a><span className="local-badge"><span/>LOCAL GAME MODE</span><IconButton icon={CircleHelp} onClick={()=>setShowHelp(true)} variant="btn-soft">How to play</IconButton><button className="btn btn-primary" onClick={openDisplay}><MonitorPlay size={18}/> Open projector view <ArrowUpRight size={15}/></button></div></header>
    <main className="host-main">
      <div className="intro"><div><div className="eyebrow">EVENT TOOLKIT <span> / </span> MC CONTROL ROOM</div><h1>Let’s play <em>Survey Showdown.</em></h1><p>Your game, your questions, your stage. Control every reveal from here while the audience sees the big board.</p></div><div className="intro-status"><span className="live-dot"/> READY FOR THE STAGE</div></div>
      <div className="host-grid">
        <div className="host-primary">
          <section className="preview-section"><div className="section-head"><div><h2>Live game preview</h2><p>What your audience sees on the projector</p></div><div className="head-buttons"><IconButton icon={Copy} onClick={copyDisplay} variant="btn-soft">{copyOkay?'Copied':'Copy display URL'}</IconButton><IconButton icon={Expand} onClick={openDisplay} variant="btn-soft">Pop out</IconButton></div></div><div className="preview-frame"><Stage game={game} preview/></div></section>
          <ControlCard title="Reveal answers" description="Click an answer to show it on the big board. Shortcuts: 1–8." extra={<span className="small-count">{p.revealed.length} / {q.answers.length} SHOWN</span>}>
            <div className="reveal-grid">{q.answers.map((a,i)=><button key={i} disabled={locked} className={'reveal-button '+(p.revealed.includes(i)?'reveal-button--on':'')} onClick={()=>reveal(i)} title={`Keyboard: ${i+1}`}><span className="reveal-index">{i+1}</span><span className="reveal-name">{a.text}</span><strong>{a.points*q.multiplier} <small>pts</small></strong>{p.revealed.includes(i)?<Eye size={16}/>:<EyeOff size={16}/>}</button>)}</div>
            <div className="minor-note">Point values are sample survey-style data. Replace them with real survey results before your event.</div>
          </ControlCard>
          <ControlCard title="Team scoreboard" description="Rename teams to match your players. Score is assigned at the end of each round.">
            <div className="team-editor-row">{[0,1].map(team=><div key={team} className={'team-editor team-editor--'+team}><label htmlFor={'team-name-'+team}>TEAM {team+1}</label><input id={'team-name-'+team} value={game.teamNames[team]} maxLength={45} onChange={e=>change(old=>({...old,teamNames:old.teamNames.map((n,i)=>i===team?e.target.value:n)}))}/><strong>{scores[team]}</strong></div>)}</div>
          </ControlCard>
        </div>
        <aside className="host-sidebar">
          <ControlCard title="Round controls" description="Choose the question and manage the live round.">
            <div className="round-select-row"><button className="square-btn" disabled={game.roundIndex===0} onClick={()=>goRound(game.roundIndex-1)} aria-label="Previous round"><ChevronLeft/></button><select aria-label="Select round" value={game.roundIndex} onChange={e=>goRound(Number(e.target.value))}>{game.questions.map((v,i)=><option key={v.id} value={i}>Round {i+1} · {v.multiplier}× points</option>)}</select><button className="square-btn" disabled={game.roundIndex===game.questions.length-1} onClick={()=>goRound(game.roundIndex+1)} aria-label="Next round"><ChevronRight/></button></div>
            <div className="current-phase"><div><span>ROUND STATUS</span><strong>{locked?'Finished':p.phase==='steal'?'Steal opportunity':'Playing'}</strong></div><div><span>POINTS IN BANK</span><strong>{locked?p.awardedAmount:bank}</strong></div></div>
            <div className="active-team-label">WHICH TEAM IS PLAYING?</div>
            <div className="active-team-selector">{[0,1].map(team=><button disabled={locked} key={team} className={'select-team select-team--'+team+(p.activeTeam===team?' selected':'')} onClick={()=>chooseTeam(team)}>{p.activeTeam===team&&<Check size={16}/>} {game.teamNames[team]}</button>)}</div>
            <div className="divider-line"/>
            <div className="active-team-label">WRONG ANSWERS</div>
            <div className="strike-control"><div className="strike-preview">{[0,1,2].map(i=><b key={i} className={i<p.strikes?'live-strike':''}>×</b>)}</div><div className="strike-buttons"><button disabled={locked||p.strikes===0} className="square-btn" onClick={()=>strike(-1)} title="Undo strike (Z)"><Minus size={18}/></button><button disabled={locked||p.strikes===3} className="btn btn-danger" onClick={()=>strike()}><X size={17}/> Strike <span> (X)</span></button></div></div>
            {p.phase==='steal'&&!locked&&<div className="steal-message"><ShieldAlert size={17}/> Three strikes! The opposing team has one chance to steal. The MC decides who gets the bank.</div>}
            <div className="divider-line"/>
            <div className="active-team-label">AWARD ROUND POINTS</div>
            <div className="award-buttons">{[0,1].map(team=><button key={team} className={'award-btn award-btn--'+team} disabled={locked} onClick={()=>award(team)}><Trophy size={18}/><span>Award to<br/><strong>{game.teamNames[team]}</strong></span><ArrowRight size={17}/></button>)}</div>
            {locked&&<div className="awarded-note"><CheckCheck size={18}/> {game.teamNames[p.awardedTeam]} received {p.awardedAmount} points. <button onClick={undoAward}>Undo award</button></div>}
            <div className="divider-line"/>
            <button className="btn btn-plain-wide" onClick={revealAll}><Eye size={17}/> Reveal all remaining answers</button>
            <button className="btn btn-plain-wide" onClick={resetRound}><RotateCcw size={17}/> Reset this round</button>
            <button className="btn btn-next" disabled={game.roundIndex===game.questions.length-1} onClick={()=>goRound(game.roundIndex+1)}>Next round <ArrowRight size={18}/></button>
          </ControlCard>
          <ControlCard title="Question bank" description={`${game.questions.length} editable rounds · JSON import/export`}>
            <div className="tool-grid"><button className="btn btn-tool" onClick={()=>setEditing(true)}><Edit3 size={17}/> Edit questions</button><button className="btn btn-tool" onClick={exportData}><Download size={17}/> Export</button><button className="btn btn-tool" onClick={()=>fileRef.current?.click()}><FileUp size={17}/> Import JSON</button><button className="btn btn-tool" onClick={resetMatch}><RotateCcw size={17}/> Reset match</button></div><input type="file" hidden ref={fileRef} accept="application/json,.json" onChange={importData}/>
          </ControlCard>
          <div className="setup-tip"><Sparkles size={18}/><p><strong>Pro tip</strong><br/>Use two browser windows on the same laptop. Put the display window on the projector and keep this control room on your laptop screen.</p></div>
        </aside>
      </div>
      <footer className="host-footer"><span>PlayLab · Independent interactive games collection · v0.2</span><span>Runs entirely in your browser · No participant accounts</span></footer>
    </main>
    {notice&&<div role="status" className="toast">{notice}</div>}
    {editing&&<QuestionEditor questions={game.questions} onClose={()=>setEditing(false)} onSave={questions=>{change(old=>({...old,questions,roundIndex:0,progress:{},lastEvent:dispatchEvent('next')}));setEditing(false);notify('Question bank updated; match scores reset.')}}/>}
    {showHelp&&<div className="modal-backdrop" onClick={()=>setShowHelp(false)}><div className="modal modal--help" role="dialog" aria-modal="true" aria-label="How to play" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">HOST QUICK START</span><h2>How to play</h2></div><button className="square-btn" onClick={()=>setShowHelp(false)} aria-label="Close"><X/></button></div><ol className="howto"><li><b>Open projector view</b> and move it to the external screen. Fullscreen it, and enable its sound if desired.</li><li><b>Pick the question</b> and designate which team is playing.</li><li><b>Reveal matching answers</b> by clicking answers or pressing keys 1–8. Their weighted points enter the bank.</li><li><b>Use X for wrong answers</b> and Z to undo. At three strikes, give the other team a chance to steal.</li><li><b>Award the bank</b> to whichever team wins. Then advance to the next round.</li><li><b>Replace sample questions</b> with responses from a real survey before the public event.</li></ol><div className="help-foot"><Keyboard size={18}/> Keyboard controls: <kbd>1</kbd>–<kbd>8</kbd> answers · <kbd>X</kbd> strike · <kbd>Z</kbd> undo</div><button className="btn btn-primary" onClick={()=>setShowHelp(false)}>Got it</button></div></div>}
  </div>;
}
function QuestionEditor({questions,onSave,onClose}){
  const [items,setItems]=useState(()=>structuredClone(questions));
  const [selected,setSelected]=useState(0),[error,setError]=useState('');
  const q=items[selected];
  const mutate=fn=>setItems(old=>fn(structuredClone(old)));
  const updateQ=(field,value)=>mutate(old=>{old[selected][field]=value;return old});
  const updateA=(i,field,value)=>mutate(old=>{old[selected].answers[i][field]=value;return old});
  const addRound=()=>{mutate(old=>[...old,{id:uid(),question:'',multiplier:1,answers:[{text:'',points:50},{text:'',points:50}]}]);setSelected(items.length);setError('')};
  const deleteRound=()=>{if(items.length===1){setError('Keep at least one round.');return;}if(!window.confirm('Delete this question?'))return;mutate(old=>old.filter((_,i)=>i!==selected));setSelected(Math.max(0,selected-1));setError('')};
  const save=()=>{try{const normalized=normalizeQuestions(items);onSave(normalized)}catch(e){setError(e.message)}};
  return <div className="modal-backdrop" onClick={onClose}><div className="modal editor-modal" role="dialog" aria-modal="true" aria-label="Edit question bank" onClick={e=>e.stopPropagation()}>
    <div className="modal-head"><div><span className="eyebrow">CONTENT STUDIO</span><h2>Edit question bank</h2><p>Update questions and points without touching the code.</p></div><button className="square-btn" onClick={onClose} aria-label="Close"><X/></button></div>
    <div className="editor-layout"><div className="editor-list">{items.map((item,i)=><button key={item.id} onClick={()=>{setSelected(i);setError('')}} className={'editor-list-item '+(i===selected?'current':'')}><small>ROUND {String(i+1).padStart(2,'0')}</small><span>{item.question||'Untitled question'}</span><i>{item.multiplier}×</i></button>)}<button className="add-round" onClick={addRound}><Plus size={18}/> Add question</button></div>
      <div className="editor-form"><label htmlFor="editor-question">QUESTION</label><textarea id="editor-question" value={q.question} rows={3} maxLength={240} placeholder="Sebutkan..." onChange={e=>updateQ('question',e.target.value)}/><div className="editor-multi"><label htmlFor="editor-multiplier">POINT MULTIPLIER</label><select id="editor-multiplier" value={q.multiplier} onChange={e=>updateQ('multiplier',Number(e.target.value))}><option value={1}>1× — normal round</option><option value={2}>2× — double points</option><option value={3}>3× — triple points</option></select></div>
      <div className="answer-editor-label"><label>ANSWERS & SURVEY POINTS</label><span>{q.answers.reduce((s,a)=>s+(Number(a.points)||0),0)} base points total (100 recommended)</span></div>
      <div className="editor-answer-rows">{q.answers.map((a,i)=><div className="editor-answer-row" key={i}><span>{String(i+1).padStart(2,'0')}</span><input aria-label={'Answer '+(i+1)} placeholder="Answer text" maxLength={70} value={a.text} onChange={e=>updateA(i,'text',e.target.value)}/><input aria-label={'Points for answer '+(i+1)} type="number" min="1" max="100" step="1" value={a.points} onChange={e=>updateA(i,'points',e.target.value)}/><button disabled={q.answers.length<=2} aria-label={'Remove answer '+(i+1)} title="Remove answer" className="remove-answer" onClick={()=>mutate(old=>{old[selected].answers.splice(i,1);return old})}><Trash2 size={16}/></button></div>)}</div>
      <div className="editor-form-bottom"><button className="btn btn-tool" disabled={q.answers.length>=8} onClick={()=>mutate(old=>{old[selected].answers.push({text:'',points:1});return old})}><Plus size={17}/> Add answer</button><button className="btn btn-delete" onClick={deleteRound}><Trash2 size={16}/> Delete round</button></div>
      </div></div>
    {error&&<div role="alert" className="form-error"><ShieldAlert size={17}/>{error}</div>}
    <div className="modal-footer"><div><ShieldAlert size={16}/> Saving changes clears the current match scores.</div><div><button className="btn btn-soft" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}><Save size={17}/> Save questions</button></div></div>
  </div></div>;
}
function DisplayApp({game}){
  const ref=useRef(null);const [soundEnabled,toggleSound]=useCue(game.lastEvent);
  const full=()=>{const el=ref.current;if(!document.fullscreenElement){el?.requestFullscreen?.().catch(()=>{})}else{document.exitFullscreen?.()}};
  return <main className="display-view" ref={ref}><Stage game={game} fullscreenAction={full} soundAction={toggleSound} soundEnabled={soundEnabled}/></main>
}
// Game 2: a separate classroom-friendly trivia game. All state stays local to this browser.
const QUICKFIRE_KEY='playlab-quickfire-state-v1';
const QUICKFIRE_CHANNEL='playlab-quickfire-sync-v1';
const QUICKFIRE_QUESTIONS=[
  {id:'t1',question:'Planet manakah yang paling dekat dengan Matahari?',options:['Venus','Bumi','Merkurius','Mars'],answer:2,explanation:'Merkurius adalah planet terdekat dari Matahari.'},
  {id:'t2',question:'Manakah di antara berikut ini yang merupakan bilangan prima?',options:['15','17','21','27'],answer:1,explanation:'17 hanya dapat dibagi habis oleh 1 dan 17.'},
  {id:'t3',question:'Apa kepanjangan dari CPU dalam komputer?',options:['Central Processing Unit','Computer Power Utility','Central Program User','Control Processing Upload'],answer:0,explanation:'CPU adalah Central Processing Unit.'},
  {id:'t4',question:'Pada tekanan sekitar 1 atmosfer, air murni mendidih pada suhu berapa?',options:['80°C','90°C','100°C','110°C'],answer:2,explanation:'Pada tekanan 1 atm, air murni mendidih sekitar 100°C.'},
  {id:'t5',question:'Format file mana yang biasa digunakan untuk tabel data berbasis teks?',options:['PNG','MP3','CSV','MP4'],answer:2,explanation:'CSV menyimpan data tabular dalam format teks.'},
  {id:'t6',question:'Dalam grafik batang, tinggi batang biasanya mewakili apa?',options:['Warna kategori','Nilai kategori','Urutan huruf','Ukuran font'],answer:1,explanation:'Panjang atau tinggi batang menyatakan nilai data.'}
];
function quickfireInitial(){
  return {version:1,questions:structuredClone(QUICKFIRE_QUESTIONS),questionIndex:0,teamNames:['Team A','Team B'],scores:[0,0],revealed:{},lastAward:null};
}
function useQuickfire(){
  const read=()=>{try{const val=JSON.parse(localStorage.getItem(QUICKFIRE_KEY));return val?.version===1&&Array.isArray(val.questions)&&val.questions.length&&val.scores?.length===2?val:quickfireInitial()}catch{return quickfireInitial()}};
  const [state,setState]=useState(read),ref=useRef(state),ch=useRef(null);
  useEffect(()=>{
    const channel=typeof BroadcastChannel==='function'?new BroadcastChannel(QUICKFIRE_CHANNEL):null;ch.current=channel;
    const apply=next=>{if(next?.version===1){ref.current=next;setState(next)}};
    const onMessage=e=>{if(e.data?.type==='quickfire')apply(e.data.state)};
    const onStorage=e=>{if(e.key===QUICKFIRE_KEY&&e.newValue){try{apply(JSON.parse(e.newValue))}catch{}}};
    channel?.addEventListener('message',onMessage);window.addEventListener('storage',onStorage);
    return ()=>{channel?.removeEventListener('message',onMessage);channel?.close();window.removeEventListener('storage',onStorage)};
  },[]);
  const change=useCallback(fn=>{
    const next=fn(ref.current);if(next===ref.current)return;ref.current=next;setState(next);
    try{localStorage.setItem(QUICKFIRE_KEY,JSON.stringify(next))}catch{}
    ch.current?.postMessage({type:'quickfire',state:next});
  },[]);
  return [state,change];
}
function QuickfireBoard({game,preview=false}){
  const q=game.questions[game.questionIndex],visible=game.revealed[q.id]||false;
  return <div className={'quick-board '+(preview?'quick-board--preview':'')}>
    <div className="quick-stars">✦ <span>PLAYLAB · QUICKFIRE QUIZ</span> ✦</div>
    <div className="quick-head"><h1>QUICKFIRE <em>QUIZ</em></h1><div className="quick-counter">QUESTION {String(game.questionIndex+1).padStart(2,'0')} / {game.questions.length}</div></div>
    <div className="quick-scores">{[0,1].map(i=><div key={i}><span>{game.teamNames[i]}</span><strong>{game.scores[i]}</strong></div>)}</div>
    <div className="quick-question">{q.question}</div>
    <div className="quick-options">{q.options.map((choice,i)=><div key={i} className={'quick-option '+(visible?(i===q.answer?'correct':'muted'):'')}><span>{'ABCD'[i]}</span><strong>{choice}</strong>{visible&&i===q.answer&&<Check size={27}/>}</div>)}</div>
    <div className="quick-footer">{visible?<span className="quick-explanation">{q.explanation||'Correct answer highlighted.'}</span>:<span>Discuss with your team. The host will reveal the answer.</span>}</div>
  </div>;
}
function QuickfireHost({game,change}){
  const q=game.questions[game.questionIndex],visible=game.revealed[q.id]||false;
  const [editor,setEditor]=useState(false),[draft,setDraft]=useState(''),[error,setError]=useState('');
  const setQuestion=n=>change(old=>({...old,questionIndex:Math.max(0,Math.min(old.questions.length-1,n))}));
  const reveal=()=>change(old=>({...old,revealed:{...old.revealed,[q.id]:!visible}}));
  const award=(team,points)=>change(old=>({...old,scores:old.scores.map((v,i)=>i===team?Math.max(0,v+points):v)}));
  const openEditor=()=>{setDraft(JSON.stringify({questions:game.questions},null,2));setError('');setEditor(true)};
  const saveEditor=()=>{
    try{
      const raw=JSON.parse(draft),questions=raw.questions;if(!Array.isArray(questions)||questions.length<1||questions.length>60)throw Error('Provide 1–60 questions.');
      const clean=questions.map((item,i)=>{
        if(!item||typeof item.question!=='string'||!item.question.trim()||item.question.length>250)throw Error(`Question ${i+1}: invalid question text.`);
        if(!Array.isArray(item.options)||item.options.length!==4||item.options.some(x=>typeof x!=='string'||!x.trim()||x.length>110))throw Error(`Question ${i+1}: provide exactly four options.`);
        if(!Number.isInteger(item.answer)||item.answer<0||item.answer>3)throw Error(`Question ${i+1}: answer must be 0, 1, 2, or 3.`);
        return {id:`t-${i+1}`,question:item.question.trim(),options:item.options.map(x=>x.trim()),answer:item.answer,explanation:String(item.explanation||'').slice(0,250)};
      });
      if(!window.confirm('Replace all trivia questions and reset the match?'))return;
      change(old=>({...old,questions:clean,questionIndex:0,revealed:{},scores:[0,0]}));setEditor(false);
    }catch(err){setError(err.message)}
  };
  const exportQuestions=()=>{
    const blob=new Blob([JSON.stringify({questions:game.questions},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='playlab-quickfire-questions.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const displayUrl=new URL(location.href);displayUrl.searchParams.set('view','display');
  return <div className="host-shell">
    <header className="host-header"><PlayLabBrand/><div className="host-header-right"><a className="home-link" href="./">← Game library</a><button className="btn btn-primary" onClick={()=>window.open(displayUrl.toString(),'playlab-quickfire-display')}><MonitorPlay size={17}/> Open projector <ArrowUpRight size={14}/></button></div></header>
    <main className="host-main">
      <div className="intro"><div><div className="eyebrow">CLASSROOM & EVENT TOOLKIT / HOST CONTROL ROOM</div><h1>Let’s play <em>Quickfire Quiz.</em></h1><p>Reveal multiple-choice answers, award team points, and take the whole game to a projector.</p></div></div>
      <div className="quick-layout"><section className="preview-section"><div className="section-head"><div><h2>Audience preview</h2><p>The question and options shown on the projector</p></div></div><div className="preview-frame"><QuickfireBoard game={game} preview/></div></section>
      <aside className="quick-controls">
        <ControlCard title="Question control" description="Run the round from this screen."><div className="quick-nav"><button className="btn btn-soft" disabled={game.questionIndex===0} onClick={()=>setQuestion(game.questionIndex-1)}><ChevronLeft size={17}/> Previous</button><span>{game.questionIndex+1} / {game.questions.length}</span><button className="btn btn-soft" disabled={game.questionIndex===game.questions.length-1} onClick={()=>setQuestion(game.questionIndex+1)}>Next <ChevronRight size={17}/></button></div><h3 className="quick-control-question">{q.question}</h3><p className="quick-correct-hint">Answer: {'ABCD'[q.answer]} · {q.options[q.answer]}</p><button className="btn btn-primary quick-main-action" onClick={reveal}>{visible?<EyeOff size={17}/>:<Eye size={17}/>} {visible?'Hide answer':'Reveal correct answer'}</button></ControlCard>
        <ControlCard title="Team points" description="Manually award or remove 10 points per correct response.">{[0,1].map(i=><div className="quick-team-editor" key={i}><input aria-label={`Team ${i+1} name`} maxLength={45} value={game.teamNames[i]} onChange={e=>change(old=>({...old,teamNames:old.teamNames.map((n,j)=>i===j?e.target.value:n)}))}/><strong>{game.scores[i]}</strong><button className="square-btn" onClick={()=>award(i,-10)} aria-label={`Subtract ten points from team ${i+1}`}><Minus size={16}/></button><button className="square-btn" onClick={()=>award(i,10)} aria-label={`Add ten points to team ${i+1}`}><Plus size={16}/></button></div>)}</ControlCard>
        <ControlCard title="Question bank" description="Editable JSON for reusable lesson and event sets."><div className="tool-grid"><button className="btn btn-tool" onClick={openEditor}><Edit3 size={17}/> Edit / import</button><button className="btn btn-tool" onClick={exportQuestions}><Download size={17}/> Export</button><button className="btn btn-tool" onClick={()=>{if(window.confirm('Reset team points and answer reveals?'))change(old=>({...old,scores:[0,0],questionIndex:0,revealed:{}}))}}><RotateCcw size={17}/> Reset match</button></div></ControlCard>
      </aside></div>
      <footer className="host-footer"><span>PlayLab · Quickfire Quiz v0.2</span><span>Local-only state · Use the same browser profile for host and projector</span></footer>
    </main>
    {editor&&<div className="modal-backdrop" onClick={()=>setEditor(false)}><div className="modal quick-editor" role="dialog" aria-modal="true" aria-label="Edit trivia questions" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><h2>Quickfire question editor</h2><p>Each question has four options. The correct answer is a zero-based index (0–3).</p></div><button className="square-btn" onClick={()=>setEditor(false)} aria-label="Close"><X/></button></div><div className="quick-editor-body"><label htmlFor="json-editor">Paste or edit a JSON question bank</label><textarea id="json-editor" spellCheck={false} value={draft} onChange={e=>setDraft(e.target.value)}/>{error&&<p role="alert" className="form-error">{error}</p>}</div><div className="modal-footer"><span>Saving replaces the bank and resets scores.</span><div><button className="btn btn-soft" onClick={()=>setEditor(false)}>Cancel</button><button className="btn btn-primary" onClick={saveEditor}>Save questions</button></div></div></div></div>}
  </div>;
}
function QuickfireApp(){
  const [game,change]=useQuickfire();const ref=useRef(null);
  const display=new URLSearchParams(location.search).get('view')==='display';
  if(display)return <main className="display-view" ref={ref}><div className="quick-full-actions"><button onClick={()=>document.fullscreenElement?document.exitFullscreen():ref.current?.requestFullscreen?.()}><Maximize size={16}/> Fullscreen</button></div><QuickfireBoard game={game}/></main>;
  return <QuickfireHost game={game} change={change}/>;
}
const CATALOG=[
  {slug:'survey',number:'01',title:'Survey Showdown',category:'Survey & team play',description:'Guess the top answers, reveal survey points and steal the round.',badge:'Playable',icon:'✦'},
  {slug:'quickfire',number:'02',title:'Quickfire Quiz',category:'Trivia & learning',description:'Multiple-choice trivia with answer reveals and team scoring.',badge:'Playable',icon:'⚡'},
  {slug:null,number:'03',title:'Word Relay',category:'Team vocabulary',description:'A fast-paced word-building challenge for groups.',badge:'Planned',icon:'◈'},
  {slug:null,number:'04',title:'Buzzer Battle',category:'Speed & knowledge',description:'Race to buzz in, claim a question and earn points.',badge:'Planned',icon:'◎'}
];
function GameHub(){
  return <div className="hub-shell"><header className="hub-header"><PlayLabBrand/><div className="hub-header-tag"><span className="hub-status-dot"/> A collection of games for real people, in real rooms.</div></header>
    <main className="hub-main"><section className="hub-hero"><div className="hub-eyebrow">INTERACTIVE GAME COLLECTION <span> / </span> VERSION 0.2</div><h1>Make every room<br/><em>come alive.</em></h1><p>Host-led games built for classrooms, workshops, gatherings and community events. No accounts, no complexity — just a laptop, a screen, and people ready to play.</p><div className="hub-hero-actions"><a href="?game=survey" className="hub-button hub-button--primary">Play Survey Showdown <ArrowUpRight size={18}/></a><a href="#games" className="hub-button hub-button--secondary">Explore all games <ArrowRight size={18}/></a></div><div className="hub-hero-facts"><span><MonitorPlay size={16}/> Projector-ready</span><span><Gamepad2 size={16}/> Host-controlled</span><span><Lock size={16}/> No sign-in</span></div></section>
    <section className="hub-games" id="games"><div className="hub-section-head"><div><div className="hub-eyebrow">THE COLLECTION</div><h2>Choose your game</h2></div><p>Two working games. More formats in development.</p></div><div className="hub-card-grid">{CATALOG.map(item=><article className={'hub-game-card '+(!item.slug?'hub-game-card--planned':'')} key={item.number}><div className="hub-card-top"><span>GAME {item.number}</span><span className={'hub-game-status '+(item.slug?'is-ready':'')}>{item.badge}</span></div><div className="hub-game-glyph" aria-hidden="true">{item.icon}</div><div className="hub-game-category">{item.category}</div><h3>{item.title}</h3><p>{item.description}</p>{item.slug?<a href={'?game='+item.slug} className="hub-card-link">Open game <ArrowUpRight size={18}/></a>:<span className="hub-card-later">Coming in a later release</span>}</article>)}</div></section>
    <section className="hub-how"><div><div className="hub-eyebrow">DESIGNED FOR IN-PERSON MOMENTS</div><h2>One laptop.<br/>A room full of energy.</h2></div><div className="hub-steps"><div><b>01</b><span>Pick a game and customize its questions.</span></div><div><b>02</b><span>Open a separate audience window on a projector.</span></div><div><b>03</b><span>Control reveals, scores and rounds from the host screen.</span></div></div></section>
    <footer className="hub-footer"><div><strong>PLAYLAB</strong><span>Interactive games, independently built.</span></div><span>Portfolio project · Prototype v0.2 · Example scores are fictional</span></footer></main></div>;
}
function SurveyGame(){const [game,change]=useGame();return IS_DISPLAY?<DisplayApp game={game}/>:<HostApp game={game} change={change}/>;}
function App(){
  useEffect(()=>{if('serviceWorker' in navigator && import.meta.env.PROD){navigator.serviceWorker.register(new URL('sw.js',location.href)).catch(err=>console.warn('Offline registration unsuccessful',err))}},[]);
  const params=new URLSearchParams(location.search),selected=params.get('game');
  if(selected==='quickfire')return <QuickfireApp/>;
  if(selected==='survey')return <SurveyGame/>;
  return <GameHub/>;
}
createRoot(document.getElementById('root')).render(<App/>);
