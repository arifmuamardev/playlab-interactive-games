import {test,expect} from '@playwright/test';

async function showProjector(host,name){
  const popup=host.waitForEvent('popup');
  await host.getByRole('button',{name}).click();
  const audience=await popup;
  await audience.waitForLoadState('domcontentloaded');
  return audience;
}

test('Quickfire: host countdown syncs to projector, survives refresh and clears on answer reveal',async({context})=>{
  const host=await context.newPage();
  await host.goto('?game=quickfire');
  const audience=await showProjector(host,/Open projector/i);
  const stageTimer=audience.locator('.quick-head .playlab-countdown-badge');
  await expect(stageTimer).toHaveCount(0);
  await host.getByRole('button',{name:'Start 30 second countdown'}).click();
  await expect(stageTimer).toContainText('TIME LEFT');
  await expect(host.locator('.playlab-countdown-status')).toContainText('Running');
  await host.getByRole('button',{name:'Pause countdown'}).click();
  await expect(stageTimer).toContainText('PAUSED');
  const timeBefore=await stageTimer.locator('strong').textContent();
  await audience.reload();
  await expect(stageTimer).toContainText('PAUSED');
  await expect(stageTimer.locator('strong')).toHaveText(timeBefore);
  await host.reload();
  await expect(host.getByRole('button',{name:'Resume countdown'})).toBeVisible();
  await host.getByRole('button',{name:'Resume countdown'}).click();
  await expect(stageTimer).toContainText('TIME LEFT');
  await host.getByRole('button',{name:'Reveal correct answer'}).click();
  await expect(stageTimer).toHaveCount(0);
  await expect(audience.locator('.quick-option.correct')).toHaveCount(1);
  await expect(audience.locator('.quick-scores strong')).toHaveText(['0','0']);
  await host.getByRole('button',{name:'Start 15 second countdown'}).click();
  await expect(stageTimer).toBeVisible();
  await host.locator('.quick-nav').getByRole('button',{name:/Next/}).click();
  await expect(stageTimer).toHaveCount(0);
  await audience.close();
  await host.close();
});

test('Survey: optional timer follows current round and never changes score or strikes',async({context})=>{
  const host=await context.newPage();
  await host.goto('?game=survey');
  const audience=await showProjector(host,/Open projector view/i);
  const stageTimer=audience.locator('.stage-question .playlab-countdown-badge');
  await expect(stageTimer).toHaveCount(0);
  await host.getByRole('button',{name:'Start 15 second countdown'}).click();
  await expect(stageTimer).toContainText('TIME LEFT');
  await host.getByRole('button',{name:'Clear countdown'}).click();
  await expect(stageTimer).toHaveCount(0);
  await host.getByRole('button',{name:'Start 60 second countdown'}).click();
  await expect(stageTimer).toBeVisible();
  await host.getByRole('combobox',{name:'Select round'}).selectOption('1');
  await expect(stageTimer).toHaveCount(0);
  await expect(audience.locator('.team-score .team-number')).toHaveText(['0','0']);
  await expect(audience.locator('.strike.is-strike')).toHaveCount(0);
  await audience.close();
  await host.close();
});

test('Rehearsal countdown is isolated from the live match',async({page})=>{
  await page.goto('?game=quickfire');
  await page.getByRole('button',{name:'Add ten points to team 1'}).click();
  const liveBefore=await page.evaluate(()=>localStorage.getItem('playlab-quickfire-state-v1'));
  await page.goto('?game=quickfire&mode=rehearsal');
  await page.getByRole('button',{name:'Start 30 second countdown'}).click();
  expect(await page.evaluate(()=>localStorage.getItem('playlab-quickfire-state-v1'))).toBe(liveBefore);
  const practice=await page.evaluate(()=>JSON.parse(localStorage.getItem('playlab-quickfire-rehearsal-v1')));
  expect(practice.countdown.durationSeconds).toBe(30);
});

for(const game of ['survey','quickfire']){
  test(game+' timer controls do not cause mobile horizontal overflow',async({page})=>{
    await page.setViewportSize({width:360,height:820});
    await page.goto('?game='+game);
    await page.getByRole('button',{name:'Start 30 second countdown'}).click();
    await expect(page.locator('.playlab-countdown-status')).toContainText('Running');
    const dimensions=await page.evaluate(()=>({vw:innerWidth,sw:document.documentElement.scrollWidth}));
    expect(dimensions.sw,game+' must fit a 360px host viewport').toBeLessThanOrEqual(dimensions.vw+1);
  });
}
