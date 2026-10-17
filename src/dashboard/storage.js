import {STORAGE_KEY,makeInitialState,normalizeQuestions,getScores} from '../data.js';
import {QUICKFIRE_KEY,quickfireInitial,normalizeQuickfireQuestions} from '../games/quickfire/data.js';

export const LIBRARY_KEY='playlab-content-packs-v1';
export const PACK_SCHEMA='playlab.question-pack';
export const PACK_LIMIT=40;
const GAME_KEYS={survey:STORAGE_KEY,quickfire:QUICKFIRE_KEY};

export function gameTitle(game){return game==='survey'?'Survey Showdown':game==='quickfire'?'Quickfire Quiz':'Unknown game';}
export function validatePackQuestions(game,questions){
  if(game==='survey')return normalizeQuestions(questions);
  if(game==='quickfire')return normalizeQuickfireQuestions(questions);
  throw Error('Unsupported game format.');
}
export function normalizePack(input){
  if(!input||input.schema!==PACK_SCHEMA||input.version!==1)throw Error('Unsupported pack schema or version. Import a PlayLab question pack.');
  const game=input.game;
  const name=String(input.name||'').trim();
  if(!name||name.length>70)throw Error('Pack name must contain 1–70 characters.');
  const questions=validatePackQuestions(game,input.questions);
  return {schema:PACK_SCHEMA,version:1,id:String(input.id||'').slice(0,80),game,name,questions,
    createdAt:typeof input.createdAt==='string'&&Number.isFinite(Date.parse(input.createdAt))?input.createdAt:new Date().toISOString()};
}
export function createPack(game,name,questions){
  const pack=normalizePack({schema:PACK_SCHEMA,version:1,game,name,questions,createdAt:new Date().toISOString()});
  return {...pack,id:globalThis.crypto?.randomUUID?.()||('pack-'+Date.now()+'-'+Math.random().toString(36).slice(2))};
}
export function readPackLibrary(storage=localStorage){
  let raw;
  try{raw=storage.getItem(LIBRARY_KEY);if(!raw)return [];
    const data=JSON.parse(raw);
    if(data?.version!==1||!Array.isArray(data.packs))throw Error('Incompatible library version.');
    if(data.packs.length>PACK_LIMIT)throw Error('Too many packs in saved library.');
    return data.packs.map(normalizePack);
  }catch(error){throw Error('Saved question library could not be read. Export a backup from an earlier version if available. '+error.message);}
}
export function writePackLibrary(packs,storage=localStorage){
  if(!Array.isArray(packs)||packs.length>PACK_LIMIT)throw Error('Question library limit reached (40 packs).');
  if(new Set(packs.map(p=>p.id)).size!==packs.length)throw Error('Duplicate pack identifier.');
  const clean=packs.map(normalizePack);
  storage.setItem(LIBRARY_KEY,JSON.stringify({version:1,packs:clean}));
  return clean;
}
export function readGameSession(game,storage=localStorage){
  const key=GAME_KEYS[game];
  if(!key)return null;
  const raw=storage.getItem(key);
  if(!raw)return null;
  try{
    const saved=JSON.parse(raw);
    if(saved?.version!==1)return null;
    const questions=validatePackQuestions(game,saved.questions);
    const index=game==='survey'?saved.roundIndex:saved.questionIndex;
    if(!Number.isInteger(index)||index<0||index>=questions.length)return null;
    const names=Array.isArray(saved.teamNames)&&saved.teamNames.length===2?saved.teamNames.map(x=>String(x).slice(0,45)):['Team A','Team B'];
    const score=game==='survey'?getScores({...saved,questions}):saved.scores;
    if(!Array.isArray(score)||score.length!==2||score.some(v=>!Number.isFinite(v)||v<0))return null;
    return {game,key,questions,position:index+1,teams:names,scores:score,rawState:saved};
  }catch{return null;}
}
export function resetGameSession(game,storage=localStorage){
  const previous=readGameSession(game,storage);
  if(game==='survey'){
    const initial=makeInitialState();
    const state=previous?{...initial,questions:previous.questions,teamNames:previous.teams}:initial;
    storage.setItem(STORAGE_KEY,JSON.stringify(state));return state;
  }
  if(game==='quickfire'){
    const initial=quickfireInitial();
    const state=previous?{...initial,questions:previous.questions,teamNames:previous.teams}:initial;
    storage.setItem(QUICKFIRE_KEY,JSON.stringify(state));return state;
  }
  throw Error('Unsupported game.');
}
export function applyPackToSession(pack,storage=localStorage){
  const clean=normalizePack(pack);
  const previous=readGameSession(clean.game,storage);
  const state=clean.game==='survey'?{
    ...makeInitialState(),questions:clean.questions,teamNames:previous?.teams||makeInitialState().teamNames
  }: {...quickfireInitial(),questions:clean.questions,teamNames:previous?.teams||quickfireInitial().teamNames};
  storage.setItem(GAME_KEYS[clean.game],JSON.stringify(state));
  return state;
}
