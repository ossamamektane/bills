// Regression for the shared time picker: scroll, boundaries, cancellation and layout.
const {testUrl}=require('./ui-fixture.cjs');
const {chromium}=require('playwright'); const assert=require('node:assert/strict');
(async()=>{
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Paris'});const p=await ctx.newPage(), errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(testUrl+'?t=2026-11-06T12:30:00&fresh=1&native=1&seed=1'); const ev=s=>p.evaluate(s=>__R.ev(s),s);
await p.click('#addBtn');await p.fill('#fName','Wheel');await p.click('#tAdd');
const d=await p.locator('.timePick .pickDialog').boundingBox();assert(d.width<390&&d.y>20&&d.y+d.height<824);
const hour=p.locator('[data-wheel=hour]'),min=p.locator('[data-wheel=minute]'),period=p.locator('[data-wheel=period]');
assert.equal(await hour.count(),1);assert.equal(await period.count(),1);
// Set 12:59 PM then scroll to the next hour and minute, crossing both boundaries.
await p.locator('[data-cp-hour="12"]').click();await p.locator('[data-cp-minute="59"]').click();await p.locator('[data-cp-period="1"]').click();
await hour.evaluate(e=>e.scrollTop+=44);await min.evaluate(e=>e.scrollTop+=44);await p.waitForTimeout(250);
assert.equal(await hour.getAttribute('aria-valuetext'),'1');assert.equal(await min.getAttribute('aria-valuetext'),'00');await p.click('#cpSet');assert.equal(await p.locator('#wInput').inputValue(),'13:00');
// Cancel must leave the previous value unchanged, even after scrolling.
await p.click('#tAdd');await min.evaluate(e=>e.scrollTop+=44);await p.waitForTimeout(220);await p.click('#cpCancel');assert.deepEqual(await ev('F.times'),['13:00']);
// Explicit keyboard input and 12 AM / PM must persist canonical time.
await p.click('#tAdd');await p.locator('[data-cp-hour="12"]').click();await p.locator('[data-cp-minute="0"]').click();await p.locator('[data-cp-period="0"]').click();await min.focus();await p.keyboard.press('ArrowDown');await p.click('#cpSet');assert.equal(await p.locator('#wInput').inputValue(),'00:01');
// Layout and stable colours in both themes and all supported languages.
for(const lang of ['en','fr','ar'])for(const theme of ['light','dark'])for(const width of [320,390]){
 await p.setViewportSize({width,height:740});await ev(`lang=${JSON.stringify(lang)};set('r.lang',lang);set('r.theme',${JSON.stringify(theme)});applyTheme();applyLang();`);
 const c=await p.locator('#tAdd').evaluate(e=>[getComputedStyle(e).color,getComputedStyle(e).webkitTextFillColor]);assert.equal(c[0],c[1]);
 await p.click('#tAdd');const box=await p.locator('.timePick .pickDialog').boundingBox();assert(box.width<width && box.x>0 && box.x+box.width<=width);assert.equal(await p.locator('.wheelCol').count(),3);await p.click('#cpCancel');
}
assert.deepEqual(errors,[]);assert.deepEqual(await p.evaluate(()=>__errs),[]);console.log('PASS: compact wheel scrolling, boundaries, keyboard, cancel, noon, midnight, 12 locale/theme layouts');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
