// Recurrence is a child draft: cancelling restores all dependent values, not just the unit.
const {testUrl}=require('./ui-fixture.cjs'), {chromium}=require('playwright'), assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
for(const size of [{width:280,height:480},{width:320,height:568},{width:390,height:844},{width:568,height:320}]) for(const lang of ['en','fr','ar']) for(const theme of ['light','dark']){
 const p=await b.newPage({viewport:size,isMobile:true,hasTouch:true,reducedMotion:'reduce'}), errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(testUrl+'?t=2026-11-06T12:30:00&fresh=1&native=1&seed=1&lang='+lang);const ev=s=>p.evaluate(s=>__R.ev(s),s);await ev(`set('r.theme',${JSON.stringify(theme)});applyTheme();openSheet(null)`);
 await p.fill('#fName','Draft');await ev(`F.times=['08:15','12:30'];F.wake=null;paintSheet()`);const original=await ev('JSON.stringify(F)');
 await p.locator('#intervalTrigger').click();assert(await p.locator('#sheet').evaluate(e=>e.classList.contains('on')));
 const r=await p.locator('#intervalPick .pickDialog').boundingBox();assert(r.x>=0&&r.y>=0&&r.x+r.width<=size.width+1&&r.y+r.height<=size.height+1,JSON.stringify({size,lang,theme,r}));
 await p.locator('[data-unit=h]').click();assert.equal(await ev('F.times.length'),1);await p.locator('[data-unit=d]').click();assert.equal(await ev('F.times.length'),2);await p.locator('[data-unit=h]').click();await p.keyboard.press('Escape');assert.equal(await ev('JSON.stringify(F)'),original);assert(await p.locator('#sheet').evaluate(e=>e.classList.contains('on')));
 await p.locator('#intervalTrigger').click();await p.locator('[data-unit=w]').click();await p.locator('[data-stp=n][data-d="1"]').click();await p.locator('#intervalSet').click();assert.equal(await ev('F.unit'), 'w');assert.equal(await ev('N()'),2);assert.equal(await ev('F.times.length'),2);assert(await p.locator('#intervalTrigger').innerText().then(s=>s.length>0));
 await p.locator('[data-picker-for=fStartDate]').scrollIntoViewIfNeeded();await p.locator('[data-picker-for=fStartDate]').click();assert(await p.locator('#customPick').evaluate(e=>e.classList.contains('on')));await p.locator('#cpCancel').click();
 await p.locator('#intervalTrigger').scrollIntoViewIfNeeded();await p.locator('#intervalTrigger').click();await p.locator('[data-unit=d]').click();assert(await p.evaluate(()=>window.__nat.back()));assert.equal(await ev('F.unit'),'w');assert(await p.locator('#sheet').evaluate(e=>e.classList.contains('on')));
 await p.locator('#saveBtn').click();let it=await ev(`items.find(x=>x.name==='Draft')`);assert.equal(it.unit,'w');assert.equal(it.n,2);assert.deepEqual(it.times,['08:15','12:30']);assert.deepEqual(errors,[]);await p.close();
}
await b.close();console.log('PASS: nested recurrence cancel, back, commit and date picker across 24 layouts');})().catch(e=>{console.error(e);process.exit(1)});
