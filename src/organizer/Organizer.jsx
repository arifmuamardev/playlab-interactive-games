import React,{useState} from 'react';
import {ArrowLeft,ArrowRight,Check,ClipboardCopy,ExternalLink,Gamepad2,Link2,MonitorPlay,ShieldCheck,Smartphone,Tv2,Wifi,WifiOff} from 'lucide-react';
import {LanguageSwitch,useLanguage} from '../i18n/language.jsx';
import {readOrganizer,remoteLinks} from '../remote/session.js';
import {GAME_CATALOG} from '../core/gameRegistry.js';
import './organizer.css';

const games=GAME_CATALOG.filter(x=>x.slug);
export function Organizer(){
 const {lang}=useLanguage();
 const roomId=new URLSearchParams(location.search).get('room');
 const saved=roomId?readOrganizer(roomId):null;
 const [copied,setCopied]=useState('');
 const [notice,setNotice]=useState('');
 const [checked,setChecked]=useState({screen:false,network:false,questions:false});
 const links=saved?remoteLinks(saved.game,saved.roomId,saved.controlKey,saved.viewKey):null;
 const translate=(a,b)=>lang==='id'?b:a;
 async function copy(value,what){
   try{await navigator.clipboard.writeText(value);setCopied(what);setNotice('');setTimeout(()=>setCopied(''),1800);}
   catch{setNotice(translate('Select and copy the link from the field below.','Pilih dan salin tautan dari kolom di bawah.'));}
 }
 async function share(){
   if(!links)return;
   if(navigator.share){try{await navigator.share({title:'PlayLab remote controller',text:'Open this link on the MC device to control the game:',url:links.controller});}catch{}}
   else copy(links.controller,'controller');
 }
 const prep=[
  {key:'screen',label:translate('Projector / large screen is connected','Proyektor / layar besar telah terhubung')},
  {key:'network',label:translate('Both devices have internet access','Kedua perangkat terhubung ke internet')},
  {key:'questions',label:translate('Teams, questions and rules have been reviewed','Tim, pertanyaan, dan aturan sudah diperiksa')}
 ];
 return <div className="org-page">
  <header className="org-header"><a href="./" className="org-brand">✦ PlayLab</a><nav><a href="?page=dashboard&tab=setup">{translate('Game setup','Pengaturan game')}</a><LanguageSwitch/></nav></header>
  <main className="org-main">
    {saved?<>
      <div className="org-eyebrow"><Wifi size={16}/> {translate('PAIRED EVENT SESSION','SESI PERMAINAN TERHUBUNG')}</div>
      <h1>{translate('Your game room is ready.','Ruang permainanmu siap.')}</h1>
      <p className="org-lead">{translate('This laptop shows the audience screen. Open the private controller link on your second device (phone, tablet or laptop).','Laptop ini menampilkan layar penonton. Buka tautan kontrol pribadi pada perangkat kedua (ponsel, tablet, atau laptop).')}</p>
      <div className="org-session-info"><strong>{games.find(x=>x.slug===saved.game)?.title}</strong><span>{translate('Room','Ruang')} {saved.roomId.toUpperCase()}</span><span>{translate('Expires 12 hours after creation','Berakhir 12 jam setelah dibuat')}</span></div>
      <div className="org-connections">
       <section className="org-device-card"><div className="org-card-head"><Tv2 size={25}/><span>01 · {translate('DISPLAY LAPTOP','LAPTOP TAMPILAN')}</span></div><h2>{translate('Audience / projector','Penonton / proyektor')}</h2><p>{translate('Read-only. Answers, timer, scores and final results appear here.','Hanya menampilkan. Jawaban, waktu, skor, dan hasil akhir muncul di sini.')}</p>
        <a className="org-primary-link" href={links.projector} target="_blank" rel="noreferrer"><MonitorPlay size={19}/> {translate('Open audience display','Buka tampilan penonton')} <ExternalLink size={17}/></a>
        <label htmlFor="org-display-url">{translate('Display link (view-only)','Tautan tampilan (hanya lihat)')}</label><div className="org-copy-row"><input id="org-display-url" readOnly value={links.projector} onFocus={e=>e.target.select()}/><button type="button" onClick={()=>copy(links.projector,'display')} aria-label="Copy display link"><ClipboardCopy size={18}/></button></div>
       </section>
       <section className="org-device-card"><div className="org-card-head"><Smartphone size={25}/><span>02 · {translate('PRESENTER DEVICE','PERANGKAT PEMANDU')}</span></div><h2>{translate('Private game controls','Kontrol permainan pribadi')}</h2><p>{translate('Open this link on the phone or laptop operated by the MC. It can reveal answers and change scores.','Buka tautan ini di ponsel atau laptop pemandu. Dapat membuka jawaban dan mengubah skor.')}</p>
        <button className="org-primary-link" type="button" onClick={share}><Link2 size={19}/> {translate('Share controller link','Bagikan tautan pemandu')} <ArrowRight size={17}/></button>
        <label htmlFor="org-controller-url">{translate('Keep this link private','Jangan bagikan tautan ini ke penonton')}</label><div className="org-copy-row"><input id="org-controller-url" readOnly value={links.controller} onFocus={e=>e.target.select()}/><button type="button" onClick={()=>copy(links.controller,'controller')} aria-label="Copy controller link"><ClipboardCopy size={18}/></button></div>
       </section>
      </div>
      {copied&&<p role="status" className="org-good"><Check size={16}/>{translate('Link copied.','Tautan disalin.')}</p>}
      {notice&&<p role="status" className="org-warning">{notice}</p>}
      <div className="org-security"><ShieldCheck size={20}/><p>{translate('Only the controller link can modify the game. Anyone with that private link can control it, so send it only to the MC. The audience link cannot change scores. Live pairing requires internet on both devices.','Hanya tautan kontrol yang bisa mengubah permainan. Siapa pun yang memilikinya dapat mengendalikan game, jadi kirim hanya kepada pemandu. Tautan penonton tidak dapat mengubah skor. Mode ini memerlukan internet di kedua perangkat.')}</p></div>
      <section className="org-checklist"><h2>{translate('Before starting','Sebelum memulai')}</h2>{prep.map(item=><label key={item.key}><input type="checkbox" checked={checked[item.key]} onChange={e=>setChecked({...checked,[item.key]:e.target.checked})}/>{item.label}</label>)}</section>
      <p className="org-hint">{translate('Leave the audience screen open. The presenter controls match progress remotely; the screen reconnects after brief interruptions. Do not use the local-game host in this session.','Biarkan layar penonton terbuka. Pemandu mengontrol permainan dari jauh; layar akan mencoba tersambung kembali jika koneksi putus. Jangan gunakan kontrol permainan lokal untuk sesi ini.')}</p>
    </>:<>
      <div className="org-eyebrow"><Gamepad2 size={16}/> {translate('GAME ORGANIZER','PENYELENGGARA PERMAINAN')}</div>
      <h1>{translate('Choose your event setup.','Pilih susunan perangkat permainan.')}</h1>
      <p className="org-lead">{translate('Both supported formats work with Survey Showdown and Quickfire Quiz. Pick a mode, then prepare teams and questions.','Kedua mode mendukung Survey Showdown dan Quickfire Quiz. Pilih mode, lalu siapkan tim dan pertanyaan.')}</p>
      <div className="org-mode-grid">
       <section className="org-device-card"><div className="org-card-head"><MonitorPlay size={25}/><span>MODE A</span></div><h2>{translate('One laptop + projector','Satu laptop + proyektor')}</h2><p>{translate('The MC uses the laptop. Open the projector screen in another window and move it to the external display. Works offline after the app is cached.','Pemandu menggunakan laptop. Buka layar proyektor di jendela lain dan pindahkan ke tampilan eksternal. Dapat bekerja offline setelah aplikasi tersimpan.')}</p>{games.map(g=><a key={g.slug} className="org-game-link" href={'?page=dashboard&tab=setup&format='+g.slug+'&devices=local'}>{g.icon} {g.title} <ArrowRight size={17}/></a>)}</section>
       <section className="org-device-card"><div className="org-card-head"><Smartphone size={25}/><span>MODE B</span></div><h2>{translate('Display laptop + separate controller','Laptop tampilan + pengontrol terpisah')}</h2><p>{translate('The laptop drives the projector. The MC controls questions and scores from a second phone, tablet or laptop using a private pairing link. Both devices need internet.','Laptop menayangkan proyektor. Pemandu mengontrol pertanyaan dan skor dari perangkat kedua menggunakan tautan pribadi. Keduanya memerlukan internet.')}</p>{games.map(g=><a key={g.slug} className="org-game-link" href={'?page=dashboard&tab=setup&format='+g.slug+'&devices=remote'}>{g.icon} {g.title} <ArrowRight size={17}/></a>)}</section>
      </div>
      <div className="org-security"><ShieldCheck size={20}/><p>{translate('No participant accounts required. The organizer keeps control of game progress in either mode. Remote rooms expire after 12 hours.','Tidak perlu akun peserta. Penyelenggara tetap mengontrol alur permainan dalam kedua mode. Sesi jarak jauh berakhir setelah 12 jam.')}</p></div>
    </>}
    <a className="org-back" href="./"><ArrowLeft size={16}/>{translate('Back to game catalog','Kembali ke katalog game')}</a>
  </main>
 </div>;
}
