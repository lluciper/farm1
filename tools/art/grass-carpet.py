#!/usr/bin/env python3
"""Seamless grass-carpet tile for the barn yard -> public/pens/grass-carpet.webp (512x512, tiles in both directions).

Thousands of short painted blades in the game's leaf greens on a soft mottled base, a few clover patches and tiny
flowers. Everything is drawn wrapped around the tile edges, so the tile repeats without seams.
Run with numpy, scipy and Pillow:  python3 tools/art/grass-carpet.py
"""
import os, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'public', 'pens', 'grass-carpet.webp')
N, S = 512, 2                     # tile size, supersampling
R = random.Random(7)

def base():
    # mottled base: wrapped low-frequency noise between two greens
    rng = np.random.default_rng(3)
    n = ndi.gaussian_filter(rng.random((N, N)), 26, mode='wrap'); n = (n - n.min()) / (n.max() - n.min())
    m = ndi.gaussian_filter(rng.random((N, N)), 7, mode='wrap'); m = (m - m.min()) / (m.max() - m.min())
    a, b = np.array([108, 168, 58.]), np.array([142, 196, 78.])
    img = a + (b - a) * (n * .75 + m * .25)[..., None]
    return Image.fromarray(img.clip(0, 255).astype(np.uint8)).resize((N * S, N * S), Image.BICUBIC)

def wrap(draw_fn, x, y, pad):
    for dx in (-N, 0, N):
        for dy in (-N, 0, N):
            if -pad < x + dx < N + pad and -pad < y + dy < N + pad:
                draw_fn(x + dx, y + dy)

def blade(d, x, y, h, lean, w, col):
    tip = (x + lean, y - h)
    pts = [(x - w, y), ((x - w * .2 + tip[0]) / 2 - lean * .15, (y + tip[1]) / 2), tip, ((x + w * .2 + tip[0]) / 2 + lean * .1, (y + tip[1]) / 2), (x + w, y)]
    d.polygon([(px * S, py * S) for px, py in pts], fill=col)

def main():
    img = base(); d = ImageDraw.Draw(img, 'RGBA')
    greens = [(78, 127, 39), (96, 150, 48), (125, 180, 70), (150, 204, 90), (184, 220, 122)]
    # darker clumps first, then the bright blades on top (rows from back to front so lower blades overlap)
    for layer, (count, hr, cols, alpha) in enumerate([(1400, (7, 12), greens[:2], 150), (2600, (6, 11), greens[1:4], 200), (900, (5, 9), greens[3:], 220)]):
        pts = sorted(((R.random() * N, R.random() * N) for _ in range(count)), key=lambda p: p[1])
        for x, y in pts:
            h, lean, w = R.uniform(*hr), R.uniform(-4, 4), R.uniform(1.1, 2)
            c = R.choice(cols) + (alpha,)
            wrap(lambda X, Y: blade(d, X, Y, h, lean, w, c), x, y, 16)
    # clover patches and tiny flowers
    for _ in range(14):
        cx, cy = R.random() * N, R.random() * N
        for _ in range(5):
            x, y = cx + R.uniform(-10, 10), cy + R.uniform(-7, 7)
            def clover(X, Y):
                for a in (0, 2.1, 4.2):
                    ox, oy = math.cos(a) * 2.6, math.sin(a) * 2.2
                    d.ellipse([(X + ox - 2.6) * S, (Y + oy - 2.2) * S, (X + ox + 2.6) * S, (Y + oy + 2.2) * S], fill=(88, 148, 52, 235))
            wrap(clover, x, y, 10)
    for _ in range(26):
        x, y = R.random() * N, R.random() * N; col = R.choice([(255, 255, 255), (255, 243, 176), (246, 178, 194)])
        def flower(X, Y):
            for a in range(5):
                ang = a * 2 * math.pi / 5; ox, oy = math.cos(ang) * 1.9, math.sin(ang) * 1.6
                d.ellipse([(X + ox - 1.5) * S, (Y + oy - 1.3) * S, (X + ox + 1.5) * S, (Y + oy + 1.3) * S], fill=col + (240,))
            d.ellipse([(X - 1) * S, (Y - 1) * S, (X + 1) * S, (Y + 1) * S], fill=(248, 202, 76, 255))
        wrap(flower, x, y, 6)
    img = img.resize((N, N), Image.LANCZOS)
    img.save(OUT, 'WEBP', quality=88, method=6)
    print('wrote', OUT, os.path.getsize(OUT), 'bytes')

if __name__ == '__main__':
    main()
