// 흐름 녹화(10/8 격리 실험 도구 일반판): node flowrec.mjs <id> <url> [maxSteps] [outDir]
// GPU 크롬 1440x900 헤드리스, 영상 녹화(recordVideo). 6초 대기 → Enter류 누르기 → 실휠 120px/110ms 로 끝까지(최대 maxSteps칸) → 1.5초 → 닫기.
// 우회 없음(로그인·봇 확인). 쿠키 창은 누르지 않고 그대로 찍힌다.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';   // uf-service 의존성(pnpm, playwright 1.62.1 = F:/uf-shared/tools 와 같은 판) — 10/19 C10 B-5
import fs from 'node:fs';
const [id, url, maxS = '280', OUT = '.'] = process.argv.slice(2);
const D = OUT; fs.mkdirSync(D, { recursive: true });
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: `${D}/_tmp_${id}`, size: { width: 1440, height: 900 } } });
const T0 = Date.now(); const pg = await ctx.newPage(); const meta = { id, url, steps: 0 };
try {
  await pg.goto(url, { waitUntil: 'load', timeout: 60000 }); await pg.waitForTimeout(6000);
  for (const t of ['Enter', 'ENTER', 'Start', 'START', 'Explore', 'Begin', 'BEGIN']) { const el = pg.getByText(t, { exact: true }).first(); if (await el.isVisible().catch(() => false)) { await el.click({ timeout: 2000 }).catch(() => {}); meta.clicked = t; await pg.waitForTimeout(2500); break; } }
  if (!meta.clicked) { const el = pg.locator('text=/start the experience|^enter$|^explore$/i').first(); if (await el.isVisible().catch(() => false)) { await el.click({ timeout: 3000 }).catch(() => {}); meta.clicked = 'regex'; await pg.waitForTimeout(4000); } }
  await pg.mouse.move(720, 450);
  if (process.env.POINTER) {   // 상호작용형(한 방짜리 3D): 마우스 8자 경로 8초 → 끌기 2초 → 놓기, 그 뒤 휠
    meta.pointerStart = (Date.now() - T0) / 1000;
    for (let k = 0; k <= 80; k++) { const a = k / 80 * Math.PI * 2; await pg.mouse.move(720 + 520 * Math.sin(a), 450 + 260 * Math.sin(2 * a)); await pg.waitForTimeout(100); }
    await pg.mouse.move(500, 450); await pg.mouse.down(); for (let k = 0; k <= 20; k++) { await pg.mouse.move(500 + 30 * k, 450 - 6 * k); await pg.waitForTimeout(100); } await pg.mouse.up(); await pg.waitForTimeout(2500);
  }
  meta.scrollStart = (Date.now() - T0) / 1000;
  let still = 0, last = -1;
  while (meta.steps < +maxS) {
    await pg.mouse.wheel(0, 120); await pg.waitForTimeout(110); meta.steps++;
    const [y, max] = await pg.evaluate(() => [scrollY, document.documentElement.scrollHeight - innerHeight]);
    if (y > 0) meta.moved = true;
    if (max > 5 && meta.moved && y >= max - 1 && meta.bottomAt == null) meta.bottomAt = (Date.now() - T0) / 1000;   // 10/9: 페이지 바닥 도착 시각(그 뒤 화면은 시트에서 뺀다)
    if (max > 5 && meta.moved) { if (y >= max - 1 || y === last) still++; else still = 0; last = y; if (still >= 20) break; }   // 문서가 한 번도 안 움직이면(가상 스크롤) 정해진 칸까지
  }
  meta.scrollEnd = (Date.now() - T0) / 1000; await pg.waitForTimeout(1500);
} catch (e) { meta.err = String(e).slice(0, 120); }
const v = pg.video(); await ctx.close(); await b.close();
const p = await v.path(); fs.renameSync(p, `${D}/${id}.webm`); fs.rmSync(`${D}/_tmp_${id}`, { recursive: true, force: true });
fs.writeFileSync(`${D}/${id}.json`, JSON.stringify(meta, null, 1));
console.log('ok', JSON.stringify(meta));
