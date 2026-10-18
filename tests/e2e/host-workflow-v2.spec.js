import {test,expect} from '@playwright/test';

async function openProjector(host){
  const popup=host.waitForEvent('popup');
  await host.getByRole('button',{name:/Open projector/}).click();
  const screen=await popup;
  await screen.waitForLoadState('domcontentloaded');
  return screen;
}

test('Survey: host has contextual reveal, strike, award, and next-round actions that sync to projector',async({context})=>{
  const host=await context.newPage();
  await host.goto('?game=survey');
  const screen=await openProjector(host);
  const bar=host.getByRole('region',{name:'Live host controls'});
  await expect(bar).toContainText('Ready for answers');
  await expect(bar.getByRole('button',{name:'Jump to answer buttons'})).toBeVisible();
  await expect(bar.getByRole('button',{name:/Give bank to/})).toHaveCount(0);
  await bar.getByRole('button',{name:'Add strike'}).click();
  await expect(screen.locator('.strike.is-strike')).toHaveCount(1);
  await bar.getByRole('button',{name:'Undo strike'}).click();
  await expect(screen.locator('.strike.is-strike')).toHaveCount(0);
  await bar.getByRole('button',{name:'Jump to answer buttons'}).click();
  await expect(host.locator('#survey-reveal-controls')).toBeInViewport();
  await host.locator('.reveal-button').first().click();
  await expect(screen.locator('.stage-answer.is-revealed')).toHaveCount(1);
  await expect(bar).toContainText('34 points available');
  await expect(bar.getByRole('button',{name:'Give bank to Tim Merah'})).toBeEnabled();
  await bar.getByRole('button',{name:'Give bank to Tim Merah'}).click();
  await expect(screen.locator('.team-score--0 .team-number')).toHaveText('34');
  await expect(bar).toContainText('Round points awarded');
  await bar.getByRole('button',{name:'Continue to round 2'}).click();
  await expect(screen.locator('.stage-question h1')).toContainText('akhir pekan');
  await expect(bar).toContainText('LIVE ROUND 2 /');
  await host.reload();
  await expect(host.getByRole('region',{name:'Live host controls'})).toContainText('Ready for answers');
  await expect(host.locator('.team-editor--0 strong')).toHaveText('34');
});

test('Survey: stolen bank remains a deliberate team choice and final results stay confirmed',async({page})=>{
  await page.goto('?game=survey');
  const bar=page.getByRole('region',{name:'Live host controls'});
  await page.locator('.reveal-button').first().click();
  await bar.getByRole('button',{name:'Add strike'}).click();
  await bar.getByRole('button',{name:'Add strike'}).click();
  await bar.getByRole('button',{name:'Add strike'}).click();
  await expect(bar).toContainText('Steal opportunity');
  await expect(bar.getByRole('button',{name:/Give bank to/})).toHaveCount(2);
  await bar.getByRole('button',{name:'Give bank to Tim Biru'}).click();
  await expect(page.locator('.team-editor--1 strong')).toHaveText('34');
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Finish match & show results'}).click();
  await expect(page.locator('.results-board')).toBeVisible();
  await page.getByRole('button',{name:'Resume match'}).click();
  await expect(page.getByRole('region',{name:'Live host controls'})).toContainText('Round points awarded');
});

test('Quickfire: the bar keeps reveal, explicit team scoring, undo and question progression together',async({context})=>{
  const host=await context.newPage();
  await host.goto('?game=quickfire');
  const screen=await openProjector(host);
  const bar=host.getByRole('region',{name:'Live host controls'});
  await expect(bar).toContainText('Give everyone a moment to answer');
  await expect(bar.getByRole('button',{name:/\+10/})).toHaveCount(0);
  await bar.getByRole('button',{name:'Show answer on projector'}).click();
  await expect(screen.locator('.quick-option.correct')).toHaveCount(1);
  await expect(bar).toContainText('Answer revealed');
  await expect(bar.getByRole('button',{name:'+10 · Team A'})).toBeVisible();
  await bar.getByRole('button',{name:'+10 · Team A'}).click();
  await expect(screen.locator('.quick-scores > div').first().locator('strong')).toHaveText('10');
  await bar.getByRole('button',{name:'Undo score change'}).click();
  await expect(screen.locator('.quick-scores > div').first().locator('strong')).toHaveText('0');
  await bar.getByRole('button',{name:'+10 · Team B'}).click();
  await expect(screen.locator('.quick-scores > div').nth(1).locator('strong')).toHaveText('10');
  await bar.getByRole('button',{name:'Continue to question 2'}).click();
  await expect(screen.locator('.quick-question')).toContainText('bilangan prima');
  await expect(bar).toContainText('Give everyone a moment to answer');
  await host.reload();
  await expect(host.locator('.quick-team-editor').nth(1).locator('strong')).toHaveText('10');
  await expect(host.getByRole('region',{name:'Live host controls'})).toContainText('LIVE QUESTION 2 /');
});

test('Quickfire: the last answer offers finish action without automatic scoring or reset',async({page})=>{
  await page.goto('?game=quickfire');
  await page.getByRole('button',{name:'Next'}).click();
  for(let i=2;i<6;i++){await page.getByRole('button',{name:'Next'}).click();}
  const bar=page.getByRole('region',{name:'Live host controls'});
  await expect(bar).toContainText('LIVE QUESTION 6 / 6');
  await bar.getByRole('button',{name:'Show answer on projector'}).click();
  await expect(bar).toContainText('Last answer revealed');
  expect((await page.evaluate(()=>JSON.parse(localStorage.getItem('playlab-quickfire-state-v1')))).scores).toEqual([0,0]);
  page.once('dialog',d=>d.dismiss());
  await bar.getByRole('button',{name:'Show final results'}).click();
  await expect(page.locator('.quick-team-editor')).toHaveCount(2);
  page.once('dialog',d=>d.accept());
  await bar.getByRole('button',{name:'Show final results'}).click();
  await expect(page.locator('.results-board')).toBeVisible();
  await expect(page.getByRole('heading',{name:'It’s a tie!'})).toBeVisible();
});

for(const width of [360,390,768,1280]){
  test('Survey and Quickfire action bars fit and remain usable at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:810});
    for(const game of ['survey','quickfire']){
      await page.goto('?game='+game);
      const bar=page.getByRole('region',{name:'Live host controls'});
      await expect(bar).toBeVisible();
      await expect(bar).toHaveCSS('position','sticky');
      const check=async()=>{
        const d=await page.evaluate(()=>({inner:innerWidth,doc:document.documentElement.scrollWidth}));
        expect(d.doc,game+' overflow at '+width).toBeLessThanOrEqual(d.inner+1);
      };
      await check();
      if(game==='survey'){
        await page.locator('.reveal-button').first().click();
        await expect(bar.getByRole('button',{name:'Give bank to Tim Merah'})).toBeVisible();
      }else{
        await bar.getByRole('button',{name:'Show answer on projector'}).click();
        await expect(bar.getByRole('button',{name:'+10 · Team A'})).toBeVisible();
      }
      await check();
      await page.evaluate(()=>scrollTo(0,Math.min(650,document.body.scrollHeight*.45)));
      await expect(bar).toBeInViewport({ratio:.3});
    }
  });
}
