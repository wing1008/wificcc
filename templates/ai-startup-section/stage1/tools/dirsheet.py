# Builds dir/DIRECTION-SHEET.jpg: 3 mocks next to award motion sheets, the nearest section/ reference per direction, 2 floor strips, and notes.
import sys, os, textwrap
from PIL import Image, ImageDraw, ImageFont
S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = '/home/user/uf-service/pipeline/sek/refs/references'
F = lambda w, sz: ImageFont.truetype(os.path.join(S, 'tools', f'NotoSansKR-{w}.ttf'), sz)
W = 3000
def fit(p, w):
    im = Image.open(p).convert('RGB'); return im.resize((w, round(im.height * w / im.width)))
blocks = []
def title(t, sz=40, h=70, col=(20, 20, 20)):
    im = Image.new('RGB', (W, h), 'white'); ImageDraw.Draw(im).text((30, 12), t, font=F(700, sz), fill=col); blocks.append(im)
def text(lines, sz=26):
    lh = round(sz * 1.55); wrapped = []
    for l in lines: wrapped += textwrap.wrap(l, 175) or ['']
    im = Image.new('RGB', (W, lh * len(wrapped) + 30), 'white'); d = ImageDraw.Draw(im)
    for i, l in enumerate(wrapped): d.text((30, 10 + i * lh), l, font=F(400, sz), fill=(30, 30, 30))
    blocks.append(im)
def row(imgs, labels, h=None):
    gap = 20; n = len(imgs); w = (W - 60 - gap * (n - 1)) // n
    ims = [fit(p, w) for p in imgs]; H = max(i.height for i in ims) + 50
    im = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(im)
    for k, (i, lab) in enumerate(zip(ims, labels)):
        x = 30 + k * (w + gap); d.text((x, 4), lab, font=F(700, 24), fill=(60, 60, 60)); im.paste(i, (x, 44))
    blocks.append(im)
title('온갖 [DRAFT name] — 방향 시트 / direction sheet  (stage1, 2026-10-22)', 46, 90)
title('Award level: 6 motion sheets (plain, 24 frames evenly in time)', 30, 56, (90, 90, 90))
ms = ['at', 'unseen', 'lando', 'igloo', 'deepsee', 'fromanother']
row([f'{R}/motion-sheets/{m}-plain.jpg' for m in ms[:3]], ms[:3])
row([f'{R}/motion-sheets/{m}-plain.jpg' for m in ms[3:]], ms[3:])
dirs = [('A', '한 줄의 재배치 — 글자가 재료가 된다', 'illoca'),
        ('B', '불 켜지는 작업대 — 빛이 지나간 자리부터 단단해진다', 'mclaren-w1'),
        ('C', '만든 것들의 지도 — 한 장 캔버스를 확대해 들어간다', 'radian')]
for k, t, ref in dirs:
    title(f'Direction {k}: {t}   |   level to reach: section/{ref}', 34, 64)
    row([f'{S}/dir/mock-{k.lower()}.png', f'{R}/motion-sheets-sections/section/{ref}-plain.jpg', f'{R}/motion-sheets-sections/section/{ref}-map.jpg'],
        [f'mock {k} — key frame (1920x1080, headless)', f'{ref}-plain (reference level)', f'{ref}-map (where things move)'])
title('Floor: 2 paid-template strips (8 frames evenly down the page)', 30, 56, (90, 90, 90))
row([f'{R}/motion-sheets-sections/floor/mugen-strip.jpg', f'{R}/motion-sheets-sections/floor/neiden-strip.jpg'], ['floor / mugen', 'floor / neiden'])
title('Under the sheet — where each mock falls short, and the floor', 34, 64)
text(open(os.path.join(S, 'tools', 'sheet-notes.txt'), encoding='utf-8').read().split('\n'))
H = sum(b.height for b in blocks); out = Image.new('RGB', (W, H), 'white'); y = 0
for b in blocks: out.paste(b, (0, y)); y += b.height
out.save(os.path.join(S, 'dir', 'DIRECTION-SHEET.jpg'), quality=86); print(out.size)
