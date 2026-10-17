import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {GAME_CATALOG} from '../src/core/gameRegistry.js';
import {QUICKFIRE_QUESTIONS,normalizeQuickfireQuestions,quickfireInitial,changeQuickfireScore} from '../src/games/quickfire/data.js';
const playable=GAME_CATALOG.filter(g=>g.slug);
assert.deepEqual(playable.map(g=>g.slug),['survey','quickfire']);
assert.equal(new Set(playable.map(g=>g.slug)).size,playable.length);
const initial=quickfireInitial();
assert.equal(initial.questions.length,QUICKFIRE_QUESTIONS.length);
assert.deepEqual(initial.scores,[0,0]);
assert.deepEqual(changeQuickfireScore([10,20],0,-40),[0,20]);
assert.deepEqual(changeQuickfireScore([10,20],1,10),[10,30]);
assert.throws(()=>changeQuickfireScore([10,20],2,10));
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
console.log('Catalog, module boundaries, Quickfire scoring and question-validation tests passed.');
