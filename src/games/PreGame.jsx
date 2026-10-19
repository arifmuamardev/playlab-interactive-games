import React from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,ChevronLeft,Maximize,MonitorPlay,Play,ShieldCheck,Volume2,VolumeX} from 'lucide-react';
import {PlayLabBrand} from '../components/shared.jsx';
import {LanguageSwitch,useLanguage} from '../i18n/language.jsx';
import {navigatePresentation,presentationCanStart,presentationStep,PRE_GAME_STEPS} from './pregame.js';
import './pregame.css';

const MESSAGES={
 en:{
  eyebrow:'THE SHOW STARTS HERE',
  welcome:'Are you ready to play?',
  welcomeSub:'Two teams. One big challenge. Let the fun begin!',
  teamsTitle:'Meet the teams',
  teamsSub:'Give both teams a big round of applause!',
  rulesTitle:'How to play',
  rulesSub:'A few simple rules before the first question.',
  stages:['Welcome','Meet the teams','Game rules'],
  round:'rounds',question:'questions',
  presenting:'Shown on the audience screen',
  hostTitle:'Get the crowd ready!',
  hostSub:'Walk the audience through the welcome, team introductions and rules. The game stays paused until you explicitly start it.',
  stageNow:'Showing',
  start:'Start Game',
  next:'Next: ',
  previous:'Previous',
  open:'Open projector',
  paired:'Use the view-only projector link from the pairing lobby. Never share the private controller URL.',
  noteWelcome:'MC cue: welcome the audience, introduce the game and build excitement.',
  noteTeams:'MC cue: introduce both team names, then invite participants to applaud.',
  noteRules:'MC cue: explain that the presenter reveals answers and awards points manually. Confirm both teams are ready.',
  total:'questions ready',
  manual:'MC-managed scoring',
  noAuto:'Timer does not automatically score or reveal answers',
  startHint:'The first question will only appear after you press Start Game.',
  replay:'Show introductions',
  backTo:'Return to game',
  surveyRules:[
   'Guess the listed popular answers to build the round bank.',
   'Three wrong guesses show a steal opportunity. The MC makes the final decision.',
   'The MC awards the bank to one team. Higher total points win.',
   'Bundled answer rankings and points are fictional game examples, not real survey results.'
  ],
  quickfireRules:[
   'Each question has four options: A, B, C and D.',
   'The MC reveals the correct choice after teams have answered.',
   'The MC awards +10 manually per correct response; scores never update themselves.',
   'Optional time limits and one-award-per-question house rules are not enforced by the software.'
  ],
  rulesFoot:'The MC controls the pace and any optional countdown. No automatic turns, scoring, reveals or penalties.'
 },
 id:{
  eyebrow:'PERTANDINGAN AKAN DIMULAI',
  welcome:'Siap untuk bermain?',
  welcomeSub:'Dua tim. Satu tantangan seru. Ayo mulai!',
  teamsTitle:'Kenalan dengan tim',
  teamsSub:'Beri tepuk tangan yang meriah untuk kedua tim!',
  rulesTitle:'Cara bermain',
  rulesSub:'Beberapa aturan sebelum pertanyaan pertama.',
  stages:['Sambutan','Kenalkan tim','Aturan permainan'],
  round:'ronde',question:'pertanyaan',
  presenting:'Ditampilkan di layar penonton',
  hostTitle:'Siapkan suasana!',
  hostSub:'Sambut penonton, kenalkan tim, dan jelaskan aturan. Pertandingan belum dimulai hingga tombol Mulai Permainan ditekan.',
  stageNow:'Sedang ditampilkan',
  start:'Mulai Permainan',
  next:'Lanjut: ',
  previous:'Kembali',
  open:'Buka proyektor',
  paired:'Gunakan tautan proyektor hanya-lihat dari halaman penyambungan. Jangan bagikan tautan pengontrol pribadi.',
  noteWelcome:'Panduan MC: sambut peserta, perkenalkan permainan, dan bangun antusiasme.',
  noteTeams:'Panduan MC: kenalkan kedua tim dan ajak penonton bertepuk tangan.',
  noteRules:'Panduan MC: jelaskan bahwa pemandu membuka jawaban dan memberi poin secara manual. Pastikan kedua tim siap.',
  total:'pertanyaan siap',
  manual:'Skor dikelola MC',
  noAuto:'Penghitung waktu tidak otomatis memberi poin atau membuka jawaban',
  startHint:'Pertanyaan pertama hanya akan muncul setelah tombol Mulai Permainan ditekan.',
  replay:'Tampilkan pembukaan',
  backTo:'Kembali ke permainan',
  surveyRules:[
   'Tebak jawaban yang tersedia untuk mengumpulkan poin ronde.',
   'Tiga kesalahan menampilkan kesempatan mencuri poin. Keputusan akhir di tangan MC.',
   'MC memberikan poin ronde kepada satu tim. Total poin tertinggi menang.',
   'Peringkat jawaban dan poin bawaan merupakan contoh fiktif, bukan hasil survei.'
  ],
  quickfireRules:[
   'Setiap pertanyaan memiliki empat pilihan: A, B, C, dan D.',
   'MC membuka jawaban benar setelah tim menjawab.',
   'MC memberi +10 poin secara manual untuk jawaban benar; tidak ada penilaian otomatis.',
   'Batas waktu dan aturan pemberian poin satu kali per soal tidak otomatis diberlakukan oleh sistem.'
  ],
  rulesFoot:'MC mengatur tempo dan penghitung waktu opsional. Tidak ada giliran, penilaian, pembukaan jawaban, atau penalti otomatis.'
 }
};
const TITLE={survey:'Survey Showdown',quickfire:'Quickfire Quiz'};
function formatStage(stage,words){return words.stages[PRE_GAME_STEPS.indexOf(stage)]||stage;}

export function PreGameBoard({game,kind,preview=false,onFullscreen,onSound,soundEnabled}){
 const {lang}=useLanguage(),w=MESSAGES[lang]||MESSAGES.en;
 const stage=presentationStep(game);
 const rules=kind==='survey'?w.surveyRules:w.quickfireRules;
 const count=game.questions.length;
 return <section className={'playlab-pregame '+(preview?'playlab-pregame--preview':'playlab-pregame--audience')+' playlab-pregame--'+stage} aria-label={formatStage(stage,w)}>
   <div className="playlab-pregame-decoration playlab-pregame-decoration--one" aria-hidden="true">✳</div>
   <div className="playlab-pregame-decoration playlab-pregame-decoration--two" aria-hidden="true">✦</div>
   <div className="playlab-pregame-inside">
     <div className="playlab-pregame-header"><span>✦ PLAYLAB</span><span>{TITLE[kind]} · {count} {kind==='survey'?w.round:w.question}</span></div>
     <div className="playlab-pregame-progress" aria-label={formatStage(stage,w)}>
       {w.stages.map((name,i)=><span key={name} className={i===PRE_GAME_STEPS.indexOf(stage)?'is-current':i<PRE_GAME_STEPS.indexOf(stage)?'is-complete':''}><i>{i+1}</i>{name}</span>)}
     </div>
     <div className="playlab-pregame-center" key={stage}>
       {stage==='welcome'&&<div className="playlab-pregame-welcome">
         <div className="playlab-pregame-kicker">✦ {w.eyebrow} ✦</div>
         <h1>{w.welcome}</h1>
         <p>{w.welcomeSub}</p>
         <div className="playlab-pregame-burst" aria-hidden="true">★ <span>VS</span> ★</div>
       </div>}
       {stage==='teams'&&<div className="playlab-pregame-teams">
         <div className="playlab-pregame-kicker">✦ {w.teamsTitle} ✦</div>
         <h1>{w.teamsTitle}</h1>
         <div className="playlab-pregame-team-grid">
           {game.teamNames.map((team,i)=><div key={i} className={'playlab-pregame-team playlab-pregame-team--'+i}><span>{lang==='id'?'TIM':'TEAM'} {i+1}</span><strong>{team}</strong><b aria-hidden="true">{i===0?'★':'⚡'}</b></div>)}
           <div className="playlab-pregame-vs" aria-hidden="true">VS</div>
         </div><p>{w.teamsSub}</p>
       </div>}
       {stage==='rules'&&<div className="playlab-pregame-rules">
         <div className="playlab-pregame-kicker">✦ {w.rulesTitle} ✦</div>
         <h1>{w.rulesTitle}</h1><p className="playlab-pregame-rule-sub">{w.rulesSub}</p>
         <ol>{rules.map((item,i)=><li key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{item}</p></li>)}</ol>
       </div>}
     </div>
     <footer className="playlab-pregame-footer"><span>★ {game.teamNames[0]}</span><span>✦ PLAYLAB ✦</span><span>{game.teamNames[1]} ★</span></footer>
   </div>
   {!preview&&(onFullscreen||onSound)&&<div className="playlab-pregame-tools">
     <LanguageSwitch compact/>
     {onSound&&<button type="button" onClick={onSound} aria-label={soundEnabled?'Mute projector sounds':'Enable projector sounds'}>{soundEnabled?<Volume2 size={17}/>:<VolumeX size={17}/>}</button>}
     {onFullscreen&&<button type="button" onClick={onFullscreen} aria-label="Fullscreen"><Maximize size={17}/></button>}
   </div>}
 </section>;
}

export function PreGameHost({game,kind,change,openProjector,paired=false}){
 const {lang}=useLanguage(),w=MESSAGES[lang]||MESSAGES.en;
 const stage=presentationStep(game),index=PRE_GAME_STEPS.indexOf(stage);
 const advance=()=>change(old=>navigatePresentation(old,PRE_GAME_STEPS[Math.min(index+1,3)]));
 const back=()=>change(old=>navigatePresentation(old,PRE_GAME_STEPS[Math.max(index-1,0)]));
 const hint=stage==='welcome'?w.noteWelcome:stage==='teams'?w.noteTeams:w.noteRules;
 return <div className="host-shell gameplay-polished playlab-pregame-host">
   <header className="host-header"><PlayLabBrand/><div className="host-header-right"><LanguageSwitch/><a className="home-link" href="?page=organizer">{lang==='id'?'← Penyelenggara':'← Organizer'}</a>{!paired&&<button type="button" className="btn btn-primary" onClick={openProjector}><MonitorPlay size={17}/>{w.open}</button>}</div></header>
   <main className="playlab-pregame-host-main">
     <div className="playlab-pregame-host-heading"><div><span className="playlab-pregame-host-eyebrow">✦ {w.eyebrow}</span><h1>{w.hostTitle}</h1><p>{w.hostSub}</p></div><div className="playlab-pregame-host-count">{game.questions.length}<small>{w.total}</small></div></div>
     <div className="playlab-pregame-host-layout">
       <div className="playlab-pregame-host-preview"><h2><MonitorPlay size={20}/>{w.presenting}</h2><PreGameBoard game={game} kind={kind} preview/></div>
       <aside className="playlab-pregame-host-controls">
         <span className="playlab-pregame-host-eyebrow">{w.stageNow} · {index+1} / 3</span>
         <h2>{formatStage(stage,w)}</h2>
         <p>{hint}</p>
         <div className="playlab-pregame-host-check"><CheckCircle2 size={20}/><span>{w.manual}</span></div>
         <div className="playlab-pregame-host-check"><ShieldCheck size={20}/><span>{w.noAuto}</span></div>
         <div className="playlab-pregame-host-buttons">
           {index>0&&<button type="button" className="playlab-pregame-secondary" onClick={back}><ChevronLeft size={18}/>{w.previous}</button>}
           {index===2?
             <button type="button" className="playlab-pregame-primary" onClick={advance} disabled={!presentationCanStart(game)}><Play size={19} fill="currentColor"/>{w.start}</button>:
             <button type="button" className="playlab-pregame-primary" onClick={advance}>{w.next}{w.stages[index+1]} <ArrowRight size={18}/></button>}
         </div>
         <small>{index===2?w.startHint:w.rulesFoot}</small>
         {paired&&<div className="playlab-pregame-host-paired">{w.paired}</div>}
       </aside>
     </div>
   </main>
 </div>;
}
