#!/usr/bin/env python3
"""Fit data for the fitted-shoe pictures (public/fashion/feet-<gender>-<outfit>-<shoe>.png) -> public/shoe-fit.js.

Each picture holds BOTH shoes in one image, touching or slightly overlapping. For the walking character every shoe has to
move with its own leg, so for every picture this finds:
  - t : the top row (400-px layer units) of the left and of the right shoe; the painted footwear of the outfit is cut away
        from there down and each leg ends just inside its shoe;
  - s : the curve between the two shoes (watershed on the silhouette, layer units) used to clip the picture into a left
        and a right shoe.
It also fills the see-through gaps between the straps of sandals with skin (originals kept in tools/art/src/feet/).

Run with numpy, scipy and Pillow:  python3 tools/art/shoe-fit.py
"""
import os, re, json, glob
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, '..', '..', 'public')
FASH = os.path.join(PUB, 'fashion')
SRC = os.path.join(HERE, 'src', 'feet')
SHOD = {'denim', 'denimjacket', 'green', 'master', 'jade', 'legend'}

def skin_of(g, o):
    f = os.path.join(FASH, f'rig-{g}-{o}' + ('-shod' if o in SHOD else '') + '.png')
    im = np.array(Image.open(f).convert('RGBA')).astype(int)
    r, gg, b, a = im[..., 0], im[..., 1], im[..., 2], im[..., 3]
    m = (a > 200) & (r > 225) & (gg > 160) & (gg < 215) & (b > 115) & (b < 185) & (r - gg > 28) & (r - gg < 80)
    m[:560] = False; m[700:] = False
    return np.median(im[..., :3][m], axis=0) if m.sum() > 50 else np.array([248., 200., 165.])

def seam(im, mask):
    """Boundary between the two shoes as a path x(y): a minimum-cost seam through the dark outline where the shoes
    overlap (or through the gap where they don't), kept near the middle of the pair. Returns x per row (800-px units)
    for rows y0..y1 together with y0."""
    ys, xs = np.where(mask)
    y0, y1, xmin, xmax = int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max())
    mid = (xmin + xmax) / 2.0
    half = max(26, int((xmax - xmin) * .16))
    lo, hi = int(mid - half), int(mid + half)
    a = im[..., 3] / 255.0
    lum = (0.299 * im[..., 0] + 0.587 * im[..., 1] + 0.114 * im[..., 2]) / 255.0
    cost = a * (0.15 + lum) + 0.0                              # transparent = free, dark outline = cheap, bright fill = dear
    cost = ndi.gaussian_filter(cost, 1.0)
    W = hi - lo + 1
    rows = y1 - y0 + 1
    pen = 0.012 * np.abs(np.arange(lo, hi + 1) - mid)[None, :]
    C = cost[y0:y1 + 1, lo:hi + 1] + pen
    D = np.full((rows, W), 1e9); P = np.zeros((rows, W), np.int8)
    D[0] = C[0]
    for r in range(1, rows):
        best = np.full(W, 1e9); arg = np.zeros(W, np.int8)
        for d in (-2, -1, 0, 1, 2):
            sh = np.full(W, 1e9)
            if d < 0: sh[:d] = D[r - 1][-d:]
            elif d > 0: sh[d:] = D[r - 1][:-d]
            else: sh = D[r - 1].copy()
            m = sh + (abs(d) * 0.02)
            better = m < best; best[better] = m[better]; arg[better] = d
        D[r] = best + C[r]; P[r] = arg
    x = int(np.argmin(D[-1])); path = [x]
    for r in range(rows - 1, 0, -1):
        x = x - int(P[r][x]) if False else x
        d = int(P[r][x]); x = x - d; path.append(x)
    path = np.array(path[::-1]) + lo
    return ndi.uniform_filter1d(path.astype(float), 7, mode='nearest'), y0

def curve_from_seam(path, y0):
    return [[round(float(x) / 2, 1), round((y0 + i) / 2, 1)] for i, x in enumerate(path) if i % 5 == 0 or i == len(path) - 1]

def main():
    fit = {}
    for f in sorted(glob.glob(os.path.join(SRC, 'feet-*.png')) + [p for p in sorted(glob.glob(os.path.join(FASH, 'feet-*.png'))) if not p.endswith('-sandals.png')]):
        key = os.path.basename(f)[5:-4]; g, o, sh = key.split('-')
        im = np.array(Image.open(f).convert('RGBA')).astype(float)
        a = im[..., 3] / 255.0
        mask = a > .5
        if sh == 'sandals':                                  # skin under the straps: close the gaps, keep the toes open
            pocket = ndi.binary_closing(mask, structure=np.ones((3, 3)), iterations=9) & ~(a > .9)
            fillc = skin_of(g, o)
            yy = np.arange(800)[:, None].astype(float)
            ys_ = np.where(mask)[0]; y0, y1 = ys_.min(), ys_.max()
            shade = 1.0 - .22 * np.clip((yy - y0) / max(y1 - y0, 1), 0, 1)
            under = np.zeros_like(im); under[..., :3] = fillc[None, None, :] * shade[..., None]
            under[..., 3] = 255 * ndi.gaussian_filter(pocket.astype(float), .8)
            comp = Image.fromarray(under.clip(0, 255).astype(np.uint8), 'RGBA')
            comp.alpha_composite(Image.fromarray(im.astype(np.uint8), 'RGBA'))
            comp.save(os.path.join(FASH, f'feet-{key}.png'), optimize=True)
            mask = np.array(comp)[..., 3] > 128
        path, y0 = seam(im, mask)
        yy, xx = np.mgrid[0:800, 0:640]
        xs_row = np.full(800, np.nan); xs_row[y0:y0 + len(path)] = path
        xs_row[:y0] = path[0]; xs_row[y0 + len(path):] = path[-1]
        L = mask & (xx < xs_row[:, None]); R = mask & (xx >= xs_row[:, None])
        tl = float(np.where(L)[0].min()) / 2 if L.any() else y0 / 2
        tr = float(np.where(R)[0].min()) / 2 if R.any() else y0 / 2
        pts = curve_from_seam(path, y0)
        fit[key] = {'t': [round(tl, 1), round(tr, 1)], 's': pts}
    js = '// Generated by tools/art/shoe-fit.py. t = top row of the left / right shoe, s = curve between the two shoes (400-px layer units).\nwindow.XOM_SHOE_FIT=' + json.dumps(fit, separators=(',', ':')) + ';\n'
    open(os.path.join(PUB, 'shoe-fit.js'), 'w').write(js)
    print('fitted', len(fit), 'pictures,', len(js) // 1024, 'KB')

if __name__ == '__main__':
    main()
