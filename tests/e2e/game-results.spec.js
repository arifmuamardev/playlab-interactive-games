import {test,expect} from '@playwright/test';

async function projector(host,name){
  const popup=host.waitForEvent('popup');
  await host.getByRole('button',{name}).click();
  const display=await popup;
  await display.waitForLoadState('domcontentloaded');
  return display;
}
test('Survey: finishing shows winner in host/projector; canceled finish does not change game; reload persists; resume restores gameplay',async({context})=>{
  const host=await context.newPage();await host.goto('?game=survey');
  const screen=await projector(host,/Open projector view/);
  await host.locator('.reveal-button').first().click();
  await host.locator('.award-btn--0').click();
  host.once('dialog',d=>d.dismiss());
  await host.getByRole('button',{name:'Finish match & show results'}).click();
  await expect(host.locator('.stage--preview')).toBeVisible();
  await expect(screen.locator('.stage--full')).toBeVisible();
  host.once('dialog',d=>d.accept());
  await host.getByRole('button',{name:'Finish match & show results'}).click();
  await expect(host.getByRole('heading',{name:'We have a winner!'})).toBeVisible();
  await expect(screen.getByRole('heading',{name:'We have a winner!'})).toBeVisible();
  await expect(screen.locator('.results-team--0 .results-team-score')).toHaveText('34');
  await expect(screen.locator('.results-team--1 .results-team-score')).toHaveText('0');
  await expect(screen.locator('.results-team--0')).toContainText('WINNER');
  await expect(screen.locator('.results-summary')).toContainText('1 of 6 rounds awarded');
  await host.reload();await screen.reload();
  await expect(host.getByRole('button',{name:'Resume match'})).toBeVisible();
  await expect(screen.locator('.results-board--survey')).toBeVisible();
  await host.keyboard.press('1'); // No host game shortcuts while viewing results.
  await expect(screen.locator('.results-board')).toBeVisible();
  await host.getByRole('button',{name:'Resume match'}).click();
  await expect(host.locator('.stage--preview')).toBeVisible();
  await expect(host.locator('.team-editor--0 strong')).toHaveText('34');
  await expect(screen.locator('.stage--full')).toBeVisible();
  await expect(screen.locator('.team-score--0 .team-number')).toHaveText('34');
});
test('Survey: reset from results requires confirmation and preserves question bank + team names',async({page})=>{
  await page.goto('?game=survey');
  await page.locator('#team-name-0').fill('Class Alpha');
  await page.locator('.reveal-button').first().click();
  await page.locator('.award-btn--0').click();
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Finish match & show results'}).click();
  page.once('dialog',d=>d.dismiss());
  await page.getByRole('button',{name:'Reset & play again'}).click();
  await expect(page.locator('.results-board')).toBeVisible();
  expect((await page.evaluate(()=>JSON.parse(localStorage.getItem('playlab-survey-showdown-v2')))).finished).toBe(true);
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Reset & play again'}).click();
  await expect(page.locator('.stage--preview')).toBeVisible();
  await expect(page.locator('#team-name-0')).toHaveValue('Class Alpha');
  await expect(page.locator('.team-editor--0 strong')).toHaveText('0');
  await expect(page.locator('.reveal-button')).toHaveCount(5);
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('playlab-survey-showdown-v2')));
  expect(state.finished).toBe(false);
  expect(state.progress).toEqual({});
});
test('Quickfire: tied scores and later winner, projector audio control and no destructive reset',async({context})=>{
  const host=await context.newPage();await host.goto('?game=quickfire');
  const screen=await projector(host,/Open projector/);
  await host.getByRole('button',{name:'Add ten points to team 1'}).click();
  await host.getByRole('button',{name:'Add ten points to team 2'}).click();
  await host.getByRole('button',{name:'Reveal correct answer'}).click();
  host.once('dialog',d=>d.accept());
  await host.getByRole('button',{name:'Finish match & show results'}).click();
  await expect(screen.getByRole('heading',{name:'It’s a tie!'})).toBeVisible();
  await expect(screen.locator('.results-team--0 .results-team-score')).toHaveText('10');
  await expect(screen.locator('.results-team--1 .results-team-score')).toHaveText('10');
  await expect(screen.locator('.results-summary')).toContainText('1 of 6 answers revealed');
  await expect(screen.getByRole('button',{name:'Enable projector sounds'})).toBeVisible();
  await host.reload();await screen.reload();
  await expect(host.getByRole('heading',{name:'It’s a tie!'})).toBeVisible();
  await expect(screen.getByRole('heading',{name:'It’s a tie!'})).toBeVisible();
  await host.keyboard.press('r');
  await host.keyboard.press('n');
  await expect(screen.locator('.results-board')).toBeVisible();
  await host.getByRole('button',{name:'Resume match'}).click();
  await expect(screen.locator('.quick-board:not(.quick-board--preview)')).toBeVisible();
  await host.getByRole('button',{name:'Add ten points to team 1'}).click();
  host.once('dialog',d=>d.accept());
  await host.getByRole('button',{name:'Finish match & show results'}).click();
  await expect(screen.getByRole('heading',{name:'We have a winner!'})).toBeVisible();
  await expect(screen.locator('.results-team--0')).toContainText('WINNER');
  await expect(screen.locator('.results-team--0 .results-team-score')).toHaveText('20');
  host.once('dialog',d=>d.accept());
  await host.getByRole('button',{name:'Reset & play again'}).click();
  await expect(screen.locator('.quick-board:not(.quick-board--preview)')).toBeVisible();
  await expect(screen.locator('.quick-scores>div').first().locator('strong')).toHaveText('0');
});
test('Quickfire rehearsal results do not modify the saved real match',async({context})=>{
  const live=await context.newPage();await live.goto('?game=quickfire');
  await live.getByRole('button',{name:'Add ten points to team 1'}).click();
  const setup=await context.newPage();await setup.goto('?page=dashboard&tab=setup&format=quickfire');
  await setup.getByRole('button',{name:'Continue'}).click();
  await setup.getByRole('button',{name:'Continue'}).click();
  await setup.getByRole('button',{name:'Continue'}).click();
  const popup=setup.waitForEvent('popup');
  await setup.getByRole('button',{name:/Practice without affecting live game/}).click();
  const rehearsal=await popup;
  await expect(rehearsal.locator('.playlab-pregame-welcome')).toBeVisible();
  await rehearsal.getByRole('button',{name:/Next: Meet the teams/}).click();
  await rehearsal.getByRole('button',{name:/Next: Game rules/}).click();
  await rehearsal.getByRole('button',{name:'Start Game'}).click();
  rehearsal.once('dialog',d=>d.accept());
  await rehearsal.getByRole('button',{name:'Finish match & show results'}).click();
  await expect(rehearsal.locator('.results-board')).toBeVisible();
  expect((await live.evaluate(()=>JSON.parse(localStorage.getItem('playlab-quickfire-state-v1')))).scores).toEqual([10,0]);
  await live.reload();
  await expect(live.locator('.quick-team-editor').first().locator('strong')).toHaveText('10');
  expect((await live.evaluate(()=>JSON.parse(localStorage.getItem('playlab-quickfire-state-v1')))).finished).not.toBe(true);
  expect((await rehearsal.evaluate(()=>JSON.parse(localStorage.getItem('playlab-quickfire-rehearsal-v1')))).finished).toBe(true);
});
for(const width of [360,390,768,1280]){
  test('Result host and projector fit viewport '+width+'px',async({context})=>{
    const host=await context.newPage();await host.setViewportSize({width,height:820});
    const display=await context.newPage();await display.setViewportSize({width,height:820});
    await host.goto('?game=survey');
    await display.goto('?game=survey&view=display');
    host.once('dialog',d=>d.accept());
    await host.getByRole('button',{name:'Finish match & show results'}).click();
    await expect(host.locator('.results-board--preview')).toBeVisible();
    await expect(display.locator('.results-board--survey')).toBeVisible();
    for(const [p,label] of [[host,'host'],[display,'projector']]){
      const widths=await p.evaluate(()=>({inner:innerWidth,document:document.documentElement.scrollWidth}));
      expect(widths.document,label+' at '+width).toBeLessThanOrEqual(widths.inner+1);
    }
    await host.close();await display.close();
  });
}
