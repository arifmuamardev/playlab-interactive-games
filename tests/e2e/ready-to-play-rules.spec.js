import {test,expect} from '@playwright/test';
import {starterTemplatesFor,findStarterTemplate} from '../../src/dashboard/starterTemplates.js';

test('The setup wizard advertises rules for both games, including what is not automated',async({page})=>{
  await page.goto('?page=dashboard&tab=setup');
  await expect(page.locator('.playlab-rules')).toHaveCount(2);
  await page.locator('.playlab-rules--survey summary').click();
  await expect(page.locator('.playlab-rules--survey')).toContainText('Three strikes');
  await expect(page.locator('.playlab-rules--survey')).toContainText('fictional');
  await expect(page.locator('.playlab-rules--survey')).toContainText('not enforced');
  await page.locator('.playlab-rules--quickfire summary').click();
  await expect(page.locator('.playlab-rules--quickfire')).toContainText('manually awards +10');
  await expect(page.locator('.playlab-rules--quickfire')).toContainText('No automatic correctness checking');
  await expect(page.locator('.playlab-rules--quickfire')).toContainText('not enforced');
});
for(const game of ['survey','quickfire']){
  test(game+' offers five full eight-question sets with browsable previews and no early writes',async({page})=>{
    await page.goto('?page=dashboard&tab=setup&format='+game);
    await page.getByRole('button',{name:'Continue'}).click();
    await page.getByRole('radio',{name:/Ready-to-use classroom/}).check();
    const cards=page.locator('.setup-template-card');
    await expect(cards).toHaveCount(5);
    const options=page.locator('#setup-template option');
    await expect(options).toHaveCount(6); // placeholder + 5 sets
    for(const template of starterTemplatesFor(game)){
      await page.locator('#setup-template').selectOption(template.id);
      await expect(page.locator('.setup-template-card.selected')).toContainText(template.title);
      await expect(page.locator('.setup-template-preview')).toContainText('8 curated');
      await expect(page.locator('.setup-template-preview > ul > li')).toHaveCount(3);
      await expect(page.locator('.setup-template-preview')).toContainText(template.questions[0].question);
      const selected=page.locator('.setup-template-card.selected');
      await expect(selected).toHaveAttribute('aria-pressed','true');
      expect(findStarterTemplate(game,template.id).questions).toHaveLength(8);
    }
    expect(await page.evaluate(key=>localStorage.getItem(key),game==='survey'?'playlab-survey-showdown-v2':'playlab-quickfire-state-v1')).toBeNull();
    expect(await page.evaluate(()=>localStorage.getItem('playlab-content-packs-v1'))).toBeNull();
  });
  test(game+' exposes the official rules to a live presenter',async({page})=>{
    await page.goto('?game='+game);
    const rules=page.locator('.host-rules-reference .playlab-rules--'+game);
    await expect(rules).toBeVisible();
    await rules.locator('summary').click();
    await expect(rules).toContainText(game==='survey'?'Round bank':'Current default');
    await expect(rules).toContainText('Finish match');
    await expect(page.getByRole('region',{name:'Live host controls'})).toBeVisible();
  });
}
test('All ready sets preserve custom team names and isolated rehearsal session',async({page})=>{
  await page.goto('?game=quickfire');
  await page.getByRole('button',{name:'Add ten points to team 1'}).click();
  await page.goto('?page=dashboard&tab=setup&format=quickfire');
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('radio',{name:/Ready-to-use classroom/}).check();
  await page.locator('.setup-template-card').filter({hasText:'Science & Nature Explorer'}).click();
  await page.getByRole('button',{name:'Continue'}).click();
  await page.getByLabel('Team 1').fill('Blue Team');
  await page.getByLabel('Team 2').fill('Yellow Team');
  await page.getByRole('button',{name:'Continue'}).click();
  await expect(page.getByText(/Science & Nature Explorer · 8 questions/)).toBeVisible();
  expect((await page.evaluate(()=>JSON.parse(localStorage.getItem('playlab-quickfire-state-v1')))).scores).toEqual([10,0]);
  const popup=page.waitForEvent('popup');
  await page.getByRole('button',{name:'Practice without affecting live game'}).click();
  const practice=await popup;
  await expect(practice).toHaveURL(/mode=rehearsal/);
  await expect(practice.locator('.playlab-pregame-teams')).toHaveCount(0);
  await practice.getByRole('button',{name:/Next: Meet the teams/}).click();
  await expect(practice.locator('.playlab-pregame-team')).toContainText(['Blue Team','Yellow Team']);
  await practice.getByRole('button',{name:/Next: Game rules/}).click();
  await practice.getByRole('button',{name:'Start Game'}).click();
  await expect(practice.getByRole('textbox',{name:'Team 1 name'})).toHaveValue('Blue Team');
  await expect(practice.locator('.quick-nav>span')).toHaveText('1 / 8');
  expect((await page.evaluate(()=>JSON.parse(localStorage.getItem('playlab-quickfire-state-v1')))).scores).toEqual([10,0]);
  expect(await page.evaluate(()=>localStorage.getItem('playlab-content-packs-v1'))).toBeNull();
});
for(const width of [360,390,768,1280]){
  test('The five-set catalog and expanded rules remain responsive at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:820});
    await page.goto('?page=dashboard&tab=setup');
    await page.locator('.playlab-rules--survey summary').click();
    await page.locator('.playlab-rules--quickfire summary').click();
    let dim=await page.evaluate(()=>({vw:innerWidth,sw:document.documentElement.scrollWidth}));
    expect(dim.sw,'Rules overflow '+width+'px').toBeLessThanOrEqual(dim.vw+1);
    await page.getByRole('button',{name:/Quickfire Quiz/}).click();
    await page.getByRole('button',{name:'Continue'}).click();
    await page.getByRole('radio',{name:/Ready-to-use classroom/}).check();
    await page.locator('.setup-template-card').last().click();
    await expect(page.locator('.setup-template-preview')).toBeVisible();
    dim=await page.evaluate(()=>({vw:innerWidth,sw:document.documentElement.scrollWidth}));
    expect(dim.sw,'Five-set browser overflow '+width+'px').toBeLessThanOrEqual(dim.vw+1);
  });
}
