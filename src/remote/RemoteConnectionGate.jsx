import React from 'react';
import {ShieldAlert,Wifi,WifiOff} from 'lucide-react';
import {useLanguage} from '../i18n/language.jsx';
import './connection.css';

/** Never show offline sample content in place of an unavailable paired room. */
export function RemoteConnectionGate({connection,host=false,children}){
 const {lang}=useLanguage();
 if(!connection)return children;
 const writable=connection.role==='controller';
 if(connection.state!=='connected'||(host&&!writable)){
  const unauthorized=host&&connection.state==='connected'&&!writable;
  return <main className="playlab-remote-unavailable" role="status">
   {unauthorized?<ShieldAlert size={40}/>:<WifiOff size={40}/>}
   <h1>{lang==='id'?(unauthorized?'Tautan hanya untuk tampilan':connection.state==='invalid'?'Tautan tidak valid':'Menyambungkan sesi permainan…'):(unauthorized?'This is a view-only link':connection.state==='invalid'?'Invalid pairing link':'Connecting to live session…')}</h1>
   <p>{unauthorized?(lang==='id'?'Buka tautan pengontrol pribadi dari penyelenggara.':'Ask the organizer for the private controller link.'):connection.error|| (lang==='id'?'Memeriksa sambungan langsung. Kedua perangkat memerlukan internet.':'Waiting for the live room. Both devices need internet access.')}</p>
   <a href="?page=organizer">{lang==='id'?'Kembali ke penyelenggara':'Back to organizer'}</a>
  </main>;
 }
 return <>{host&&<div className="playlab-remote-connected" role="status"><Wifi size={13}/>{lang==='id'?'Pengontrol terhubung':'Controller online'} <span aria-hidden="true">●</span></div>}{children}</>;
}
