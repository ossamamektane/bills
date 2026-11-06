// Layout checks cannot replace real-device safe-area, keyboard, and Dynamic Type testing.
const {testUrl}=require('./ui-fixture.cjs'); const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});const c=await b.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true});const p=await c.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(testUrl+'?t=2026-11-06T12:30:00&fresh=1&native=1&seed=1');const ev=s=>p.evaluate(s=>__R.ev(s),s);
for(const lang of ['en','fr','ar'])for(const theme of ['light','dark'])for(const dims of [{width:320,height:568},{width:390,height:844}]){
 await p.setViewportSize(dims);await ev(`lang=${JSON.stringify(lang)};set('r.lang',lang);set('r.theme',${JSON.stringify(theme)});applyTheme();applyLang();openSheet(null)`);await p.fill('#fName','Test');
 async function bounds(sel){return p.locator(sel).evaluate(e=>{let r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,scroll:e.scrollWidth,client:e.clientWidth}})}
 const editor=await bounds('#sbody');assert(editor.scroll<=editor.client+1,JSON.stringify({lang,theme,dims,editor}));
 await p.locator('[data-picker-for=fStartDate]').click();let date=await bounds('.pickDialog');assert(date.x>=-1&&date.right<=dims.width+1&&date.y>=-1&&date.bottom<=dims.height+1,JSON.stringify({lang,theme,dims,date}));await p.click('#cpCancel');
 await p.locator('#tAdd').scrollIntoViewIfNeeded();await p.click('#tAdd');let dialog=await bounds('.pickDialog');assert(dialog.x>=0&&dialog.right<=dims.width&&dialog.y>=0&&dialog.bottom<=dims.height,JSON.stringify({lang,theme,dims,dialog}));
 for(let sel of ['.timeWheel','.cpFooter']){let r=await bounds(sel);assert(r.x>=dialog.x-1&&r.right<=dialog.right+1&&r.bottom<=dialog.bottom+1,JSON.stringify({lang,theme,dims,sel,r,dialog}));}await p.click('#cpCancel');
 await p.locator('[data-tmode=wake]').scrollIntoViewIfNeeded();await p.locator('[data-tmode=wake]').click();await p.locator('#durationTrigger').click();let wheel=await bounds('.durationWheel');assert(wheel.w<=dims.width&&wheel.scroll<=wheel.client+1,JSON.stringify({lang,theme,dims,wheel}));await p.click('#cpCancel');await ev('closeSheet()');
}
assert.deepEqual(errs,[]);console.log('PASS: editor and picker bounds across 12 language/theme/device-size combinations');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
