// Browser checks for task-editor scroll clearance and the 12-hour Add time dialog.
// Does not substitute for iPhone WebKit, real touch, or VoiceOver testing.
const {testUrl}=require('./ui-fixture.cjs');
const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const c=await b.newContext({viewport:{width:390,height:740},isMobile:true,hasTouch:true,timezoneId:'Europe/Paris'}),p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.goto(testUrl+'?t=2026-11-06T12:30:00&fresh=1&native=1&seed=1');await p.waitForTimeout(250);const ev=s=>p.evaluate(s=>__R.ev(s),s);
 assert.equal(await p.locator('#zoneNote').count(),0);
 for(const clock of ['24','12']){
   await ev(`set('r.clock','${clock}');openSheet(null)`);await p.fill('#fName','Clock '+clock);await p.click('#tAdd');
   assert.equal(await p.locator('[data-cp-period]').count(),2);assert.equal(await p.locator('[data-cp-hour]').count(),12);
   // Noon, midnight and a PM time must use canonical 24-hour storage.
   for(const [period,expected] of [['0','00:00'],['1','12:00']]){
     await p.locator('[data-cp-hour="12"]').click();await p.locator('[data-cp-minute="0"]').click();await p.locator(`[data-cp-period="${period}"]`).click();
     assert.equal(await ev('hm(CP.minute)'),expected);
   }
   await p.locator('[data-cp-hour="2"]').click();await p.locator('[data-cp-minute="25"]').click();await p.locator('[data-cp-period="1"]').click();await p.click('#cpSet');
   assert.deepEqual(await ev('F.times'),['14:25']);assert.equal(await ev('get("r.clock")'),clock);await ev('closeSheet()');
 }
 // Existing tasks have extra action controls: all controls must scroll above the fixed footer.
 for(const lang of ['en','fr','ar'])for(const theme of ['light','dark'])for(const height of [568,740,844]){
  await p.setViewportSize({width:320,height});await ev(`lang=${JSON.stringify(lang)};set('r.lang',lang);set('r.theme',${JSON.stringify(theme)});applyTheme();applyLang();openSheet(items.find(i=>i.id==='rent'))`);await p.waitForTimeout(150);
  assert.equal(await p.locator('#hint').evaluate(e=>!!e.closest('#sbody')),true);
  const g=await p.locator('#tAdd');await g.scrollIntoViewIfNeeded();const info=await p.evaluate(()=>{const x=document.querySelector('#tAdd').getBoundingClientRect(),sc=document.querySelector('#sbody').getBoundingClientRect(),f=document.querySelector('#saveBtn').getBoundingClientRect();return {top:x.top,bottom:x.bottom,scTop:sc.top,scBottom:sc.bottom,saveBottom:f.bottom}});
  assert(info.top>=info.scTop-1&&info.bottom<=info.scBottom+1&&info.scTop>=info.saveBottom-1,JSON.stringify(info));
  await g.click();assert.equal(await p.locator('[data-cp-period]').count(),2);await p.click('#cpCancel');
  await p.locator('#delBtn').scrollIntoViewIfNeeded();const end=await p.evaluate(()=>{const x=document.querySelector('#delBtn').getBoundingClientRect(),sc=document.querySelector('#sbody').getBoundingClientRect();return x.bottom<=sc.bottom+1});assert(end);
  const colors=await p.locator('.tgh .ot b').first().evaluate(e=>({ink:getComputedStyle(document.body).color,actual:getComputedStyle(e).color,fill:getComputedStyle(e).webkitTextFillColor}));assert.equal(colors.actual,colors.ink);assert.equal(colors.fill,colors.ink);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(await p.evaluate(()=>__errs),[]);console.log('PASS: no footer, AM/PM noon/midnight, 12/24 preference, editor scroll clearance across 18 layouts');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
