/* 온갖 — one line becomes everything. One scroll value drives the stage. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const N = 54, G = 18, END = 16.0, L5 = 11.6;           // tiles, glyphs, page length (screens), S5 layer start
const DEF = '비 오는 날 우산 챙기는 고양이 게임 만들어 줘';
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ss = t => t * t * t * (t * (t * 6 - 15) + 10);   // smootherstep
const rnd = k => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

let W, H, M, fs, ruleY1, colW, gap;
let glyph = [], wordOf = [], real = [], nWords = 1, nReal = G, line = DEF;
const tilesEl = $('#tiles'), charEl = $('#char'), ruleEl = $('#rule'), frameEl = $('#frame'), trailEl = $('#trail');
const layerEl = $('#layer'), trackEl = $('#track'), underEl = $('#hero-under');
const T = [];                                           // tile records
let wordOrd = [], levelCell = [], colQ = [], winRC = [], toolSlot = [], gIdx = [];
let pathPts = [], Y6 = 0, Y6r = 0, stopP = [], hovered = -1, editing = false;

/* ---------- line → glyphs ---------- */
function parseLine(s) {
  s = (s || '').trim() || DEF;
  const chars = [], wo = []; let w = 0, sawSpace = false;
  for (const ch of s) {
    if (/\s/.test(ch)) { sawSpace = true; continue; }
    if (sawSpace && chars.length) w++;
    sawSpace = false; chars.push(ch); wo.push(w);
  }
  const n = Math.min(chars.length, G);
  nReal = n; glyph = []; wordOf = []; real = [];
  for (let j = 0; j < G; j++) { glyph.push(chars[j % n]); wordOf.push(wo[Math.min(j, n - 1)]); real.push(j < n); }
  nWords = wordOf[n - 1] + 1; line = s;
}

/* ---------- build tiles ---------- */
function buildTiles() {
  for (let i = 0; i < N; i++) {
    const d = document.createElement('div'); d.className = 't';
    d.innerHTML = '<div class="b"></div><div class="o"></div><div class="g"></div><div class="h"></div>';
    d.dataset.i = i; tilesEl.appendChild(d);
    T.push({ el: d, b: d.children[0], o: d.children[1], g: d.children[2], h: d.children[3], last: {}, acc: false, lit: false });
    d.addEventListener('mouseenter', () => { hovered = i; dirty = true; litTrace(i % G); });
    d.addEventListener('mouseleave', () => { if (hovered === i) { hovered = -1; dirty = true; litTrace(-1); } });
  }
}
function setGlyphs() {
  for (let i = 0; i < N; i++) { const c = glyph[i % G]; T[i].g.textContent = c; T[i].h.textContent = c; }
  const tr = $('#trace'); tr.innerHTML = '';
  let w = 0;
  for (let j = 0; j < nReal; j++) {
    if (wordOf[j] !== w) { tr.appendChild(document.createTextNode(' ')); w = wordOf[j]; }
    const s = document.createElement('span'); s.textContent = glyph[j]; s.dataset.j = j; tr.appendChild(s);
  }
  // per-word strike underlines
  underEl.innerHTML = '';
  for (let k = 0; k < nWords; k++) underEl.appendChild(document.createElement('i'));
  orders(); layoutHero();
}
function litTrace(j) {
  for (const s of document.querySelectorAll('#trace span')) s.classList.toggle('lit', +s.dataset.j === j % nReal && j >= 0);
}

/* ---------- orders and slot maps (who goes where) ---------- */
const LEVEL = (() => {   // 18 x 6 level, exactly 54 cells; [row, col], row 0 = top
  const rows = { 5: [0,1,2,3,4,5,8,9,10,11,12,14,15,16,17], 4: [0,1,2,3,4,5,8,9,10,11,12,14,15,16,17],
    3: [0,1,2,3,9,10,11,15,16,17], 2: [0,1,10,11,16,17], 1: [5,6,7,16,17], 0: [0,16,17] };
  const out = []; for (const r of [5,4,3,2,1,0]) for (const c of rows[r]) out.push([r, c]);
  return out;   // bottom row first
})();
const GOAL = LEVEL.findIndex(([r, c]) => r === 0 && c === 17);
const TOP = (() => { const t = []; for (let c = 0; c < 18; c++) { let m = 6; for (const [r, cc] of LEVEL) if (cc === c && r < m) m = r; t.push(m); }
  for (let c = 0; c < 18; c++) if (t[c] === 6) t[c] = Math.min(t[c - 1] ?? 6, t[c + 1] ?? 6); return t; })();
function orders() {
  const idx = [...Array(N).keys()];
  idx.sort((a, b) => (wordOf[a % G] - wordOf[b % G]) || ((a % G) - (b % G)) || (a - b));
  wordOrd = []; levelCell = [];
  idx.forEach((i, r) => { levelCell[i] = r; wordOrd[i] = (wordOf[i % G] + ((i / G | 0) * 0.18)) / Math.max(1, nWords); });
  // collapse order: by level column then row
  const byX = [...Array(N).keys()].sort((a, b) => (LEVEL[levelCell[a]][1] - LEVEL[levelCell[b]][1]) || (LEVEL[levelCell[b]][0] - LEVEL[levelCell[a]][0]));
  byX.forEach((i, q) => { colQ[i] = q; winRC[i] = [q / 9 | 0, q % 9]; });
  for (let i = 0; i < N; i++) { const [r, c] = winRC[i]; const k = c / 3 | 0; toolSlot[i] = [k, (c % 3) * 6 + r]; gIdx[i] = k * 18 + (c % 3) * 6 + r; }
}

/* ---------- layout ---------- */
function layout() {
  W = innerWidth; H = innerHeight; M = Math.round(W * 80 / 1920); gap = 24 * W / 1920;
  colW = (W - 2 * M - 11 * gap) / 12; fs = 46 * H / 1080; ruleY1 = 0.70 * H;
  document.documentElement.style.setProperty('--M', M + 'px');
  trackEl.style.height = ((END + 1) * H) + 'px';
  $('#ink').setAttribute('viewBox', `0 0 ${W} ${H}`);
  cv.width = Math.round(W * .5); cv.height = Math.round(H * .5);
  gl && gl.viewport(0, 0, cv.width, cv.height);
  // S5 / S6 layer geometry (layer coords)
  Y6 = (END - L5) * H; const s6 = $('#s6'); s6.style.top = Y6 + 'px';
  layerEl.style.height = (Y6 + H) + 'px';
  const ein = $('#endinput');
  Y6r = Y6 + ein.offsetTop + $('#send').offsetTop + ein.offsetHeight + 2;
  stopP = [[0.66 * W, 1.30 * H], [0.36 * W, 2.00 * H], [0.66 * W, 2.70 * H], [0.36 * W, 3.40 * H]];
  document.querySelectorAll('.stop').forEach((el, k) => {
    const [x, y] = stopP[k]; const right = x > W / 2;
    el.style.left = (right ? M + colW : x + 0.10 * W) + 'px'; el.style.top = (y - 0.10 * H) + 'px';
  });
  const R4 = 0.80 * H;
  const C = [[M, R4], [0.22 * W, R4], [0.56 * W, 0.98 * H], stopP[0], stopP[1], stopP[2], stopP[3], [0.86 * W, Y6r - 0.30 * H], [M + 0.66 * W, Y6r], [M + 0.44 * W, Y6r], [M + 0.22 * W, Y6r], [M, Y6r]];
  pathPts = catmull(C, 200).map(([x, y]) => [x, Math.min(y, Y6r)]);
  layoutHero(); dirty = true;
}
function catmull(P, n) {
  const out = []; const segs = P.length - 1;
  for (let k = 0; k < n; k++) {
    const u = k / (n - 1) * segs; let s = Math.min(segs - 1, u | 0); const t = u - s;
    const p0 = P[Math.max(0, s - 1)], p1 = P[s], p2 = P[s + 1], p3 = P[Math.min(segs, s + 2)];
    const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
  }
  return out;
}
let heroX = [];   // glyph centre x in sentence
function layoutHero() {
  if (!W) return;
  heroX = []; let x = M; let w = 0;
  for (let j = 0; j < G; j++) {
    const jj = real[j] ? j : nReal - 1;
    if (real[j]) { if (wordOf[j] !== w) { x += fs * 0.34; w = wordOf[j]; } heroX[j] = x + fs * 0.5; x += fs * 1.0; }
    else heroX[j] = heroX[jj];
  }
  const hit = $('#editline'); hit.style.left = M + 'px'; hit.style.top = (ruleY1 - fs * 1.25) + 'px';
  hit.style.width = (x - M + fs) + 'px'; hit.style.height = (fs * 1.35) + 'px';
  const inp = $('#lineinput'); inp.style.left = M + 'px'; inp.style.top = (ruleY1 - fs * 1.15) + 'px'; inp.style.width = (W * 0.62) + 'px';
  inp.style.fontSize = fs + 'px';
  // underline per word
  const u = underEl.children;
  for (let k = 0; k < u.length; k++) {
    let a = 1e9, b = -1e9; for (let j = 0; j < nReal; j++) if (wordOf[j] === k) { a = Math.min(a, heroX[j] - fs * .5); b = Math.max(b, heroX[j] + fs * .5); }
    u[k].style.left = a + 'px'; u[k].style.top = (ruleY1 + 8) + 'px'; u[k].style.width = (b - a) + 'px';
  }
}

/* ---------- key states: [x, y, size(px box), rot, bg, outline, op, paperGlyph, acc] ---------- */
const box = c => c / 100, txt = f => f / 60;
function levelGeo(g) {          // g: 0 small (right 5 cols, on the hero rule) → 1 full stage
  const x0s = M + 7 * (colW + gap), ws = 5 * colW + 4 * gap, css = ws / 18;
  const csf = Math.min((W - 2 * M) / 18, 0.086 * H);
  return { x0: lerp(x0s, W - M - 18 * csf, g), cs: lerp(css, csf, g), base: lerp(ruleY1, 0.92 * H, g) };
}
function winGeo(g) {            // g: 0 big window → 1 small framed window
  const cb = Math.min(0.105 * H, W * 0.55 / 9), csm = 0.072 * H;
  const cs = lerp(cb, csm, g);
  return { cs, x0: lerp(W - M - 9 * cb, W - M - 9 * csm - 0.05 * W, g), base: lerp(0.92 * H, 0.82 * H, g) };
}
const R4 = () => 0.80 * H, c4 = () => 0.058 * H;
let trackU = 0, layerY = 0, growG = 0, shrinkG = 0;
function toolCX(k) { return W * 0.64 + k * 0.40 * W - trackU * 0.80 * W; }
const ROUTE = [[0,4],[1,4],[1,3],[1,2],[2,2],[3,2],[3,3],[3,4],[4,4],[5,4],[5,3],[5,2],[5,1],[4,1],[3,1],[3,0],[2,0],[1,0]];
const BARS = [2, 4, 3, 5, 1, 3];

function key(name, i) {
  const j = i % G, cp = i / G | 0;
  switch (name) {
    case 'A': {   // the sentence on the input rule
      const s = txt(fs);
      return [heroX[j], ruleY1 - fs * 0.62, s, 0, 0, 0, (cp === 0 && real[j] && !editing) ? introOp(j) : 0, 0, 0];
    }
    case 'B': {   // game level (geometry follows growG)
      const L = levelGeo(growG); const [r, c] = LEVEL[levelCell[i]];
      return [L.x0 + (c + .5) * L.cs, L.base - (5 - r + .5) * L.cs, box(L.cs), 0, 1, 0, 1, 1, levelCell[i] === GOAL ? 1 : 0];
    }
    case 'C0': {  // collapsed back into one row of letters on the rule
      const cw = (W - 2 * M) / N;
      return [M + (colQ[i] + .5) * cw, 0.92 * H - cw * 0.55, txt(cw * 0.92), 0, 0, 0, 1, 0, 0];
    }
    case 'D': {   // program window (geometry follows shrinkG)
      const Wg = winGeo(shrinkG); const [r, c] = winRC[i];
      const solid = r === 0 || c === 0;
      let s = box(Wg.cs), y = Wg.base - (5 - r + .5) * Wg.cs;
      if (hovered === i && !solid) { s *= 1.14; y -= 6; }
      return [Wg.x0 + (c + .5) * Wg.cs, y, s, 0, solid ? 1 : 0, solid ? 0 : 1, 1, solid ? 1 : 0, 0];
    }
    case 'E0': {  // drawer: columns slide apart
      const Wg = winGeo(1); const [r, c] = winRC[i];
      const spread = (c - 4) * Wg.cs * 0.55, dy = (c % 2 ? -1 : 1) * Wg.cs * 0.35;
      return [Wg.x0 + (c + .5) * Wg.cs + spread, Wg.base - (5 - r + .5) * Wg.cs + dy, box(Wg.cs * .92), 0, 1, 0, 1, 1, 0];
    }
    case 'F': {   // three tools on the rail
      const [k, m] = toolSlot[i]; const cx = toolCX(k), c = c4(), R = R4();
      if (k === 0) { let b = 0, h = m; while (h >= BARS[b]) { h -= BARS[b]; b++; }
        return [cx + (b - 2.5) * 1.3 * c, R - (h + .5) * c * 1.04, box(c), 0, 1, 0, 1, 1, b === 3 && h === 4 ? 1 : 0]; }
      if (k === 1) { const cy = R - 3.3 * c;
        if (m < 16) { const a = m / 16 * Math.PI * 2 - Math.PI / 2; return [cx + Math.cos(a) * 2.6 * c, cy + Math.sin(a) * 2.6 * c, box(c * .82), a * 57.3 + 90, 1, 0, 1, 1, m === 0 ? 1 : 0]; }
        const a = -Math.PI / 2 + 1.05, rr = (m - 15) * 0.85 * c; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, box(c * .62), 0, 0, 1, 1, 0, 0]; }
      const [gx, gy] = ROUTE[m], sp = c * 0.98;
      return [cx + (gx - 2.5) * sp, R - (4 - gy + .5) * sp, box(c * .86), 0, (m === 0 || m === 8 || m === 17) ? 1 : 0.0, (m === 0 || m === 8 || m === 17) ? 0 : 1, 1, (m === 0 || m === 8 || m === 17) ? 1 : 0, (m === 0 || m === 17) ? 1 : 0];
    }
    case 'G0': {  // dropped onto the rail
      const cw = (W - 2 * M) / N;
      return [M + (gIdx[i] + .5) * cw, R4() - cw * .5, box(cw * .9), 0, 1, 0, 1, 1, 0];
    }
    case 'H': {   // four stops along the path (layer coords)
      const g = gIdx[i]; let k, m;
      if (g < 14) { k = 0; m = g; } else if (g < 27) { k = 1; m = g - 14; } else if (g < 40) { k = 2; m = g - 27; } else { k = 3; m = g - 40; }
      const [px, py0] = stopP[k], py = py0 + layerY; const dir = px > W / 2 ? 1 : -1;
      const ax = px + dir * 0.015 * W;
      if (k === 0) return [ax + (rnd(m) - .5) * 0.12 * W, py + (rnd(m + 9) - .5) * 0.14 * H, txt(fs * .9), (rnd(m + 3) - .5) * 70, 0, 0, 1, 0, 0];
      if (k === 1) { const a = fs * 0.8; return [px + dir * (6 * a + 0.02 * W) + (m - 6) * a, py, txt(fs * .7), 0, 0, 0, 1, 0, 0]; }
      const c = 0.058 * H; const cx = px + dir * (2.5 * c + 0.01 * W) + ((m % 5) - 2) * c, cy = py + ((m / 5 | 0) - 1) * c;
      if (k === 2) return [cx, cy, box(c), 0, 0, 1, 1, 0, 0];
      return [cx, cy, box(c), 0, 1, 0, 1, 1, m === 13 ? 1 : 0];
    }
    case 'I0': {  // gathered back into the one line on the end rule (screen coords)
      const y = Y6r + layerY - fs * 0.75;
      return [M + (heroX[j] - M) * 1.0 + 4, y, txt(fs), 0, 0, 0, cp === 0 && real[j] ? 1 : 0, 0, 0];
    }
    case 'I1': {
      const y = Y6r + layerY - fs * 0.75;
      return [M + 4 + (heroX[j] - M) * 0.15, y, txt(fs * .6), 0, 0, 0, 0, 0, 0];
    }
  }
}
let t0 = performance.now();
function introOp(j) { if (RM) return 1; const t = (performance.now() - t0) / 1000; return clamp((t - 0.35 - j * 0.055) / 0.1); }

/* ---------- the timeline: holds between segments, staggered glide between keys (D1) ---------- */
const SEG = [
  { a: 0.40, b: 2.60, f: 'A', t: 'B', ord: i => wordOrd[i], stg: 0.80, arc: .30, rot: 28 },  // words strike, lift, fly, land as tiles
  { a: 4.55, b: 5.15, f: 'B', t: 'C0', ord: i => LEVEL[levelCell[i]][1] / 17, stg: .55, arc: -.02, rot: 88 }, // collapse
  { a: 5.15, b: 5.90, f: 'C0', t: 'D', ord: i => winRC[i][0] / 5, stg: .5, arc: .14, rot: 0 },   // reflow up into a window
  { a: 7.65, b: 8.10, f: 'D', t: 'E0', ord: i => Math.abs(winRC[i][1] - 4) / 4, stg: .35, arc: 0, rot: 0 }, // unzip
  { a: 8.10, b: 8.75, f: 'E0', t: 'F', ord: i => winRC[i][1] / 8, stg: .45, arc: .10, rot: 0 },   // strips become tools
  { a: 10.75, b: 11.15, f: 'F', t: 'G0', ord: i => gIdx[i] / 53, stg: .5, arc: 0, rot: 0 },       // tools drop to the rail
  { a: 11.15, b: 11.95, f: 'G0', t: 'H', ord: i => gIdx[i] / 53, stg: .5, arc: .12, rot: 0 },     // onto the path
  { a: 14.70, b: 15.45, f: 'H', t: 'I0', ord: i => (i % G) / 17, stg: .5, arc: .10, rot: 0 },      // slide back into one line
  { a: 15.45, b: 15.95, f: 'I0', t: 'I1', ord: i => 1 - (i % G) / 17, stg: .5, arc: 0, rot: 0 },   // compress, leave an empty line
];
function tileState(i, sp) {
  if (sp < SEG[0].a) return key('A', i);
  let s = SEG[0];
  for (const q of SEG) if (sp >= q.a) s = q;
  if (sp >= s.b) return key(s.t, i);
  const a = key(s.f, i), b = key(s.t, i);
  const u = (sp - s.a) / (s.b - s.a);
  const tt = clamp(u * (1 + s.stg) - s.stg * s.ord(i));
  if (s === SEG[0]) {   // strike first, then lift
    const e = ss(clamp((tt - 0.14) / 0.86));
    return blend(a, b, e, s, i);
  }
  return blend(a, b, ss(tt), s, i);
}
function blend(a, b, e, s, i) {
  const o = new Array(9);
  for (let k = 0; k < 9; k++) o[k] = lerp(a[k], b[k], e);
  const arc = Math.sin(Math.PI * e);
  o[1] -= s.arc * H * arc;
  o[3] += s.rot * arc * (i % 2 ? 1 : -1);
  if (s === SEG[0]) { o[6] = a[6] > 0 ? Math.max(o[6], 1) : clamp(e * 2.5); o[6] = editing && e === 0 ? 0 : o[6]; }
  return o;
}

/* ---------- WebGL paper: grain + a raking light that lowers through the page ---------- */
const cv = $('#paper');
let gl = null, uR, uT, uL, uW, uG;
try {
  gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true });
  const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const fsrc = `precision mediump float;uniform vec2 uR;uniform float uT;uniform vec2 uL;uniform float uW;uniform float uG;
  float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
  void main(){vec2 uv=gl_FragCoord.xy/uR;float asp=uR.x/uR.y;vec2 p=vec2(uv.x*asp,uv.y);vec2 L=vec2(uL.x*asp,uL.y);
  float d=length(p-L);float lit=exp(-d*d*.55);
  vec3 paper=vec3(.945,.925,.886);
  vec3 warm=mix(vec3(1.,.99,.965),vec3(1.,.90,.74),uW);
  vec3 c=paper*(.935+.085*lit)*mix(vec3(1.),warm,.55+.45*lit);
  c*=1.-.07*smoothstep(.6,2.1,d);
  float f=n(p*vec2(150.,38.)+vec2(uT*.03,0.))*.55+n(p*vec2(46.,210.))*.45;
  float g=h(floor(gl_FragCoord.xy)+fract(uT*1.7)*91.)-.5;
  c*=1.-uG*(.06*f+.07*g);
  gl_FragColor=vec4(c,1.);}`;
  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fsrc)); gl.linkProgram(pr); gl.useProgram(pr);
  const bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  uR = gl.getUniformLocation(pr, 'uR'); uT = gl.getUniformLocation(pr, 'uT'); uL = gl.getUniformLocation(pr, 'uL'); uW = gl.getUniformLocation(pr, 'uW'); uG = gl.getUniformLocation(pr, 'uG');
} catch (e) { gl = null; cv.style.display = 'none'; }
let lastPaper = 0, lastPaperSp = -1, shadowKey = '';
function drawPaper(now, sp) {
  const p = clamp(sp / END);
  const lx = lerp(0.10, -0.12, p), ly = lerp(1.10, 0.28, p);
  // shadows of landed tiles follow the light (written only when they change)
  const dx = 0.5 - lx, dy = ly - 0.5, len = 5 + 9 * p, nn = Math.hypot(dx, dy) || 1;
  const k = Math.round(dx / nn * len) + ',' + Math.round(dy / nn * len);
  if (k !== shadowKey) { shadowKey = k; const [a, b] = k.split(','); tilesEl.style.setProperty('--sx', a + 'px'); tilesEl.style.setProperty('--sy', b + 'px'); }
  if (!gl) return;
  if (Math.abs(sp - lastPaperSp) < 0.004 && now - lastPaper < (RM ? 1e9 : 140)) return;
  lastPaper = now; lastPaperSp = sp;
  gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, RM ? 0 : now / 1000); gl.uniform2f(uL, lx, ly);
  gl.uniform1f(uW, p); gl.uniform1f(uG, 0.35 / 0.35);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/* ---------- rule: one line through every scene ---------- */
const NP = 200;
function ruleY(sp) {    // y of the flat rule before it bends
  const k = [[0, ruleY1], [2.55, ruleY1], [4.0, 0.92 * H], [5.9, 0.92 * H], [6.9, 0.82 * H], [8.1, 0.82 * H], [8.75, R4()]];
  if (sp <= k[0][0]) return k[0][1];
  for (let q = 1; q < k.length; q++) if (sp < k[q][0]) return lerp(k[q - 1][1], k[q][1], ss((sp - k[q - 1][0]) / (k[q][0] - k[q - 1][0])));
  return R4();
}
let lastD = '';
function drawRule(sp) {
  const bend = ss(clamp((sp - 10.95) / 0.95));
  const y = ruleY(sp);
  const intro = RM ? 1 : clamp(((performance.now() - t0) / 1000 - 0.1) / 0.9);
  let x0 = M, x1 = lerp(M, W - M, ss(intro));
  const penY = bend > 0 ? H * 0.74 + (1 - bend) * 4 * H : 1e9;
  let d = '', prev = null;
  for (let k = 0; k < NP; k++) {
    const fx = lerp(x0, x1, k / (NP - 1));
    const px = pathPts[k][0], py = pathPts[k][1] + layerY;
    const X = lerp(fx, px, bend), Y = lerp(y, py, bend);
    if (Y > penY) { if (prev) { const t = (penY - prev[1]) / (Y - prev[1] || 1); d += `L${lerp(prev[0], X, t).toFixed(1)} ${penY.toFixed(1)}`; } break; }
    d += (k ? 'L' : 'M') + X.toFixed(1) + ' ' + Y.toFixed(1); prev = [X, Y];
  }
  if (d !== lastD) { ruleEl.setAttribute('d', d); lastD = d; }
}

/* ---------- frame (S2 grows, S3 shrinks into a window) ---------- */
function drawFrame(sp) {
  let op = 0, x, y, w, h;
  if (sp > 2.2 && sp < 4.7) { const L = levelGeo(growG); x = L.x0 - L.cs * .5; w = 19 * L.cs; y = L.base - 7.2 * L.cs; h = 7.2 * L.cs; op = clamp((sp - 2.3) / .4) * (1 - clamp((sp - 4.3) / .35)); }
  if (sp > 5.6 && sp < 8.0) { const Wg = winGeo(shrinkG); x = Wg.x0 - Wg.cs * .35; w = 9.7 * Wg.cs; y = Wg.base - 6.35 * Wg.cs - Wg.cs * .45; h = 6.35 * Wg.cs + Wg.cs * .45 + 1; op = clamp((sp - 5.8) / .4) * (1 - clamp((sp - 7.6) / .3)); }
  frameEl.style.opacity = op.toFixed(3);
  if (op > 0) { frameEl.setAttribute('x', x.toFixed(1)); frameEl.setAttribute('y', y.toFixed(1)); frameEl.setAttribute('width', w.toFixed(1)); frameEl.setAttribute('height', h.toFixed(1)); }
}

/* ---------- caret → character ---------- */
function drawChar(sp, now) {
  let x, y, wd, ht, op = 1, blink = false;
  const endX = (() => { let m = 0; for (let j = 0; j < nReal; j++) m = Math.max(m, heroX[j]); return m + fs * 0.62; })();
  const cx0 = endX, cy0 = ruleY1 - fs * 0.12, w0 = Math.max(3, fs * .07), h0 = fs * 1.05;
  const L = levelGeo(growG);
  const walk = clamp((sp - 2.95) / 1.45);
  const xf = walk * 17, c0 = Math.min(17, Math.floor(xf)), c1 = Math.min(17, c0 + 1), fr = xf - c0;
  const top = lerp(TOP[c0], TOP[c1], ss(fr)), lift = (TOP[c0] !== TOP[c1] || TOP[c0] === 6) ? Math.sin(Math.PI * fr) * 0.9 : 0;
  const lx = L.x0 + (xf + .5) * L.cs, ly = L.base - (6 - top + lift) * L.cs;
  const lw = L.cs * .26, lh = L.cs * .85;
  if (sp < 2.35) { x = cx0; y = cy0; wd = w0; ht = h0; blink = sp < 0.3 && !editing; op = (editing ? 0 : 1) * (RM ? 1 : clamp(((now - t0) / 1000 - 1.35) / .2)); }
  else if (sp < 2.95) { const e = ss((sp - 2.35) / .6); x = lerp(cx0, L.x0 + .5 * L.cs, e); y = lerp(cy0, L.base - (6 - TOP[0]) * L.cs, e) - Math.sin(Math.PI * e) * .18 * H; wd = lerp(w0, lw, e); ht = lerp(h0, lh, e); }
  else { x = lx; y = ly; wd = lw; ht = lh; op = 1 - clamp((sp - 4.6) / .25); }
  charEl.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${(wd / 10).toFixed(3)},${(ht / 44).toFixed(3)})`;
  charEl.style.opacity = op.toFixed(3);
  if (blink !== charEl._b) { charEl.classList.toggle('blink', blink); charEl._b = blink; }
}

/* ---------- trail: dotted arc of the word in flight ---------- */
function drawTrail(sp) {
  let op = 0;
  if (sp > 0.4 && sp < 2.7) {
    const u = (sp - 0.4) / 2.2, w = Math.min(nWords - 1, Math.floor(u * nWords * 1.1));
    let i = -1; for (let q = 0; q < N; q++) if (wordOf[q % G] === w && q < G && real[q]) { i = q; break; }
    if (i >= 0) {
      const a = key('A', i), b = key('B', i); const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - .55 * H;
      trailEl.setAttribute('d', `M${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
      op = clamp((sp - .45) / .2) * (1 - clamp((sp - 2.4) / .3)) * .9;
    }
  }
  trailEl.style.opacity = op.toFixed(3);
}

/* ---------- scene text & nav ---------- */
const SC = [['#s1', -9, 1.15], ['#s2', 2.6, 4.6], ['#s3', 6.0, 7.7], ['#s4', 8.55, 10.8], ['#s6', 15.5, 99]];
const NAMES = ['한 줄', '게임', '프로그램', '도구', '만드는 법', '당신의 한 줄'];
const BOUND = [0, 2.3, 5.2, 8.1, 11.2, 15.3];
let lastIdx = -1;
function drawText(sp) {
  for (const [sel, a, b] of SC) { const el = $(sel); const on = sp >= a && sp < b; if (el._on !== on) { el.classList.toggle('on', on); el._on = on; } }
  const s5 = $('#s5'), v5 = sp > 11.25 && sp < 15.2; if (s5._v !== v5) { s5.classList.toggle('vis', v5); s5.classList.toggle('on', v5); s5._v = v5; }
  document.querySelectorAll('.stop').forEach((el, k) => { const on = stopP[k][1] + layerY < 0.84 * H && sp > 11.4; if (el._on !== on) { el.classList.toggle('on', on); el._on = on; } });
  let k = 0; for (let q = 0; q < BOUND.length; q++) if (sp >= BOUND[q]) k = q;
  if (k !== lastIdx) { $('#idx').innerHTML = `0${k + 1} / 06 &nbsp; ${NAMES[k]}`; lastIdx = k; }
  // tool names ride under their tools
  if (sp > 8.3 && sp < 11) document.querySelectorAll('.tname').forEach((el, q) => { el.style.transform = `translate(${(toolCX(q) - 50).toFixed(1)}px,${(R4() + 22).toFixed(1)}px)`; });
  // hero underline strikes
  const u = underEl.children;
  for (let w = 0; w < u.length; w++) {
    const ord = (w) / Math.max(1, nWords); const uu = (sp - .4) / 2.2; const tt = clamp(uu * 1.8 - .8 * ord);
    const sc = clamp(tt / .12), op = 1 - clamp((tt - .2) / .2);
    const v = sc.toFixed(3) + '|' + op.toFixed(2);
    if (u[w]._v !== v) { u[w].style.transform = `scaleX(${sc.toFixed(3)})`; u[w].style.opacity = op.toFixed(2); u[w]._v = v; }
  }
  { const tv = sp > 6.7 && sp < 7.7; const s3 = $('#s3'); if (s3._t !== tv) { s3.classList.toggle('tr', tv); s3._t = tv; } }
  { const hd = sp < 15.9; const f = $('#send'); if (f._h !== hd) { f.classList.toggle('hold', hd); f._h = hd; } }
  const hov = sp > 6.75 && sp < 7.65; if (tilesEl._h !== hov) { tilesEl.classList.toggle('hover', hov); tilesEl._h = hov; if (!hov && hovered >= 0) { hovered = -1; litTrace(-1); } }
  $('#editline').style.pointerEvents = sp < 0.35 ? 'auto' : 'none';
}

/* ---------- frame loop ---------- */
let sy = scrollY, lastT = performance.now(), dirty = true, lastSp = -1;
function frame(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  const target = scrollY;
  sy += (target - sy) * (RM ? 1 : (1 - Math.exp(-dt / 0.15)));      // D3 time-based damping
  if (Math.abs(target - sy) < 0.3) sy = target;
  const sp = sy / H;
  const introLive = now - t0 < 2600;
  drawPaper(now, sp);
  if (dirty || introLive || Math.abs(sp - lastSp) > 1e-5) {
    lastSp = sp; dirty = false;
    growG = ss(clamp((sp - 2.65) / 1.35));
    shrinkG = ss(clamp((sp - 5.95) / 0.9));
    trackU = clamp((sp - 8.6) / 2.1); trackU = trackU < .5 ? 2 * trackU * trackU : 1 - Math.pow(-2 * trackU + 2, 2) / 2; trackU = lerp(clamp((sp - 8.6) / 2.1), trackU, .5);
    layerY = sp > L5 ? -(sp - L5) * H : 0;
    layerEl.style.transform = `translate3d(0,${layerY.toFixed(1)}px,0)`;
    for (let i = 0; i < N; i++) {
      const s = tileState(i, sp), t = T[i], L = t.last;
      const tr = `translate3d(${s[0].toFixed(1)}px,${s[1].toFixed(1)}px,0) rotate(${s[3].toFixed(1)}deg) scale(${s[2].toFixed(4)})`;
      if (L.tr !== tr) { t.el.style.transform = tr; L.tr = tr; }
      const op = s[6].toFixed(3); if (L.op !== op) { t.el.style.opacity = op; L.op = op; }
      const bg = s[4].toFixed(3); if (L.bg !== bg) { t.b.style.opacity = bg; L.bg = bg; }
      const ol = s[5].toFixed(3); if (L.ol !== ol) { t.o.style.opacity = ol; L.ol = ol; }
      const hh = s[7].toFixed(3); if (L.hh !== hh) { t.h.style.opacity = hh; L.hh = hh; }
      const acc = s[8] > 0.5; if (t.acc !== acc) { t.el.classList.toggle('acc', acc); t.acc = acc; }
      const lit = hovered === i; if (t.lit !== lit) { t.el.classList.toggle('lit', lit); t.lit = lit; }
    }
    drawRule(sp); drawFrame(sp); drawChar(sp, now); drawTrail(sp); drawText(sp);
  }
  requestAnimationFrame(frame);
}

/* ---------- hand: edit the hero line, send the end line, own cursor ---------- */
const cur = $('#cur');
addEventListener('pointermove', e => {
  cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
  const t = e.target;
  const ed = !!(t.closest && t.closest('[data-edit]')), bt = !!(t.closest && t.closest('.btn, .t'));
  if (cur._ed !== ed) { cur.classList.toggle('ed', ed); cur._ed = ed; }
  if (cur._bt !== bt) { cur.classList.toggle('bt', bt); cur._bt = bt; }
}, { passive: true });
document.addEventListener('pointerleave', () => cur.style.opacity = 0);
document.addEventListener('pointerenter', () => cur.style.opacity = 1);
const lin = $('#lineinput');
$('#editline').addEventListener('click', () => {
  editing = true; dirty = true; lin.value = line === DEF ? '' : line; lin.placeholder = DEF; lin.classList.add('show'); lin.focus();
});
function commit() { if (!editing) return; editing = false; lin.classList.remove('show'); parseLine(lin.value); setGlyphs(); dirty = true; t0 = performance.now() - 300; $('#endinput').value = ''; }
lin.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { lin.value = line; commit(); } });
lin.addEventListener('blur', commit);
$('#toend').addEventListener('click', e => { e.preventDefault(); scrollTo({ top: document.documentElement.scrollHeight - innerHeight, behavior: 'smooth' }); setTimeout(() => $('#endinput').focus({ preventScroll: true }), 1600); });
const form = $('#send'), ein = $('#endinput');
const idle = () => form.classList.toggle('idle', !ein.value && document.activeElement !== ein);
ein.addEventListener('input', idle); ein.addEventListener('focus', idle); ein.addEventListener('blur', idle);
form.addEventListener('submit', e => {
  e.preventDefault();
  const v = ein.value.trim(); if (!v) { ein.focus(); return; }
  const r = ein.getBoundingClientRect(); const st = $('#stage');
  let x = r.left;
  [...v].forEach((ch, k) => {
    const s = document.createElement('span'); s.className = 'fly'; s.textContent = ch;
    s.style.left = x + 'px'; s.style.top = (r.top + 4) + 'px'; s.style.fontSize = getComputedStyle(ein).fontSize; st.appendChild(s);
    x += parseFloat(getComputedStyle(ein).fontSize) * (ch === ' ' ? .34 : 1);
    requestAnimationFrame(() => requestAnimationFrame(() => { s.style.transitionDelay = (k * 0.03) + 's'; s.style.transform = `translateX(${W + 200}px)`; s.style.opacity = 0; }));
    setTimeout(() => s.remove(), 2600 + k * 30);
  });
  ein.value = ''; ein.blur(); idle();
  const m = $('#sendmsg'); m.textContent = '한 줄을 받았습니다. 곧 답장 드릴게요.'; m.classList.add('ok');
});

/* ---------- start ---------- */
parseLine(DEF); buildTiles();
history.scrollRestoration = 'manual';
layout(); setGlyphs(); idle();
addEventListener('resize', () => { layout(); });
const start = () => { t0 = performance.now(); $('#s1').classList.add('on'); $('#s1')._on = true; dirty = true; };
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { layout(); start(); });
requestAnimationFrame(frame);
})();
