// Test-only fixture: inject a fake clock, seed and private hooks into a temporary
// copy. Production web/index.html never exposes eval or the fixture hooks.
const fs = require('fs'), os = require('os'), path = require('path');
const {pathToFileURL} = require('url');
const root = path.resolve(__dirname, '..'), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'routines-ui-'));
let html = fs.readFileSync(path.join(root,'web','index.html'),'utf8');
// Some legacy layout checks start after dismissing the wake question. This flag
// changes test data only; the production wake-up prompt is never bypassed.
let prelude = fs.readFileSync(path.join(__dirname,'test-prelude.js'),'utf8');
if(process.env.ROUTINES_TEST_NO_INITIAL_WAKE) prelude += ';localStorage.setItem("r.open",String(Date.now()));';
html = html.replace('<head>','<head><script>'+prelude+'</script>')
  .replace('if(get("r.test") === "1") window.__R = {','if(get("r.test") === "1") window.__R = {ev:function(s){return eval(s);},');
const file = path.join(dir,'fixture.html'); fs.writeFileSync(file,html);
process.on('exit',()=>fs.rmSync(dir,{recursive:true,force:true}));
module.exports = {testUrl:pathToFileURL(file).href};
