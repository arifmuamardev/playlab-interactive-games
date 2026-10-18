import React,{useEffect,useRef,useState} from 'react';
import {ArrowRight,BookOpen,Check,ChevronRight,Download,ExternalLink,FileUp,FolderOpen,Gamepad2,HardDrive,LayoutDashboard,Library,MonitorPlay,Plus,RotateCcw,Save,ShieldCheck,Trash2,X} from 'lucide-react';
import {PlayLabBrand} from '../components/shared.jsx';
import {GAME_CATALOG} from '../core/gameRegistry.js';
import {createPack,readPackLibrary,writePackLibrary,readGameSession,resetGameSession,applyPackToSession,gameTitle,PACK_LIMIT,normalizePack} from './storage.js';
import {makeInitialState} from '../data.js';
import {quickfireInitial} from '../games/quickfire/data.js';
import {SessionSetup} from './SessionSetup.jsx';
import './dashboard.css';
import './playful-dashboard.css';
import {LanguageSwitch,useLanguage} from '../i18n/language.jsx';

const PLAYABLE=GAME_CATALOG.filter(game=>game.slug);
const TABS=[{id:'overview',label:'Overview',icon:LayoutDashboard},{id:'games',label:'My games',icon:Gamepad2},{id:'setup',label:'Game setup',icon:MonitorPlay},{id:'packs',label:'Question packs',icon:Library}];
function getTab(){const tab=new URLSearchParams(location.search).get('tab');return TABS.some(t=>t.id===tab)?tab:'overview';}
function getSessions(){return Object.fromEntries(PLAYABLE.map(item=>[item.slug,readGameSession(item.slug)]));}
function download(filename,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const element=document.createElement('a');element.href=url;element.download=filename;element.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function dateLabel(date){return new Date(date).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});}
function GameCard({item,session,onSavePack,onReset}){
  const {lang}=useLanguage();
  const ready=Boolean(session);
  return <article className={"dash-game-card dash-game-card--"+item.slug}>
    <div className="dash-game-top"><span className="dash-game-symbol" aria-hidden="true">{item.icon}</span><span className="dash-chip">Playable</span></div>
    <h3>{item.title}</h3><p className="dash-muted">{item.description}</p>
    <div className="dash-game-session" aria-label={item.title+' saved session'}>
      {ready?<><span>Saved in this browser · Round {session.position} of {session.questions.length}</span><strong>{session.teams[0]} {session.scores[0]} · {session.scores[1]} {session.teams[1]}</strong></>:<><span>No saved match yet</span><strong>Ready to start</strong></>}
    </div>
    <div className="dash-game-actions"><a className="dash-action" href={"?page=dashboard&tab=setup&format="+item.slug}><MonitorPlay size={16}/> {lang==='id'?'Siapkan':'Set up'}</a><a className="dash-action dash-action-primary" href={'?game='+item.slug}>{lang==='id'?(ready?'Lanjutkan game':'Mulai game'):(ready?'Continue game':'Start game')} <ArrowRight size={16}/></a>
      <button className="dash-action" onClick={()=>onSavePack(item.slug)}><Save size={16}/> {lang==='id'?'Simpan pertanyaan':'Save questions'}</button>
      {ready&&<button className="dash-icon-button" aria-label={'Start fresh '+item.title+' match'} title="Reset match (keeps questions and teams)" onClick={()=>onReset(item.slug)}><RotateCcw size={17}/></button>}
    </div>
  </article>;
}
function PackCard({pack,onLoad,onRemove}){
  const title=gameTitle(pack.game);
  return <article className="dash-pack-card">
    <div className="dash-pack-top"><span className="dash-pack-icon"><BookOpen size={19}/></span><span className="dash-chip">{title}</span></div>
    <h3>{pack.name}</h3><p className="dash-muted">{pack.questions.length} questions · Saved {dateLabel(pack.createdAt)}</p>
    <div className="dash-pack-actions"><button className="dash-action dash-action-primary" onClick={()=>onLoad(pack)}><MonitorPlay size={16}/> Load into game</button>
      <button className="dash-action" onClick={()=>download('playlab-'+pack.game+'-'+pack.id+'.json',pack)}><Download size={16}/> Export</button>
      <button className="dash-icon-button" aria-label={'Delete pack '+pack.name} title="Delete saved pack" onClick={()=>onRemove(pack)}><Trash2 size={17}/></button></div>
  </article>;
}

export function Dashboard(){
  const {lang}=useLanguage();
  const [tab,setTab]=useState(getTab);
  const [packs,setPacks]=useState([]);
  const [sessions,setSessions]=useState({});
  const [libraryError,setLibraryError]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [saveFor,setSaveFor]=useState(null);
  const [packName,setPackName]=useState('');
  const fileRef=useRef(null);
  const reload=()=>{
    try{setPacks(readPackLibrary());setLibraryError('');}catch(err){setLibraryError(err.message);setPacks([]);}
    setSessions(getSessions());
  };
  useEffect(()=>{
    reload();
    const storage=e=>{if(!e.key||e.key.startsWith('playlab-'))reload();};
    const visibility=()=>{if(!document.hidden)reload();};
    const pop=()=>setTab(getTab());
    window.addEventListener('storage',storage);
    window.addEventListener('focus',reload);
    document.addEventListener('visibilitychange',visibility);
    window.addEventListener('popstate',pop);
    return ()=>{window.removeEventListener('storage',storage);window.removeEventListener('focus',reload);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('popstate',pop);};
  },[]);
  function navigate(next){setTab(next);setError('');history.pushState(null,'','?page=dashboard'+(next==='overview'?'':'&tab='+next));}
  function feedback(message){setError('');setNotice(message);}
  function saveLibrary(next){try{const clean=writePackLibrary(next);setPacks(clean);feedback('Question library saved in this browser.');return true;}catch(err){setError('Could not save: '+err.message);return false;}}
  function openSave(game){setPackName('');setSaveFor(game);setError('');}
  function confirmSave(){try{
    if(libraryError)throw Error(libraryError);
    if(packs.length>=PACK_LIMIT)throw Error('Question library is full (40 packs).');
    const active=readGameSession(saveFor);
    const questions=active?.questions||(saveFor==='survey'?makeInitialState().questions:quickfireInitial().questions);
    const pack=createPack(saveFor,packName,questions);
    if(saveLibrary([pack,...packs])){setSaveFor(null);navigate('packs');setNotice('Saved "'+pack.name+'" to your question library.');}
  }catch(err){setError(err.message);}}
  function loadPack(pack){if(!window.confirm('Load "'+pack.name+'" into '+gameTitle(pack.game)+'? This replaces its current questions and clears all scores and progress. Export your existing questions first if needed.'))return;
    try{applyPackToSession(pack);setSessions(getSessions());feedback('Pack loaded. Open '+gameTitle(pack.game)+' to play.');}catch(err){setError(err.message);}}
  function removePack(pack){if(!window.confirm('Delete "'+pack.name+'" from this browser’s question library? This cannot be undone unless you exported a copy.'))return;saveLibrary(packs.filter(p=>p.id!==pack.id));}
  function freshMatch(game){if(!window.confirm('Start a fresh '+gameTitle(game)+' match? Existing scores and progress will be cleared, but questions and team names remain.'))return;
    try{resetGameSession(game);setSessions(getSessions());feedback('Match reset. Your questions and teams were kept.');}catch(err){setError(err.message);}}
  async function importPack(event){const file=event.target.files?.[0];event.target.value='';if(!file)return;try{
    if(libraryError)throw Error(libraryError);
    if(file.size>250000)throw Error('File is too large (250 KB maximum).');
    if(packs.length>=PACK_LIMIT)throw Error('Library is full (40 packs).');
    const pack=normalizePack(JSON.parse(await file.text()));
    const unique={...pack,id:crypto.randomUUID?.()||('import-'+Date.now())};
    if(saveLibrary([unique,...packs]))feedback('Imported "'+unique.name+'" as an independent saved pack.');
  }catch(err){setError('Import failed: '+err.message);}}
  const active=PLAYABLE.filter(item=>sessions[item.slug]);
  return <div className="dash-shell dash-playful">
    <aside className="dash-sidebar"><a className="dash-brand" href="./" aria-label="PlayLab home"><PlayLabBrand/></a>
      <div className="dash-sidebar-eyebrow">{lang==='id'?'RUANG KERJA ANDA':'YOUR WORKSPACE'}</div>
      <nav className="dash-nav" aria-label="Dashboard navigation">{TABS.map(item=><button type="button" key={item.id} className={'dash-nav-button '+(tab===item.id?'active':'')} aria-label={item.label} aria-current={tab===item.id?'page':undefined} onClick={()=>navigate(item.id)}><item.icon size={18}/><span>{lang==='id'?({Overview:'Ringkasan','My games':'Permainan saya','Game setup':'Pengaturan game','Question packs':'Paket pertanyaan'}[item.label]):item.label}</span>{item.id==='packs'&&<small>{packs.length}</small>}</button>)}</nav>
      <div className="dash-sidebar-bottom"><div className="dash-sidebar-note"><HardDrive size={19}/><strong>{lang==='id'?'Ruang kerja lokal':'Local workspace'}</strong><p>{lang==='id'?'Permainan dan paket pertanyaan tersimpan di peramban ini; tanpa akun atau sinkronisasi cloud.':'Your games and question packs are stored in this browser. There is no account or cloud sync.'}</p></div><a href="./" className="dash-return"><ExternalLink size={16}/> Public game catalog</a></div>
    </aside>
    <main className="dash-main"><header className="dash-topbar"><div><span className="dash-kicker">PLAYLAB / WORKSPACE</span><h1>{lang==='id'?({overview:'Dasbor Anda',games:'Permainan saya',setup:'Pengaturan game',packs:'Paket pertanyaan'}[tab]):tab==='overview'?'Your dashboard':tab==='games'?'My games':tab==='setup'?'Game setup':'Question packs'}</h1></div><div className="dash-top-actions"><LanguageSwitch/><a href="?page=organizer" className="dash-top-link">{lang==='id'?'Atur acara':'Organize event'} <ArrowRight size={17}/></a><a href="./" className="dash-top-link">{lang==='id'?'Jelajahi game':'Browse games'} <ArrowRight size={17}/></a></div></header>
      {libraryError&&<div role="alert" className="dash-error">{libraryError} Your existing library was not modified. Avoid saving or importing packs until this is resolved.</div>}
      {error&&<div role="alert" className="dash-error">{error}</div>}
      {notice&&<div role="status" className="dash-notice"><Check size={17}/>{notice}</div>}
      {tab==='overview'&&<>
        <section className="dash-intro"><div><span className="dash-kicker">YOUR PLAY SPACE ✦</span><h2>Ready, set,<br/><em>let’s play!</em></h2><p>Your games, saved questions, and next big moment—all in one happy place.</p><button className="dash-action dash-action-primary" onClick={()=>navigate('setup')}>{lang==='id'?'Siapkan permainan':'Prepare a game'} <ArrowRight size={16}/></button><button className="dash-text-link" onClick={()=>navigate('games')}>Manage existing games <ArrowRight size={16}/></button></div><div className="dash-intro-mark" aria-hidden="true"><span>LET’S<br/>GO!</span><i>✳</i></div></section>
        <section aria-label="Workspace summary" className="dash-stats"><div><span>{lang==='id'?'Game siap dimainkan':'Playable games'}</span><strong>{PLAYABLE.length}</strong><small>Available game formats</small></div><div><span>{lang==='id'?'Paket pertanyaan':'Question packs'}</span><strong>{packs.length}</strong><small>Saved on this browser</small></div><div><span>{lang==='id'?'Permainan tersimpan':'Saved matches'}</span><strong>{active.length}</strong><small>With stored session data</small></div></section>
        <section className="dash-section"><div className="dash-section-title"><div><span className="dash-kicker">PICK UP WHERE YOU LEFT OFF</span><h2>{lang==='id'?'Permainan Anda':'Your games'}</h2></div><button className="dash-text-link" onClick={()=>navigate('games')}>View all <ChevronRight size={16}/></button></div><div className="dash-game-grid">{PLAYABLE.map(item=><GameCard item={item} key={item.slug} session={sessions[item.slug]} onSavePack={openSave} onReset={freshMatch}/>)}</div></section>
        <section className="dash-section"><div className="dash-section-title"><div><span className="dash-kicker">REUSABLE CONTENT</span><h2>{lang==='id'?'Pustaka pertanyaan Anda':'Your question library'}</h2></div><button className="dash-text-link" onClick={()=>navigate('packs')}>Open library <ChevronRight size={16}/></button></div>{packs.length?<p className="dash-muted">{packs.length} saved packs are ready to load into their compatible games.</p>:<div className="dash-empty"><FolderOpen size={25}/><strong>No saved question packs yet</strong><p>Open a game, prepare its questions, then save a reusable copy from My games.</p><button className="dash-action" onClick={()=>navigate('games')}>Go to my games <ArrowRight size={15}/></button></div>}</section>
      </>}
      {tab==='setup'&&<SessionSetup/>}
      {tab==='games'&&<><section className="dash-lead"><p>Play, resume, or save the current questions from either game. Resetting a match never deletes your question library.</p></section><section className="dash-game-grid">{PLAYABLE.map(item=><GameCard item={item} key={item.slug} session={sessions[item.slug]} onSavePack={openSave} onReset={freshMatch}/>)}</section><div className="dash-section dash-future"><h2>More games are coming</h2><p>Word Relay and Buzzer Battle are planned. They will use the same workspace when ready.</p></div></>}
      {tab==='packs'&&<><section className="dash-lead"><p>Save questions independently of a live match. Loading a pack replaces a game’s current questions and resets its scores; your saved pack remains unchanged.</p><div className="dash-pack-toolbar"><button className="dash-action" onClick={()=>fileRef.current?.click()} disabled={Boolean(libraryError)}><FileUp size={16}/> Import PlayLab pack</button><input ref={fileRef} type="file" accept=".json,application/json" aria-label="Import question pack file" className="dash-hidden-file" onChange={importPack}/><button className="dash-action" onClick={()=>navigate('games')}><Plus size={16}/> Save from a game</button></div></section>{packs.length?<div className="dash-pack-grid">{packs.map(pack=><PackCard key={pack.id} pack={pack} onLoad={loadPack} onRemove={removePack}/>)}</div>:<div className="dash-empty dash-empty-large"><Library size={30}/><strong>No packs saved yet</strong><p>Prepare questions inside Survey Showdown or Quickfire Quiz, then use “Save questions” in My games. You can also import a PlayLab pack JSON.</p><button className="dash-action dash-action-primary" onClick={()=>navigate('games')}>Choose a game <ArrowRight size={16}/></button></div>}</>}
      <footer className="dash-footer"><span><ShieldCheck size={16}/> No login or tracking. Export important packs for backup.</span><span>PlayLab · Local-first dashboard</span></footer>
    </main>
    {saveFor&&<div className="dash-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSaveFor(null);}}><div role="dialog" aria-modal="true" aria-labelledby="dash-save-title" className="dash-dialog"><div className="dash-dialog-head"><div><span className="dash-kicker">QUESTION LIBRARY</span><h2 id="dash-save-title">Save question pack</h2></div><button className="dash-icon-button" aria-label="Close save pack dialog" onClick={()=>setSaveFor(null)}><X size={18}/></button></div><p>Save the current {gameTitle(saveFor)} questions separately from match scores and progress. If no match is saved yet, the demo questions will be used.</p><label htmlFor="dash-pack-name">Pack name</label><input id="dash-pack-name" value={packName} autoFocus maxLength={70} placeholder="e.g. Statistics Week 3" onChange={e=>setPackName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')confirmSave();}}/>{error&&<p role="alert" className="dash-dialog-error">{error}</p>}<div className="dash-dialog-actions"><button className="dash-action" onClick={()=>{setSaveFor(null);setError('');}}>Cancel</button><button className="dash-action dash-action-primary" onClick={confirmSave}><Save size={16}/> Save pack</button></div></div></div>}
  </div>;
}
