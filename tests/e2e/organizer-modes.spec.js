import {test,expect} from '@playwright/test';
const ROOM='0123456789abcdef',KEY='a'.repeat(48),VIEW='b'.repeat(48);
test('Organizer offers real display and separate MC workflows for both games',async({page})=>{
 await page.goto('?page=organizer');
 await expect(page.getByRole('heading',{name:'Choose your event setup.'})).toBeVisible();
 await expect(page.getByText('One laptop + projector')).toBeVisible();
 await expect(page.getByText('Display laptop + separate controller')).toBeVisible();
 await expect(page.locator('.org-mode-grid .org-game-link')).toHaveCount(4);
 await page.locator('.org-mode-grid .org-device-card').last().getByRole('link',{name:/Quickfire Quiz/}).click();
 await expect(page).toHaveURL(/devices=remote/);
 await expect(page).toHaveURL(/format=quickfire/);
});

test('Paired setup creates a room without resetting the locally saved match',async({page})=>{
 await page.route('**/sessions',async route=>{
   if(route.request().method()!=='POST')return route.fallback();
   const body=route.request().postDataJSON();
   expect(body.game).toBe('quickfire');
   expect(body.state.version).toBe(1);
   expect(body.state.teamNames).toHaveLength(2);
   await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({roomId:ROOM,controlKey:KEY,viewKey:VIEW,expiresIn:43200})});
 });
 await page.goto('?game=quickfire');
 await page.getByRole('button',{name:'Add ten points to team 1'}).click();
 const before=await page.evaluate(()=>localStorage.getItem('playlab-quickfire-state-v1'));
 await page.goto('?page=dashboard&tab=setup&format=quickfire&devices=remote');
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.getByRole('radio',{name:/Display laptop/})).toBeChecked();
 await page.getByRole('button',{name:'Create paired session'}).click();
 await expect(page).toHaveURL(new RegExp('page=organizer&room='+ROOM));
 await expect(page.getByRole('heading',{name:'Your game room is ready.'})).toBeVisible();
 const host=await page.locator('#org-controller-url').inputValue(),viewer=await page.locator('#org-display-url').inputValue();
 expect(new URL(host).searchParams.get('remote')).toBe(ROOM);
 expect(new URL(host).hash).toBe('#key='+KEY);
 expect(new URL(host).searchParams.get('view')).toBeNull();
 expect(new URL(viewer).hash).toBe('#key='+VIEW);
 expect(new URL(viewer).searchParams.get('view')).toBe('display');
 expect(await page.evaluate(()=>localStorage.getItem('playlab-quickfire-state-v1'))).toBe(before);
});

test('Failed pairing does not lose offline match or become an unpaired local game',async({page})=>{
 await page.route('**/sessions',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"Temporary service outage"}'}));
 await page.goto('?page=dashboard&tab=setup&format=survey&devices=remote');
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Create paired session'}).click();
 await expect(page.getByRole('alert')).toContainText('Temporary service outage');
 await expect(page).toHaveURL(/tab=setup/);
 expect(await page.evaluate(()=>localStorage.getItem('playlab-survey-showdown-v2'))).toBeNull();
});

test('Remote projector never silently displays local demo data while disconnected',async({page})=>{
 await page.goto('?game=survey&view=display&remote='+ROOM+'#key='+VIEW);
 await expect(page.getByRole('heading',{name:/Connecting to live session/})).toBeVisible();
 await expect(page.locator('.stage-answer-grid')).toHaveCount(0);
});

for(const width of [360,768,1280]){
 test('Device organizer and private links fit '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:850});
  await page.goto('?page=organizer');
  await expect(page.locator('.org-mode-grid .org-device-card')).toHaveCount(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
 });
}
