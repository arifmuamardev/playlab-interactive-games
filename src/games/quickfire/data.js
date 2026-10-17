/** Quickfire demo pack and pure scoring/question validation helpers. */
export const QUICKFIRE_KEY='playlab-quickfire-state-v1';
export const QUICKFIRE_CHANNEL='playlab-quickfire-sync-v1';
export const QUICKFIRE_QUESTIONS=[
  {id:'t1',question:'Planet manakah yang paling dekat dengan Matahari?',options:['Venus','Bumi','Merkurius','Mars'],answer:2,explanation:'Merkurius adalah planet terdekat dari Matahari.'},
  {id:'t2',question:'Manakah di antara berikut ini yang merupakan bilangan prima?',options:['15','17','21','27'],answer:1,explanation:'17 hanya dapat dibagi habis oleh 1 dan 17.'},
  {id:'t3',question:'Apa kepanjangan dari CPU dalam komputer?',options:['Central Processing Unit','Computer Power Utility','Central Program User','Control Processing Upload'],answer:0,explanation:'CPU adalah Central Processing Unit.'},
  {id:'t4',question:'Pada tekanan sekitar 1 atmosfer, air murni mendidih pada suhu berapa?',options:['80°C','90°C','100°C','110°C'],answer:2,explanation:'Pada tekanan 1 atm, air murni mendidih sekitar 100°C.'},
  {id:'t5',question:'Format file mana yang biasa digunakan untuk tabel data berbasis teks?',options:['PNG','MP3','CSV','MP4'],answer:2,explanation:'CSV menyimpan data tabular dalam format teks.'},
  {id:'t6',question:'Dalam grafik batang, tinggi batang biasanya mewakili apa?',options:['Warna kategori','Nilai kategori','Urutan huruf','Ukuran font'],answer:1,explanation:'Panjang atau tinggi batang menyatakan nilai data.'}
];
export function quickfireInitial(){
  return {version:1,questions:structuredClone(QUICKFIRE_QUESTIONS),questionIndex:0,teamNames:['Team A','Team B'],scores:[0,0],revealed:{},lastAward:null};
}

export function normalizeQuickfireQuestions(input){
  const questions=Array.isArray(input)?input:input?.questions;
  if(!Array.isArray(questions)||questions.length<1||questions.length>60)throw Error('Provide 1–60 questions.');
  return questions.map((item,i)=>{
    if(!item||typeof item.question!=='string'||!item.question.trim()||item.question.length>250)throw Error(`Question ${i+1}: invalid question text.`);
    if(!Array.isArray(item.options)||item.options.length!==4||item.options.some(x=>typeof x!=='string'||!x.trim()||x.length>110))throw Error(`Question ${i+1}: provide exactly four options.`);
    if(!Number.isInteger(item.answer)||item.answer<0||item.answer>3)throw Error(`Question ${i+1}: answer must be 0, 1, 2, or 3.`);
    return {id:`t-${i+1}`,question:item.question.trim(),options:item.options.map(x=>x.trim()),answer:item.answer,explanation:String(item.explanation||'').slice(0,250)};
  });
}
export function changeQuickfireScore(scores,team,delta){
  if(!Array.isArray(scores)||scores.length!==2 || ![0,1].includes(team) || !Number.isFinite(delta))throw Error('Invalid score update.');
  return scores.map((points,i)=>i===team?Math.max(0,points+delta):points);
}

/** A single-step scoring safety net. Records the exact pre-change totals so subtracting
 * at zero or later changing the question can never produce an incorrect rollback. */
export function awardQuickfirePoints(game,team,delta){
  const scores=changeQuickfireScore(game.scores,team,delta);
  if(scores[team]===game.scores[team])return game;
  return {...game,scores,lastAward:{team,delta,previousScores:[...game.scores],questionId:game.questions[game.questionIndex]?.id||null}};
}
export function undoQuickfireAward(game){
  if(!game.lastAward||!Array.isArray(game.lastAward.previousScores)||game.lastAward.previousScores.length!==2)return game;
  const {previousScores}=game.lastAward;
  if(previousScores.some(score=>!Number.isFinite(score)||score<0))return game;
  return {...game,scores:[...previousScores],lastAward:null};
}
