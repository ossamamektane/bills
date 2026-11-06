// Checks the web scripts and generated bundle without needing Expo or an iOS build.
// This is a quick gate, not a substitute for interactive and device testing.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'web/index.html'), 'utf8');
for (const name of ['package.json','app.json','eas.json']) JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const blocks = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
if (!blocks.length) throw new Error('No inline scripts found');
blocks.forEach((m, i) => new vm.Script(m[1], {filename: `web script ${i + 1}`}));
// Duplicate translation keys silently override earlier entries in JavaScript.
const textBlock = html.split('var T = {')[1]?.split('\n};')[0];
if (!textBlock) throw new Error('Missing translation table');
const keys = [...textBlock.matchAll(/(?:^|,\s+)([A-Za-z]\w*):\[/gm)].map(m=>m[1]);
const duplicates = keys.filter((k,i)=>keys.indexOf(k)!==i);
if (duplicates.length) throw new Error('Duplicate translation keys: '+duplicates.join(', '));
const expected = "// Generated from web/index.html — don't edit by hand.\nexport default " + JSON.stringify(html) + ";\n";
if (fs.readFileSync(path.join(root, 'src/web.js'), 'utf8') !== expected) throw new Error('Generated web bundle is stale: run node scripts/make-web.js');
console.log(`OK: JSON, ${blocks.length} web scripts and generated bundle`);
