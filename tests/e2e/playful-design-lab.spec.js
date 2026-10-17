import {test,expect} from '@playwright/test';

test('Playful design lab shows an illustrated catalog while preserving live routes',async({page})=>{
  await page.goto('?page=design-lab');
  await expect(page.getByRole('heading',{name:/Every room/})).toBeVisible();
  await expect(page.getByRole('heading',{name:/Pick a game/})).toBeVisible();
  await expect(page.locator('.pf-game-card')).toHaveCount(4);
  await expect(page.locator('.pf-art-board')).toHaveCount(1);
  await expect(page.locator('.pf-quiz-art')).toHaveCount(1);
  await expect(page.getByText('DESIGN LAB — playful visual direction')).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Design preview navigation'}).getByRole('link',{name:'Game catalog'})).toHaveAttribute('aria-current','page');
  await expect(page.locator('.pf-game-card.is-coming')).toHaveCount(2);
  await expect(page.locator('.pf-card-actions')).toHaveCount(2);
  await expect(page.getByRole('link',{name:/Current website/})).toHaveAttribute('href','./');
  await expect(page.getByRole('link',{name:'Set up game'})).toHaveCount(2);
  await expect(page.getByRole('link',{name:'Set up game'}).first()).toHaveAttribute('href','?page=dashboard&tab=setup&format=survey');
});
test('Playful design lab dashboard previews real local totals and links to working pages',async({page})=>{
  await page.goto('?game=quickfire');
  await page.getByRole('button',{name:'Add ten points to team 1'}).click();
  await page.goto('?page=design-lab');
  await page.getByRole('navigation',{name:'Design preview navigation'}).getByRole('link',{name:'Dashboard'}).click();
  await expect(page).toHaveURL(/page=design-lab&screen=dashboard/);
  await expect(page.getByRole('heading',{name:/Ready, set/})).toBeVisible();
  await expect(page.locator('.pf-dashboard-stats strong')).toHaveText(['2','0','1']);
  await expect(page.getByRole('navigation',{name:'Design preview navigation'}).getByRole('link',{name:'Dashboard'})).toHaveAttribute('aria-current','page');
  await expect(page.locator('.pf-dash-game')).toHaveCount(2);
  await expect(page.locator('.pf-dash-game').last()).toContainText('Team A');
  await expect(page.getByRole('link',{name:/Create a game session/})).toHaveAttribute('href','?page=dashboard&tab=setup');
  await page.getByRole('link',{name:'Open question library'}).click();
  await expect(page).toHaveURL(/page=dashboard&tab=packs/);
});
for(const width of [360,390,768,1280]){
  test('Playful catalog and dashboard have no horizontal document overflow at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:840});
    for(const screen of ['catalog','dashboard']){
      await page.goto('?page=design-lab'+(screen==='dashboard'?'&screen=dashboard':''));
      await expect(page.locator('.playful-lab')).toBeVisible();
      const metrics=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));
      expect(metrics.width,'overflow in '+screen+' at '+width).toBeLessThanOrEqual(metrics.viewport+1);
    }
  });
}
test('Existing homepage, host and dashboard continue to render independently',async({page})=>{
  await page.goto('./');
  await expect(page.locator('.hub-hero')).toBeVisible();
  await expect(page.locator('.playful-lab')).toHaveCount(0);
  await page.goto('?game=survey');
  await expect(page.locator('.host-shell')).toBeVisible();
  await expect(page.locator('.playful-lab')).toHaveCount(0);
  await page.goto('?page=dashboard');
  await expect(page.locator('.dash-shell')).toBeVisible();
  await expect(page.locator('.playful-lab')).toHaveCount(0);
});
