// Deterministic recurrence property checks against functions extracted from the actual web source.
// Three processes set TZ before Date is initialized. This does not simulate UI, notifications or iOS.
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
if (!process.env.ROUTINES_TEST_TZ_CHILD) {
  for (const tz of ['America/New_York','Europe/Paris','Africa/Casablanca']) {
    const run = cp.spawnSync(process.execPath, [__filename], {stdio:'inherit',env:{...process.env,TZ:tz,ROUTINES_TEST_TZ_CHILD:'1'}});
    if (run.status !== 0) process.exit(run.status || 1);
  }
  process.exit(0);
}
const html = fs.readFileSync(path.join(__dirname,'..','web','index.html'),'utf8');
const names = ['iso','parse','addDays','addMonths','diff','step','firstOnOrAfter'];
const functions = names.map(name => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = html.match(new RegExp('^function '+escaped+'\\([^\\n]*$','m'));
  if (!m) throw new Error(`Cannot find single-line function ${name}`);
  return m[0];
}).join('\n') + '\n' + (html.match(/function nextFixed\(it, after\)\{[\s\S]*?\n\}/) || [])[0];
if (!functions.includes('function nextFixed')) throw new Error('Missing nextFixed');
const c = vm.createContext({}); vm.runInContext(functions,c);
let state = 0x9e3779b9;
function rand(n){state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) % n;}
function expectDate(year, month, day, unit, n, k){
  if (unit === 'm') { const d = new Date(year, month+n*k, 1, 12); d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0,12).getDate())); return d; }
  return new Date(year, month, day+n*k*(unit === 'w' ? 7 : 1), 12);
}
for(let i=0;i<100000;i++){
  const year=2015+rand(20), month=rand(12), last=new Date(year,month+1,0,12).getDate(), day=1+rand(last);
  const anchor=new Date(year,month,day,12), unit=['d','w','m'][rand(3)], n=1+rand(12);
  const target=new Date(year,month,day+rand(601),12), item={anchor:c.iso(anchor),next:c.iso(anchor),unit,n};
  let k=0; while(expectDate(year,month,day,unit,n,k)<=target) k++;
  const actual=c.iso(c.nextFixed(item,target)), expected=c.iso(expectDate(year,month,day,unit,n,k));
  if(actual!==expected) throw new Error(JSON.stringify({i,item,target:c.iso(target),actual,expected}));
  let q=0; while(expectDate(year,month,day,unit,n,q)<target) q++;
  const inclusive=c.iso(c.firstOnOrAfter(item,target)), expectedInclusive=c.iso(expectDate(year,month,day,unit,n,q));
  if(inclusive!==expectedInclusive) throw new Error(JSON.stringify({i,item,target:c.iso(target),inclusive,expectedInclusive}));
}
const old = {anchor:'1970-01-01',next:'1970-01-01',unit:'d',n:1}; if(c.iso(c.nextFixed(old,new Date(2026,10,6,12))) !== '2026-11-07') throw new Error('Old daily anchor not advanced');
console.log(`OK: 100,000 fixed-recurrence cases, next and inclusive, TZ=${process.env.TZ}`);
