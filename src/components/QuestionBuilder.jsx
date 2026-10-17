import React,{useState} from 'react';
import {Plus,Save,ShieldAlert,X} from 'lucide-react';

/** Shared editor primitives. Question rules and their fields remain game-specific. */
export function useQuestionDraft(questions){
  const [items,setItems]=useState(()=>structuredClone(questions));
  const [selected,setSelected]=useState(0);
  const [error,setError]=useState('');
  const mutate=fn=>setItems(previous=>{
    const next=structuredClone(previous);
    fn(next);
    return next;
  });
  return {items,setItems,selected,setSelected,error,setError,mutate};
}

export function QuestionBuilder({label,title,description,eyebrow,items,selected,onSelect,onAdd,
  addLabel='Add question',maxItems=60,kindLabel='QUESTION',itemBadge=()=>'',className='',
  error,saveNote,onSave,onClose,closeLabel='Close',children}){
  return <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div role="dialog" aria-modal="true" aria-label={label} className={'modal shared-question-builder '+className}>
      <div className="modal-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>
        <button type="button" className="square-btn" onClick={onClose} aria-label={closeLabel}><X size={19}/></button></div>
      <div className="editor-layout">
        <nav className="editor-list" aria-label="Question list">
          {items.map((item,i)=><button type="button" key={item.id||i} className={'editor-list-item '+(selected===i?'current':'')} aria-current={selected===i?'true':undefined} onClick={()=>onSelect(i)}>
            <small>{kindLabel} {String(i+1).padStart(2,'0')}</small><span>{item.question||'Untitled question'}</span><i>{itemBadge(item,i)}</i>
          </button>)}
          <button type="button" className="add-round" disabled={items.length>=maxItems} onClick={onAdd}><Plus size={17}/> {addLabel}</button>
        </nav>
        <div className="editor-form">{children}</div>
      </div>
      {error&&<div role="alert" className="form-error"><ShieldAlert size={17}/>{error}</div>}
      <div className="modal-footer"><div className="builder-save-note"><ShieldAlert size={16}/><span>{saveNote}</span></div><div>
        <button type="button" className="btn btn-soft" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={onSave}><Save size={17}/> Save questions</button>
      </div></div>
    </div>
  </div>;
}
