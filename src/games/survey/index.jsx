import React, {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Check,CheckCheck,ChevronDown,ChevronLeft,ChevronRight,CircleHelp,Copy,Download,Edit3,Expand,Eye,EyeOff,FileUp,Gamepad2,Headphones,Keyboard,Lock,Maximize,Minus,MonitorPlay,Plus,RotateCcw,Save,Settings2,ShieldAlert,SkipForward,Sparkles,Trash2,Trophy,Volume2,VolumeX,X} from 'lucide-react';
import {useSyncedSession} from '../../core/useSyncedSession.js';
import {QuestionBuilder,useQuestionDraft} from '../../components/QuestionBuilder.jsx';
import '../gameplay-polish.css';
import '../projector-fx.css';
import {useProjectorAudio} from '../stageEffects.js';
import {REHEARSAL_KEYS,isRehearsal} from '../../core/rehearsal.js';
import {PlayLabBrand,RoundPill,ControlCard,IconButton} from '../../components/shared.jsx';
import {CHANNEL,STORAGE_KEY,getScores,makeInitialState,normalizeQuestions,progressFor,readSavedState,sampleQuestions,sumBank} from '../../data.js';
const IS_DISPLAY=new URLSearchParams(location.search).get('view')==='display';
const IS_REHEARSAL=isRehearsal();
function uid(){return `r-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;}
function dispatchEvent(kind,detail=''){return {kind,detail,stamp:Date.now(),nonce:Math.random().toString(36).slice(2)};}
const SURVEY_SESSION={
  storageKey:IS_REHEARSAL?REHEARSAL_KEYS.survey:STORAGE_KEY,
  channelName:IS_REHEARSAL?CHANNEL+'-rehearsal':CHANNEL,
  messageType:'state',
  readInitial:IS_REHEARSAL?()=>{
    try{const saved=JSON.parse(localStorage.getItem(REHEARSAL_KEYS.survey));return saved?.version===1&&Array.isArray(saved.questions)&&saved.questions.length?saved:makeInitialState();}
    catch{return makeInitialState();}
  }:readSavedState,
  isValid:state=>state?.version===1&&Array.isArray(state.questions)
};
function useGame(){return useSyncedSession(SURVEY_SESSION);}
function updateProgress(game, patch, eventKind){
  const q=game.questions[game.roundIndex];if(!q)return game;
  const old=progressFor(game,q.id);
  return {...game,progress:{...game.progress,[q.id]:{...old,...patch}},lastEvent:eventKind?dispatchEvent(eventKind):game.lastEvent};
}
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
        {!preview&&<div className="display-actions"><button className="display-tool" onClick={soundAction} aria-pressed={soundEnabled} aria-label={soundEnabled?'Mute projector sounds':'Enable projector sounds'} title={soundEnabled?'Mute game sounds':'Enable game sounds on this screen'}>{soundEnabled?<Volume2 size={18}/>:<VolumeX size={18}/>}<span>{soundEnabled?'Sound on':'Enable sound'}</span></button><button className="display-tool" onClick={fullscreenAction} title="Go fullscreen"><Maximize size={18}/><span>Fullscreen</span></button></div>}
      </div>
      <div className="score-ribbon">
        {[0,1].map(team=><div className={'team-score team-score--'+team+(p.activeTeam===team&&p.awardedTeam===null?' is-active':'')+(p.awardedTeam===team?' is-winner':'')} key={team}>
          <div className="team-label"><span className="team-dot"/><span>{game.teamNames[team]}</span>{p.activeTeam===team&&p.awardedTeam===null&&<span className="playing-pill">MAIN</span>}{p.awardedTeam===team&&<Trophy size={17}/>}</div>
          <div className="team-number">{scores[team].toLocaleString('id-ID')}</div>
        </div>)}
      </div>
      <div className="stage-question" key={q.id}><span>PERTANYAAN {String(game.roundIndex+1).padStart(2,'0')}</span><h1>{q.question}</h1></div>
      <div key={q.id} className={'stage-answer-grid '+(q.answers.length>=7?'stage-answer-grid--dense':'')}>
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
    {!preview&&flair&&<div className="award-overlay" role="status" key={flair.nonce}><div className="projector-confetti" aria-hidden="true">{Array.from({length:14},(_,i)=><i key={i}/>)}</div><div className="award-burst">✦ ✦ ✦</div><Trophy size={60}/><span>SELAMAT!</span><strong>{flair.team}</strong><b>+{flair.points} POIN</b></div>}
  </div>
}
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
  return <div className="host-shell gameplay-polished gameplay-survey">
    <header className="host-header"><PlayLabBrand/><div className="host-header-right"><a className="home-link" href="./">← Game library</a><span className="local-badge"><span/>LOCAL GAME MODE</span><IconButton icon={CircleHelp} onClick={()=>setShowHelp(true)} variant="btn-soft">How to play</IconButton><button className="btn btn-primary" onClick={openDisplay}><MonitorPlay size={18}/> Open projector view <ArrowUpRight size={15}/></button></div></header>
    <main className="host-main">
      <div className="intro"><div><div className="eyebrow">EVENT TOOLKIT <span> / </span> MC CONTROL ROOM</div><h1>Let’s play <em>Survey Showdown.</em></h1><p>Your game, your questions, your stage. Control every reveal from here while the audience sees the big board.</p></div><div className="gameplay-progress-pill"><span>✦</span> ROUND {game.roundIndex+1} OF {game.questions.length}</div></div>
      <div className="gameplay-status-strip" aria-label="Current game status"><div><span>ROUND STATE</span><strong>{locked?'Round finished':p.phase==='steal'?'Steal opportunity':'Answers in play'}</strong></div><div><span>REVEALED / BANK</span><strong>{p.revealed.length} of {q.answers.length} · {locked?p.awardedAmount:bank} points</strong></div><div><span>QUICK KEYS</span><strong>1–8 reveal · X strike · Z undo strike</strong></div></div>
      <div className="host-grid">
        <div className="host-primary">
          <section className="preview-section"><div className="section-head"><div><h2>Live game preview</h2><p>What your audience sees on the projector</p></div><div className="head-buttons"><IconButton icon={Copy} onClick={copyDisplay} variant="btn-soft">{copyOkay?'Copied':'Copy display URL'}</IconButton><IconButton icon={Expand} onClick={openDisplay} variant="btn-soft">Pop out</IconButton></div></div><div className="preview-frame"><Stage game={game} preview/></div></section>
          <ControlCard title="Reveal answers" description="Click an answer to show it on the big board. Shortcuts: 1–8." extra={<span className="small-count">{p.revealed.length} / {q.answers.length} SHOWN</span>}>
            <div className="reveal-grid">{q.answers.map((a,i)=><button key={i} disabled={locked} className={'reveal-button '+(p.revealed.includes(i)?'reveal-button--on':'')} aria-pressed={p.revealed.includes(i)} onClick={()=>reveal(i)} title={`Keyboard: ${i+1}`}><span className="reveal-index">{i+1}</span><span className="reveal-name">{a.text}</span><strong>{a.points*q.multiplier} <small>pts</small></strong>{p.revealed.includes(i)?<Eye size={16}/>:<EyeOff size={16}/>}</button>)}</div>
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
            <div className="active-team-selector">{[0,1].map(team=><button disabled={locked} key={team} className={'select-team select-team--'+team+(p.activeTeam===team?' selected':'')} aria-pressed={p.activeTeam===team} onClick={()=>chooseTeam(team)}>{p.activeTeam===team&&<Check size={16}/>} {game.teamNames[team]}</button>)}</div>
            <div className="divider-line"/>
            <div className="active-team-label">WRONG ANSWERS</div>
            <div className="strike-control"><div className="strike-preview">{[0,1,2].map(i=><b key={i} className={i<p.strikes?'live-strike':''}>×</b>)}</div><div className="strike-buttons"><button disabled={locked||p.strikes===0} className="square-btn" onClick={()=>strike(-1)} title="Undo strike (Z)"><Minus size={18}/></button><button disabled={locked||p.strikes===3} className="btn btn-danger" onClick={()=>strike()}><X size={17}/> Strike <span> (X)</span></button></div></div>
            {p.phase==='steal'&&!locked&&<div className="steal-message"><ShieldAlert size={17}/> Three strikes! The opposing team has one chance to steal. The MC decides who gets the bank.</div>}
            <div className="divider-line"/>
            <div className="active-team-label">AWARD ROUND POINTS</div>
            {bank===0&&!locked&&<div className="gameplay-guidance" role="status">Reveal at least one answer before awarding points to a team.</div>}
            <div className="award-buttons">{[0,1].map(team=><button key={team} className={'award-btn award-btn--'+team} disabled={locked||bank===0} title={bank===0?'Reveal an answer before awarding points':undefined} onClick={()=>award(team)}><Trophy size={18}/><span>Award to<br/><strong>{game.teamNames[team]}</strong></span><ArrowRight size={17}/></button>)}</div>
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
      <footer className="host-footer"><span>PlayLab · Survey Showdown</span><span>Runs entirely in your browser · No participant accounts</span></footer>
    </main>
    {notice&&<div role="status" className="toast">{notice}</div>}
    {editing&&<QuestionEditor questions={game.questions} onClose={()=>setEditing(false)} onSave={questions=>{change(old=>({...old,questions,roundIndex:0,progress:{},lastEvent:dispatchEvent('next')}));setEditing(false);notify('Question bank updated; match scores reset.')}}/>}
    {showHelp&&<div className="modal-backdrop" onClick={()=>setShowHelp(false)}><div className="modal modal--help" role="dialog" aria-modal="true" aria-label="How to play" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">HOST QUICK START</span><h2>How to play</h2></div><button className="square-btn" onClick={()=>setShowHelp(false)} aria-label="Close"><X/></button></div><ol className="howto"><li><b>Open projector view</b> and move it to the external screen. Fullscreen it, and enable its sound if desired.</li><li><b>Pick the question</b> and designate which team is playing.</li><li><b>Reveal matching answers</b> by clicking answers or pressing keys 1–8. Their weighted points enter the bank.</li><li><b>Use X for wrong answers</b> and Z to undo. At three strikes, give the other team a chance to steal.</li><li><b>Award the bank</b> to whichever team wins. Then advance to the next round.</li><li><b>Replace sample questions</b> with responses from a real survey before the public event.</li></ol><div className="help-foot"><Keyboard size={18}/> Keyboard controls: <kbd>1</kbd>–<kbd>8</kbd> answers · <kbd>X</kbd> strike · <kbd>Z</kbd> undo</div><button className="btn btn-primary" onClick={()=>setShowHelp(false)}>Got it</button></div></div>}
  </div>;
}
function QuestionEditor({questions,onSave,onClose}){
  const {items,setItems,selected,setSelected,error,setError,mutate}=useQuestionDraft(questions);
  const q=items[selected];
  const updateQ=(field,value)=>mutate(draft=>{draft[selected][field]=value;});
  const updateA=(i,field,value)=>mutate(draft=>{draft[selected].answers[i][field]=value;});
  const addRound=()=>{
    if(items.length>=60)return;
    setItems(old=>[...old,{id:uid(),question:'',multiplier:1,answers:[{text:'',points:50},{text:'',points:50}]}]);
    setSelected(items.length);setError('');
  };
  const deleteRound=()=>{
    if(items.length===1){setError('Keep at least one round.');return;}
    if(!window.confirm('Delete this question?'))return;
    setItems(old=>old.filter((_,i)=>i!==selected));
    setSelected(Math.max(0,selected-1));setError('');
  };
  const save=()=>{try{onSave(normalizeQuestions(items));setError('');}catch(err){setError(err.message)}};
  return <QuestionBuilder label="Edit question bank" title="Edit question bank"
    eyebrow="CONTENT STUDIO · SURVEY" description="Update questions and points without touching the code."
    items={items} selected={selected} onSelect={i=>{setSelected(i);setError('');}}
    onAdd={addRound} addLabel="Add question" kindLabel="ROUND" itemBadge={item=>item.multiplier+'×'}
    className="editor-modal" error={error}
    saveNote="Saving changes clears the current match scores." onSave={save} onClose={onClose}>
    <label htmlFor="editor-question">QUESTION</label>
    <textarea id="editor-question" value={q.question} rows={3} maxLength={240} placeholder="Sebutkan..." onChange={e=>updateQ('question',e.target.value)}/>
    <div className="editor-multi"><label htmlFor="editor-multiplier">POINT MULTIPLIER</label>
      <select id="editor-multiplier" value={q.multiplier} onChange={e=>updateQ('multiplier',Number(e.target.value))}><option value={1}>1× — normal round</option><option value={2}>2× — double points</option><option value={3}>3× — triple points</option></select>
    </div>
    <div className="answer-editor-label"><label>ANSWERS & SURVEY POINTS</label><span>{q.answers.reduce((sum,a)=>sum+(Number(a.points)||0),0)} base points total (100 recommended)</span></div>
    <div className="editor-answer-rows">{q.answers.map((a,i)=><div className="editor-answer-row" key={i}>
      <span>{String(i+1).padStart(2,'0')}</span>
      <input aria-label={'Answer '+(i+1)} placeholder="Answer text" maxLength={70} value={a.text} onChange={e=>updateA(i,'text',e.target.value)}/>
      <input aria-label={'Points for answer '+(i+1)} type="number" min="1" max="100" step="1" value={a.points} onChange={e=>updateA(i,'points',e.target.value)}/>
      <button disabled={q.answers.length<=2} aria-label={'Remove answer '+(i+1)} title="Remove answer" className="remove-answer" onClick={()=>mutate(draft=>{draft[selected].answers.splice(i,1);})}><Trash2 size={16}/></button>
    </div>)}</div>
    <div className="editor-form-bottom">
      <button className="btn btn-tool" disabled={q.answers.length>=8} onClick={()=>mutate(draft=>{draft[selected].answers.push({text:'',points:1});})}><Plus size={17}/> Add answer</button>
      <button className="btn btn-delete" onClick={deleteRound}><Trash2 size={16}/> Delete round</button>
    </div>
  </QuestionBuilder>;
}
function DisplayApp({game}){
  const ref=useRef(null);const [soundEnabled,toggleSound]=useProjectorAudio(game.lastEvent);
  const full=()=>{const el=ref.current;if(!document.fullscreenElement){el?.requestFullscreen?.().catch(()=>{})}else{document.exitFullscreen?.()}};
  return <main className="display-view" ref={ref}><Stage game={game} fullscreenAction={full} soundAction={toggleSound} soundEnabled={soundEnabled}/></main>
}

export function SurveyGame(){const [game,change]=useGame();return <>{IS_REHEARSAL&&<aside role="status" className="playlab-practice-banner"><strong>Practice mode</strong> · Scores and changes stay separate from your real match. <a href="?page=dashboard&tab=setup&format=survey">Back to setup</a></aside>}{IS_DISPLAY?<DisplayApp game={game}/>:<HostApp game={game} change={change}/>}</>;}
