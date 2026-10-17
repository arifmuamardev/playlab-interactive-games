import assert from 'node:assert/strict';
import {sampleQuestions,makeInitialState,normalizeQuestions,sumBank,progressFor,getScores} from '../src/data.js';
assert.equal(sampleQuestions.length,6);
for(const q of sampleQuestions) {
 assert(q.answers.length >= 2 && q.answers.length <=8);
 assert.equal(q.answers.reduce((s,a)=>s+a.points,0),100,`${q.id} sample weights`);
}
const state=makeInitialState();
const q=state.questions[0];
assert.equal(sumBank(q,{revealed:[0,2]}),52);
assert.equal(sumBank(state.questions[2],{revealed:[0,1]}),120);
assert.equal(progressFor(state,q.id).strikes,0);
state.progress[q.id]={awardedTeam:1,awardedAmount:50};
assert.deepEqual(getScores(state),[0,50]);
assert.throws(()=>normalizeQuestions([{question:'Hi',answers:[{text:'X',points:101},{text:'Y',points:1}]}]));
console.log('Data, multipliers, game scoring and import validation passed.');
