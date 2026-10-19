import {PRE_GAME_STEPS} from './games/pregame.js';

// Fictional sample answers and point values. Replace using a real survey before public events.
export const sampleQuestions = [
  { id:'demo-1', question:'Sebutkan benda yang biasanya dibawa saat pergi ke sekolah atau kampus!', multiplier:1, answers:[{text:'Tas',points:34},{text:'Buku / catatan',points:24},{text:'Laptop',points:18},{text:'Alat tulis',points:14},{text:'Botol minum',points:10}] },
  { id:'demo-2', question:'Sebutkan aktivitas yang sering dilakukan saat akhir pekan!', multiplier:1, answers:[{text:'Istirahat',points:30},{text:'Jalan-jalan',points:26},{text:'Menonton film',points:20},{text:'Olahraga',points:14},{text:'Berkumpul dengan teman',points:10}] },
  { id:'demo-3', question:'Sebutkan hal yang membuat acara komunitas menjadi seru!', multiplier:2, answers:[{text:'Permainan',points:35},{text:'Makanan',points:25},{text:'Hadiah',points:18},{text:'Musik',points:12},{text:'Teman baru',points:10}] },
  { id:'demo-4', question:'Sebutkan sesuatu yang biasanya ada di ruang kelas!', multiplier:2, answers:[{text:'Meja',points:32},{text:'Kursi',points:26},{text:'Papan tulis',points:20},{text:'Proyektor',points:14},{text:'Spidol',points:8}] },
  { id:'demo-5', question:'Sebutkan hal yang perlu disiapkan sebelum presentasi!', multiplier:3, answers:[{text:'Slide',points:36},{text:'Materi',points:26},{text:'Latihan',points:18},{text:'Laptop',points:12},{text:'Koneksi / kabel',points:8}] },
  { id:'demo-6', question:'Sebutkan cara seseorang biasanya mengisi waktu luang!', multiplier:3, answers:[{text:'Membaca',points:30},{text:'Bermain game',points:26},{text:'Menonton',points:20},{text:'Berolahraga',points:14},{text:'Memasak',points:10}] }
];

export const STORAGE_KEY = 'playlab-survey-showdown-v2';
export const CHANNEL = 'playlab-survey-showdown-sync-v2';

export function makeInitialState() {
  return {
    version:1,
    questions:structuredClone(sampleQuestions),
    roundIndex:0,
    teamNames:['Tim Merah','Tim Biru'],
    progress:{},
    finished:false,
    lastEvent:null
  };
}
export function progressFor(state, questionId) {
  return state.progress?.[questionId] ?? {revealed:[], strikes:0, activeTeam:0, phase:'play', awardedTeam:null, awardedAmount:0};
}
export function sumBank(question, progress) {
  if (!question) return 0;
  return question.answers.reduce((sum, answer, i) => sum + (progress.revealed.includes(i) ? answer.points * question.multiplier : 0), 0);
}
export function getScores(state) {
  return state.questions.reduce((acc, q) => {
    const p = state.progress?.[q.id];
    if (p && (p.awardedTeam === 0 || p.awardedTeam === 1)) acc[p.awardedTeam] += p.awardedAmount || 0;
    return acc;
  }, [0,0]);
}
export function normalizeQuestions(input) {
  const data = Array.isArray(input) ? input : input?.questions;
  if (!Array.isArray(data) || !data.length || data.length > 60) throw new Error('Import must contain 1–60 questions.');
  const used = new Set();
  return data.map((q,i) => {
    const question = String(q.question||'').trim();
    const multiplier = Number(q.multiplier ?? 1);
    if (!question || question.length>240) throw new Error(`Question ${i+1}: enter a question (max 240 characters).`);
    if (![1,2,3].includes(multiplier)) throw new Error(`Question ${i+1}: multiplier must be 1, 2, or 3.`);
    if (!Array.isArray(q.answers) || q.answers.length<2 || q.answers.length>8) throw new Error(`Question ${i+1}: include 2–8 answers.`);
    const answers = q.answers.map((a,j) => {
      const ans = String(a.text||'').trim(); const points = Number(a.points);
      if (!ans || ans.length>70 || !Number.isInteger(points) || points<1 || points>100) throw new Error(`Question ${i+1}, answer ${j+1}: provide text and integer points 1–100.`);
      return {text:ans,points};
    });
    let id = String(q.id||`q${i+1}`);
    if (used.has(id)) id = `q${i+1}-${Date.now()}`;
    used.add(id);
    return {id,question,multiplier,answers};
  });
}
export function readSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const questions = normalizeQuestions(saved.questions);
      return {
        version:1,questions,
        roundIndex:Math.min(Math.max(0,Number(saved.roundIndex)||0),questions.length-1),
        teamNames:Array.isArray(saved.teamNames) && saved.teamNames.length===2 ? saved.teamNames.map((s,i)=>String(s||`Tim ${i+1}`).slice(0,45)) : ['Tim Merah','Tim Biru'],
        progress: typeof saved.progress==='object' && saved.progress && !Array.isArray(saved.progress) ? saved.progress : {},
        finished:saved.finished===true,
        presentation:PRE_GAME_STEPS.includes(saved.presentation)?saved.presentation:undefined,
        lastEvent:saved.lastEvent||null
      };
    }
  } catch (e) {console.warn('Saved game could not be read; loading demo data.',e);}
  return makeInitialState();
}
