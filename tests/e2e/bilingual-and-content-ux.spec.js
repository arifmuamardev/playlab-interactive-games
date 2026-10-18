import {test,expect} from '@playwright/test';

test('The live catalog, setup, and dashboard share the EN/ID preference',async({page})=>{
  await page.goto('./');
  await expect(page.getByRole('heading',{name:/Every room/})).toBeVisible();
  await page.getByRole('button',{name:'Bahasa Indonesia'}).click();
  await expect(page.getByRole('heading',{name:/Setiap ruangan/})).toBeVisible();
  await page.goto('?page=dashboard&tab=setup&format=quickfire');
  await expect(page.getByRole('heading',{name:'Siapkan permainanmu.'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Pilih permainan'})).toBeVisible();
  await page.getByRole('button',{name:'Lanjut',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Pilih pertanyaan'})).toBeVisible();
  await page.getByRole('button',{name:'English'}).click();
  await expect(page.getByRole('heading',{name:'Choose your questions'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.lang)).toBe('en');
});

test('Host and projector update language across tabs without changing scores',async({page})=>{
  await page.goto('?game=quickfire');
  await page.getByRole('button',{name:'Add ten points to team 1'}).click();
  const popup=page.waitForEvent('popup');
  await page.getByRole('button',{name:/Open projector/}).click();
  const audience=await popup;
  await expect(audience.locator('.quick-counter')).toContainText('QUESTION');
  await page.getByRole('button',{name:'Bahasa Indonesia'}).click();
  await expect(audience.locator('.quick-counter')).toContainText('PERTANYAAN');
  await expect(audience.locator('.quick-footer')).toContainText('Diskusikan');
  await expect(audience.locator('.quick-scores strong').first()).toHaveText('10');
  await audience.getByRole('button',{name:'English'}).click();
  await expect(audience.locator('.quick-counter')).toContainText('QUESTION');
  expect(await page.evaluate(()=>localStorage.getItem('playlab-interface-language-v1'))).toBe('en');
  await audience.close();
});

for(const game of ['survey','quickfire']){
  test(game+' ready set can be previewed fully and copied into editable local pack safely',async({page})=>{
    await page.goto('?game='+game);
    if(game==='quickfire')await page.getByRole('button',{name:'Add ten points to team 1'}).click();
    else await page.locator('.reveal-button').first().click();
    const key=game==='survey'?'playlab-survey-showdown-v2':'playlab-quickfire-state-v1';
    const before=await page.evaluate(key=>localStorage.getItem(key),key);
    await page.goto('?page=dashboard&tab=setup&format='+game);
    await page.getByRole('button',{name:'Continue'}).click();
    await page.getByRole('radio',{name:/Ready-to-use classroom/}).check();
    await page.getByLabel('Search ready-to-play sets').fill('Classroom');
    if(game==='quickfire')await expect(page.locator('.setup-template-card')).toHaveCount(0);
    await page.getByLabel('Search ready-to-play sets').fill('');
    await expect(page.locator('.setup-template-card')).toHaveCount(5);
    await page.locator('.setup-template-card').first().click();
    await page.locator('.setup-template-full-preview summary').click();
    await expect(page.locator('.setup-template-full-preview>ol>li')).toHaveCount(8);
    await page.getByLabel('Show answers').check();
    await expect(page.locator('.setup-template-full-preview')).toContainText(game==='survey'?'points':'Correct answer');
    await page.getByRole('button',{name:'Customize this set'}).click();
    const editor=page.getByRole('dialog');
    await expect(editor).toBeVisible();
    if(game==='quickfire')await editor.locator('#quick-builder-question').fill('New draft question?');
    else await editor.locator('#editor-question').fill('New draft survey question?');
    await editor.getByRole('button',{name:'Save questions'}).click();
    await expect(editor).toHaveCount(0);
    await expect(page.locator('#setup-pack')).toBeVisible();
    const packs=await page.evaluate(()=>JSON.parse(localStorage.getItem('playlab-content-packs-v1')));
    expect(packs.packs).toHaveLength(1);
    expect(packs.packs[0].questions[0].question).toContain('New draft');
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(before);
  });
}

for(const {width,height} of [{width:1280,height:720},{width:1024,height:768},{width:1920,height:1080}]){
  for(const game of ['survey','quickfire']){
    test(game+' audience fits '+width+'×'+height+' projector',async({page})=>{
      await page.setViewportSize({width,height});
      await page.goto('?game='+game+'&view=display');
      const target=page.locator(game==='survey'?'.stage-bottom-brand':'.quick-footer');
      await expect(target).toBeVisible();
      const bottom=await target.evaluate(element=>element.getBoundingClientRect().bottom);
      expect(bottom,game+' footer should be in viewport').toBeLessThanOrEqual(height+2);
      const scroll=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));
      expect(scroll.width,game+' projector must not horizontally overflow').toBeLessThanOrEqual(scroll.viewport+1);
    });
  }
}
