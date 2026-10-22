// headless capture of mock key frames: node shot.mjs mock-a mock-b ...
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
for (const n of process.argv.slice(2)) {
  await p.goto('file://' + path.join(dir, n + '.html'));
  await p.waitForLoadState('networkidle');
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(dir, n + '.png') });
  console.log('shot', n);
}
await b.close();
