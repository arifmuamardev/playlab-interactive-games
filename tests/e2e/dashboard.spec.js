import {test,expect} from '@playwright/test';

test('Public landing offers a dashboard and real empty-workspace state',async({page})=>{
  await page.goto('./');
  await page.getByRole('link',{name:/My dashboard/i}).click();
  await expect(page).toHaveURL(/page=dashboard/);
  await expect(page.getByRole('heading',{name:'Your dashboard'})).toBeVisible();
  await expect(page.getByRole('region',{name:'Workspace summary'})).toBeVisible();
  await expect(page.locator('.dash-stats strong')).toHaveText(['2','0','0']);
  await expect(page.getByText('No saved question packs yet')).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Dashboard navigation'})).toBeVisible();
});

test('Dashboard saves, exports, deletes and imports compatible question packs',async({page})=>{
  await page.goto('?page=dashboard');
  await page.getByRole('button',{name:'My games'}).click();
  await page.locator('.dash-game-card').first().getByRole('button',{name:'Save questions'}).click();
  const dialog=page.getByRole('dialog',{name:'Save question pack'});
  await dialog.getByRole('textbox',{name:'Pack name'}).fill('Classroom survey');
  await dialog.getByRole('button',{name:'Save pack'}).click();
  await expect(page.getByRole('heading',{name:'Question packs'})).toBeVisible();
  await expect(page.locator('.dash-pack-card')).toHaveCount(1);
  await expect(page.locator('.dash-pack-card').first()).toContainText('6 questions');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('playlab-content-packs-v1')));
  expect(saved.version).toBe(1);
  expect(saved.packs[0].questions.length).toBe(6);
  expect(saved.packs[0].game).toBe('survey');
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export'}).click();
  const file=await download;
  expect(file.suggestedFilename()).toMatch(/playlab-survey.*\.json$/);
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Delete pack Classroom survey'}).click();
  await expect(page.locator('.dash-pack-card')).toHaveCount(0);
  await page.locator('input[type=file]').setInputFiles({name:'classroom.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved.packs[0]))});
  await expect(page.locator('.dash-pack-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.dash-pack-card')).toHaveCount(1);
});

test('Dashboard pack load prompts before clearing a live game and updates host in another tab',async({context})=>{
  const host=await context.newPage();
  await host.goto('?game=quickfire');
  await host.getByRole('button',{name:'Add ten points to team 1'}).click();
  await expect(host.locator('.quick-team-editor').first().locator('strong')).toHaveText('10');
  const dash=await context.newPage();
  await dash.goto('?page=dashboard&tab=games');
  await expect(dash.locator('.dash-game-card').last()).toContainText('10');
  await dash.locator('.dash-game-card').last().getByRole('button',{name:'Save questions'}).click();
  await dash.getByRole('textbox',{name:'Pack name'}).fill('My quiz');
  await dash.getByRole('button',{name:'Save pack'}).click();
  await expect(dash.locator('.dash-pack-card')).toHaveCount(1);
  dash.once('dialog',d=>d.dismiss());
  await dash.getByRole('button',{name:'Load into game'}).click();
  await expect(host.locator('.quick-team-editor').first().locator('strong')).toHaveText('10');
  dash.once('dialog',d=>d.accept());
  await dash.getByRole('button',{name:'Load into game'}).click();
  await expect(host.locator('.quick-team-editor').first().locator('strong')).toHaveText('0');
  await expect(dash.getByRole('status')).toContainText('Pack loaded');
  await host.reload();
  await expect(host.locator('.quick-team-editor').first().locator('strong')).toHaveText('0');
});

test('Dashboard new-match action preserves questions and team names',async({page})=>{
  await page.goto('?game=quickfire');
  await page.getByRole('textbox',{name:'Team 1 name'}).fill('My class');
  await page.getByRole('button',{name:'Add ten points to team 1'}).click();
  await page.goto('?page=dashboard&tab=games');
  await expect(page.locator('.dash-game-card').last()).toContainText('My class 10');
  page.once('dialog',d=>d.dismiss());
  await page.getByRole('button',{name:'Start fresh Quickfire Quiz match'}).click();
  await expect(page.locator('.dash-game-card').last()).toContainText('My class 10');
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Start fresh Quickfire Quiz match'}).click();
  await expect(page.locator('.dash-game-card').last()).toContainText('My class 0');
  await page.goto('?game=quickfire');
  await expect(page.getByRole('textbox',{name:'Team 1 name'})).toHaveValue('My class');
});

test('Malformed import is rejected without overwriting saved library',async({page})=>{
  await page.goto('?page=dashboard&tab=packs');
  await page.locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')});
  await expect(page.getByRole('alert')).toContainText('Import failed');
  await expect(page.locator('.dash-pack-card')).toHaveCount(0);
  expect(await page.evaluate(()=>localStorage.getItem('playlab-content-packs-v1'))).toBeNull();
});

for(const width of [360,390,768,1280]){
  test('Dashboard layout has no horizontal overflow at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:820});
    await page.goto('?page=dashboard');
    for(const tab of ['overview','games','packs']){
      await page.getByRole('button',{name:tab==='overview'?'Overview':tab==='games'?'My games':'Question packs',exact:true}).click();
      const dims=await page.evaluate(()=>({screen:innerWidth,page:document.documentElement.scrollWidth}));
      expect(dims.page,tab+' layout overflows').toBeLessThanOrEqual(dims.screen+1);
    }
  });
}
