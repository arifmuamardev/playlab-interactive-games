import {test,expect} from '@playwright/test';

async function soundHarness(context){
  await context.addInitScript(()=>{
    window.__oscillatorStarts=0;
    class FakeAudioContext{
      state='suspended';currentTime=0;destination={};
      createOscillator(){
        return {type:'sine',frequency:{setValueAtTime(){}},connect(){},start(){window.__oscillatorStarts++;},stop(){}};
      }
      createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
      async resume(){this.state='running';}
      async close(){this.state='closed';}
    }
    window.AudioContext=FakeAudioContext;
    window.webkitAudioContext=FakeAudioContext;
  });
}
async function projector(host,name){
  const pending=host.waitForEvent('popup');
  await host.getByRole('button',{name}).click();
  return pending;
}
test('Survey audience stage: opt-in audio, animated reveals, celebratory award and no replay on refresh',async({context})=>{
  await soundHarness(context);
  const host=await context.newPage();await host.goto('?game=survey');
  const screen=await projector(host,/Open projector view/);
  await expect(screen.locator('.stage--full')).toBeVisible();
  const sound=screen.getByRole('button',{name:'Enable projector sounds'});
  await expect(sound).toHaveAttribute('aria-pressed','false');
  await host.locator('.reveal-button').first().click();
  await expect(screen.locator('.stage-answer.is-revealed')).toHaveCount(1);
  expect(await screen.evaluate(()=>window.__oscillatorStarts)).toBe(0);
  await sound.click();
  await expect(screen.getByRole('button',{name:'Mute projector sounds'})).toHaveAttribute('aria-pressed','true');
  const afterEnable=await screen.evaluate(()=>window.__oscillatorStarts);
  expect(afterEnable).toBeGreaterThan(0);
  await host.locator('.reveal-button').nth(1).click();
  await expect(screen.locator('.stage-answer.is-revealed')).toHaveCount(2);
  await expect.poll(()=>screen.evaluate(()=>window.__oscillatorStarts)).toBeGreaterThan(afterEnable);
  const animation=await screen.locator('.stage-answer.is-revealed').last().evaluate(el=>getComputedStyle(el).animationName);
  expect(animation).toContain('pf-card-flip');
  await host.locator('.award-btn--0').click();
  await expect(screen.locator('.award-overlay')).toBeVisible();
  await expect(screen.locator('.award-overlay .projector-confetti i')).toHaveCount(14);
  await expect(screen.locator('.team-score--0 .team-number')).toHaveText('58');
  await screen.reload();
  await expect(screen.locator('.award-overlay')).toHaveCount(0);
  await expect(screen.getByRole('button',{name:'Enable projector sounds'})).toHaveAttribute('aria-pressed','false');
  await expect(screen.locator('.team-score--0 .team-number')).toHaveText('58');
  await expect(screen.locator('.stage-answer.is-revealed')).toHaveCount(2);
});
test('Quickfire audience stage: sound is off by default, reveals animate, scores celebrate once',async({context})=>{
  await soundHarness(context);
  const host=await context.newPage();await host.goto('?game=quickfire');
  const screen=await projector(host,/Open projector/);
  await expect(screen.locator('.quick-board:not(.quick-board--preview)')).toBeVisible();
  await expect(screen.getByRole('button',{name:'Enable projector sounds'})).toHaveAttribute('aria-pressed','false');
  await host.getByRole('button',{name:'Reveal correct answer'}).click();
  await expect(screen.locator('.quick-option.correct')).toHaveCount(1);
  expect(await screen.evaluate(()=>window.__oscillatorStarts)).toBe(0);
  await screen.getByRole('button',{name:'Enable projector sounds'}).click();
  const enabledCount=await screen.evaluate(()=>window.__oscillatorStarts);
  await host.getByRole('button',{name:'Next'}).click();
  await expect(screen.locator('.quick-counter')).toContainText('02');
  await expect.poll(()=>screen.evaluate(()=>window.__oscillatorStarts)).toBeGreaterThan(enabledCount);
  await host.getByRole('button',{name:'Reveal correct answer'}).click();
  await expect(screen.locator('.quick-option.correct')).toHaveCount(1);
  const revealAnimation=await screen.locator('.quick-option.correct').evaluate(el=>getComputedStyle(el).animationName);
  expect(revealAnimation).toContain('pf-correct-reveal');
  await host.getByRole('button',{name:'Add ten points to team 1'}).click();
  await expect(screen.locator('.quick-score-celebration')).toBeVisible();
  await expect(screen.locator('.quick-score-celebration')).toContainText('Team A');
  await expect(screen.locator('.quick-score-celebration')).toContainText('+10');
  await expect(screen.locator('.projector-confetti i')).toHaveCount(14);
  await expect(screen.locator('.quick-score-celebration')).toHaveCount(0,{timeout:6000});
  await expect(screen.locator('.quick-scores > div').first().locator('strong')).toHaveText('10');
  await screen.reload();
  await expect(screen.locator('.quick-score-celebration')).toHaveCount(0);
  await expect(screen.getByRole('button',{name:'Enable projector sounds'})).toBeVisible();
  await expect(screen.locator('.quick-scores > div').first().locator('strong')).toHaveText('10');
});
test('Reduced-motion preference disables projector animations but preserves gameplay',async({context})=>{
  await context.addInitScript(()=>{});
  const host=await context.newPage();
  const screen=await context.newPage();
  await screen.emulateMedia({reducedMotion:'reduce'});
  await host.goto('?game=quickfire');
  await screen.goto('?game=quickfire&view=display');
  await host.getByRole('button',{name:'Reveal correct answer'}).click();
  await expect(screen.locator('.quick-option.correct')).toHaveCount(1);
  const animation=await screen.locator('.quick-option.correct').evaluate(el=>getComputedStyle(el).animationName);
  expect(animation).toBe('none');
  await host.getByRole('button',{name:'Add ten points to team 1'}).click();
  await expect(screen.locator('.quick-scores > div').first().locator('strong')).toHaveText('10');
  await expect(screen.locator('.projector-confetti')).toHaveCSS('display','none');
});
test('Host previews stay compact and audio controls appear only on audience displays',async({page})=>{
  for(const game of ['survey','quickfire']){
    await page.goto('?game='+game);
    await expect(page.locator(game==='survey'?'.stage--preview':'.quick-board--preview')).toBeVisible();
    await expect(page.getByRole('button',{name:'Enable projector sounds'})).toHaveCount(0);
  }
});
