// Exercise popup centering, transparent dismissal layers and non-destructive typing.
const {testUrl}=require('./ui-fixture.cjs'),{chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
for(const size of [{width:320,height:568},{width:390,height:844},{width:568,height:320}]) for(const lang of ['en','fr','ar']){
 const p=await b.newPage({viewport:size,isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(testUrl+'?t=2026-11-06T12:30:00&fresh=1&native=1&seed=1');
 await p.evaluate(lang=>__R.ev(`lang=${JSON.stringify(lang)};set('r.lang',lang);applyLang();openSheet(null)`),lang);await p.waitForTimeout(350);
 const box=await p.locator('#sheet').boundingBox();assert(box.x>=10&&box.y>=10&&box.x+box.width<=size.width-10&&box.y+box.height<=size.height-10,JSON.stringify({size,lang,box}));assert(Math.abs(box.x+box.width/2-size.width/2)<1);assert(Math.abs(box.y+box.height/2-size.height/2)<1);
 assert.equal(await p.locator('#scrim').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 await p.locator('#fName').fill('My task');await p.locator('#fName').press('Enter');assert.equal(await p.locator('#fName').inputValue(),'My task');assert(await p.locator('#sheet').evaluate(e=>e.classList.contains('on')));
 await p.locator('#fDesc').fill('First line');await p.locator('#fDesc').press('Enter');await p.locator('#fDesc').type('Second line');assert.equal(await p.locator('#fDesc').inputValue(),'First line\nSecond line');
 await p.evaluate(()=>__R.ev('openPicker()'));assert.equal(await p.locator('#customPick').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');await p.locator('#cpCancel').click();assert.equal(await p.locator('#fName').inputValue(),'My task');assert.deepEqual(errors,[]);await p.close();
}await b.close();console.log('PASS: transparent centered editor, picker and typing across screen sizes and languages');})().catch(e=>{console.error(e);process.exit(1)});
