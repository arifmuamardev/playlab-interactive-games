import React from 'react';
import {Sparkles} from 'lucide-react';
import './host-action-bar.css';

/** Contextual actions for a live presenter. This component never owns game state:
 * every action delegates to the existing validated game handlers. */
export function HostActionBar({eyebrow,title,description,children,footnote}){
  return <section className="host-action-bar" aria-label="Live host controls">
    <div className="host-action-copy">
      <span className="host-action-kicker"><Sparkles size={16} aria-hidden="true"/> {eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    <div className="host-action-buttons">{children}</div>
    {footnote&&<p className="host-action-footnote">{footnote}</p>}
  </section>;
}
export function HostActionButton({onClick,children,primary=false,muted=false,disabled=false,title}){
  return <button type="button" className={'host-action-btn'+(primary?' host-action-btn--primary':'')+(muted?' host-action-btn--muted':'')} onClick={onClick} disabled={disabled} title={title}>
    {children}
  </button>;
}
