# 흐름 시트(일반판): python flowsheet.py <id> [dir]  (dir 안의 <id>.webm·<id>.json → <id>-plain.jpg, <id>-map.jpg)  → sheets/<id>-plain.jpg , sheets/<id>-map.jpg
# plain = 스크롤 구간에서 시간 균등 24장. map = Motion-as-Prompt(arXiv 2608.11655) 근사:
#   프레임 차 에너지 누적의 등분위로 24장(움직임 많은 곳에 촘촘), 직전 칸→이 칸 사이 점 궤적(Shi-Tomasi + LK 광류, 프레임마다 추적)을 칸 위에 그림.
#   원 논문의 조밀 점 추적기는 밝혀지지 않음 → OpenCV 근사(자진 신고).
import cv2, json, sys, numpy as np
from PIL import Image, ImageDraw, ImageFont
id_ = sys.argv[1]; D = sys.argv[2] if len(sys.argv) > 2 else '.'
meta = json.load(open(f'{D}/{id_}.json')); c = cv2.VideoCapture(f'{D}/{id_}.webm'); fps = c.get(5)
fr = []; t = []
while True:
    ok, f = c.read()
    if not ok: break
    fr.append(f); t.append(len(t) / fps)
S0 = meta.get('pointerStart', meta['scrollStart']); a = S0 - 0.3
# 10/9: 바닥 도착(bottomAt)이 있으면 그 뒤 1초까지만 — 그 뒤는 «더 내려갈 데가 없는 화면»이라 정지로 오인됨(C5~C10 판정 착시). TAIL 로 정지 구간을 일부러 볼 때는 그대로.
b = (meta['bottomAt'] + 1.0) if ('bottomAt' in meta and not meta.get('tail', 1.5) > 2) else (meta.get('scrollEnd', t[-1]) + 1.2)
idx = [i for i, x in enumerate(t) if a <= x <= b]
small = [cv2.cvtColor(cv2.resize(fr[i], (360, 225)), cv2.COLOR_BGR2GRAY).astype(np.float32) for i in idx]
energy = np.array([0.0] + [float(np.mean(np.abs(small[k] - small[k - 1]))) for k in range(1, len(small))])
N = 24; W, H, C = 480, 300, 6
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 20)
def save(sel, name, draw_tracks):
    R = (len(sel) + C - 1) // C; im = Image.new('RGB', (W * C, H * R), 'black'); d = ImageDraw.Draw(im)
    for k, j in enumerate(sel):
        i = idx[j]; tile = Image.fromarray(cv2.cvtColor(cv2.resize(fr[i], (W, H)), cv2.COLOR_BGR2RGB)); im.paste(tile, ((k % C) * W, (k // C) * H))
        if draw_tracks and k > 0:
            j0 = sel[k - 1]; g0 = cv2.cvtColor(cv2.resize(fr[idx[j0]], (W, H)), cv2.COLOR_BGR2GRAY)
            pts = cv2.goodFeaturesToTrack(g0, 50, 0.01, 20)   # 10/8: 120점은 화면을 가려 50점으로
            if pts is not None:
                paths = [[tuple(p.ravel())] for p in pts]; alive = np.ones(len(pts), bool); prev = g0; cur = pts
                for jj in range(j0 + 1, j + 1):
                    g = cv2.cvtColor(cv2.resize(fr[idx[jj]], (W, H)), cv2.COLOR_BGR2GRAY)
                    nxt, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, cur, None, winSize=(21, 21), maxLevel=3)
                    st = st.ravel().astype(bool); alive &= st
                    for q in range(len(paths)):
                        if alive[q]: paths[q].append(tuple(nxt[q].ravel()))
                    prev, cur = g, nxt
                ox, oy = (k % C) * W, (k // C) * H
                for q, pth in enumerate(paths):
                    if len(pth) < 2: continue
                    L = np.hypot(pth[-1][0] - pth[0][0], pth[-1][1] - pth[0][1])
                    if L < 3: continue   # 거의 안 움직인 점은 그리지 않음
                    col = tuple(int(v) for v in cv2.cvtColor(np.uint8([[[q * 7 % 180, 255, 255]]]), cv2.COLOR_HSV2RGB)[0, 0])
                    d.line([(ox + x, oy + y) for x, y in pth], fill=col, width=2); x, y = pth[-1]; d.ellipse([ox + x - 3, oy + y - 3, ox + x + 3, oy + y + 3], fill=col)
        ts = t[idx[j]] - S0
        d.rectangle([(k % C) * W, (k // C) * H, (k % C) * W + 118, (k // C) * H + 26], fill='black')
        d.text(((k % C) * W + 5, (k // C) * H + 2), f'{k+1}  {ts:5.2f}s', fill='yellow', font=font)
    im.save(f'{D}/{id_}-{name}.jpg', quality=82)
plain = [round(k * (len(idx) - 1) / (N - 1)) for k in range(N)]
cum = np.cumsum(energy); cum = cum / cum[-1] if cum[-1] > 0 else np.linspace(0, 1, len(cum))
mp = sorted(set([int(np.searchsorted(cum, q)) for q in np.linspace(0, 1, N)]))
mp = [min(x, len(idx) - 1) for x in mp]
while len(mp) < N:   # 겹친 칸은 가장 긴 간격을 반으로
    gaps = [(mp[k + 1] - mp[k], k) for k in range(len(mp) - 1)]; g, k = max(gaps)
    if g < 2: break
    mp.insert(k + 1, mp[k] + g // 2)
save(plain, 'plain', False); save(mp, 'map', True)
print(id_, 'frames', len(idx), 'scroll-window s', round(b - a, 1), 'plain', N, 'map', len(mp))
