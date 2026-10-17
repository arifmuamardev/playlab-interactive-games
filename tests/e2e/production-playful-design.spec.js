import {test,expect} from '@playwright/test';

test('Approved playful homepage is the actual public catalog, not a Design Lab preview',async({page})=>{
  await page.goto('./');
  await expect(page.locator('.pf-production .pf-hero')).toBeVisible();
  await expect(page.getByRole('heading',{name:/Every room/})).toBeVisible();
  await expect(page.locator('.pf-game-card')).toHaveCount(4);
  await expect(page.locator('.pf-game-card.is-coming')).toHaveCount(2);
  await expect(page.locator('.pf-lab-ribbon')).toHaveCount(0);
  await expect(page.getByRole('navigation',{name:'Main navigation'})).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'My dashboard'})).toHaveAttribute('href','?page=dashboard');
  await expect(page.getByRole('link',{name:'Set up game'})).toHaveCount(2);
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'My dashboard'}).click();
  await expect(page).toHaveURL(/page=dashboard/);
  await expect(page.locator('.dash-playful .dash-nav')).toBeVisible();
  await expect(page.locator('.dash-playful .dash-game-card')).toHaveCount(2);
});

test('Playful dashboard is functional: save pack, navigate and retain real counts',async({page})=>{
  await page.goto('?page=dashboard');
  await expect(page.getByRole('heading',{name:'Your dashboard'})).toBeVisible();
  await expect(page.getByRole('heading',{name:/Ready, set/})).toBeVisible();
  await expect(page.locator('.dash-playful .dash-intro-mark')).toContainText('GO!');
  await expect(page.locator('.dash-stats strong')).toHaveText(['2','0','0']);
  await page.getByRole('button',{name:'My games',exact:true}).click();
  await expect(page.locator('.dash-game-card--survey')).toBeVisible();
  await expect(page.locator('.dash-game-card--quickfire')).toBeVisible();
  await page.locator('.dash-game-card--survey').getByRole('button',{name:'Save questions'}).click();
  await page.getByRole('textbox',{name:'Pack name'}).fill('Fun lesson');
  await page.getByRole('button',{name:'Save pack',exact:true}).click();
  await expect(page.locator('.dash-pack-card')).toHaveCount(1);
  await page.getByRole('button',{name:'Overview'}).click();
  await expect(page.locator('.dash-stats strong')).toHaveText(['2','1','0']);
  await page.getByRole('button',{name:'Game setup'}).click();
  await expect(page.getByRole('heading',{name:'Get your game ready.'})).toBeVisible();
});

for(const width of [360,390,768,1280]){
  test('Actual playful catalog and working dashboard fit '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:810});
    for(const url of ['./','?page=dashboard','?page=dashboard&tab=games','?page=dashboard&tab=packs']){
      await page.goto(url);
      const info=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
      expect(info.document,url+' overflow').toBeLessThanOrEqual(info.viewport+1);
    }
  });
}
