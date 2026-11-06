// Synthetic viewport, stacking, motion and regression checks; not a substitute for an iPhone.
const {testUrl}=require('./ui-fixture.cjs'), {chromium}=require('playwright'), assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(testUrl+'?t=2026-11-06T12:30:00&fresh=1&native=1&seed=1');
 const ev=s=>page.evaluate(s=>__R.ev(s),s);
 async function bottom(sel,size){
   const b=await page.locator(sel).boundingBox(); assert(b,`missing ${sel}`);
   assert(b.x>=-1&&b.y>=-1&&b.x+b.width<=size.width+1&&Math.abs(b.y+b.height-size.height)<=2,JSON.stringify({sel,size,b}));
   const cs=await page.locator(sel).evaluate(e=>{let s=getComputedStyle(e);return [s.borderTopLeftRadius,s.borderBottomLeftRadius]}); assert.deepEqual(cs,['28px','0px']);
 }
 for(const theme of ['light','dark'])for(const lang of ['en','fr','ar'])for(const size of [{width:320,height:568},{width:390,height:844},{width:568,height:320}]){
   await page.setViewportSize(size);await ev(`lang=${JSON.stringify(lang)};set('r.lang',lang);set('r.theme',${JSON.stringify(theme)});applyLang();applyTheme()`);
   await ev('openSheet(null)');await bottom('#sheet',size);
   let scrim=await page.locator('#scrim').evaluate(e=>getComputedStyle(e).backgroundColor);assert.equal(scrim,theme==='dark'?'rgba(0, 0, 0, 0.6)':'rgba(0, 0, 0, 0.32)');
   assert(await page.locator('#fKind [data-unit=d]').count());assert(!(await page.locator('#addBtn').isVisible()));
   await page.locator('[data-picker-for=fStartDate]').click();await bottom('#customPick .pickDialog',size);assert(await page.locator('#sheet').evaluate(e=>e.classList.contains('on')));
   await page.locator('#cpCancel').click();assert.equal(await page.locator('#customPick').getAttribute('aria-hidden'),'true');assert(await page.locator('#sheet').evaluate(e=>e.classList.contains('on')));
   await ev('closeSheet();openPrefs()');await bottom('#prefs',size);await ev('closePrefs();openAll()');await bottom('#all',size);
   await ev('openSheet(items[0])');await bottom('#sheet',size);assert(await page.locator('#all').evaluate(e=>e.classList.contains('on')));await ev('closeSheet();closeAll()');
   await page.locator('#app .row [data-act=menu]').first().click();await bottom('#rMenu',size);await ev('closeMenu()');
   assert(await page.locator('#addBtn').isVisible());
 }
 // Scrolling never hides the add button; Done stays above it at the end of the list.
 await page.setViewportSize({width:390,height:844});await ev('lang="en";set("r.doneHide","1");applyLang();apply("slot","pill","09:00",{});lastHTML="";render()');
 await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(100);
 assert(await page.locator('#addBtn').isVisible());
 const done=page.locator('#app [data-act=doneTg]');
 assert.equal(await done.count(),1);{const r=await done.boundingBox(),a=await page.locator('#addBtn').boundingBox();assert(r.y+r.height<a.y||r.x+r.width<a.x||r.x>a.x+a.width,JSON.stringify({r,a}));}
 assert.deepEqual(errors,[]);console.log('PASS: bottom sheets, tint, nested dismissal, add and 18 theme/language/screen combinations');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
