import {test,expect} from '@playwright/test';

test('Quickfire: undo latest score exactly, persist, synchronize and avoid subtraction below zero',async({context})=>{
  const host=await context.newPage();
  await host.goto('?game=quickfire');
  const opened=host.waitForEvent('popup');
  await host.getByRole('button',{name:/Open projector/}).click();
  const projector=await opened;
  await expect(host.getByRole('button',{name:'Subtract ten points from team 1'})).toBeDisabled();
  await expect(host.getByRole('button',{name:/Undo last score change/})).toBeDisabled();
  await host.getByRole('button',{name:'Add ten points to team 1'}).click();
  await host.getByRole('button',{name:'Add ten points to team 1'}).click();
  await expect(projector.locator('.quick-scores > div').first().locator('strong')).toHaveText('20');
  await host.getByRole('button',{name:/Undo last score change/}).click();
  await expect(projector.locator('.quick-scores > div').first().locator('strong')).toHaveText('10');
  await expect(host.getByRole('button',{name:/Undo last score change/})).toBeDisabled();
  await host.reload();
  await expect(host.locator('.quick-team-editor').first().locator('strong')).toHaveText('10');
  await host.getByRole('button',{name:'Subtract ten points from team 1'}).click();
  await expect(projector.locator('.quick-scores > div').first().locator('strong')).toHaveText('0');
  await host.keyboard.press('u');
  await expect(projector.locator('.quick-scores > div').first().locator('strong')).toHaveText('10');
  await expect(host.getByRole('button',{name:'Reveal correct answer'})).toHaveAttribute('aria-pressed','false');
});

test('Quickfire: keyboard controls operate the game but never intercept typing or modal edits',async({page})=>{
  await page.goto('?game=quickfire');
  await page.keyboard.press('r');
  await expect(page.getByRole('button',{name:'Hide answer'})).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('n');
  await expect(page.locator('.quick-nav>span')).toHaveText('2 / 6');
  await expect(page.getByRole('button',{name:'Reveal correct answer'})).toHaveAttribute('aria-pressed','false');
  await page.keyboard.press('p');
  await expect(page.locator('.quick-nav>span')).toHaveText('1 / 6');
  await page.getByRole('textbox',{name:'Team 1 name'}).focus();
  await page.keyboard.press('n');
  await page.keyboard.press('r');
  await expect(page.locator('.quick-nav>span')).toHaveText('1 / 6');
  await expect(page.getByRole('button',{name:'Reveal correct answer'})).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:'Edit question bank'}).click();
  await expect(page.getByRole('dialog',{name:'Edit trivia questions'})).toBeVisible();
  await page.keyboard.press('n');
  await page.keyboard.press('r');
  await expect(page.locator('.quick-nav>span')).toHaveText('1 / 6');
  await page.getByRole('dialog',{name:'Edit trivia questions'}).getByRole('button',{name:'Cancel'}).click();
});

test('Survey: operator status and team toggles remain consistent, zero-bank awards are blocked',async({context})=>{
  const host=await context.newPage();
  await host.goto('?game=survey');
  const opened=host.waitForEvent('popup');
  await host.getByRole('button',{name:/Open projector view/}).click();
  const projector=await opened;
  await expect(host.locator('.gameplay-status-strip')).toContainText('Answers in play');
  await expect(host.locator('.award-btn--0')).toBeDisabled();
  await expect(host.locator('.award-btn--1')).toBeDisabled();
  await expect(host.locator('.select-team--0')).toHaveAttribute('aria-pressed','true');
  await host.locator('.select-team--1').click();
  await expect(host.locator('.select-team--1')).toHaveAttribute('aria-pressed','true');
  await host.locator('.reveal-button').first().click();
  await expect(host.locator('.award-btn--0')).toBeEnabled();
  await expect(host.locator('.gameplay-status-strip')).toContainText('1 of 5 · 34 points');
  await host.locator('.award-btn--0').click();
  await expect(host.locator('.gameplay-status-strip')).toContainText('Round finished');
  await expect(projector.locator('.team-score--0 .team-number')).toHaveText('34');
});

for(const width of [360,390,768,1280]){
  test('Playful game host layout avoids horizontal overflow at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:850});
    for(const game of ['survey','quickfire']){
      await page.goto('?game='+game);
      await expect(page.locator('.gameplay-status-strip')).toBeVisible();
      const widthCheck=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
      expect(widthCheck.document,game+' host overflow at '+width+'px').toBeLessThanOrEqual(widthCheck.viewport+1);
    }
  });
}
