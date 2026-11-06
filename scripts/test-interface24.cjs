// Regression checks for Update 24's divider, timing guidance and centered menu.
const {testUrl}=require('./ui-fixture.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true});
 await p.goto(testUrl+'?t=2026-11-06T12:30:00&fresh=1&native=1&seed=1');
 const ev=s=>p.evaluate(s=>__R.ev(s),s);
 for(const lang of ['en','fr','ar']) for(const theme of ['light','dark']){
  await ev(`lang=${JSON.stringify(lang)};set('r.lang',lang);applyLang();set('r.theme',${JSON.stringify(theme)});applyTheme();openSheet(null)`);
  await p.waitForTimeout(500); // Let theme color transitions finish before measuring.
  assert.equal(await p.locator('#clockHelp').count(),0); // Update 26 removes duplicate guidance.
  await p.locator('#fName').focus();
  const border=()=>p.locator('#fDesc').evaluate(e=>({color:getComputedStyle(e).borderTopColor,width:getComputedStyle(e).borderTopWidth}));
  const before=await border(); await p.locator('#fDesc').focus();const after=await border();
  assert.equal(before.width,'1px');assert.equal(after.color,before.color);assert.notEqual(after.color,'rgba(0, 0, 0, 0)');
  await p.locator('[data-tmode=wake]').scrollIntoViewIfNeeded();await p.locator('[data-tmode=wake]').click();
  assert.equal(await p.locator('#clockHelp').count(),0);assert(await p.locator('#wakeBox').isVisible());
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await ev('closeSheet()');
  assert.equal(await p.locator('.tl').evaluate(e=>getComputedStyle(e).position),'static');
  const menuButton=p.locator('#app .row [data-act=menu]').first();await menuButton.scrollIntoViewIfNeeded();await menuButton.click();
  const metrics=await p.locator('#rMenu').evaluate(el=>{const r=x=>{let a=x.getBoundingClientRect();return {cx:a.left+a.width/2,cy:a.top+a.height/2}};return {menu:r(el),title:r(el.querySelector('.mh')),items:[...el.querySelectorAll('.mi')].map(x=>({row:r(x),text:r(x.querySelector('span'))}))}});
  assert(Math.abs(metrics.menu.cx-metrics.title.cx)<1,JSON.stringify(metrics));
  for(const x of metrics.items) {assert(Math.abs(x.row.cx-x.text.cx)<1,JSON.stringify(x));assert(Math.abs(x.row.cy-x.text.cy)<1,JSON.stringify(x));}
  assert.equal(await p.locator('#addBtn').isVisible(),false);
  await ev('closeMenu()');assert(await p.locator('#addBtn').isVisible());
 }
 await b.close();console.log('PASS: focus divider, guidance, non-sticky wake status, and popup geometry in three languages and two themes');
})().catch(e=>{console.error(e);process.exit(1)});
