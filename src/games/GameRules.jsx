import React from 'react';
import {BookOpen,ChevronDown,ShieldCheck} from 'lucide-react';
import './game-rules.css';

/** Official PlayLab rules reflect implemented mechanics, not proposed settings.
 * House rules are suggestions for an MC, not software-enforced constraints. */
export const GAME_RULES={
  survey:{
    title:'Survey Showdown',
    tagline:'Guess the most popular answers, build the bank, and win the round.',
    label:'Survey-style guessing · 2 teams',
    steps:[
      'The host reads a prompt and accepts spoken guesses from the teams.',
      'When a guess matches a listed answer, the host reveals it. Each revealed answer adds its displayed points × that round’s multiplier (1×, 2× or 3×) to the bank.',
      'For wrong guesses, the host adds a strike (X). Three strikes trigger a steal-opportunity indicator; the host decides how to handle the opposing team’s attempt.',
      'The host explicitly awards the bank to one team. At least one answer must be revealed before points can be awarded. Scores are never awarded automatically.',
      'Continue through the rounds, then choose Finish match to display the final scores. The highest-scoring team wins; equal scores produce a tie.'
    ],
    controls:'Keyboard: 1–8 reveal answers · X add strike · Z undo strike. You may undo a round award or correct the scoreboard before finishing.',
    scoring:'Round bank = sum of revealed answer points × round multiplier. Awarding transfers the current bank to exactly one team.',
    caveat:'All bundled answer rankings and points are fictional game examples—not results from a real survey. Replace them if your event requires collected survey data.',
    optional:'Optional MC house rule: alternate which team guesses first each round. PlayLab does not enforce turns, a timer, or a particular steal decision.'
  },
  quickfire:{
    title:'Quickfire Quiz',
    tagline:'Reveal the correct choice, award points, and move to the next question.',
    label:'Multiple-choice trivia · 2 teams',
    steps:[
      'The host displays a question with four choices: A, B, C and D.',
      'Give teams a chance to discuss or answer aloud. The host chooses when to reveal the correct answer and any explanation.',
      'The host manually awards +10 to a team for a correct response. A −10 correction and one-step Undo are available. No automatic correctness checking or scoring occurs.',
      'Move to the next question. The host can navigate backward and adjust scores; PlayLab does not enforce a timer, buzzer, or one award per question.',
      'Choose Finish match to show the final scoreboard. The highest-scoring team wins; equal scores produce a tie.'
    ],
    controls:'Keyboard: R reveal/hide · N next · P previous · U undo the last score change. Typing in input fields disables shortcuts.',
    scoring:'Current default: +10 points per manual award; −10 corrections stop at zero. A question reveal does not award any points.',
    caveat:'The bundled trivia sets use objective answers and explanations; the MC should adapt the difficulty to participants.',
    optional:'Optional MC house rule: allow 15–30 seconds to answer and award +10 only once per question. Time limits and single-award restrictions are not enforced.'
  }
};
export function GameRules({game,open=false}){
  const rule=GAME_RULES[game];if(!rule)return null;
  return <details className={'playlab-rules playlab-rules--'+game} open={open||undefined}>
    <summary><span className="playlab-rules-label"><BookOpen size={19} aria-hidden="true"/><span><strong>{rule.title}: how to play</strong><small>{rule.label}</small></span></span><ChevronDown size={19} aria-hidden="true"/></summary>
    <div className="playlab-rules-body">
      <p className="playlab-rules-tagline">{rule.tagline}</p>
      <ol>{rule.steps.map((item,i)=><li key={i}>{item}</li>)}</ol>
      <div className="playlab-rules-facts"><p><strong>Scoring:</strong> {rule.scoring}</p><p><strong>Host controls:</strong> {rule.controls}</p></div>
      <p className="playlab-rules-notice"><ShieldCheck size={17} aria-hidden="true"/>{rule.caveat}</p>
      <p className="playlab-rules-optional"><strong>Optional house rule (not enforced):</strong> {rule.optional.replace(/^Optional MC house rule:\s*/,'')}</p>
    </div>
  </details>;
}
