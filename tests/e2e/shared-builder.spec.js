import {test,expect} from '@playwright/test';

test('Shared Survey builder validates new rounds and updates projector without losing editor controls',async({context})=>{
  const host=await context.newPage();
  await host.goto('?game=survey');
  const popup=host.waitForEvent('popup');
  await host.getByRole('button',{name:/Open projector view/}).click();
  const projector=await popup;
  await host.getByRole('button',{name:'Edit questions'}).click();
  const dialog=host.getByRole('dialog',{name:'Edit question bank'});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('navigation',{name:'Question list'})).toBeVisible();
  await expect(dialog.locator('.editor-list-item')).toHaveCount(6);
  await dialog.getByRole('button',{name:'Add question'}).click();
  await expect(dialog.locator('.editor-list-item')).toHaveCount(7);
  await dialog.getByRole('button',{name:'Save questions'}).click();
  await expect(dialog.getByRole('alert')).toContainText('Question 7');
  await dialog.locator('#editor-question').fill('Name a good study habit.');
  await expect(dialog.locator('.editor-answer-row')).toHaveCount(2);
  await expect(dialog.getByRole('button',{name:'Remove answer 1'})).toBeDisabled();
  await dialog.getByRole('button',{name:'Add answer'}).click();
  await expect(dialog.locator('.editor-answer-row')).toHaveCount(3);
  await dialog.getByRole('button',{name:'Remove answer 3'}).click();
  await expect(dialog.locator('.editor-answer-row')).toHaveCount(2);
  await dialog.getByRole('textbox',{name:'Answer 1'}).fill('Review notes');
  await dialog.getByRole('textbox',{name:'Answer 2'}).fill('Practice regularly');
  await dialog.getByRole('button',{name:'Save questions'}).click();
  await expect(dialog).toHaveCount(0);
  await host.getByRole('combobox',{name:'Select round'}).selectOption('6');
  await expect(projector.locator('.stage-question h1')).toHaveText('Name a good study habit.');
  await expect(host.locator('.reveal-button')).toHaveCount(2);
});

test('Shared editor shows consistent close, cancel, save controls in both games',async({page})=>{
  for(const game of ['survey','quickfire']){
    await page.goto('?game='+game);
    await page.getByRole('button',{name:game==='survey'?'Edit questions':'Edit question bank'}).click();
    const editor=page.getByRole('dialog',{name:game==='survey'?'Edit question bank':'Edit trivia questions'});
    await expect(editor.getByRole('navigation',{name:'Question list'})).toBeVisible();
    await expect(editor.getByRole('button',{name:'Save questions'})).toBeVisible();
    await expect(editor.getByRole('button',{name:'Cancel'})).toBeVisible();
    await expect(editor.locator('.editor-list-item')).toHaveCount(6);
    await editor.getByRole('button',{name:'Cancel'}).click();
    await expect(editor).toHaveCount(0);
  }
});
