import {test,expect} from '@playwright/test';

/** An explicit integration smoke on the organizer feature PR; no production
 * session creation on regular local builds or unrelated PRs.
 */
test('Actual Cloudflare room pairs a phone controller with a read-only audience board',async({page,browser})=>{
 test.skip(!['feature/organizer-dual-device-modes','feature/pregame-intro-and-rules'].includes(process.env.GITHUB_HEAD_REF),'Live relay smoke runs only for paired session feature work.');
 test.setTimeout(65_000);
 await page.goto('?page=dashboard&tab=setup&format=quickfire&devices=remote');
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Create paired session'}).click();
 await expect(page.getByRole('heading',{name:'Your game room is ready.'})).toBeVisible({timeout:15_000});
 const controllerUrl=await page.locator('#org-controller-url').inputValue();
 const displayUrl=await page.locator('#org-display-url').inputValue();
 const ctx=await browser.newContext();
 try{
  const audience=await ctx.newPage(),mc=await ctx.newPage();
  await audience.goto(displayUrl);
  await mc.goto(controllerUrl);
  await expect(mc.getByRole('heading',{name:'Get the crowd ready!'})).toBeVisible({timeout:15_000});
  await expect(audience.locator('.playlab-pregame-welcome')).toBeVisible({timeout:15_000});
  await mc.getByRole('button',{name:/Next: Meet the teams/}).click();
  await expect(audience.locator('.playlab-pregame-teams')).toBeVisible();
  await mc.getByRole('button',{name:/Next: Game rules/}).click();
  await expect(audience.locator('.playlab-pregame-rules')).toBeVisible();
  await audience.reload();
  await expect(audience.locator('.playlab-pregame-rules')).toBeVisible({timeout:15_000});
  await mc.getByRole('button',{name:'Start Game'}).click();
  await expect(mc.getByRole('button',{name:'Add ten points to team 1'})).toBeVisible({timeout:15_000});
  await expect(audience.locator('.quick-scores strong').first()).toHaveText('0',{timeout:15_000});
  await mc.getByRole('button',{name:'Add ten points to team 1'}).click();
  await expect(audience.locator('.quick-scores strong').first()).toHaveText('10',{timeout:15_000});
  await audience.reload();
  await expect(audience.locator('.quick-scores strong').first()).toHaveText('10',{timeout:15_000});
  const viewerWithHostRoute=await ctx.newPage();
  await viewerWithHostRoute.goto(displayUrl.replace('view=display','view=host'));
  await expect(viewerWithHostRoute.getByRole('heading',{name:'This is a view-only link'})).toBeVisible({timeout:15_000});
  await expect(viewerWithHostRoute.getByRole('button',{name:'Add ten points to team 1'})).toHaveCount(0);
 }finally{await ctx.close();}
});
