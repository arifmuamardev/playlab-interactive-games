import {test,expect} from '@playwright/test';

test('Setup wizard validates game and team names before writing a new match',async({page})=>{
  await page.goto('?page=dashboard&tab=setup');
  await expect(page.getByRole('heading',{name:'Game setup'})).toBeVisible();
  await page.getByRole('button',{name:'Continue'}).click();
  await expect(page.getByRole('alert')).toContainText('Choose a game');
  await page.getByRole('button',{name:/Quickfire Quiz/}).click();
  await page.getByRole('button',{name:'Continue'}).click();
  await expect(page.getByRole('radio',{name:/Use a saved question pack/})).toBeDisabled();
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByLabel('Team 1').fill('Team one');
  await page.getByLabel('Team 2').fill('team ONE');
  await page.getByRole('button',{name:'Continue'}).click();
  await expect(page.getByRole('alert')).toContainText('two distinct team names');
  expect(await page.evaluate(()=>localStorage.getItem('playlab-quickfire-state-v1'))).toBeNull();
});

test('Setup reuses saved Quickfire question pack and updates live projector only after confirmation',async({context})=>{
  const host=await context.newPage();
  await host.goto('?game=quickfire');
  await host.getByRole('button',{name:'Add ten points to team 1'}).click();
  const popupPromise=host.waitForEvent('popup');
  await host.getByRole('button',{name:/Open projector/}).click();
  const projector=await popupPromise;
  await expect(projector.locator('.quick-scores > div').first().locator('strong')).toHaveText('10');
  const dashboard=await context.newPage();
  await dashboard.goto('?page=dashboard&tab=games');
  await dashboard.locator('.dash-game-card').last().getByRole('button',{name:'Save questions'}).click();
  await dashboard.getByRole('textbox',{name:'Pack name'}).fill('Weekly classroom quiz');
  await dashboard.getByRole('button',{name:'Save pack',exact:true}).click();
  await dashboard.getByRole('button',{name:'Game setup'}).click();
  await dashboard.getByRole('button',{name:/Quickfire Quiz/}).click();
  await dashboard.getByRole('button',{name:'Continue'}).click();
  await dashboard.getByRole('radio',{name:/Use a saved question pack/}).check();
  await dashboard.locator('#setup-pack').selectOption({label:'Weekly classroom quiz · 6 questions'});
  await dashboard.getByRole('button',{name:'Continue'}).click();
  await dashboard.getByLabel('Team 1').fill('Group A');
  await dashboard.getByLabel('Team 2').fill('Group B');
  await dashboard.getByRole('button',{name:'Continue'}).click();
  await expect(dashboard.getByText('Group A vs Group B')).toBeVisible();
  dashboard.once('dialog',dialog=>dialog.dismiss());
  await dashboard.getByRole('button',{name:'Launch host controls'}).click();
  await expect(dashboard.getByText('Review your new match')).toBeVisible();
  await expect(projector.locator('.quick-scores > div').first().locator('strong')).toHaveText('10');
  dashboard.once('dialog',dialog=>dialog.accept());
  await dashboard.getByRole('button',{name:'Launch host controls'}).click();
  await expect(dashboard).toHaveURL(/\?game=quickfire/);
  await expect(dashboard.getByRole('heading',{name:'Get the crowd ready!'})).toBeVisible();
  await expect(projector.locator('.playlab-pregame-welcome')).toBeVisible();
  await dashboard.getByRole('button',{name:/Next: Meet the teams/}).click();
  await expect(projector.locator('.playlab-pregame-teams')).toContainText('Group A');
  await dashboard.getByRole('button',{name:/Next: Game rules/}).click();
  await dashboard.getByRole('button',{name:'Start Game'}).click();
  await expect(dashboard.getByRole('textbox',{name:'Team 1 name'})).toHaveValue('Group A');
  await expect(projector.locator('.quick-scores > div').first().locator('strong')).toHaveText('0');
  await expect(projector.locator('.quick-scores')).toContainText('Group B');
  await expect(host.getByRole('textbox',{name:'Team 1 name'})).toHaveValue('Group A');
  const library=await dashboard.evaluate(()=>JSON.parse(localStorage.getItem('playlab-content-packs-v1')));
  expect(library.packs).toHaveLength(1);
});

test('Setup preselects Survey, reuses saved questions and resets progress',async({page})=>{
  await page.goto('?game=survey');
  await page.locator('.reveal-button').first().click();
  await page.locator('.award-btn--0').click();
  await expect(page.locator('.team-editor--0 strong')).toHaveText('34');
  await page.goto('?page=dashboard&tab=setup&format=survey');
  await expect(page.getByRole('button',{name:/Survey Showdown/})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('radio',{name:/Reuse current game questions/}).check();
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByLabel('Team 1').fill('Course A');
  await page.getByLabel('Team 2').fill('Course B');
  await page.getByRole('button',{name:'Continue'}).click();
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Launch host controls'}).click();
  await expect(page).toHaveURL(/\?game=survey/);
  await expect(page.locator('.playlab-pregame-welcome')).toBeVisible();
  await page.getByRole('button',{name:/Next: Meet the teams/}).click();
  await page.getByRole('button',{name:/Next: Game rules/}).click();
  await page.getByRole('button',{name:'Start Game'}).click();
  await expect(page.locator('.team-editor--0 strong')).toHaveText('0');
  await expect(page.locator('#team-name-0')).toHaveValue('Course A');
  await expect(page.locator('.reveal-button')).toHaveCount(5);
  await expect(page.locator('.stage-answer.is-hidden')).toHaveCount(5);
});

for(const width of [360,390,768,1280]){
  test('Game setup is responsive at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:820});
    await page.goto('?page=dashboard&tab=setup');
    for(let step=0;step<4;step++){
      if(step===0)await page.getByRole('button',{name:/Survey Showdown/}).click();
      const dimensions=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
      expect(dimensions.document,'Overflow in setup step '+step).toBeLessThanOrEqual(dimensions.viewport+1);
      if(step<3)await page.getByRole('button',{name:'Continue'}).click();
    }
    await expect(page.getByText('Review your new match')).toBeVisible();
  });
}
