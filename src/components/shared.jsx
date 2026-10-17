import React from 'react';
import {Trophy} from 'lucide-react';
export function PlayLabBrand({onDark=false}) {return <div className={'brand '+(onDark?'brand--dark':'')}><div className="brand-mark">P<span>✦</span></div><div><strong>PLAYLAB</strong><small>GAMES FOR EVERY GATHERING</small></div></div>}
export function RoundPill({current,total,multiplier}){return <div className="round-pill">RONDE <b>{String(current+1).padStart(2,'0')}</b> <span>/ {String(total).padStart(2,'0')}</span><i>·</i> <strong>{multiplier}× POIN</strong></div>}
export function ControlCard({title,description,children,extra}){return <section className="control-card"><div className="card-head"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div>{extra}</div>{children}</section>}
export function IconButton({icon:Icon,children,onClick,disabled=false,title='',variant=''}){return <button type="button" title={title} disabled={disabled} onClick={onClick} className={'btn '+variant}><Icon size={17}/>{children&&<span>{children}</span>}</button>}
