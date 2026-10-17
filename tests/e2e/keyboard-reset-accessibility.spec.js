import {test,expect} from '@playwright/test';

test('Survey shortcuts respond only in the host, not text fields or help dialog',async({page})=>{
  await page.goto('?game=survey');
  const answers=page.locator('.reveal-button');
  await expect(answers.first()).toHaveAttribute('aria-pressed','false');
  await page.keyboard.press('1');
  await expect(answers.first()).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.stage-answer.is-revealed')).toHaveCount(1);
  await page.keyboard.press('x');
  await expect(page.locator('.strike.is-strike')).toHaveCount(1);
  await page.keyboard.press('z');
  await expect(page.locator('.strike.is-strike')).toHaveCount(0);
  await page.keyboard.press('1');
  await expect(page.locator('.stage-answer.is-revealed')).toHaveCount(0);
  const name=page.locator('#team-name-0');
  await name.focus();
  await page.keyboard.press('2');
  await page.keyboard.press('x');
  await expect(page.locator('.stage-answer.is-revealed')).toHaveCount(0);
  await expect(page.locator('.strike.is-strike')).toHaveCount(0);
  await page.getByRole('button',{name:'How to play'}).click();
  await expect(page.getByRole('dialog',{name:'How to play'})).toBeVisible();
  await page.keyboard.press('3');
  await expect(page.locator('.stage-answer.is-revealed')).toHaveCount(0);
});

test('Survey round reset requires confirmation and updates projector and scores',async({context})=>{
  const host=await context.newPage();
  await host.goto('?game=survey');
  const popup=host.waitForEvent('popup');
  await host.getByRole('button',{name:/Open projector view/}).click();
  const projector=await popup;
  await projector.waitForLoadState('domcontentloaded');
  await host.locator('.reveal-button').first().click();
  await host.locator('.award-btn--0').click();
  await expect(projector.locator('.team-score--0 .team-number')).toHaveText('34');
  host.once('dialog',dialog=>dialog.dismiss());
  await host.getByRole('button',{name:'Reset this round'}).click();
  await expect(projector.locator('.team-score--0 .team-number')).toHaveText('34');
  host.once('dialog',dialog=>dialog.accept());
  await host.getByRole('button',{name:'Reset this round'}).click();
  await expect(projector.locator('.team-score--0 .team-number')).toHaveText('0');
  await expect(projector.locator('.stage-answer.is-hidden')).toHaveCount(5);
  await host.locator('.reveal-button').first().click();
  await host.locator('.award-btn--0').click();
  await host.locator('.btn-next').click();
  host.once('dialog',dialog=>dialog.dismiss());
  await host.getByRole('button',{name:'Reset match'}).click();
  await expect(projector.locator('.team-score--0 .team-number')).toHaveText('34');
  host.once('dialog',dialog=>dialog.accept());
  await host.getByRole('button',{name:'Reset match'}).click();
  await expect(host.getByRole('combobox',{name:'Select round'})).toHaveValue('0');
  await expect(projector.locator('.team-score--0 .team-number')).toHaveText('0');
  await expect(projector.locator('.stage-answer.is-hidden')).toHaveCount(5);
});

test('Quickfire reset dialog cancels safely then clears both host and projector',async({context})=>{
  const host=await context.newPage();
  await host.goto('?game=quickfire');
  const popup=host.waitForEvent('popup');
  await host.getByRole('button',{name:/Open projector/}).click();
  const projector=await popup;
  await host.getByRole('button',{name:'Reveal correct answer'}).click();
  await host.getByRole('button',{name:'Add ten points to team 1'}).click();
  await expect(projector.locator('.quick-scores > div').first().locator('strong')).toHaveText('10');
  host.once('dialog',dialog=>dialog.dismiss());
  await host.getByRole('button',{name:'Reset match'}).click();
  await expect(projector.locator('.quick-option.correct')).toHaveCount(1);
  host.once('dialog',dialog=>dialog.accept());
  await host.getByRole('button',{name:'Reset match'}).click();
  await expect(projector.locator('.quick-option.correct')).toHaveCount(0);
  await expect(projector.locator('.quick-scores > div').first().locator('strong')).toHaveText('0');
  await expect(projector.locator('.quick-counter')).toContainText('01');
});

test('Every interactive host control has an accessible name and game landmarks',async({page})=>{
  for(const game of ['survey','quickfire']){
    await page.goto('?game='+game);
    await expect(page.getByRole('main')).toHaveCount(1);
    const unnamed=await page.locator('button:not([disabled])').evaluateAll(buttons=>buttons
      .filter(button=>!((button.getAttribute('aria-label')||button.getAttribute('title')||button.innerText||'').trim()))
      .map(button=>button.outerHTML.slice(0,160)));
    expect(unnamed,game+' unnamed buttons').toEqual([]);
    await expect(page.getByRole('button',{name:/Open projector/})).toBeVisible();
  }
});
