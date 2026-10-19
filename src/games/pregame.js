/**
 * The event introduction is an optional persisted phase on configured matches.
 * Legacy one-click demo sessions omit "presentation" and continue directly
 * into gameplay, preserving existing saved-match behavior.
 */
export const PRE_GAME_STEPS=['welcome','teams','rules','playing'];
export function presentationStep(game){
 return PRE_GAME_STEPS.includes(game?.presentation)?game.presentation:'playing';
}
export function navigatePresentation(game,step){
 if(game?.finished||!PRE_GAME_STEPS.includes(step))return game;
 const current=presentationStep(game);
 if(current===step)return game;
 // New introductions never reset team names, answers, progress or scores.
 return {...game,presentation:step};
}
export function resetPresentation(game){
 return {...game,presentation:game.presentation===undefined?undefined:'welcome'};
}
export function presentationCanStart(game){
 if(!game||game.finished||!Array.isArray(game.questions)||game.questions.length===0)return false;
 return presentationStep(game)==='rules';
}
