import puppeteer from 'puppeteer-core';
const [url,out,sx,sz,ex] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 2500));
if (sx) await p.evaluate((x,z,ex)=>{ const c=window.__player.chibi; c.position.set(+x,0,+z); c.rotation.y=Math.PI; if(ex) eval(ex); }, sx, sz, ex||'');
await new Promise(r => setTimeout(r, 2500));
console.log(JSON.stringify(await p.evaluate(()=>({calls:window.__info?.calls,tris:window.__info?.triangles, sage: (()=>{const s=window.__scene.children.find(o=>o.userData?.name==='Sage'); return s&&[s.position.x.toFixed(2),s.position.z.toFixed(2)]})()}))));
await p.screenshot({ path: out }); await b.close();
