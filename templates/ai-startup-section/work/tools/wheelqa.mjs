// headed real-wheel QA: node wheelqa.mjs <w> <h> <outdir>   (120 px mouse.wheel steps, no flags)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [w, h, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ headless: false, channel: 'chrome' });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
const t0 = Date.now();
await p.goto('http://127.0.0.1:8815/', { waitUntil: 'load' });
await p.waitForTimeout(5000); await p.screenshot({ path: `${out}/00-first5s.png` });
await p.evaluate(() => { window.__f = []; const f = t => { __f.push(t); requestAnimationFrame(f); }; requestAnimationFrame(f); });
await p.mouse.move(+w * .7, +h * .5);
const marks = [0.25, 1.2, 2.0, 2.9, 3.8, 4.4, 4.9, 5.5, 6.4, 7.2, 7.9, 8.4, 9.4, 10.4, 11.0, 11.6, 12.6, 13.6, 14.4, 15.1, 15.6, 16.0];
let k = 0, step = 0;
while (true) {
  const y = await p.evaluate(() => [scrollY / innerHeight, scrollY >= document.documentElement.scrollHeight - innerHeight - 1]);
  if (k < marks.length && y[0] >= marks[k] - 1e-3) { await p.waitForTimeout(900); await p.screenshot({ path: `${out}/${String(k + 1).padStart(2, '0')}-sp${marks[k]}.png` }); k++; continue; }
  if (y[1]) { await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/99-end.png` }); break; }
  await p.mouse.wheel(0, 120); await p.waitForTimeout(110); step++;
  if (step > 400) break;
}
// hover check in S3 and hero edit check
const r = await p.evaluate(() => { const d = []; for (let i = 1; i < __f.length; i++) d.push(__f[i] - __f[i - 1]); const tot = (__f.at(-1) - __f[0]) / 1000; d.sort((a, b) => a - b); return { fps: +(d.length / tot).toFixed(1), p95: +d[Math.floor(d.length * .95)].toFixed(1) }; });
console.log(JSON.stringify({ w, h, steps: step, shots: k, ...r, errs, secs: (Date.now() - t0) / 1000 }));
await b.close();
