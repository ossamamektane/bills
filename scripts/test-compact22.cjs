// Landscape and compact-height dialogs must remain reachable and scrollable.
const {testUrl}=require('./ui-fixture.cjs');const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});const c=await b.newContext({viewport:{width:568,height:320},isMobile:true,hasTouch:true});const p=await c.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(testUrl+'?t=2026-11-06T12:30:00&fresh=1&native=1&seed=1');const ev=s=>p.evaluate(s=>__R.ev(s),s);
for(const lang of ['en','fr','ar'])for(const dims of [{width:568,height:320},{width:844,height:390},{width:320,height:460}]){
 await p.setViewportSize(dims);await ev(`lang=${JSON.stringify(lang)};set('r.lang',lang);applyLang();openSheet(null)`);await p.locator('[data-picker-for=fStartDate]').scrollIntoViewIfNeeded();await p.locator('[data-picker-for=fStartDate]').click();
 const dialog=p.locator('.pickDialog');const rect=await dialog.boundingBox();assert(rect.x>=-1&&rect.y>=-1&&rect.x+rect.width<=dims.width+1&&rect.y+rect.height<=dims.height+1,JSON.stringify({lang,dims,rect}));await p.locator('#cpSet').scrollIntoViewIfNeeded();await p.click('#cpSet');
 await p.locator('#tAdd').scrollIntoViewIfNeeded();await p.click('#tAdd');assert.equal(await p.locator('[data-cp-period]').count(),2);await p.locator('#cpCancel').scrollIntoViewIfNeeded();await p.click('#cpCancel');await ev('closeSheet()');
 let header=await p.locator('.wrap > .day').evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth}));assert(header.scroll<=header.client+1,JSON.stringify({lang,dims,header}));
}
assert.deepEqual(errs,[]);console.log('PASS: compact and landscape picker bounds, controls and header');await b.close()})().catch(e=>{console.error(e);process.exit(1)});
