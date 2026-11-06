// Behavioral and layout checks for nested bottom sheets using synthetic data.
const {testUrl}=require('./ui-fixture.cjs'), {chromium}=require('playwright'), assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
for(const size of [{width:280,height:480},{width:320,height:568},{width:390,height:844},{width:568,height:320}]) for(const lang of ['en','fr','ar']) for(const theme of ['light','dark']) {
 const p=await browser.newPage({viewport:size,isMobile:true,hasTouch:true,reducedMotion:'reduce'}); const errors=[]; p.on('pageerror',e=>errors.push(e.message));
 await p.goto(testUrl+'?t=2026-11-06T12:30:00&fresh=1&native=1&seed=1&lang='+lang); const ev=s=>p.evaluate(s=>__R.ev(s),s);
 await ev(`set('r.theme',${JSON.stringify(theme)});applyTheme()`);
 async function bounds(sel){const r=await p.locator(sel).boundingBox();assert(r&&r.x>=-0.5&&r.y>=-0.5&&r.x+r.width<=size.width+.5&&r.y+r.height<=size.height+.5,JSON.stringify({sel,size,lang,theme,r}));return r;}
 async function visibleByScroll(sel){await p.locator(sel).scrollIntoViewIfNeeded();assert(await p.locator(sel).isVisible(),sel)}
 // Initial wake-up question is a pop-up, and its nested time picker can cancel.
 await bounds('#ndCard');assert.equal(await p.locator('.wakeOverlay').evaluate(e=>getComputedStyle(e).backgroundColor),(theme==='dark'?'rgba(0, 0, 0, 0.6)':'rgba(0, 0, 0, 0.32)'));
 await visibleByScroll('[data-picker-for=wakeInput]');await p.locator('[data-picker-for=wakeInput]').click();await bounds('#customPick .pickDialog');await p.locator('#cpCancel').click();await visibleByScroll('[data-act=ndNo]');await p.locator('[data-act=ndNo]').click();assert.equal(await p.locator('.wakeOverlay').count(),0);
 const add=await p.locator('#addBtn').boundingBox();assert(Math.abs(add.x+add.width/2-size.width/2)<1,JSON.stringify({size,add}));
 await p.locator('#addBtn').click(); await bounds('#sheet');assert.equal(await p.locator('#sheet').evaluate(e=>getComputedStyle(e).overflow),'hidden');assert.equal(await p.locator('#sheet').evaluate(e=>getComputedStyle(e).borderBottomLeftRadius),'0px');
 await p.locator('#fName').fill('Test task');await p.locator('#fName').press('Enter');assert.equal(await p.locator('#fName').inputValue(),'Test task');
 await visibleByScroll('[data-picker-for=fStartDate]');await p.locator('[data-picker-for=fStartDate]').click();await bounds('#customPick .pickDialog');assert(await p.locator('#sheet').evaluate(e=>e.classList.contains('on')));await p.keyboard.press('Escape');assert(await p.locator('#sheet').evaluate(e=>e.classList.contains('on')));assert.equal(await p.locator('#fName').inputValue(),'Test task');await p.locator('#closeBtn').click();
 await ev('openAll()');await bounds('#all');await visibleByScroll('#aList [data-aid]:first-child');
 await p.locator('#aList [data-aid]:first-child').click();await bounds('#sheet');assert(await p.locator('#sheet').evaluate(e=>e.classList.contains('nested')));assert(await p.locator('#all').evaluate(e=>e.classList.contains('on')));
 // System Back closes only the child, leaving management available underneath.
 assert(await p.evaluate(()=>window.__nat.back()));assert(!(await p.locator('#sheet').evaluate(e=>e.classList.contains('on'))));assert(await p.locator('#all').evaluate(e=>e.classList.contains('on')));await p.locator('#aList [data-aid]:first-child').click();
 await p.locator('#fName').fill('Renamed task');await p.locator('#saveBtn').click();assert(await p.locator('#all').evaluate(e=>e.classList.contains('on')));assert(await p.locator('#aList').innerText().then(s=>s.includes('Renamed task')));await p.locator('#aClose').click();
 await ev('editWake()');await bounds('#tsheet');await visibleByScroll('[data-picker-for=tInput]');await p.locator('[data-picker-for=tInput]').click();await bounds('#customPick .pickDialog');await p.locator('#cpCancel').click();await p.locator('#tClose').click();
 await ev('openCatch()');if(await p.locator('#catch').evaluate(e=>e.classList.contains('on'))){await bounds('#catch');await visibleByScroll('#cLater');await p.locator('#cLater').click();await bounds('#later');assert.equal(await p.locator('#lScrim').evaluate(e=>getComputedStyle(e).zIndex),'54');await p.keyboard.press('Escape');assert(!(await p.locator('#later').evaluate(e=>e.classList.contains('on'))));assert(await p.locator('#catch').evaluate(e=>e.classList.contains('on')));await visibleByScroll('#cOther');await p.locator('#cOther').click();assert(await p.locator('#tsheet').evaluate(e=>e.classList.contains('on')));await p.keyboard.press('Escape');assert(!(await p.locator('#tsheet').evaluate(e=>e.classList.contains('on'))));assert(await p.locator('#catch').evaluate(e=>e.classList.contains('on')));await p.locator('#cClose').click();}
 assert.deepEqual(errors,[]);await p.close();
}
await browser.close();console.log('PASS: bottom sheets for wake, editor, nested picker, manage, wake edit and catch-up at 4 sizes, 3 languages and 2 themes');})().catch(e=>{console.error(e);process.exit(1)});
