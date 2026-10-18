import React, {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Check,CheckCheck,ChevronDown,ChevronLeft,ChevronRight,CircleHelp,Copy,Download,Edit3,Expand,Eye,EyeOff,FileUp,Gamepad2,Headphones,Keyboard,Lock,Maximize,Minus,MonitorPlay,Plus,RotateCcw,Save,Settings2,ShieldAlert,SkipForward,Sparkles,Trash2,Trophy,Volume2,VolumeX,X} from 'lucide-react';
import {useSyncedSession} from '../../core/useSyncedSession.js';
import {RemoteConnectionGate} from '../../remote/RemoteConnectionGate.jsx';
import {REHEARSAL_KEYS,isRehearsal} from '../../core/rehearsal.js';
import {QuickfireQuestionEditor} from './QuestionEditor.jsx';
import {PlayLabBrand,ControlCard} from '../../components/shared.jsx';
import {QUICKFIRE_KEY,QUICKFIRE_CHANNEL,quickfireInitial,normalizeQuickfireQuestions,awardQuickfirePoints,undoQuickfireAward} from './data.js';
import '../gameplay-polish.css';
import '../projector-fx.css';
import {makeStageEvent,useProjectorAudio,useStageMoment} from '../stageEffects.js';
import {ResultsBoard,ResultsHost} from '../GameResults.jsx';
import {HostActionBar,HostActionButton} from '../HostActionBar.jsx';
import {GameRules} from '../GameRules.jsx';
import {CountdownBadge,CountdownControls} from '../Countdown.jsx';
import {clearCountdown} from '../countdown.js';
import {LanguageSwitch,useLanguage} from '../../i18n/language.jsx';
const IS_REHEARSAL=isRehearsal();
// Game 2: a separate classroom-friendly trivia game. All state stays local to this browser.
function readQuickfire(){
  try {const value=JSON.parse(localStorage.getItem(IS_REHEARSAL?REHEARSAL_KEYS.quickfire:QUICKFIRE_KEY));
    return value?.version===1&&Array.isArray(value.questions)&&value.questions.length&&value.scores?.length===2?value:quickfireInitial();
  }catch{return quickfireInitial();}
}
const QUICKFIRE_SESSION={storageKey:IS_REHEARSAL?REHEARSAL_KEYS.quickfire:QUICKFIRE_KEY,channelName:IS_REHEARSAL?QUICKFIRE_CHANNEL+'-rehearsal':QUICKFIRE_CHANNEL,messageType:'quickfire',readInitial:readQuickfire,
  isValid:state=>state?.version===1&&Array.isArray(state.questions)&&state.questions.length>0&&Array.isArray(state.scores)&&state.scores.length===2};
function useQuickfire(){return useSyncedSession(QUICKFIRE_SESSION);}
function QuickfireBoard({game,preview=false}){
  const {lang,t}=useLanguage();
  const q=game.questions[game.questionIndex],visible=game.revealed[q.id]||false;
  const moment=useStageMoment(game.lastEvent,['score'],1850);
  const questionRef=useRef(null),optionsRef=useRef(null),previousQuestion=useRef(q.id);
  useEffect(()=>{
    if(previousQuestion.current===q.id)return;
    previousQuestion.current=q.id;
    if(preview||window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return;
    const timing={duration:420,easing:'cubic-bezier(.2,.8,.15,1)'};
    questionRef.current?.animate?.([{opacity:.15,transform:'translateY(-12px)'},{opacity:1,transform:'translateY(0)'}],timing);
    optionsRef.current?.animate?.([{opacity:.45,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],timing);
  },[q.id,preview]);
  return <div className={'quick-board '+(preview?'quick-board--preview':'')}>
    <div className="quick-stars">✦ <span>PLAYLAB · QUICKFIRE QUIZ</span> ✦</div>
    <div className="quick-head"><h1>QUICKFIRE <em>QUIZ</em></h1><div className="quick-counter">{t('QUESTION')} {String(game.questionIndex+1).padStart(2,'0')} / {game.questions.length}</div><CountdownBadge game={game} contextId={q.id}/></div>
    <div className="quick-scores">{[0,1].map(i=><div key={i}><span>{game.teamNames[i]}</span><strong>{game.scores[i]}</strong></div>)}</div>
    <div className="quick-question" ref={questionRef}>{q.question}</div>
    <div className="quick-options" ref={optionsRef}>{q.options.map((choice,i)=><div key={i} className={'quick-option '+(visible?(i===q.answer?'correct':'muted'):'')}><span>{'ABCD'[i]}</span><strong>{choice}</strong>{visible&&i===q.answer&&<Check size={27}/>}</div>)}</div>
    <div className="quick-footer">{visible?<span className="quick-explanation">{q.explanation||t('Correct answer highlighted.')}</span>:<span>{t('Discuss with your team. The host will reveal the answer.')}</span>}</div>
    {!preview&&moment&&<div className="quick-score-celebration" role="status" key={moment.nonce}>
      <div className="projector-confetti" aria-hidden="true">{Array.from({length:14},(_,i)=><i key={i}/>)}</div>
      <Trophy size={52} aria-hidden="true"/><span>{t('POINTS FOR')}</span>
      <strong>{game.teamNames[moment.team]||'TEAM'}</strong><b>+{moment.points}</b>
    </div>}
  </div>;
}
function QuickfireHost({game,change}){
  const {lang,t}=useLanguage();
  const q=game.questions[game.questionIndex],visible=game.revealed[q.id]||false;
  const [editor,setEditor]=useState(false);
  const setQuestion=n=>change(old=>{
    const index=Math.max(0,Math.min(old.questions.length-1,n));
    return index===old.questionIndex?old:{...clearCountdown(old),questionIndex:index,lastEvent:makeStageEvent('next')};
  });
  const reveal=()=>change(old=>{
    const question=old.questions[old.questionIndex],nowVisible=!old.revealed[question.id];
    return {...(nowVisible?clearCountdown(old):old),revealed:{...old.revealed,[question.id]:nowVisible},lastEvent:makeStageEvent(nowVisible?'reveal':'undo')};
  });
  const award=(team,points)=>change(old=>{
    const next=awardQuickfirePoints(old,team,points);
    return next===old?old:{...next,lastEvent:makeStageEvent(points>0?'score':'subtract',{team,points:next.scores[team]-old.scores[team]})};
  });
  const undoScore=()=>change(old=>{
    const next=undoQuickfireAward(old);
    return next===old?old:{...next,lastEvent:makeStageEvent('undo')};
  });
  useEffect(()=>{
    const keydown=event=>{
      if(editor||game.finished||event.repeat||event.altKey||event.ctrlKey||event.metaKey||event.isComposing)return;
      if(/INPUT|TEXTAREA|SELECT/.test(event.target?.tagName)||event.target?.isContentEditable||event.target?.closest?.('[role=dialog]'))return;
      const key=event.key.toLowerCase();
      if(!['r','n','p','u'].includes(key))return;
      event.preventDefault();
      if(key==='r')reveal();
      if(key==='n'&&game.questionIndex<game.questions.length-1)setQuestion(game.questionIndex+1);
      if(key==='p'&&game.questionIndex>0)setQuestion(game.questionIndex-1);
      if(key==='u'&&game.lastAward)undoScore();
    };
    window.addEventListener('keydown',keydown);
    return ()=>window.removeEventListener('keydown',keydown);
  },[editor,game.questionIndex,game.questions.length,game.lastAward,visible,q.id]);
  const finishMatch=()=>{
    if(!window.confirm('Finish this match and show final results? Scores and questions stay saved. You can resume to correct anything.'))return;
    change(old=>old.finished?old:{...clearCountdown(old),finished:true,lastEvent:makeStageEvent('finish')});
  };
  const resumeMatch=()=>change(old=>({...old,finished:false,lastEvent:makeStageEvent('next')}));
  const resetFinishedMatch=()=>{
    if(!window.confirm('Reset and play again? ALL points and revealed answers will be cleared. Questions and team names stay saved.'))return;
    change(old=>({...clearCountdown(old),finished:false,scores:[0,0],questionIndex:0,revealed:{},lastAward:null,lastEvent:makeStageEvent('next')}));
  };
  const openEditor=()=>setEditor(true);
  const exportQuestions=()=>{
    const blob=new Blob([JSON.stringify({questions:game.questions},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='playlab-quickfire-questions.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const displayUrl=new URL(location.href);displayUrl.searchParams.set('view','display');
  if(game.finished)return <ResultsHost game={game} kind="quickfire" onResume={resumeMatch} onReset={resetFinishedMatch} openProjector={()=>window.open(displayUrl.toString(),'playlab-quickfire-display')}/>;
  return <div className="host-shell gameplay-polished gameplay-quickfire">
    <header className="host-header"><PlayLabBrand/><div className="host-header-right"><LanguageSwitch/><a className="home-link" href="./">← {t('Game library')}</a><button className="btn btn-primary" onClick={()=>window.open(displayUrl.toString(),'playlab-quickfire-display')}><MonitorPlay size={17}/> {t('Open projector')} <ArrowUpRight size={14}/></button></div></header>
    <main className="host-main">
      <div className="intro"><div><div className="eyebrow">CLASSROOM & EVENT TOOLKIT / HOST CONTROL ROOM</div><h1>{lang==='id'?'Ayo main':'Let’s play'} <em>Quickfire Quiz.</em></h1><p>{lang==='id'?'Tampilkan jawaban pilihan ganda, berikan poin, dan tayangkan permainan di proyektor.':'Reveal multiple-choice answers, award team points, and take the whole game to a projector.'}</p></div><div className="gameplay-progress-pill"><span>✦</span> {t('QUESTION')} {game.questionIndex+1} {lang==='id'?'DARI':'OF'} {game.questions.length}</div></div>
      <div className="gameplay-status-strip" aria-label="Current game status"><div><span>{lang==='id'?'DI LAYAR BESAR':'ON THE BIG SCREEN'}</span><strong>{t(visible?'Answer revealed':'Question waiting')}</strong></div><div><span>{lang==='id'?'TIM BERTANDING':'TEAMS READY'}</span><strong>{game.teamNames.join(' vs ')}</strong></div><div><span>{lang==='id'?'PINTASAN':'QUICK KEYS'}</span><strong>{lang==='id'?'R buka · N/P pindah · U batalkan':'R reveal · N/P navigate · U undo'}</strong></div></div>
      <HostActionBar eyebrow={`${lang==='id'?'PERTANYAAN LANGSUNG':'LIVE QUESTION'} ${game.questionIndex+1} / ${game.questions.length}`}
        title={lang==='id'?(visible?(game.questionIndex===game.questions.length-1?'Jawaban terakhir dibuka':'Jawaban terbuka — beri poin atau lanjut'):'Berikan waktu untuk menjawab'):(visible?(game.questionIndex===game.questions.length-1?'Last answer revealed':'Answer revealed — score or continue'):'Give everyone a moment to answer')}
        description={lang==='id'?(visible?'Berikan poin secara manual sebelum lanjut. Tidak ada skor otomatis.':'Minta tim memilih jawaban, lalu buka jawaban benar saat siap.'):(visible?'Award points explicitly before advancing. There is no automatic scoring.':'Ask the room for their choice, then show the correct answer when ready.')}
        footnote={lang==='id'?'Gunakan R untuk membuka/menutup, N/P untuk berpindah, dan U untuk membatalkan skor. Kontrol detail ada di bawah.':'Use R to reveal/hide, N/P to navigate and U to undo a score change. All detailed controls stay available below.'}>
        {!visible?
          <><HostActionButton primary onClick={reveal}><Eye size={17}/> {t('Show answer on projector')}</HostActionButton>
            {game.questionIndex<game.questions.length-1&&<HostActionButton muted onClick={()=>setQuestion(game.questionIndex+1)}><ArrowRight size={16}/> {lang==='id'?'Lewati ke pertanyaan':'Skip to question'} {game.questionIndex+2}</HostActionButton>}
          </>:
          <>{[0,1].map(team=><HostActionButton key={team} onClick={()=>award(team,10)}><Plus size={17}/> +10 · {game.teamNames[team]}</HostActionButton>)}
            {game.questionIndex===game.questions.length-1?
              <HostActionButton primary onClick={finishMatch}><Trophy size={17}/> {t('Show final results')}</HostActionButton>:
              <HostActionButton primary onClick={()=>setQuestion(game.questionIndex+1)}><ArrowRight size={17}/> {t('Continue to question')} {game.questionIndex+2}</HostActionButton>}
            {game.lastAward&&<HostActionButton muted onClick={undoScore}><RotateCcw size={16}/> {t('Undo score change')}</HostActionButton>}
          </>}
      </HostActionBar>
      <div className="host-rules-reference"><GameRules game="quickfire"/></div>
      <div className="quick-layout"><section className="preview-section"><div className="section-head"><div><h2>{lang==='id'?'Pratinjau penonton':'Audience preview'}</h2><p>{lang==='id'?'Pertanyaan dan pilihan yang ditampilkan di proyektor':'The question and options shown on the projector'}</p></div></div><div className="preview-frame"><QuickfireBoard game={game} preview/></div></section>
      <aside className="quick-controls">
        <ControlCard title={t('Countdown timer')} description="Choose a duration to show a timer on the projector."><CountdownControls game={game} change={change} contextId={q.id}/></ControlCard>
        <ControlCard title={t('Question control')} description="Host shortcuts: R reveal/hide · N next · P previous. They pause while editing text."><div className="quick-nav"><button className="btn btn-soft" disabled={game.questionIndex===0} onClick={()=>setQuestion(game.questionIndex-1)}><ChevronLeft size={17}/> Previous</button><span>{game.questionIndex+1} / {game.questions.length}</span><button className="btn btn-soft" disabled={game.questionIndex===game.questions.length-1} onClick={()=>setQuestion(game.questionIndex+1)}>Next <ChevronRight size={17}/></button></div><h3 className="quick-control-question">{q.question}</h3><p className="quick-correct-hint">Answer: {'ABCD'[q.answer]} · {q.options[q.answer]}</p><button className="btn btn-primary quick-main-action" aria-pressed={visible} onClick={reveal}>{visible?<EyeOff size={17}/>:<Eye size={17}/>} {t(visible?'Hide answer':'Reveal correct answer')}</button></ControlCard>
        <ControlCard title={t('Team points')} description="Adjust points manually. Undo the latest change with U or the button below.">{[0,1].map(i=><div className="quick-team-editor" key={i}><input aria-label={`Team ${i+1} name`} maxLength={45} value={game.teamNames[i]} onChange={e=>change(old=>({...old,teamNames:old.teamNames.map((n,j)=>i===j?e.target.value:n)}))}/><strong>{game.scores[i]}</strong><button className="square-btn" disabled={game.scores[i]===0} onClick={()=>award(i,-10)} aria-label={`Subtract ten points from team ${i+1}`}><Minus size={16}/></button><button className="square-btn" onClick={()=>award(i,10)} aria-label={`Add ten points to team ${i+1}`}><Plus size={16}/></button></div>)}<div className="quick-undo-row"><button className="btn btn-soft quick-undo-button" disabled={!game.lastAward} onClick={undoScore}><RotateCcw size={15}/> Undo last score change <kbd>U</kbd></button>{game.lastAward&&<span role="status">Last: {game.lastAward.delta>0?'+':''}{game.lastAward.delta} for {game.teamNames[game.lastAward.team]}</span>}</div></ControlCard>
        <ControlCard title={t('Match results')} description="Announce the final scoreboard on the projector without resetting points.">
          <button className="btn btn-primary results-finish-button" onClick={finishMatch}><Trophy size={18}/> {t('Finish match & show results')}</button>
          <p className="results-finish-note">You can finish early. Your current score stays saved, and you can resume to correct it.</p>
        </ControlCard>
        <ControlCard title={t('Question bank')} description="Use the visual editor to customize questions. Export a JSON backup anytime."><div className="tool-grid"><button className="btn btn-tool" onClick={openEditor}><Edit3 size={17}/> Edit question bank</button><button className="btn btn-tool" onClick={exportQuestions}><Download size={17}/> Export</button><button className="btn btn-tool" onClick={()=>{if(window.confirm('Reset team points and answer reveals?'))change(old=>({...clearCountdown(old),scores:[0,0],questionIndex:0,revealed:{},lastAward:null,finished:false}))}}><RotateCcw size={17}/> Reset match</button></div></ControlCard>
      </aside></div>
      <footer className="host-footer"><span>PlayLab · Quickfire Quiz</span><span>Local-only state · Use the same browser profile for host and projector</span></footer>
    </main>
    {editor&&<QuickfireQuestionEditor questions={game.questions} onClose={()=>setEditor(false)} onSave={questions=>{
      if(!window.confirm('Replace all trivia questions and reset the match?'))return;
      change(old=>({...clearCountdown(old),questions,questionIndex:0,revealed:{},scores:[0,0],lastAward:null,finished:false}));
      setEditor(false);
    }}/>} 
  </div>;
}
function QuickfireDisplay({game}){
  const {t}=useLanguage();
  const ref=useRef(null);
  const [soundEnabled,toggleSound]=useProjectorAudio(game.lastEvent);
  const fullscreen=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else ref.current?.requestFullscreen?.().catch?.(()=>{});};
  return <main className="display-view quick-display" ref={ref}>
    <div className="quick-full-actions"><LanguageSwitch compact/>
      <button type="button" aria-pressed={soundEnabled} aria-label={soundEnabled?'Mute projector sounds':'Enable projector sounds'} onClick={toggleSound}>
        {soundEnabled?<Volume2 size={16}/>:<VolumeX size={16}/>} {t(soundEnabled?'Sound on':'Enable sound')}
      </button>
      <button type="button" onClick={fullscreen}><Maximize size={16}/> {t('Fullscreen')}</button>
    </div>
    {game.finished?<ResultsBoard game={game} kind="quickfire"/>:<QuickfireBoard game={game}/>}
  </main>;
}
export function QuickfireApp(){
  const [game,change,connection]=useQuickfire();
  const display=new URLSearchParams(location.search).get('view')==='display';
  return <RemoteConnectionGate connection={connection} host={!display}>
    {IS_REHEARSAL&&<aside role="status" className="playlab-practice-banner"><strong>Practice mode</strong> · Scores and changes stay separate from your real match. <a href="?page=dashboard&tab=setup&format=quickfire">Back to setup</a></aside>}
    {display?<QuickfireDisplay game={game}/>:<QuickfireHost game={game} change={change}/>}
  </RemoteConnectionGate>;
}
