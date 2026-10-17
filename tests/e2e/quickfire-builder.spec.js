import {test,expect} from '@playwright/test';

test('Quickfire visual builder adds a question, validates fields and synchronizes the projector',async({context})=>{
  const host=await context.newPage();
  await host.goto('?game=quickfire');
  const opened=host.waitForEvent('popup');
  await host.getByRole('button',{name:/Open projector/}).click();
  const projector=await opened;
  await host.getByRole('button',{name:'Edit question bank'}).click();
  const dialog=host.getByRole('dialog',{name:'Edit trivia questions'});
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.editor-list-item')).toHaveCount(6);
  await dialog.getByRole('button',{name:'Add question'}).click();
  await expect(dialog.locator('.editor-list-item')).toHaveCount(7);
  await dialog.getByRole('button',{name:'Save questions'}).click();
  await expect(dialog.getByRole('alert')).toContainText('Question 7');
  await dialog.locator('#quick-builder-question').fill('What is the correct test answer?');
  for(const [i,value] of ['Alpha','Bravo','Charlie','Delta'].entries()){
    await dialog.locator('#builder-choice-'+i).fill(value);
  }
  await dialog.getByRole('radio',{name:'Correct answer B'}).check();
  await dialog.locator('#quick-builder-explanation').fill('Bravo is the correct answer.');
  host.once('dialog',d=>d.accept());
  await dialog.getByRole('button',{name:'Save questions'}).click();
  await expect(dialog).toHaveCount(0);
  for(let i=0;i<6;i++)await host.getByRole('button',{name:/^Next/}).click();
  await expect(projector.locator('.quick-question')).toHaveText('What is the correct test answer?');
  await host.getByRole('button',{name:'Reveal correct answer'}).click();
  await expect(projector.locator('.quick-option.correct')).toContainText('Bravo');
});

test('Quickfire JSON import validates and cancelled save preserves original question bank',async({page})=>{
  await page.goto('?game=quickfire');
  await page.getByRole('button',{name:'Edit question bank'}).click();
  const dialog=page.getByRole('dialog',{name:'Edit trivia questions'});
  await dialog.locator('.builder-json-import summary').click();
  await dialog.locator('#quick-builder-json').fill('broken json');
  await dialog.getByRole('button',{name:'Load JSON into draft'}).click();
  await expect(dialog.getByRole('alert')).toContainText('Could not load JSON');
  const question={question:'Imported classroom question?',options:['One','Two','Three','Four'],answer:3,explanation:'Fourth answer'};
  await dialog.locator('#quick-builder-json').fill(JSON.stringify({questions:[question]}));
  await dialog.getByRole('button',{name:'Load JSON into draft'}).click();
  await expect(dialog.locator('.editor-list-item')).toHaveCount(1);
  page.once('dialog',d=>d.dismiss());
  await dialog.getByRole('button',{name:'Save questions'}).click();
  await expect(dialog).toBeVisible();
  await page.getByRole('button',{name:'Cancel'}).click();
  await expect(page.locator('.quick-question')).toContainText('Planet manakah');
  await page.getByRole('button',{name:'Edit question bank'}).click();
  const reopened=page.getByRole('dialog',{name:'Edit trivia questions'});
  await expect(reopened.locator('.editor-list-item')).toHaveCount(6);
  await reopened.getByRole('button',{name:'Cancel'}).click();
});
