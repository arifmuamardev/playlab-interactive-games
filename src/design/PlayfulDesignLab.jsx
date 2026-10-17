import React,{useState} from 'react';
import {ArrowRight,ArrowUpRight,BookOpen,Check,ChevronRight,FolderOpen,Gamepad2,Home,LayoutDashboard,MonitorPlay,Play,Plus,Settings2,ShieldCheck,Star,Sparkles,Trophy,Users,Volume2,Workflow,Zap} from 'lucide-react';
import {GAME_CATALOG} from '../core/gameRegistry.js';
import {readGameSession,readPackLibrary} from '../dashboard/storage.js';
import './playful.css';

const GAMES=GAME_CATALOG.filter(game=>game.slug);
const labUrl=screen=>'?page=design-lab'+(screen==='catalog'?'':'&screen='+screen);
const gameColors={survey:'coral',quickfire:'violet'};
function PlayLabLogo(){return <span className="pf-logo"><span className="pf-logo-symbol" aria-hidden="true">P<span>✦</span></span><span className="pf-logo-title"><span className="pf-logo-word">play<b>lab</b></span><small>MAKE SPACE FOR PLAY</small></span></span>;}
function Spark({className='',character='✦'}){return <span aria-hidden="true" className={'pf-spark '+className}>{character}</span>;}
function SurveyArt(){return <div className="pf-art-board" aria-hidden="true"><div className="pf-art-title"><span>★ SURVEY SHOWDOWN ★</span><strong>TOP ANSWERS!</strong></div><div className="pf-art-scores"><span>TEAM A <b>120</b></span><span>TEAM B <b>85</b></span></div><div className="pf-art-answers">{['34','26','20'].map((v,i)=><span key={i}><b>{i+1}</b><span className="pf-art-answer-line"/><strong>{v}</strong></span>)}</div><div className="pf-art-stars">✦ ✧ ✦</div></div>}
function QuickfireArt(){return <div className="pf-quiz-art" aria-hidden="true"><div className="pf-quiz-bubble">01 / 10 <span>✦</span></div><div className="pf-quiz-question">READY FOR A<br/>QUICK QUESTION?</div><div className="pf-quiz-options">{['A','B','C','D'].map((x,i)=><span key={x} className={i===1?'highlight':''}>{x}<b>{['★','✓','?','✦'][i]}</b></span>)}</div></div>}
function WordArt(){return <div className="pf-word-art" aria-hidden="true"><span>W</span><span>O</span><span>R</span><span>D</span><b>→</b></div>}
function BuzzerArt(){return <div className="pf-buzzer-art" aria-hidden="true"><span className="pf-buzzer-ring"><Zap size={64} strokeWidth={3}/></span><i>BUZZ!</i></div>}
const Art={survey:SurveyArt,quickfire:QuickfireArt,word:WordArt,buzzer:BuzzerArt};
function GameCard({game,index}){
  const theme=game.slug?gameColors[game.slug]:index===2?'mint':'sunshine';
  const Graphic=game.slug?Art[game.slug]:index===2?WordArt:BuzzerArt;
  const playable=Boolean(game.slug);
  return <article className={'pf-game-card pf-'+theme+(!playable?' is-coming':'')}>
    <div className="pf-game-card-top"><span>GAME {game.number}</span><span className="pf-status">{playable?'READY TO PLAY':'COMING SOON'}</span></div>
    <div className="pf-game-illustration"><Graphic/></div>
    <div className="pf-game-card-content"><p className="pf-category">{game.category}</p><h3>{game.title}</h3><p>{game.description}</p>
      {playable?<div className="pf-card-actions"><a className="pf-game-action" href={'?page=dashboard&tab=setup&format='+game.slug}>Set up game <ArrowRight size={18}/></a><a className="pf-card-secondary" href={'?game='+game.slug} aria-label={'Open '+game.title+' host controls'}>Host <ArrowUpRight size={16}/></a></div>:<span className="pf-upcoming">We're cooking up something fun <Sparkles size={15}/></span>}
    </div>
  </article>;
}
function CatalogScreen(){
  return <><section className="pf-hero" aria-labelledby="pf-hero-title"><div className="pf-hero-copy">
    <span className="pf-eyebrow"><span className="pf-online-dot"/> THE LITTLE PLATFORM FOR BIG GAME NIGHTS</span>
    <h1 id="pf-hero-title">Every room<br/>is a <span className="pf-hero-highlight">playground.<Spark className="pf-hero-star"/></span></h1>
    <p>Turn an ordinary class, workshop or gathering into something everyone wants to join. Pick a game, bring your teams, and let the fun begin!</p>
    <div className="pf-hero-actions"><a className="pf-button pf-button-dark" href="#pf-games"><Play size={18} fill="currentColor"/> Find your game <ArrowRight size={17}/></a><a className="pf-button pf-button-light" href="?page=dashboard&tab=setup"><Settings2 size={17}/> Set up a game</a></div>
    <div className="pf-hero-highlights"><span><span>✦</span> No sign-up</span><span><span>✦</span> Two playable games</span><span><span>✦</span> Projector-ready</span></div>
  </div><div className="pf-hero-visual" aria-label="Illustrated game show with quiz and survey mini boards">
    <span className="pf-hero-orbit pf-orbit-one"/><span className="pf-hero-orbit pf-orbit-two"/>
    <div className="pf-hero-ticket"><span>YOU'RE INVITED TO</span><b>GAME<br/>TIME!</b><small>★ YOU BRING THE PEOPLE. WE BRING THE PLAY. ★</small></div>
    <div className="pf-hero-float pf-float-one">🏆<span>POINTS!</span></div><div className="pf-hero-float pf-float-two">⚡<span>YOUR TURN</span></div><Spark className="pf-float-star-one"/><Spark className="pf-float-star-two" character="✳"/>
  </div></section>
  <section id="pf-games" className="pf-collection" aria-labelledby="pf-collection-title"><div className="pf-section-head"><div><span className="pf-eyebrow">THE GAME SHELF</span><h2 id="pf-collection-title">Pick a game. <span>Make some noise!</span></h2></div><div className="pf-burst-label"><Sparkles size={20}/> GOOD TIMES START HERE</div></div>
    <div className="pf-game-grid">{GAME_CATALOG.map((game,i)=><GameCard key={game.number} game={game} index={i}/>)}</div>
  </section>
  <section className="pf-how"><div className="pf-how-heading"><span className="pf-eyebrow">SO EASY IT'S ALMOST CHEATING</span><h2>Three steps to<br/><span>all the fun.</span></h2><p>Make the game your own, then use one laptop for your host controls and audience screen.</p></div><div className="pf-how-steps"><div><span>01 <Gamepad2 size={25}/></span><h3>Choose a game</h3><p>Pick the format that suits your class or event.</p></div><div><span>02 <Users size={25}/></span><h3>Set the stage</h3><p>Choose questions, name teams and rehearse safely.</p></div><div><span>03 <Trophy size={25}/></span><h3>Make it memorable</h3><p>Reveal answers, keep score and bring the room together.</p></div></div></section></>;
}
function sessionsAndPacks(){
  const saved=GAMES.map(game=>{try{return {game,session:readGameSession(game.slug)};}catch{return {game,session:null};}});
  try{return {saved,packs:readPackLibrary(),error:''};}catch(e){return {saved,packs:[],error:e.message||'Local library unavailable'};}
}
function DashboardScreen(){
  const [local]=useState(sessionsAndPacks);
  const count=local.saved.filter(s=>s.session).length;
  return <div className="pf-dashboard-preview">
    <div className="pf-dashboard-lead"><div><span className="pf-eyebrow">YOUR PLAY SPACE</span><h1>Ready, set, <span>let's play!</span></h1><p>Your games, saved questions, and next big moment—all in one happy place.</p><a className="pf-button pf-button-dark" href="?page=dashboard&tab=setup"><Plus size={19}/> Create a game session <ArrowRight size={17}/></a></div><div className="pf-dashboard-sticker" aria-hidden="true"><span>LET'S<br/>GO!</span><Spark className="pf-dash-star" character="✳"/></div></div>
    <div className="pf-dashboard-stats"><div><span className="pf-stat-icon" aria-hidden="true"><Gamepad2/></span><strong>{GAMES.length}</strong><small>Playable games</small></div><div><span className="pf-stat-icon" aria-hidden="true"><BookOpen/></span><strong>{local.packs.length}</strong><small>Saved question packs</small></div><div><span className="pf-stat-icon" aria-hidden="true"><MonitorPlay/></span><strong>{count}</strong><small>Local saved matches</small></div></div>
    {local.error&&<p role="alert" className="pf-data-warning">Could not read your saved question packs: {local.error}</p>}
    <section className="pf-dash-section"><div className="pf-dash-section-title"><div><span className="pf-eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Your game collection</h2></div><a href="?page=dashboard&tab=games">Manage games <ArrowUpRight size={17}/></a></div>
      <div className="pf-dash-game-grid">{local.saved.map(({game,session})=><article className={'pf-dash-game pf-'+gameColors[game.slug]} key={game.slug}><div className="pf-dash-game-icon" aria-hidden="true">{game.icon}</div><div><p className="pf-category">{session?'SAVED MATCH':'READY TO START'}</p><h3>{game.title}</h3><p>{session?session.teams.join(' vs ')+' · Round '+session.position+' of '+session.questions.length:'Choose questions and invite your teams.'}</p><a href={'?page=dashboard&tab=setup&format='+game.slug}>{session?'Set up new match':'Get started'} <ArrowRight size={17}/></a></div></article>)}</div>
    </section>
    <section className="pf-dash-section pf-library-promo"><div className="pf-promo-illustration" aria-hidden="true"><span>Q</span><span>A</span><Spark character="✳"/></div><div><span className="pf-eyebrow">THE QUESTION VAULT</span><h2>Keep your best ideas ready.</h2><p>Save question packs for class, share exports and reuse them in future games without starting from scratch.</p><a className="pf-button pf-button-dark" href="?page=dashboard&tab=packs"><FolderOpen size={18}/> Open question library</a></div></section>
  </div>;
}
/** Hidden reference screens remain available for side-by-side visual comparison. */
export function PlayfulDesignLab(){
  const screen=new URLSearchParams(location.search).get('screen')==='dashboard'?'dashboard':'catalog';
  return <PlayfulExperience preview screen={screen}/>;
}

/** Approved playful catalog now powers the actual PlayLab homepage. */
export function PlayfulCatalog(){return <PlayfulExperience screen="catalog"/>;}

function PlayfulExperience({screen='catalog',preview=false}){
  return <div className={'playful-lab '+(preview?'pf-preview':'pf-production')}>
    {preview&&<div className="pf-lab-ribbon"><span><Sparkles size={16}/> DESIGN LAB — playful visual direction</span><span>This is a preview. Your existing PlayLab is unchanged.</span></div>}
    <header className="pf-header">
      <a className="pf-logo-link" href={preview?labUrl('catalog'):'./'} aria-label={preview?'PlayLab playful design preview home':'PlayLab home'}><PlayLabLogo/></a>
      <nav aria-label={preview?'Design preview navigation':'Main navigation'} className="pf-nav">
        <a href={preview?labUrl('catalog'):'./'} aria-current={screen==='catalog'?'page':undefined}><Home size={17}/> Game catalog</a>
        <a href={preview?labUrl('dashboard'):'?page=dashboard'} aria-current={screen==='dashboard'?'page':undefined}><LayoutDashboard size={17}/> {preview?'Dashboard':'My dashboard'}</a>
      </nav>
      <a href={preview?'./':'?page=dashboard&tab=setup'} className="pf-existing-link">{preview?'Current website':'Set up a game'} <ArrowUpRight size={16}/></a>
    </header>
    <main className="pf-content">{screen==='catalog'?<CatalogScreen/>:<DashboardScreen/>}</main>
    <footer className="pf-footer"><div><PlayLabLogo/><p>More play. Less ordinary.</p></div>
      <div><span>INDEPENDENT GAME TOOLKIT</span><p>For real classrooms, workshops & live events.</p>
        <a href="?page=dashboard&tab=setup">Get your game ready <ArrowUpRight size={15}/></a>
      </div></footer>
  </div>;
}
