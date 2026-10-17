import {test,expect} from '@playwright/test';

for(const width of [360,390,768,1280]){
  test(`Game catalog has no horizontal viewport overflow at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:820});
    await page.goto('./');
    await expect(page.getByRole('heading',{name:/Make every room/i})).toBeVisible();
    await expect(page.locator('.pf-game-card')).toHaveCount(4);
    const dimensions=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport+1);
  });
}

test('Audience display works offline after first online visit and cache warmup',async({context})=>{
  const page=await context.newPage();
  await page.goto('?game=quickfire&view=display');
  await expect(page.locator('.quick-question')).toBeVisible();
  await page.evaluate(async()=>{
    const registration=await navigator.serviceWorker.ready;
    if(!registration.active)throw Error('Service worker did not activate');
  });
  // Reload once online under service worker control; it should cache this visited URL itself.
  await page.reload();
  await page.waitForFunction(async()=>!!(await caches.match(location.href)));
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.quick-question')).toContainText('Planet manakah');
  await expect(page.locator('.quick-option')).toHaveCount(4);
  await context.setOffline(false);
});

for(const game of ['survey','quickfire']){
  for(const width of [390,1280]){
    test(`${game} host and projector render at ${width}px`,async({context})=>{
      const host=await context.newPage();
      await host.setViewportSize({width,height:820});
      await host.goto(`?game=${game}`);
      await expect(host.locator('.host-main')).toBeVisible();
      const opener=host.getByRole('button',{name:/Open projector/});
      await expect(opener).toBeVisible();
      const popupPromise=host.waitForEvent('popup');
      await opener.click();
      const display=await popupPromise;
      await display.setViewportSize({width,height:820});
      await expect(display.locator(game==='survey'?'.stage-answer':'.quick-option').first()).toBeVisible();
      await display.close();
      await host.close();
    });
  }
}
