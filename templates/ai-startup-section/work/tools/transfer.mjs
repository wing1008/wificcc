// first-screen transfer: sums encoded bytes of every response until 5 s after load
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const cdp = await p.context().newCDPSession(p); await cdp.send('Network.enable');
let total = 0, n = 0; const by = {};
cdp.on('Network.loadingFinished', e => { total += e.encodedDataLength; n++; });
cdp.on('Network.responseReceived', e => { const h = new URL(e.response.url).host; by[h] = (by[h] || 0) + 1; });
const t = Date.now(); await p.goto('http://127.0.0.1:8815/', { waitUntil: 'load' }); const load = Date.now() - t;
const fcp = await p.evaluate(() => performance.getEntriesByName('first-contentful-paint')[0]?.startTime);
await p.waitForTimeout(5000);
console.log(JSON.stringify({ requests: n, kB: +(total / 1024).toFixed(1), loadMs: load, fcpMs: Math.round(fcp), hosts: by }));
await b.close();
