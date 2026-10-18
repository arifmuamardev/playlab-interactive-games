import React,{useEffect,useSyncExternalStore} from 'react';
import './language.css';

/** Browser-local presentation preference, never part of question packs or saved matches. */
export const LANGUAGE_KEY='playlab-interface-language-v1';
const EVENT='playlab-interface-language-changed';
const WORDS={
  'Game catalog':'Katalog permainan',
  'My dashboard':'Dasbor saya',
  'Set up a game':'Siapkan permainan',
  'Set up game':'Siapkan permainan',
  'Host':'Pemandu',
  'READY TO PLAY':'SIAP DIMAINKAN',
  'COMING SOON':'SEGERA HADIR',
  'Choose this set':'Pilih set ini',
  'Selected':'Terpilih',
  'Find your game':'Cari permainan',
  'No sign-up':'Tanpa registrasi',
  'Two playable games':'Dua permainan siap dimainkan',
  'Projector-ready':'Siap ditayangkan',
  'Choose a game':'Pilih permainan',
  'Set the stage':'Siapkan permainan',
  'Make it memorable':'Ciptakan momen seru',
  'Get your game ready.':'Siapkan permainanmu.',
  'Continue':'Lanjut',
  'Back':'Kembali',
  'Dashboard':'Dasbor',
  'Game':'Permainan',
  'Questions':'Pertanyaan',
  'Teams':'Tim',
  'Review':'Tinjau',
  'Choose your questions':'Pilih pertanyaan',
  'Sample questions':'Pertanyaan contoh',
  'Reuse current game questions':'Gunakan pertanyaan permainan saat ini',
  'Use a saved question pack':'Gunakan paket pertanyaan tersimpan',
  'Ready-to-use classroom & event templates':'Set siap pakai untuk kelas dan acara',
  'Ready-to-play set':'Set siap dimainkan',
  'Choose a set':'Pilih set',
  'Name your teams':'Beri nama tim',
  'Team 1':'Tim 1',
  'Team 2':'Tim 2',
  'Review your new match':'Tinjau permainan baru',
  'MATCH READY!':'PERMAINAN SIAP!',
  'Questions and answers':'Pertanyaan dan jawaban',
  'Save an editable copy':'Simpan salinan yang dapat diedit',
  'Customize this set':'Sesuaikan set ini',
  'Edit a copy':'Edit salinan',
  'Preview all questions':'Lihat semua pertanyaan',
  'Show answers':'Tampilkan jawaban',
  'Hide answers':'Sembunyikan jawaban',
  'Preview first 3':'Pratinjau 3 pertama',
  'Start new match':'Mulai permainan baru',
  'Launch host controls':'Buka panel pemandu',
  'Practice without affecting live game':'Latihan tanpa mengubah permainan langsung',
  'Open projector':'Buka proyektor',
  'Open projector view':'Buka tampilan proyektor',
  'Enable sound':'Aktifkan suara',
  'Sound on':'Suara aktif',
  'Fullscreen':'Layar penuh',
  'Game library':'Katalog permainan',
  'How to play':'Cara bermain',
  'Reveal answers':'Tampilkan jawaban',
  'Reveal correct answer':'Tampilkan jawaban benar',
  'Hide answer':'Sembunyikan jawaban',
  'Team scoreboard':'Papan skor tim',
  'Team points':'Poin tim',
  'Round controls':'Kontrol ronde',
  'Question control':'Kontrol pertanyaan',
  'Question bank':'Bank pertanyaan',
  'Countdown timer':'Penghitung waktu',
  'Match results':'Hasil permainan',
  'Finish match & show results':'Akhiri permainan & tampilkan hasil',
  'Correct award':'Koreksi pemberian poin',
  'Show final results':'Tampilkan hasil akhir',
  'Continue to round':'Lanjut ke ronde',
  'Continue to question':'Lanjut ke pertanyaan',
  'Show answer on projector':'Tampilkan jawaban di proyektor',
  'Jump to answer buttons':'Ke tombol jawaban',
  'Answer list':'Daftar jawaban',
  'Add strike':'Tambah kesalahan',
  'Undo strike':'Batalkan kesalahan',
  'Undo score change':'Batalkan perubahan skor',
  'Award points':'Berikan poin',
  'Next':'Berikutnya',
  'Previous':'Sebelumnya',
  'Practice mode':'Mode latihan',
  'Back to setup':'Kembali ke pengaturan',
  'Round finished':'Ronde selesai',
  'Steal opportunity':'Kesempatan merebut poin',
  'Answers in play':'Menebak jawaban',
  'Question waiting':'Menunggu jawaban',
  'Answer revealed':'Jawaban terbuka',
  'GAME OVER':'PERMAINAN SELESAI',
  'QUESTION':'PERTANYAAN',
  'ROUND':'RONDE',
  'ROUND FINISHED':'RONDE SELESAI',
  'STEAL OPPORTUNITY':'KESEMPATAN MEREBUT POIN',
  'GUESS THE MOST POPULAR ANSWERS':'TEBAK JAWABAN TERPOPULER',
  'STRIKES':'KESALAHAN',
  'POINTS IN BANK':'POIN TERKUMPUL',
  'POINTS AWARDED':'POIN DIBERIKAN',
  'PLAYING':'MAIN',
  'TIME LEFT':'SISA WAKTU',
  'PAUSED':'DIJEDA',
  'TIME UP':'WAKTU HABIS',
  'Correct answer highlighted.':'Jawaban yang benar disorot.',
  'Discuss with your team. The host will reveal the answer.':'Diskusikan dengan tim. Pemandu akan membuka jawabannya.',
  'TO THE TEAM':'UNTUK TIM',
  'POINTS FOR':'POIN UNTUK',
  'Congratulations!':'Selamat!',
  'Built-in questions are not translated automatically.':'Pertanyaan bawaan tidak diterjemahkan secara otomatis.',
  'The interface language changes labels, not your question content.':'Bahasa antarmuka hanya mengubah label, bukan isi pertanyaan.'
};

export function currentLanguage(){
  try{return globalThis.localStorage?.getItem(LANGUAGE_KEY)==='id'?'id':'en';}
  catch{return 'en';}
}
function subscribe(callback){
  const onStorage=e=>{if(!e.key||e.key===LANGUAGE_KEY)callback();};
  window.addEventListener('storage',onStorage);
  window.addEventListener(EVENT,callback);
  return ()=>{window.removeEventListener('storage',onStorage);window.removeEventListener(EVENT,callback);};
}
export function setLanguage(lang){
  if(!['en','id'].includes(lang))return;
  try{localStorage.setItem(LANGUAGE_KEY,lang);}catch{/* ephemeral preference only */}
  window.dispatchEvent(new Event(EVENT));
}
export function tr(lang,english){return lang==='id'?(WORDS[english]||english):english;}
export function useLanguage(){
  const lang=useSyncExternalStore(subscribe,currentLanguage,()=> 'en');
  useEffect(()=>{document.documentElement.lang=lang;},[lang]);
  return {lang,t:english=>tr(lang,english)};
}
export function LanguageSwitch({compact=false}){
  const {lang}=useLanguage();
  return <div role="group" aria-label="Interface language" className={'playlab-language'+(compact?' playlab-language--compact':'')}>
    <button type="button" aria-label="English" aria-pressed={lang==='en'} onClick={()=>setLanguage('en')}>EN</button>
    <button type="button" aria-label="Bahasa Indonesia" aria-pressed={lang==='id'} onClick={()=>setLanguage('id')}>ID</button>
  </div>;
}
