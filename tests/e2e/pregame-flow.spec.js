import {test,expect} from '@playwright/test';
const keys={survey:'playlab-survey-showdown-v2',quickfire:'playlab-quickfire-state-v1'};

async function prepare(page,game){
 await page.goto('?page=dashboard&tab=setup&format='+game);
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Launch host controls'}).click();
 await expect(page).toHaveURL(new RegExp('game='+game));
 await expect(page.getByRole('heading',{name:'Get the crowd ready!'})).toBeVisible();
}

for(const game of ['survey','quickfire']){
 test(game+' pre-game is controlled by the MC and synchronized with the projector',async({context})=>{
  const host=await context.newPage();
  await prepare(host,game);
  const storageKey=keys[game];
  let state=await host.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);
  expect(state.presentation).toBe('welcome');
  const opened=host.waitForEvent('popup');
  await host.getByRole('button',{name:/Open projector/}).click();
  const audience=await opened;
  await expect(audience.locator('.playlab-pregame-welcome')).toBeVisible();
  await expect(audience.locator('.quick-question,.stage-question')).toHaveCount(0);
  await host.getByRole('button',{name:/Next: Meet the teams/}).click();
  await expect(audience.locator('.playlab-pregame-team')).toHaveCount(2);
  state=await host.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);
  expect(state.presentation).toBe('teams');
  await host.getByRole('button',{name:'Previous'}).click();
  await expect(audience.locator('.playlab-pregame-welcome')).toBeVisible();
  await host.getByRole('button',{name:/Next: Meet the teams/}).click();
  await host.getByRole('button',{name:/Next: Game rules/}).click();
  await expect(audience.locator('.playlab-pregame-rules li')).toHaveCount(4);
  await expect(audience.locator('.playlab-pregame-rules')).toContainText(game==='survey'?'fictional':'manually');
  await audience.reload();
  await expect(audience.locator('.playlab-pregame-rules')).toBeVisible();
  state=await host.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);
  expect(state.presentation).toBe('rules');
  await host.getByRole('button',{name:'Start Game'}).click();
  await expect(audience.locator(game==='survey'?'.stage-answer-grid':'.quick-options')).toBeVisible();
  state=await host.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);
  expect(state.presentation).toBe('playing');
  if(game==='survey')expect(state.progress).toEqual({});
  else expect(state.scores).toEqual([0,0]);
  await audience.reload();
  await expect(audience.locator(game==='survey'?'.stage-answer-grid':'.quick-options')).toBeVisible();
 });

 test(game+' can replay introductions without erasing the match',async({page})=>{
  await prepare(page,game);
  await page.getByRole('button',{name:/Next: Meet the teams/}).click();
  await page.getByRole('button',{name:/Next: Game rules/}).click();
  await page.getByRole('button',{name:'Start Game'}).click();
  if(game==='survey'){await page.locator('.reveal-button').first().click();}
  else{await page.getByRole('button',{name:'Add ten points to team 1'}).click();}
  const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),keys[game]);
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Show intro'}).click();
  await expect(page.locator('.playlab-pregame-welcome')).toBeVisible();
  await page.reload();
  await expect(page.locator('.playlab-pregame-welcome')).toBeVisible();
  const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),keys[game]);
  expect(after.questions).toEqual(before.questions);
  expect(game==='survey'?after.progress:after.scores).toEqual(game==='survey'?before.progress:before.scores);
 });

 for(const dim of [{width:1280,height:720},{width:1024,height:768},{width:360,height:780}]){
  test(game+' intro stages fit '+dim.width+'×'+dim.height,async({page})=>{
   await page.setViewportSize(dim);
   await prepare(page,game);
   const opened=page.waitForEvent('popup');
   await page.getByRole('button',{name:/Open projector/}).click();
   const audience=await opened;
   await audience.setViewportSize(dim);
   for(const stage of ['welcome','teams','rules']){
    await expect(audience.locator('.playlab-pregame--audience')).toBeVisible();
    const metrics=await audience.locator('.playlab-pregame--audience').evaluate(el=>{
      const r=el.getBoundingClientRect(),footer=el.querySelector('.playlab-pregame-footer')?.getBoundingClientRect();
      return {width:r.width,height:r.height,footerBottom:footer?.bottom,scrollWidth:document.documentElement.scrollWidth,clientWidth:innerWidth};
    });
    expect(metrics.footerBottom,stage+' footer should remain in view').toBeLessThanOrEqual(dim.height+2);
    expect(metrics.scrollWidth,stage+' must not cause horizontal overflow').toBeLessThanOrEqual(metrics.clientWidth+2);
    if(stage!=='rules')await page.getByRole('button',{name:/^Next:/}).click();
   }
  });
 }
}
