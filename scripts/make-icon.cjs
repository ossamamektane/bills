// Matching Bills' monochrome brand: a distinct repeat/check symbol on the
// same charcoal canvas. iOS applies its own mask; Android masks the foreground.
const fs=require('fs'),sharp=require('sharp'),path=require('path');
const root=path.resolve(__dirname,'..'), assets=path.join(root,'assets');
const symbol=(color)=>`<g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round"><path d="M 294 330 A 288 288 0 1 1 225 532" stroke-width="64"/><path d="M 180 551 L 225 505 L 270 551" stroke-width="64"/><path d="M 353 512 L 462 621 L 645 420" stroke-width="82"/></g>`;
const wrap=(content)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${content}</svg>`;
(async()=>{
 const icon=wrap(`<rect width="1024" height="1024" fill="#1d1d1f"/>${symbol('#ffffff')}`);
 fs.writeFileSync(path.join(root,'design/app-icon.svg'),icon);
 await sharp(Buffer.from(icon)).removeAlpha().png().toFile(path.join(assets,'icon.png'));
 const safe=`<g transform="translate(143 143) scale(.72)">${symbol('#ffffff')}</g>`;
 await sharp(Buffer.from(wrap(safe))).png().toFile(path.join(assets,'adaptive-icon.png'));
 await sharp(Buffer.from(wrap(symbol('#1d1d1f')))).png().toFile(path.join(assets,'splash-icon.png'));
 await sharp(Buffer.from(wrap(symbol('#f5f5f7')))).png().toFile(path.join(assets,'splash-icon-dark.png'));
 console.log('Rendered monochrome Bills-family icon assets');
})().catch(e=>{console.error(e);process.exit(1)});
