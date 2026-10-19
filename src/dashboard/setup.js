import {STORAGE_KEY,makeInitialState,normalizeQuestions} from '../data.js';
import {QUICKFIRE_KEY,quickfireInitial,normalizeQuickfireQuestions} from '../games/quickfire/data.js';
import {readGameSession,readPackLibrary,normalizePack} from './storage.js';
import {findStarterTemplate} from './starterTemplates.js';
import {REHEARSAL_KEYS} from '../core/rehearsal.js';

const GAME_KEYS={survey:STORAGE_KEY,quickfire:QUICKFIRE_KEY};

/** Prepares a new match without changing the current match or saved question packs.
 * Call writeConfiguredMatch only after the user has reviewed and confirmed.
 */
export function buildConfiguredMatch(config,storage=localStorage){
  const {game,source,packId,templateId,teamNames}=config||{};
  if(!Object.hasOwn(GAME_KEYS,game))throw Error('Choose a supported game.');
  if(!Array.isArray(teamNames)||teamNames.length!==2)throw Error('Enter two team names.');
  const names=teamNames.map(name=>typeof name==='string'?name.trim():'');
  if(names.some(name=>!name||name.length>45))throw Error('Each team name must contain 1–45 characters.');
  if(names[0].toLocaleLowerCase()===names[1].toLocaleLowerCase())throw Error('Use different names for the two teams.');
  let questions;
  if(source==='demo'){
    questions=game==='survey'?makeInitialState().questions:quickfireInitial().questions;
  }else if(source==='current'){
    const saved=readGameSession(game,storage);
    if(!saved)throw Error('No compatible saved match exists for this game.');
    questions=saved.questions;
  }else if(source==='starter'){
    questions=findStarterTemplate(game,templateId).questions;
  }else if(source==='pack'){
    const pack=readPackLibrary(storage).find(item=>item.id===packId);
    if(!pack)throw Error('This saved question pack was not found.');
    const clean=normalizePack(pack);
    if(clean.game!==game)throw Error('The chosen question pack belongs to another game.');
    questions=clean.questions;
  }else throw Error('Choose a question source.');
  const cleanQuestions=game==='survey'?normalizeQuestions(questions):normalizeQuickfireQuestions(questions);
  const initial=game==='survey'?makeInitialState():quickfireInitial();
  return {...initial,questions:cleanQuestions,teamNames:names,presentation:'welcome'};
}
export function writeConfiguredMatch(config,storage=localStorage){
  const result=buildConfiguredMatch(config,storage);
  storage.setItem(GAME_KEYS[config.game],JSON.stringify(result));
  return result;
}
export function hasStoredMatch(game,storage=localStorage){
  if(!Object.hasOwn(GAME_KEYS,game))return false;
  return storage.getItem(GAME_KEYS[game])!==null;
}

/** Rehearsal writes exclusively to a different session key; live scores and packs stay intact. */
export function writeRehearsalMatch(config,storage=localStorage){
  const state=buildConfiguredMatch(config,storage);
  storage.setItem(REHEARSAL_KEYS[config.game],JSON.stringify(state));
  return state;
}
