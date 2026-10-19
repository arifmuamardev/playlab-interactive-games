import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {GAME_CATALOG} from '../src/core/gameRegistry.js';
import {startCountdown,pauseCountdown,resumeCountdown,clearCountdown,secondsRemaining,formatCountdown,countdownFor} from '../src/games/countdown.js';
import {makeStageEvent,playStageCue} from '../src/games/stageEffects.js';
import {PRE_GAME_STEPS,presentationStep,navigatePresentation,resetPresentation,presentationCanStart} from '../src/games/pregame.js';
import {QUICKFIRE_QUESTIONS,normalizeQuickfireQuestions,quickfireInitial,changeQuickfireScore,awardQuickfirePoints,undoQuickfireAward} from '../src/games/quickfire/data.js';
// Pre-game stages must never change scores, question banks or reveals.
assert.deepEqual(PRE_GAME_STEPS,['welcome','teams','rules','playing']);
const draft={version:1,teamNames:['Blue','Red'],questions:[{id:'first',question:'Test'}],scores:[20,10],revealed:{first:true},finished:false,presentation:'welcome'};
assert.equal(presentationStep(draft),'welcome');
assert.equal(presentationStep({...draft,presentation:undefined}),'playing','Legacy matches remain playable');
const withTeams=navigatePresentation(draft,'teams');
const withRules=navigatePresentation(withTeams,'rules');
assert.equal(presentationCanStart(withRules),true);
assert.equal(presentationCanStart(withTeams),false);
const started=navigatePresentation(withRules,'playing');
assert.equal(started.presentation,'playing');
assert.deepEqual(started.scores,draft.scores);
assert.deepEqual(started.revealed,draft.revealed);
assert.deepEqual(started.questions,draft.questions);
assert.deepEqual(started.teamNames,draft.teamNames);
assert.equal(navigatePresentation(started,'bad-stage'),started);
assert.equal(navigatePresentation({...started,finished:true},'welcome').presentation,'playing');
assert.equal(resetPresentation(started).presentation,'welcome');
assert.equal(resetPresentation({...started,presentation:undefined}).presentation,undefined);
const playable=GAME_CATALOG.filter(g=>g.slug);
assert.deepEqual(playable.map(g=>g.slug),['survey','quickfire']);
assert.equal(new Set(playable.map(g=>g.slug)).size,playable.length);
const initial=quickfireInitial();
assert.equal(initial.questions.length,QUICKFIRE_QUESTIONS.length);
assert.deepEqual(initial.scores,[0,0]);
assert.deepEqual(changeQuickfireScore([10,20],0,-40),[0,20]);
assert.deepEqual(changeQuickfireScore([10,20],1,10),[10,30]);
assert.throws(()=>changeQuickfireScore([10,20],2,10));
let scored=awardQuickfirePoints(initial,0,10);
assert.deepEqual(scored.scores,[10,0]);
assert.deepEqual(scored.lastAward.previousScores,[0,0]);
scored=awardQuickfirePoints(scored,0,10);
assert.deepEqual(scored.scores,[20,0]);
assert.deepEqual(undoQuickfireAward(scored).scores,[10,0]);
assert.equal(undoQuickfireAward(scored).lastAward,null);
assert.equal(undoQuickfireAward(initial),initial,'No previous change must not alter state');
const nearZero={...initial,scores:[5,0]};
const corrected=awardQuickfirePoints(nearZero,0,-10);
assert.deepEqual(corrected.scores,[0,0]);
assert.deepEqual(undoQuickfireAward(corrected).scores,[5,0],'Undo must restore exact original points, even near zero');
assert.equal(awardQuickfirePoints(initial,0,-10),initial,'No-op subtraction should not create false undo history');

// Host-controlled countdown is a visual aid: no mutation to score or reveal fields.
const timerGame=startCountdown(initial,'t1',15,1000);
assert.equal(secondsRemaining(timerGame.countdown,1000),15);
assert.equal(secondsRemaining(timerGame.countdown,16000),0,'Expired countdown stays at zero');
assert.equal(formatCountdown(15),'00:15');
assert.equal(formatCountdown(90),'01:30');
assert.deepEqual(timerGame.scores,[0,0]);
assert.deepEqual(timerGame.revealed,{});
assert.equal(countdownFor(timerGame,'other-question'),null);
const pausedTimer=pauseCountdown(timerGame,'t1',6000);
assert.equal(secondsRemaining(pausedTimer.countdown,12000),10,'Pause must freeze the remaining time');
const resumedTimer=resumeCountdown(pausedTimer,'t1',10000);
assert.equal(secondsRemaining(resumedTimer.countdown,12000),8,'Resume uses the remaining duration, not the original deadline');
assert.equal(resumeCountdown(pauseCountdown(timerGame,'wrong',6000),'wrong'),timerGame,'Wrong question never affects the timer');
assert.equal(clearCountdown(timerGame).countdown,null);
assert.equal(clearCountdown(initial),initial,'Old sessions without timer remain unchanged');
assert.throws(()=>startCountdown(initial,'t1',500));
assert.throws(()=>startCountdown(initial,'',15));

const clean=normalizeQuickfireQuestions({questions:[{question:'  Test? ',options:[' One ','Two','Three','Four'],answer:0,explanation:'Test'}]});
assert.equal(clean[0].question,'Test?');
assert.equal(clean[0].options[0],'One');
assert.throws(()=>normalizeQuickfireQuestions([{question:'Invalid',options:['A','B','C','D'],answer:4}]));
assert.throws(()=>normalizeQuickfireQuestions([]));
assert.throws(()=>normalizeQuickfireQuestions([{question:'Missing choice',options:['A','B','C'],answer:0}]));
for(const file of ['src/core/useSyncedSession.js','src/games/survey/index.jsx','src/games/quickfire/index.jsx','src/components/shared.jsx','src/GameHub.jsx']) {
  assert(fs.existsSync(file),`Missing modular source: ${file}`);
}
const main=fs.readFileSync('src/main.jsx','utf8');
assert(main.includes('SurveyGame')&&main.includes('QuickfireApp'), 'Both playable games must remain routed');
const event=makeStageEvent('reveal',{team:0});
assert.equal(event.kind,'reveal');
assert.equal(event.team,0);
assert.ok(event.nonce);
assert.ok(Math.abs(Date.now()-event.stamp)<5000);
let oscillators=0;
const audio={
  state:'running',currentTime:3,destination:{},
  createOscillator:()=>({frequency:{setValueAtTime(){}},connect(){},start(){oscillators++},stop(){}}),
  createGain:()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}})
};
playStageCue('award',audio);
assert.equal(oscillators,4,'Award should create one short four-note celebration');
const previous=oscillators;
playStageCue('reveal',{...audio,state:'suspended'});
assert.equal(oscillators,previous,'Audio must not play before explicit resume');
console.log('Catalog, module boundaries, Quickfire scoring, question validation and projector cues passed.');
