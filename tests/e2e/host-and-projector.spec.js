import {test,expect} from '@playwright/test';

async function openProjector(host,buttonName){
  const popupPromise=host.waitForEvent('popup');
  await host.getByRole('button',{name:buttonName}).click();
  const projector=await popupPromise;
  await projector.waitForLoadState('domcontentloaded');
  return projector;
}

async function exerciseSurvey(context,{forceStorageFallback=false}={}){
  if(forceStorageFallback){
    await context.addInitScript(()=>{window.BroadcastChannel=undefined;});
  }
  const host=await context.newPage();
  await host.goto('?game=survey');
  await expect(host.locator('.reveal-button')).toHaveCount(5);
  const projector=await openProjector(host,/Open projector view/i);
  await expect(projector.locator('.stage-answer.is-hidden')).toHaveCount(5);

  await host.locator('.reveal-button').nth(0).click();
  await expect(projector.locator('.stage-answer.is-revealed')).toHaveCount(1);
  await expect(projector.locator('.answer-content')).toContainText(['Tas']);
  await expect(projector.locator('.bank-number')).toHaveText('34');

  await host.getByRole('button',{name:/^Strike\b/}).click({force:true});
  await host.getByRole('button',{name:/^Strike\b/}).click({force:true});
  await host.getByRole('button',{name:/^Strike\b/}).click({force:true});
  await expect(projector.locator('.strike.is-strike')).toHaveCount(3);
  await expect(projector.locator('.phase-indicator')).toContainText('KESEMPATAN');

  await host.locator('.award-btn--1').click();
  await expect(projector.locator('.team-score--1 .team-number')).toHaveText('34');
  // Refresh the audience page: scores and answers must be loaded from persisted session state.
  await projector.reload();
  await expect(projector.locator('.team-score--1 .team-number')).toHaveText('34');
  await expect(projector.locator('.stage-answer.is-revealed')).toHaveCount(1);

  await host.getByRole('button',{name:'Next round'}).click();
  await expect(projector.locator('.stage-question h1')).toContainText('akhir pekan');
  await expect(projector.locator('.team-score--1 .team-number')).toHaveText('34');
  await host.reload();
  await expect(host.getByRole('combobox',{name:'Select round'})).toHaveValue('1');
  await expect(host.locator('.team-editor--1 strong')).toHaveText('34');
  await projector.close();
  await host.close();
}

test('Survey Showdown: reveals, three strikes, score award, round change and refresh recovery',async({context})=>{
  await exerciseSurvey(context);
});

test('Survey Showdown: storage-event synchronization works without BroadcastChannel',async({context})=>{
  await exerciseSurvey(context,{forceStorageFallback:true});
});

test('Quickfire: answer reveal, team rename, point changes and question navigation persist',async({context})=>{
  const host=await context.newPage();
  await host.goto('?game=quickfire');
  const projector=await openProjector(host,/Open projector/i);
  await expect(projector.locator('.quick-option')).toHaveCount(4);
  await expect(projector.locator('.quick-option.correct')).toHaveCount(0);

  await host.getByRole('button',{name:'Reveal correct answer'}).click();
  await expect(projector.locator('.quick-option.correct')).toHaveCount(1);
  await expect(projector.locator('.quick-option.correct')).toContainText('Merkurius');
  await host.getByRole('textbox',{name:'Team 1 name'}).fill('Classroom Alpha');
  await host.getByRole('button',{name:'Add ten points to team 1'}).click();
  await expect(projector.locator('.quick-scores > div').first()).toContainText('Classroom Alpha');
  await expect(projector.locator('.quick-scores > div').first().locator('strong')).toHaveText('10');
  await host.getByRole('button',{name:/^Next/}).click();
  await expect(projector.locator('.quick-question')).toContainText('bilangan prima');
  await projector.reload();
  await expect(projector.locator('.quick-scores > div').first().locator('strong')).toHaveText('10');
  await expect(projector.locator('.quick-question')).toContainText('bilangan prima');
  await host.reload();
  await expect(host.getByRole('textbox',{name:'Team 1 name'})).toHaveValue('Classroom Alpha');
  await projector.close();
  await host.close();
});

test('Two games use independent browser storage and scores',async({page})=>{
  await page.goto('?game=quickfire');
  await page.getByRole('button',{name:'Add ten points to team 1'}).click();
  await page.goto('?game=survey');
  await expect(page.locator('.team-editor--0 strong')).toHaveText('0');
  await page.goto('?game=quickfire');
  await expect(page.locator('.quick-team-editor').first().locator('strong')).toHaveText('10');
});
