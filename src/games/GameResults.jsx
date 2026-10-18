import React from 'react';
import {ArrowLeft,ArrowRight,MonitorPlay,RotateCcw,Sparkles,Trophy} from 'lucide-react';
import {getScores} from '../data.js';
import './results.css';

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
  const {scores,names,tie,winner,total,completed}=matchResults(game,kind);
  const title=kind==='survey'?'Survey Showdown':'Quickfire Quiz';
  return <section className={'results-board results-board--'+kind+(preview?' results-board--preview':'')} aria-label="Final match results">
    {!preview&&<Confetti/>}
    <div className="results-board-inner">
      <div className="results-eyebrow"><Sparkles size={19} aria-hidden="true"/> PLAYLAB · FINAL RESULTS <Sparkles size={19} aria-hidden="true"/></div>
      <div className="results-trophy" aria-hidden="true"><Trophy size={52}/></div>
      <p className="results-game-name">{title}</p>
      <h1>{tie?'It’s a tie!':'We have a winner!'}</h1>
      <p className="results-winner">{tie?'Well played, both teams!':names[winner]}</p>
      <div className="results-scoreboard">
        {[0,1].map(team=><div className={'results-team results-team--'+team+(winner===team?' results-team--winner':'')} key={team}>
          <span>{winner===team?'★ WINNER':tie?'★ JOINT FIRST':'FINAL SCORE'}</span>
          <strong className="results-team-name">{names[team]}</strong>
          <b className="results-team-score">{scores[team].toLocaleString('en-US')}</b>
        </div>)}
      </div>
      <div className="results-summary">{completed} of {total} {kind==='survey'?'rounds awarded':'answers revealed'} <span>✦</span> Thanks for playing!</div>
    </div>
  </section>;
}
/** Host results are an explicit mode. Reset remains a separately confirmed action. */
export function ResultsHost({game,kind,onResume,onReset,openProjector}){
  return <div className={'host-shell gameplay-polished gameplay-'+kind+' results-host'}>
    <header className="host-header"><a className="results-back" href="./"><ArrowLeft size={17}/> Game catalog</a><span className="results-host-state"><Trophy size={15}/> MATCH FINISHED</span><button className="btn btn-primary" onClick={openProjector}><MonitorPlay size={18}/> Open projector</button></header>
    <main className="results-host-main">
      <div className="results-host-heading"><span className="eyebrow">PLAYLAB · GAME COMPLETE</span><h2>That’s a wrap! <span>✦</span></h2><p>The final scores are saved in this browser and appear on your projector. You can resume the match to correct a result, or start again with the same questions and teams.</p></div>
      <ResultsBoard game={game} kind={kind} preview/>
      <div className="results-host-actions">
        <button className="btn btn-soft" onClick={onResume}><ArrowLeft size={17}/> Resume match</button>
        <button className="btn btn-primary" onClick={onReset}><RotateCcw size={17}/> Reset & play again</button>
        <a className="btn btn-soft" href="?page=dashboard"><ArrowRight size={17}/> My dashboard</a>
      </div>
      <p className="results-host-footnote">Reset clears scores and progress only after confirmation. Your question bank and saved packs stay intact.</p>
    </main>
  </div>;
}
