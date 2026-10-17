import React,{useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Check,Gamepad2,MonitorPlay,ShieldAlert} from 'lucide-react';
import {GAME_CATALOG} from '../core/gameRegistry.js';
import {gameTitle,readGameSession,readPackLibrary} from './storage.js';
import {buildConfiguredMatch,hasStoredMatch,writeConfiguredMatch} from './setup.js';
import './setup.css';

const PLAYABLE=GAME_CATALOG.filter(item=>item.slug);
const STEPS=['Game','Questions','Teams','Review'];
const initialGame=()=>{
  const value=new URLSearchParams(location.search).get('format');
  return PLAYABLE.some(item=>item.slug===value)?value:'';
};
function savedNames(game){
  try{return readGameSession(game)?.teams|| (game==='survey'?['Tim Merah','Tim Biru']:['Team A','Team B']);}
  catch{return game==='survey'?['Tim Merah','Tim Biru']:['Team A','Team B'];}
}
export function SessionSetup(){
  const [game,setGame]=useState(initialGame);
  const [step,setStep]=useState(0);
  const [source,setSource]=useState('demo');
  const [packId,setPackId]=useState('');
  const [teams,setTeams]=useState(()=>savedNames(initialGame()||'quickfire'));
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [library]=useState(()=>{
    try{return {packs:readPackLibrary(),error:''};}
    catch(err){return {packs:[],error:err.message};}
  });
  const [existing]=useState(()=>Object.fromEntries(PLAYABLE.map(item=>[item.slug,readGameSession(item.slug)])));
  const available=library.packs.filter(item=>item.game===game);
  const chosen=available.find(item=>item.id===packId);
  const questions=source==='pack'?chosen?.questions:source==='current'?existing[game]?.questions:null;
  const displayedCount=questions?.length||(source==='demo'?6:0);
  const invalidTeam=teams.some(name=>!name.trim()||name.trim().length>45)||teams[0].trim().toLocaleLowerCase()===teams[1].trim().toLocaleLowerCase();
  const selectedGame=PLAYABLE.find(item=>item.slug===game);
  function chooseGame(slug){
    setGame(slug);setSource('demo');setPackId('');setTeams(savedNames(slug));setError('');
  }
  function next(){
    setError('');
    if(step===0&&!game){setError('Choose a game to continue.');return;}
    if(step===1&&source==='pack'&&!chosen){setError('Choose a saved question pack to continue.');return;}
    if(step===1&&source==='current'&&!existing[game]){setError('This game has no saved match to reuse.');return;}
    if(step===2&&invalidTeam){setError('Enter two distinct team names (1–45 characters each).');return;}
    setStep(value=>Math.min(value+1,STEPS.length-1));
  }
  function launch(){
    if(busy)return;
    setError('');
    const config={game,source,packId,teamNames:teams};
    try{
      // Validate content, format compatibility, names and IDs before a destructive confirmation.
      buildConfiguredMatch(config);
      if(hasStoredMatch(game)&&!window.confirm('Start a new '+gameTitle(game)+' match? This will replace the current match, erase its scores and revealed answers, and update any open host/projector windows. Your saved question packs will remain intact.'))return;
      setBusy(true);
      writeConfiguredMatch(config);
      window.location.assign('?game='+encodeURIComponent(game));
    }catch(err){setBusy(false);setError(err.message||'Could not prepare the game. No match was changed.');}
  }
  return <div className="dash-setup">
    <div className="setup-intro">
      <div><span className="dash-kicker">GUIDED PREPARATION</span><h2>Get your game ready.</h2><p>Choose your content, name the teams and review everything before starting. Nothing changes in your saved match until launch.</p></div>
      <Gamepad2 size={40} aria-hidden="true"/>
    </div>
    <ol className="setup-progress" aria-label="Game setup progress">
      {STEPS.map((name,i)=><li key={name} className={i===step?'current':i<step?'complete':''} aria-current={i===step?'step':undefined}><span>{i<step?<Check size={15}/>:i+1}</span>{name}</li>)}
    </ol>
    <section className="setup-card" aria-label={'Step '+(step+1)+': '+STEPS[step]}>
      {step===0&&<>
        <h3>Choose a game</h3><p className="setup-support">Start with a template. Both games work with a single laptop and an audience display.</p>
        <div className="setup-game-options">{PLAYABLE.map(item=><button type="button" className={'setup-game-option '+(game===item.slug?'selected':'')} aria-pressed={game===item.slug} key={item.slug} onClick={()=>chooseGame(item.slug)}><span className="setup-game-icon" aria-hidden="true">{item.icon}</span><strong>{item.title}</strong><small>{item.description}</small><span className="setup-game-check">{game===item.slug?'Selected':'Choose game'}</span></button>)}</div>
      </>}
      {step===1&&<>
        <h3>Choose your questions</h3><p className="setup-support">Question content is separate from scores. Preparing a new match will always start at zero.</p>
        <div className="setup-source-list">
          <label className={'setup-source '+(source==='demo'?'selected':'')}><input type="radio" name="question-source" value="demo" checked={source==='demo'} onChange={()=>{setSource('demo');setError('');}}/><span><strong>Sample questions</strong><small>Use the included 6-question demonstration pack. Survey points are fictional examples.</small></span></label>
          <label className={'setup-source '+(source==='current'?'selected':'')}><input type="radio" name="question-source" value="current" disabled={!existing[game]} checked={source==='current'} onChange={()=>{setSource('current');setError('');}}/><span><strong>Reuse current game questions</strong><small>{existing[game]?`${existing[game].questions.length} questions from the saved match (scores reset)`:'No saved match exists in this browser'}</small></span></label>
          <label className={'setup-source '+(source==='pack'?'selected':'')}><input type="radio" name="question-source" value="pack" disabled={!available.length||Boolean(library.error)} checked={source==='pack'} onChange={()=>{setSource('pack');setError('');}}/><span><strong>Use a saved question pack</strong><small>{available.length?`${available.length} compatible packs in your local library`:'No compatible saved packs yet'}</small></span></label>
        </div>
        {source==='pack'&&<div className="setup-field"><label htmlFor="setup-pack">Saved question pack</label><select id="setup-pack" value={packId} onChange={e=>{setPackId(e.target.value);setError('');}}><option value="">Choose a pack</option>{available.map(pack=><option key={pack.id} value={pack.id}>{pack.name} · {pack.questions.length} questions</option>)}</select></div>}
        {library.error&&<p className="setup-warning" role="status">Your saved question library could not be read: {library.error}. Sample questions remain available.</p>}
      </>}
      {step===2&&<>
        <h3>Name your teams</h3><p className="setup-support">These names appear in the host dashboard and projector display. They can be changed later.</p>
        <div className="setup-team-fields">{[0,1].map(i=><div className="setup-field" key={i}><label htmlFor={'setup-team-'+i}>Team {i+1}</label><input id={'setup-team-'+i} maxLength={45} value={teams[i]} onChange={e=>{setTeams(old=>old.map((name,j)=>i===j?e.target.value:name));setError('');}} placeholder={'Team '+(i+1)} /></div>)}</div>
        <p className="setup-hint">Team names must be different and no longer than 45 characters.</p>
      </>}
      {step===3&&<>
        <h3>Review your new match</h3><p className="setup-support">Once you launch, the game opens in its host control room. Open the projector from there.</p>
        <dl className="setup-review"><div><dt>Game</dt><dd>{selectedGame?.title}</dd></div><div><dt>Questions</dt><dd>{source==='demo'?'Sample questions':source==='current'?'Current saved questions':chosen?.name} · {displayedCount} questions</dd></div><div><dt>Teams</dt><dd>{teams[0].trim()} vs {teams[1].trim()}</dd></div><div><dt>Start condition</dt><dd>Question 1 · Scores 0–0</dd></div><div><dt>Storage</dt><dd>This browser only · No account</dd></div></dl>
        <div className="setup-warning"><ShieldAlert size={19}/><p>{hasStoredMatch(game)?'A saved match already exists. Starting will replace its question bank, scores and progress after confirmation. Save important questions first.':'No saved match will be replaced.'} Your saved question packs will not be deleted.</p></div>
      </>}
      {error&&<div role="alert" className="setup-error">{error}</div>}
      <div className="setup-actions">
        {step===0?<a className="dash-action" href="?page=dashboard"><ArrowLeft size={16}/> Dashboard</a>:<button className="dash-action" onClick={()=>{setStep(v=>v-1);setError('');}}><ArrowLeft size={16}/> Back</button>}
        {step===3?<button disabled={busy} className="dash-action dash-action-primary" onClick={launch}><MonitorPlay size={17}/> Launch host controls</button>:<button className="dash-action dash-action-primary" onClick={next}>Continue <ArrowRight size={16}/></button>}
      </div>
    </section>
    <p className="setup-footnote"><BookOpen size={15}/> Want to prepare custom questions first? Save them from My games in the dashboard, then choose them here.</p>
  </div>;
}
