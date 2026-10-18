import React from 'react';
import {ArrowLeft,ArrowRight,MonitorPlay,RotateCcw,Sparkles,Trophy} from 'lucide-react';
import {getScores} from '../data.js';
import './results.css';
import {LanguageSwitch,useLanguage} from '../i18n/language.jsx';

/** Single scoring contract for both games. Results are derived from the persisted
 * match, never cached separately; this makes ties and undone scores exact. */
export function matchResults(game,kind){
  if(!['survey','quickfire'].includes(kind))throw Error('Unsupported result type.');
  const scores=kind==='survey'?getScores(game):game.scores;
  if(!Array.isArray(scores)||scores.length!==2||scores.some(x=>!Number.isFinite(x)||x<0))throw Error('Invalid match scores.');
  const names=(game.teamNames||[]).map((name,i)=>String(name||'Team '+(i+1)).trim().slice(0,45));
  if(names.length!==2)throw Error('Two teams required.');
  const tie=scores[0]===scores[1];
  const winner=tie?null:(scores[0]>scores[1]?0:1);
  const total=game.questions.length;
  const completed=kind==='survey'
    ?game.questions.filter(q=>[0,1].includes(game.progress?.[q.id]?.awardedTeam)).length
    :game.questions.filter(q=>game.revealed?.[q.id]).length;
  return {scores,names,tie,winner,total,completed};
}
function Confetti(){
  return <div className="projector-confetti results-confetti" aria-hidden="true">{Array.from({length:14},(_,i)=><i key={i}/>)}</div>;
}
export function ResultsBoard({game,kind,preview=false}){
  const {lang,t}=useLanguage();
  const {scores,names,tie,winner,total,completed}=matchResults(game,kind);
  const title=kind==='survey'?'Survey Showdown':'Quickfire Quiz';
  return <section className={'results-board results-board--'+kind+(preview?' results-board--preview':'')} aria-label={lang==='id'?'Hasil akhir permainan':'Final match results'}>
    {!preview&&<Confetti/>}
    <div className="results-board-inner">
      <div className="results-eyebrow"><Sparkles size={19} aria-hidden="true"/> PLAYLAB · {lang==='id'?'HASIL AKHIR':'FINAL RESULTS'} <Sparkles size={19} aria-hidden="true"/></div>
      <div className="results-trophy" aria-hidden="true"><Trophy size={52}/></div>
      <p className="results-game-name">{title}</p>
      <h1>{lang==='id'?(tie?'Hasil seri!':'Ada pemenang!'):(tie?'It’s a tie!':'We have a winner!')}</h1>
      <p className="results-winner">{tie?(lang==='id'?'Kedua tim bermain hebat!':'Well played, both teams!'):names[winner]}</p>
      <div className="results-scoreboard">
        {[0,1].map(team=><div className={'results-team results-team--'+team+(winner===team?' results-team--winner':'')} key={team}>
          <span>{lang==='id'?(winner===team?'★ PEMENANG':tie?'★ JUARA BERSAMA':'SKOR AKHIR'):(winner===team?'★ WINNER':tie?'★ JOINT FIRST':'FINAL SCORE')}</span>
          <strong className="results-team-name">{names[team]}</strong>
          <b className="results-team-score">{scores[team].toLocaleString('en-US')}</b>
        </div>)}
      </div>
      <div className="results-summary">{completed} of {total} {lang==='id'?(kind==='survey'?'ronde diberi poin':'jawaban dibuka'):(kind==='survey'?'rounds awarded':'answers revealed')} <span>✦</span> {lang==='id'?'Terima kasih sudah bermain!':'Thanks for playing!'}</div>
    </div>
  </section>;
}
/** Host results are an explicit mode. Reset remains a separately confirmed action. */
export function ResultsHost({game,kind,onResume,onReset,openProjector}){
  const {lang,t}=useLanguage();
  return <div className={'host-shell gameplay-polished gameplay-'+kind+' results-host'}>
    <header className="host-header"><a className="results-back" href="./"><ArrowLeft size={17}/> {t('Game catalog')}</a><span className="results-host-state"><Trophy size={15}/> {lang==='id'?'PERMAINAN SELESAI':'MATCH FINISHED'}</span><LanguageSwitch/><button className="btn btn-primary" onClick={openProjector}><MonitorPlay size={18}/> {t('Open projector')}</button></header>
    <main className="results-host-main">
      <div className="results-host-heading"><span className="eyebrow">PLAYLAB · GAME COMPLETE</span><h2>{lang==='id'?'Permainan selesai!':'That’s a wrap!'} <span>✦</span></h2><p>{lang==='id'?'Skor akhir tersimpan di peramban ini dan tampil di proyektor. Lanjutkan untuk mengoreksi, atau mulai kembali dengan pertanyaan dan tim yang sama.':'The final scores are saved in this browser and appear on your projector. You can resume the match to correct a result, or start again with the same questions and teams.'}</p></div>
      <ResultsBoard game={game} kind={kind} preview/>
      <div className="results-host-actions">
        <button className="btn btn-soft" onClick={onResume}><ArrowLeft size={17}/> {lang==='id'?'Lanjutkan permainan':'Resume match'}</button>
        <button className="btn btn-primary" onClick={onReset}><RotateCcw size={17}/> {lang==='id'?'Mulai ulang & main lagi':'Reset & play again'}</button>
        <a className="btn btn-soft" href="?page=dashboard"><ArrowRight size={17}/> {t('My dashboard')}</a>
      </div>
      <p className="results-host-footnote">Reset clears scores and progress only after confirmation. Your question bank and saved packs stay intact.</p>
    </main>
  </div>;
}
