// fps under real wheel: node fps.mjs <w> <h> [headed]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [w, h, headed] = process.argv.slice(2);
const b = await chromium.launch({ headless: !headed, channel: 'chrome' });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto('http://127.0.0.1:8815/', { waitUntil: 'networkidle' }); await p.waitForTimeout(3000);
await p.evaluate(() => { window.__f = []; const f = t => { __f.push(t); requestAnimationFrame(f); }; requestAnimationFrame(f); });
await p.mouse.move(w/2, h/2);
for (let k = 0; k < 140; k++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(110); }
await p.waitForTimeout(1500);
const r = await p.evaluate(() => { const d = []; for (let i = 1; i < __f.length; i++) d.push(__f[i] - __f[i-1]); const tot = (__f.at(-1) - __f[0]) / 1000; d.sort((a,b)=>a-b); return { fps: +(d.length / tot).toFixed(1), p95: +d[Math.floor(d.length*.95)].toFixed(1), sp: scrollY / innerHeight }; });
console.log(JSON.stringify({ w, h, headed: !!headed, ...r })); await b.close();
