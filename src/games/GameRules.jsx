import React from 'react';
import {BookOpen,ChevronDown,ShieldCheck} from 'lucide-react';
import './game-rules.css';
import {useLanguage} from '../i18n/language.jsx';

/** Official PlayLab rules reflect implemented mechanics, not proposed settings.
 * House rules are suggestions for an MC, not software-enforced constraints. */
export const GAME_RULES={
  survey:{
    title:'Survey Showdown',
    tagline:'Guess the most popular answers, build the bank, and win the round.',
    label:'Survey-style guessing · 2 teams',
    steps:[
      'The host reads a prompt and accepts spoken guesses from the teams.',
      'When a guess matches a listed answer, the host reveals it. Each revealed answer adds its displayed points × that round’s multiplier (1×, 2× or 3×) to the bank.',
      'For wrong guesses, the host adds a strike (X). Three strikes trigger a steal-opportunity indicator; the host decides how to handle the opposing team’s attempt.',
      'The host explicitly awards the bank to one team. At least one answer must be revealed before points can be awarded. Scores are never awarded automatically.',
      'Continue through the rounds, then choose Finish match to display the final scores. The highest-scoring team wins; equal scores produce a tie.'
    ],
    controls:'Keyboard: 1–8 reveal answers · X add strike · Z undo strike. You may undo a round award or correct the scoreboard before finishing. A host-controlled countdown is available.',
    scoring:'Round bank = sum of revealed answer points × round multiplier. Awarding transfers the current bank to exactly one team.',
    caveat:'All bundled answer rankings and points are fictional game examples—not results from a real survey. Replace them if your event requires collected survey data.',
    optional:'Optional MC house rule: alternate which team guesses first each round and optionally show a countdown. PlayLab does not enforce time limits, turns, or a particular steal decision.'
  },
  quickfire:{
    title:'Quickfire Quiz',
    tagline:'Reveal the correct choice, award points, and move to the next question.',
    label:'Multiple-choice trivia · 2 teams',
    steps:[
      'The host displays a question with four choices: A, B, C and D.',
      'Give teams a chance to discuss or answer aloud. The host chooses when to reveal the correct answer and any explanation.',
      'The host manually awards +10 to a team for a correct response. A −10 correction and one-step Undo are available. No automatic correctness checking or scoring occurs.',
      'Move to the next question. The host can navigate backward and adjust scores; A host-controlled countdown can be shown, but PlayLab does not enforce deadlines, buzzers, or one award per question.',
      'Choose Finish match to show the final scoreboard. The highest-scoring team wins; equal scores produce a tie.'
    ],
    controls:'Keyboard: R reveal/hide · N next · P previous · U undo the last score change. Typing in input fields disables shortcuts.',
    scoring:'Current default: +10 points per manual award; −10 corrections stop at zero. A question reveal does not award any points.',
    caveat:'The bundled trivia sets use objective answers and explanations; the MC should adapt the difficulty to participants.',
    optional:'Optional MC house rule: start a visible 15–30 second countdown and award +10 only once per question. Time limits and single-award restrictions are not enforced.'
  }
};
/** Accurate Indonesian wording for the currently implemented (manual) rules. */
const GAME_RULES_ID={
  survey:{
    title:'Survey Showdown',tagline:'Tebak jawaban paling populer, kumpulkan poin, lalu menangkan ronde.',
    label:'Tebak jawaban · 2 tim',
    steps:[
      'Pemandu membacakan pertanyaan dan menerima jawaban lisan dari kedua tim.',
      'Ketika jawaban sesuai dengan daftar, pemandu membukanya. Setiap jawaban menambah poin sesuai nilai dasar dikalikan pengali ronde (1×, 2×, atau 3×).',
      'Untuk jawaban salah, pemandu menambah tanda kesalahan (X). Tiga kesalahan menampilkan kesempatan merebut poin. Pemandu tetap menentukan hasil usaha tim lawan.',
      'Pemandu secara manual memberikan total poin ronde kepada satu tim. Minimal satu jawaban harus dibuka. Poin tidak diberikan secara otomatis.',
      'Lanjutkan ronde, lalu pilih Akhiri permainan. Tim dengan poin tertinggi menang; poin sama berarti seri.'
    ],
    controls:'Tombol 1–8 membuka jawaban · X menambah kesalahan · Z membatalkan kesalahan. Pemandu bisa membatalkan pemberian poin. Penghitung waktu opsional tersedia.',
    scoring:'Poin ronde = jumlah poin jawaban yang dibuka × pengali ronde. Pemandu memberikan jumlah ini kepada satu tim.',
    caveat:'Semua peringkat dan angka poin dari set bawaan adalah contoh fiktif, BUKAN hasil survei sungguhan. Ganti dengan data survei apabila diperlukan.',
    optional:'Bergantian menunjuk tim penjawab pertama dan menggunakan penghitung waktu. Batas waktu, urutan giliran, dan keberhasilan merebut poin tidak dipaksakan oleh sistem.'
  },
  quickfire:{
    title:'Quickfire Quiz',tagline:'Tampilkan jawaban benar, berikan poin, lalu lanjutkan pertanyaan.',
    label:'Kuis pilihan ganda · 2 tim',
    steps:[
      'Pemandu menampilkan pertanyaan dengan empat pilihan A, B, C, dan D.',
      'Tim diberi kesempatan berdiskusi atau menjawab secara lisan. Pemandu menentukan kapan jawaban dan penjelasan ditampilkan.',
      'Pemandu memberi +10 poin secara manual untuk jawaban benar. Koreksi −10 dan Undo tersedia. Sistem tidak otomatis memeriksa jawaban atau menambah skor.',
      'Lanjutkan ke pertanyaan berikutnya. Pemandu dapat kembali dan memperbaiki skor. Penghitung waktu hanya visual; tidak ada batas otomatis, buzzer, atau pembatasan satu pemberian poin.',
      'Pilih Akhiri permainan untuk menampilkan hasil akhir. Poin tertinggi menang dan poin sama berarti seri.'
    ],
    controls:'Tombol R membuka/menutup jawaban · N berikutnya · P sebelumnya · U batalkan skor terakhir. Pintasan tidak aktif ketika mengetik.',
    scoring:'Default +10 poin tiap pemberian manual. Koreksi −10 tidak membuat poin negatif. Membuka jawaban tidak otomatis menambah poin.',
    caveat:'Kuis bawaan menggunakan jawaban objektif dan penjelasan. Pemandu dapat menyesuaikan tingkat kesulitan.',
    optional:'Tampilkan penghitung 15–30 detik dan berikan +10 hanya sekali tiap pertanyaan. Batas waktu maupun aturan satu pemberian poin tidak dipaksakan oleh sistem.'
  }
};

export function GameRules({game,open=false}){
  const {lang}=useLanguage();
  const rule=(lang==='id'?GAME_RULES_ID:GAME_RULES)[game];if(!rule)return null;
  return <details className={'playlab-rules playlab-rules--'+game} open={open||undefined}>
    <summary><span className="playlab-rules-label"><BookOpen size={19} aria-hidden="true"/><span><strong>{rule.title}: {lang==='id'?'cara bermain':'how to play'}</strong><small>{rule.label}</small></span></span><ChevronDown size={19} aria-hidden="true"/></summary>
    <div className="playlab-rules-body">
      <p className="playlab-rules-tagline">{rule.tagline}</p>
      <ol>{rule.steps.map((item,i)=><li key={i}>{item}</li>)}</ol>
      <div className="playlab-rules-facts"><p><strong>{lang==='id'?'Penilaian:':'Scoring:'}</strong> {rule.scoring}</p><p><strong>{lang==='id'?'Kontrol pemandu:':'Host controls:'}</strong> {rule.controls}</p></div>
      <p className="playlab-rules-notice"><ShieldCheck size={17} aria-hidden="true"/>{rule.caveat}</p>
      <p className="playlab-rules-optional"><strong>{lang==='id'?'Aturan tambahan opsional (tidak otomatis):':'Optional house rule (not enforced):'}</strong> {rule.optional.replace(/^Optional MC house rule:\s*/,'')}</p>
    </div>
  </details>;
}
