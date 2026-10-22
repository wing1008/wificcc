// hand checks: edit hero line, S3 hover trace, end send
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto('http://127.0.0.1:8815/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
await p.click('#editline'); await p.keyboard.type('우리 동네 빵집 예약 앱 만들어 주세요'); await p.keyboard.press('Enter'); await p.waitForTimeout(1200);
await p.screenshot({ path: 'tools/shots/hand-1-edited.png' });
await p.evaluate(() => scrollTo(0, 3.9 * innerHeight)); await p.waitForTimeout(1500); await p.screenshot({ path: 'tools/shots/hand-2-level.png' });
await p.evaluate(() => scrollTo(0, 7.1 * innerHeight)); await p.waitForTimeout(1500);
const box = await p.evaluate(() => { const t = document.querySelectorAll('.t')[40].getBoundingClientRect(); return [t.x + t.width / 2, t.y + t.height / 2]; });
await p.mouse.move(box[0], box[1]); await p.waitForTimeout(500); await p.screenshot({ path: 'tools/shots/hand-3-hover.png' });
const lit = await p.evaluate(() => document.querySelectorAll('#trace span.lit').length);
await p.evaluate(() => scrollTo(0, 16 * innerHeight)); await p.waitForTimeout(1500);
await p.fill('#endinput', '반려견 산책 기록 게임'); await p.click('#send .btn'); await p.waitForTimeout(400); await p.screenshot({ path: 'tools/shots/hand-4-send.png' });
const msg = await p.textContent('#sendmsg');
console.log(JSON.stringify({ lit, msg, errs })); await b.close();
