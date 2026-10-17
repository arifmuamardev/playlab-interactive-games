import React, {useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Check,CheckCheck,ChevronDown,ChevronLeft,ChevronRight,CircleHelp,Copy,Download,Edit3,Expand,Eye,EyeOff,FileUp,Gamepad2,Headphones,Keyboard,Lock,Maximize,Minus,MonitorPlay,Plus,RotateCcw,Save,Settings2,ShieldAlert,SkipForward,Sparkles,Trash2,Trophy,Volume2,VolumeX,X} from 'lucide-react';
import {useSyncedSession} from '../../core/useSyncedSession.js';
import {REHEARSAL_KEYS,isRehearsal} from '../../core/rehearsal.js';
import {QuickfireQuestionEditor} from './QuestionEditor.jsx';
import {PlayLabBrand,ControlCard} from '../../components/shared.jsx';
import {QUICKFIRE_KEY,QUICKFIRE_CHANNEL,quickfireInitial,normalizeQuickfireQuestions,changeQuickfireScore} from './data.js';
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
  const [editor,setEditor]=useState(false);
  const setQuestion=n=>change(old=>({...old,questionIndex:Math.max(0,Math.min(old.questions.length-1,n))}));
  const reveal=()=>change(old=>({...old,revealed:{...old.revealed,[q.id]:!visible}}));
  const award=(team,points)=>change(old=>({...old,scores:changeQuickfireScore(old.scores,team,points)}));
  const openEditor=()=>setEditor(true);
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
        <ControlCard title="Question bank" description="Editable JSON for reusable lesson and event sets."><div className="tool-grid"><button className="btn btn-tool" onClick={openEditor}><Edit3 size={17}/> Edit question bank</button><button className="btn btn-tool" onClick={exportQuestions}><Download size={17}/> Export</button><button className="btn btn-tool" onClick={()=>{if(window.confirm('Reset team points and answer reveals?'))change(old=>({...old,scores:[0,0],questionIndex:0,revealed:{}}))}}><RotateCcw size={17}/> Reset match</button></div></ControlCard>
      </aside></div>
      <footer className="host-footer"><span>PlayLab · Quickfire Quiz v0.2</span><span>Local-only state · Use the same browser profile for host and projector</span></footer>
    </main>
    {editor&&<QuickfireQuestionEditor questions={game.questions} onClose={()=>setEditor(false)} onSave={questions=>{
      if(!window.confirm('Replace all trivia questions and reset the match?'))return;
      change(old=>({...old,questions,questionIndex:0,revealed:{},scores:[0,0]}));
      setEditor(false);
    }}/>} 
  </div>;
}
export function QuickfireApp(){
  const [game,change]=useQuickfire();const ref=useRef(null);
  const display=new URLSearchParams(location.search).get('view')==='display';
  if(display)return <>{IS_REHEARSAL&&<aside role="status" className="playlab-practice-banner"><strong>Practice mode</strong> · Separate from the real match. <a href="?page=dashboard&tab=setup&format=quickfire">Back to setup</a></aside>}<main className="display-view" ref={ref}><div className="quick-full-actions"><button onClick={()=>document.fullscreenElement?document.exitFullscreen():ref.current?.requestFullscreen?.()}><Maximize size={16}/> Fullscreen</button></div><QuickfireBoard game={game}/></main></>;
  return <>{IS_REHEARSAL&&<aside role="status" className="playlab-practice-banner"><strong>Practice mode</strong> · Scores and changes stay separate from your real match. <a href="?page=dashboard&tab=setup&format=quickfire">Back to setup</a></aside>}<QuickfireHost game={game} change={change}/></>;
}
