import React,{useState} from 'react';
import {Plus,Trash2,Save,X,FileUp,ShieldAlert} from 'lucide-react';
import {normalizeQuickfireQuestions} from './data.js';

/** Local-first question builder for Quickfire.
 * Draft edits never modify the live session until an explicit save/confirmation.
 */
export function QuickfireQuestionEditor({questions,onSave,onClose}){
  const [items,setItems]=useState(()=>structuredClone(questions));
  const [selected,setSelected]=useState(0);
  const [error,setError]=useState('');
  const [jsonInput,setJsonInput]=useState('');
  const q=items[selected];
  const update=(mutator)=>setItems(previous=>{
    const next=structuredClone(previous);
    mutator(next);
    return next;
  });
  function addQuestion(){
    const id='draft-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
    setItems(previous=>[...previous,{id,question:'',options:['','','',''],answer:0,explanation:''}]);
    setSelected(items.length);
    setError('');
  }
  function deleteQuestion(){
    if(items.length===1){setError('Keep at least one question.');return;}
    if(!window.confirm('Delete this question from your unsaved draft?'))return;
    setItems(previous=>previous.filter((_,i)=>i!==selected));
    setSelected(Math.max(0,selected-1));
    setError('');
  }
  function loadJson(){
    try{
      const parsed=normalizeQuickfireQuestions(JSON.parse(jsonInput));
      setItems(parsed);
      setSelected(0);
      setError('');
      setJsonInput('');
    }catch(err){setError('Could not load JSON: '+err.message);}
  }
  function save(){
    try{const clean=normalizeQuickfireQuestions(items);setError('');onSave(clean);}
    catch(err){setError(err.message);}
  }
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div role="dialog" aria-modal="true" aria-label="Edit trivia questions" className="modal quick-editor quick-builder">
      <div className="modal-head">
        <div><span className="eyebrow">QUESTION BUILDER · QUICKFIRE</span><h2>Edit trivia questions</h2><p>Edit questions visually, select the correct answer and save the complete bank.</p></div>
        <button type="button" className="square-btn" aria-label="Close question editor" onClick={onClose}><X size={19}/></button>
      </div>
      <div className="editor-layout">
        <nav className="editor-list" aria-label="Question list">
          {items.map((item,i)=><button type="button" key={item.id} className={'editor-list-item '+(selected===i?'current':'')} aria-current={selected===i?'true':undefined} onClick={()=>{setSelected(i);setError('');}}>
            <small>QUESTION {String(i+1).padStart(2,'0')}</small><span>{item.question||'Untitled question'}</span><i>{'ABCD'[item.answer]||'A'}</i>
          </button>)}
          <button type="button" className="add-round" onClick={addQuestion} disabled={items.length>=60}><Plus size={17}/> Add question</button>
        </nav>
        <div className="editor-form">
          <label htmlFor="quick-builder-question">QUESTION TEXT</label>
          <textarea id="quick-builder-question" rows={3} maxLength={250} value={q.question} placeholder="Enter a question..." onChange={e=>update(d=>{d[selected].question=e.target.value;})}/>
          <div className="builder-choice-heading">ANSWER OPTIONS <span>Choose the correct answer</span></div>
          <div className="builder-choices">
            {q.options.map((option,i)=><div className="builder-choice" key={i}>
              <input type="radio" name="correct-option" aria-label={'Correct answer '+ 'ABCD'[i]} checked={q.answer===i} onChange={()=>update(d=>{d[selected].answer=i;})}/>
              <label htmlFor={'builder-choice-'+i}>{'ABCD'[i]}</label>
              <input id={'builder-choice-'+i} type="text" maxLength={110} value={option} placeholder={'Option '+ 'ABCD'[i]} onChange={e=>update(d=>{d[selected].options[i]=e.target.value;})}/>
            </div>)}
          </div>
          <label htmlFor="quick-builder-explanation">EXPLANATION (OPTIONAL)</label>
          <textarea id="quick-builder-explanation" rows={3} maxLength={250} value={q.explanation||''} placeholder="Explain why the answer is correct..." onChange={e=>update(d=>{d[selected].explanation=e.target.value;})}/>
          <div className="builder-form-bottom">
            <button type="button" className="btn btn-delete" onClick={deleteQuestion} disabled={items.length===1}><Trash2 size={16}/> Delete question</button>
            <span>{items.length} / 60 questions</span>
          </div>
          <details className="builder-json-import">
            <summary><FileUp size={16}/> Import questions from JSON (advanced)</summary>
            <label htmlFor="quick-builder-json">Paste a JSON array or an object containing a questions array</label>
            <textarea id="quick-builder-json" rows={5} spellCheck={false} value={jsonInput} onChange={e=>setJsonInput(e.target.value)} placeholder='{"questions":[{"question":"...","options":["A","B","C","D"],"answer":0}]}'/>
            <button type="button" className="btn btn-tool" onClick={loadJson} disabled={!jsonInput.trim()}>Load JSON into draft</button>
          </details>
        </div>
      </div>
      {error&&<div role="alert" className="form-error"><ShieldAlert size={17}/>{error}</div>}
      <div className="modal-footer"><span>Saving replaces the live question bank and resets the match after confirmation.</span><div>
        <button type="button" className="btn btn-soft" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={save}><Save size={17}/> Save questions</button>
      </div></div>
    </div>
  </div>;
}
