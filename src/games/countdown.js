/** Optional live-show countdown: a display aid, never a rule or automatic score action.
 * Deadline timestamps keep host/projector views consistent after refresh or backgrounding.
 * Old sessions without countdown remain compatible. */
export const COUNTDOWN_PRESETS=[15,30,60,90];

export function countdownFor(game,contextId){
  const timer=game?.countdown;
  return timer && contextId && timer.contextId===contextId ? timer : null;
}

export function secondsRemaining(timer,now=Date.now()){
  if(!timer)return null;
  const remaining=timer.running?timer.deadlineAt-now:timer.remainingMs;
  return Math.ceil(Math.max(0,Number.isFinite(remaining)?remaining:0)/1000);
}

export function formatCountdown(seconds){
  if(seconds===null)return '';
  return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
}

export function startCountdown(game,contextId,seconds,now=Date.now()){
  if(typeof contextId!=='string'||!contextId||!COUNTDOWN_PRESETS.includes(seconds))throw Error('Invalid countdown preset or question.');
  const remainingMs=seconds*1000;
  return {...game,countdown:{contextId,durationSeconds:seconds,remainingMs,deadlineAt:now+remainingMs,running:true}};
}

export function pauseCountdown(game,contextId,now=Date.now()){
  const timer=countdownFor(game,contextId);
  if(!timer?.running)return game;
  return {...game,countdown:{...timer,running:false,remainingMs:Math.max(0,timer.deadlineAt-now)}};
}

export function resumeCountdown(game,contextId,now=Date.now()){
  const timer=countdownFor(game,contextId);
  if(!timer||timer.running||timer.remainingMs<=0)return game;
  return {...game,countdown:{...timer,running:true,deadlineAt:now+timer.remainingMs}};
}

export function clearCountdown(game){
  return game.countdown==null?game:{...game,countdown:null};
}
