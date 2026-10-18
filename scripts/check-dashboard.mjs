import assert from 'node:assert/strict';
import {buildConfiguredMatch,writeConfiguredMatch,hasStoredMatch,writeRehearsalMatch} from '../src/dashboard/setup.js';
import {STARTER_TEMPLATES,starterTemplatesFor} from '../src/dashboard/starterTemplates.js';
import {REHEARSAL_KEYS} from '../src/core/rehearsal.js';
import {LIBRARY_KEY,PACK_SCHEMA,PACK_LIMIT,createPack,normalizePack,readPackLibrary,writePackLibrary,readGameSession,resetGameSession,applyPackToSession} from '../src/dashboard/storage.js';
import {makeInitialState,STORAGE_KEY,normalizeQuestions} from '../src/data.js';
import {quickfireInitial,QUICKFIRE_KEY,normalizeQuickfireQuestions} from '../src/games/quickfire/data.js';

function fakeStorage(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
const storage=fakeStorage();
assert.deepEqual(readPackLibrary(storage),[]);
assert.equal(readGameSession('survey',storage),null);
assert.equal(readGameSession('quickfire',storage),null);
const survey=makeInitialState(),quickfire=quickfireInitial();
const pack=createPack('survey','  Term review  ',survey.questions);
assert.equal(pack.name,'Term review');
assert.equal(pack.schema,PACK_SCHEMA);
assert.equal(pack.questions.length,6);
assert.equal(LIBRARY_KEY,'playlab-content-packs-v1');
assert.throws(()=>createPack('wrong','Unknown',survey.questions));
assert.throws(()=>createPack('survey',' ',survey.questions));
assert.throws(()=>normalizePack({...pack,version:2}));
assert.throws(()=>normalizePack({...pack,questions:[]}));
const quizPack=createPack('quickfire','Lecture trivia',quickfire.questions);
assert.equal(quizPack.questions.length,6);
writePackLibrary([pack,quizPack],storage);
assert.equal(readPackLibrary(storage).length,2);
assert.throws(()=>writePackLibrary([pack,pack],storage));
assert.throws(()=>writePackLibrary(Array.from({length:PACK_LIMIT+1},()=>pack),storage));

const altered={...survey,teamNames:['Alpha','Beta'],progress:{'demo-1':{revealed:[0],strikes:0,activeTeam:0,phase:'play',awardedTeam:0,awardedAmount:34}}};
storage.setItem(STORAGE_KEY,JSON.stringify(altered));
assert.deepEqual(readGameSession('survey',storage).scores,[34,0]);
const resetSurvey=resetGameSession('survey',storage);
assert.deepEqual(resetSurvey.progress,{});
assert.deepEqual(resetSurvey.teamNames,['Alpha','Beta']);
assert.equal(resetSurvey.questions.length,6);
const setPack={...pack,questions:[survey.questions[0]]};
const applied=applyPackToSession(setPack,storage);
assert.equal(applied.questions.length,1);
assert.deepEqual(readGameSession('survey',storage).scores,[0,0]);
assert.equal(applied.teamNames[0],'Alpha');

storage.setItem(QUICKFIRE_KEY,JSON.stringify({...quickfire,scores:[20,10],questionIndex:1,teamNames:['Class A','Class B']}));
assert.deepEqual(readGameSession('quickfire',storage).scores,[20,10]);
const resetQuiz=resetGameSession('quickfire',storage);
assert.deepEqual(resetQuiz.scores,[0,0]);
assert.equal(resetQuiz.teamNames[0],'Class A');
const loadedQuiz=applyPackToSession({...quizPack,questions:[quickfire.questions[0]]},storage);
assert.deepEqual(loadedQuiz.scores,[0,0]);
assert.equal(loadedQuiz.questions.length,1);
assert.equal(loadedQuiz.teamNames[0],'Class A');
assert.equal(readGameSession('quickfire',storage).questions.length,1);
storage.setItem(LIBRARY_KEY,JSON.stringify({version:999,packs:[]}));
assert.throws(()=>readPackLibrary(storage),/library|version/i);

const prepareStorage=fakeStorage();
const savedQuiz=quickfireInitial();
savedQuiz.scores=[20,10];
prepareStorage.setItem(QUICKFIRE_KEY,JSON.stringify(savedQuiz));
assert.equal(hasStoredMatch('quickfire',prepareStorage),true);
assert.equal(hasStoredMatch('invalid',prepareStorage),false);
const config={game:'quickfire',source:'current',teamNames:['  Class one  ','Class two']};
const prepared=buildConfiguredMatch(config,prepareStorage);
assert.deepEqual(prepared.scores,[0,0]);
assert.deepEqual(prepared.teamNames,['Class one','Class two']);
assert.equal(JSON.parse(prepareStorage.getItem(QUICKFIRE_KEY)).scores[0],20,'Review must never mutate a saved match');
assert.throws(()=>buildConfiguredMatch({...config,teamNames:['Same','same']},prepareStorage),/different names/);
assert.throws(()=>buildConfiguredMatch({...config,teamNames:[' ','B']},prepareStorage),/team name/);
assert.throws(()=>buildConfiguredMatch({...config,source:'pack',packId:'missing'},prepareStorage),/not found/);
assert.throws(()=>buildConfiguredMatch({...config,game:'unknown'},prepareStorage),/supported/);
writePackLibrary([pack,quizPack],prepareStorage);
const quizConfigured=buildConfiguredMatch({game:'quickfire',source:'pack',packId:quizPack.id,teamNames:['A','B']},prepareStorage);
assert.equal(quizConfigured.questions.length,6);
assert.deepEqual(quizConfigured.scores,[0,0]);
assert.throws(()=>buildConfiguredMatch({game:'survey',source:'pack',packId:quizPack.id,teamNames:['A','B']},prepareStorage),/another game/);
const configured=writeConfiguredMatch(config,prepareStorage);
assert.deepEqual(JSON.parse(prepareStorage.getItem(QUICKFIRE_KEY)).teamNames,['Class one','Class two']);
assert.deepEqual(configured.scores,[0,0]);
assert.equal(readPackLibrary(prepareStorage).length,2,'Setting up a match must never delete saved question packs');
assert.equal(prepareStorage.getItem(STORAGE_KEY),null,'Setting up Quickfire must not alter Survey');
const surveyReady=writeConfiguredMatch({game:'survey',source:'demo',teamNames:['Red','Blue']},prepareStorage);
assert.equal(surveyReady.questions.length,6);
assert.deepEqual(surveyReady.progress,{});
// Built-in starter packs are valid, independently reusable, and not saved as user-owned packs.
assert.equal(STARTER_TEMPLATES.length,10,'The catalog must have five complete sets per game');
const starterIds=STARTER_TEMPLATES.map(t=>t.id);
assert.equal(new Set(starterIds).size,10,'Every starter set must have a stable unique ID');
for(const game of ['survey','quickfire'])assert.equal(starterTemplatesFor(game).length,5);
const surveyQuestions=new Set(),quickfireQuestions=new Set();
for(const template of STARTER_TEMPLATES){
  assert.equal(template.questions.length,8,template.id+' should support a complete mini-game');
  assert.ok(template.title&&template.description&&template.category&&template.minutes&&template.audience);
  const normalized=template.game==='survey'?normalizeQuestions(template.questions):normalizeQuickfireQuestions(template.questions);
  assert.equal(normalized.length,8);
  for(const question of template.questions){
    assert.ok(question.question.length>=10&&question.question.length<250,template.id+': usable question wording');
    assert.ok(!question.question.includes('TODO'),template.id+': no placeholder questions');
    if(template.game==='survey'){
      assert.ok(!surveyQuestions.has(question.id),'Duplicated Survey answer ID '+question.id);
      surveyQuestions.add(question.id);
      assert.equal(question.answers.length,5);
      assert.ok([1,2,3].includes(question.multiplier));
      assert.equal(new Set(question.answers.map(a=>a.text.toLowerCase())).size,5);
    }else{
      assert.ok(!quickfireQuestions.has(question.id),'Duplicated quiz ID '+question.id);
      quickfireQuestions.add(question.id);
      assert.equal(question.options.length,4);
      assert.equal(new Set(question.options.map(a=>a.toLowerCase())).size,4);
      assert.ok(question.explanation.length>=12,'Every quiz answer needs an explanation');
    }
  }
  const built=buildConfiguredMatch({game:template.game,source:'starter',templateId:template.id,teamNames:['First','Second']},prepareStorage);
  assert.equal(built.questions.length,template.questions.length);
  if(template.game==='survey'){
    assert.ok(/fictional|illustrative|not real/i.test(template.description));
    for(const q of template.questions)assert.equal(q.answers.reduce((sum,a)=>sum+a.points,0),100);
  }
}
assert.equal(starterTemplatesFor('quickfire').length,5);
assert.throws(()=>buildConfiguredMatch({game:'survey',source:'starter',templateId:'quickfire-computing-v1',teamNames:['A','B']},prepareStorage),/another game/);
assert.throws(()=>buildConfiguredMatch({game:'survey',source:'starter',templateId:'unknown',teamNames:['A','B']},prepareStorage),/not found/);
const liveSurveyBefore=prepareStorage.getItem(STORAGE_KEY),liveQuizBefore=prepareStorage.getItem(QUICKFIRE_KEY),libraryBefore=prepareStorage.getItem(LIBRARY_KEY);
const practiceSurvey=writeRehearsalMatch({game:'survey',source:'starter',templateId:'survey-community-v1',teamNames:['MC A','MC B']},prepareStorage);
const practiceQuiz=writeRehearsalMatch({game:'quickfire',source:'starter',templateId:'quickfire-general-v1',teamNames:['MC A','MC B']},prepareStorage);
assert.equal(practiceSurvey.questions.length,8);
assert.equal(practiceQuiz.questions.length,8);
assert.ok(prepareStorage.getItem(REHEARSAL_KEYS.survey));
assert.ok(prepareStorage.getItem(REHEARSAL_KEYS.quickfire));
assert.equal(prepareStorage.getItem(STORAGE_KEY),liveSurveyBefore);
assert.equal(prepareStorage.getItem(QUICKFIRE_KEY),liveQuizBefore);
assert.equal(prepareStorage.getItem(LIBRARY_KEY),libraryBefore);
console.log('Local dashboard library, starter templates and isolated rehearsal validation passed.');

