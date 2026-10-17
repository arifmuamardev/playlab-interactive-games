import {test,expect} from '@playwright/test';

/** Visual contract tests target the *working* Game Setup, not the archived Design Lab. */
test('Game Setup uses playful cards across game, content, teams and review steps',async({page})=>{
  await page.goto('?page=dashboard&tab=setup');
  await expect(page.locator('.dash-playful .setup-intro')).toBeVisible();
  await expect(page.locator('.setup-intro-sticker')).toContainText('PLAY!');
  await expect(page.locator('.setup-progress li')).toHaveCount(4);
  await expect(page.locator('.setup-card--game')).toBeVisible();
  await expect(page.locator('.setup-card-eyebrow')).toContainText('STEP 01 / 04');
  await expect(page.locator('.setup-game-art')).toHaveCount(2);
  await expect(page.locator('.setup-game-option--survey')).toBeVisible();
  const art=await page.locator('.setup-intro').evaluate(el=>({
    border:getComputedStyle(el).borderTopWidth,
    background:getComputedStyle(el).backgroundColor,
    radius:getComputedStyle(el).borderTopLeftRadius
  }));
  expect(art.border).toBe('2px');
  expect(art.radius).toBe('23px');
  expect(art.background).toBe('rgb(232, 223, 255)');
  await page.getByRole('button',{name:/Survey Showdown/}).click();
  await expect(page.locator('.setup-game-option--survey')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.setup-game-option--survey')).toHaveClass(/selected/);
  await page.getByRole('button',{name:'Continue'}).click();
  await expect(page.locator('.setup-card--questions')).toBeVisible();
  await expect(page.locator('.setup-source-icon')).toHaveCount(4);
  await page.getByRole('radio',{name:/Ready-to-use classroom/i}).check();
  await expect(page.locator('.setup-source.selected')).toContainText('Ready-to-use classroom');
  await page.locator('#setup-template').selectOption('survey-classroom-v1');
  await page.getByRole('button',{name:'Continue'}).click();
  await expect(page.locator('.setup-card--teams')).toBeVisible();
  await expect(page.locator('.setup-team-icon')).toHaveCount(2);
  await page.getByLabel('Team 1').fill('Alpha');
  await page.getByLabel('Team 2').fill('Beta');
  await page.getByRole('button',{name:'Continue'}).click();
  await expect(page.locator('.setup-card--review')).toBeVisible();
  await expect(page.locator('.setup-review-celebration')).toContainText('MATCH READY!');
  await expect(page.getByText('Alpha vs Beta')).toBeVisible();
  await expect(page.getByRole('button',{name:'Practice without affecting live game'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Launch host controls'})).toBeVisible();
  await page.getByRole('button',{name:'Back'}).click();
  await expect(page.getByLabel('Team 1')).toHaveValue('Alpha');
  await expect(page.getByLabel('Team 2')).toHaveValue('Beta');
  expect(await page.evaluate(()=>localStorage.getItem('playlab-survey-showdown-v2'))).toBeNull();
});

for(const width of [360,390,768,1280]){
  test('Every playful setup step fits '+width+'px, including template and review controls',async({page})=>{
    await page.setViewportSize({width,height:820});
    await page.goto('?page=dashboard&tab=setup');
    const check=async step=>{
      await expect(page.locator('.setup-card--'+step)).toBeVisible();
      const size=await page.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth}));
      expect(size.page,step+' width at '+width+'px').toBeLessThanOrEqual(size.viewport+1);
    };
    await check('game');
    await page.getByRole('button',{name:/Quickfire Quiz/}).click();
    await page.getByRole('button',{name:'Continue'}).click();
    await check('questions');
    await page.getByRole('radio',{name:/Ready-to-use classroom/}).check();
    await page.locator('#setup-template').selectOption('quickfire-general-v1');
    await check('questions');
    await page.getByRole('button',{name:'Continue'}).click();
    await check('teams');
    await page.getByLabel('Team 1').fill('One');
    await page.getByLabel('Team 2').fill('Two');
    await page.getByRole('button',{name:'Continue'}).click();
    await check('review');
    await expect(page.locator('.setup-progress li.current')).toContainText('Review');
  });
}

test('The playful setup still requires validation and confirmation for a saved match',async({page})=>{
  await page.goto('?game=quickfire');
  await page.getByRole('button',{name:'Add ten points to team 1'}).click();
  await page.goto('?page=dashboard&tab=setup&format=quickfire');
  await expect(page.locator('.setup-card--game')).toBeVisible();
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByLabel('Team 1').fill('Same');
  await page.getByLabel('Team 2').fill('same');
  await page.getByRole('button',{name:'Continue'}).click();
  await expect(page.getByRole('alert')).toContainText('distinct team names');
  await page.getByLabel('Team 2').fill('Different');
  await page.getByRole('button',{name:'Continue'}).click();
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Launch host controls'}).click();
  await expect(page.locator('.setup-card--review')).toBeVisible();
  expect((await page.evaluate(()=>JSON.parse(localStorage.getItem('playlab-quickfire-state-v1')))).scores[0]).toBe(10);
});
