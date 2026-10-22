// headless stills at scroll positions (screens): node shots.mjs <outdir> <w> <h> sp1 sp2 ...
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [out, w, h, ...sps] = process.argv.slice(2);
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://127.0.0.1:8815/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
for (const s of sps) {
  await p.evaluate(v => scrollTo(0, v * innerHeight), +s);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/sp-${s}.png` });
}
console.log('errors', JSON.stringify(errs));
await b.close();
