import React,{useState} from 'react';
import {Trash2,FileUp} from 'lucide-react';
import {QuestionBuilder,useQuestionDraft} from '../../components/QuestionBuilder.jsx';
import {normalizeQuickfireQuestions} from './data.js';

/** Local-first question builder for Quickfire.
 * Draft edits never modify the live session until an explicit save/confirmation.
 */
export function QuickfireQuestionEditor({questions,onSave,onClose,saveNote='Saving replaces the live question bank and resets the match after confirmation.'}){
  const {items,setItems,selected,setSelected,error,setError,mutate}=useQuestionDraft(questions);
  const [jsonInput,setJsonInput]=useState('');
  const q=items[selected];
  const update=mutate;
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
  return <QuestionBuilder
    label="Edit trivia questions" title="Edit trivia questions" eyebrow="QUESTION BUILDER · QUICKFIRE"
    description="Edit questions visually, select the correct answer and save the complete bank."
    items={items} selected={selected} onSelect={i=>{setSelected(i);setError('');}}
    onAdd={addQuestion} itemBadge={item=>'ABCD'[item.answer]||'A'} maxItems={60}
    className="quick-editor quick-builder" error={error}
    saveNote={saveNote}
    closeLabel="Close question editor" onSave={save} onClose={onClose}>
    <label htmlFor="quick-builder-question">QUESTION TEXT</label>
    <textarea id="quick-builder-question" rows={3} maxLength={250} value={q.question} placeholder="Enter a question..." onChange={e=>update(d=>{d[selected].question=e.target.value;})}/>
    <div className="builder-choice-heading">ANSWER OPTIONS <span>Choose the correct answer</span></div>
    <div className="builder-choices">
      {q.options.map((option,i)=><div className="builder-choice" key={i}>
        <input type="radio" name="correct-option" aria-label={'Correct answer '+'ABCD'[i]} checked={q.answer===i} onChange={()=>update(d=>{d[selected].answer=i;})}/>
        <label htmlFor={'builder-choice-'+i}>{'ABCD'[i]}</label>
        <input id={'builder-choice-'+i} type="text" maxLength={110} value={option} placeholder={'Option '+'ABCD'[i]} onChange={e=>update(d=>{d[selected].options[i]=e.target.value;})}/>
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
  </QuestionBuilder>;
}
