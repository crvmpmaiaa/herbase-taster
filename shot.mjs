import puppeteer from 'puppeteer-core';
const CHROME=process.env.CHROME||'/Users/admin/.cache/puppeteer/chrome/mac_arm-152.0.7977.54/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [url,out,mode='desktop'] = process.argv.slice(2);
const dsf = Number(process.env.DSF || 2);
const vp = mode==='mobile' ? {width:390,height:844,deviceScaleFactor:dsf} : {width:1440,height:900,deviceScaleFactor:dsf};
const b = await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--font-render-hinting=none','--force-color-profile=srgb']});
const p = await b.newPage();
await p.setViewport(vp);
await p.goto(url,{waitUntil:'networkidle0',timeout:45000});
await p.evaluate(()=>document.fonts.ready);
if (process.env.SCROLL) {
  // step down so IntersectionObserver reveals fire, then settle at target
  const target = Number(process.env.SCROLL);
  await p.evaluate(async (t)=>{
    for (let y=0; y<=t; y+=400){ window.scrollTo(0,y); await new Promise(r=>setTimeout(r,60)); }
    window.scrollTo(0,t);
  }, target);
  await new Promise(r=>setTimeout(r,1200));
}
await new Promise(r=>setTimeout(r,700));
await p.screenshot({path:out, fullPage: process.env.FULL==='1'});
await b.close();
console.log('shot →',out);
