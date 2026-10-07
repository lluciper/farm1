#!/usr/bin/env python3
"""Split every hairstyle into two paper-doll layers (public/fashion/hair-X.png and hair-X-front.png).

Source: tools/art/src/hair-X.png, a complete hairstyle drawn on the character's head.
 - hair-X.png        hair hanging below the chin: drawn BEHIND the body, so locks fall behind shoulders and arms;
 - hair-X-front.png  the hair on the head: drawn OVER the head with a face-shaped window cut out, so bangs and locks
                     frame the eyes, nose and mouth and never hide them.
Stacked together (behind, body, front) they reproduce the complete hairstyle outside the face window.

Run with a Python that has numpy, scipy and Pillow:  python3 tools/art/split-hair.py
"""
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'public', 'fashion')
HAIRS = ['short', 'bob', 'pony', 'wave', 'curly', 'buns', 'braid', 'side']
H, W = 800, 640
CHIN = 432                  # hair from this row down hangs behind the body
FACE = dict(cx=358, cy=322, rx=124, ry=110)   # face window (covers brows, eyes, nose, mouth of every body)
HEAD = os.path.join(OUT, 'body-female-0.png')
FEATHER = 1.6               # soft edge in px

def head_inner():
    a = np.array(Image.open(HEAD).convert('RGBA'))[..., 3] > 128
    a[CHIN + 8:] = False
    return ndi.binary_erosion(a, iterations=9)          # keep the head's own outline rim covered by hair

def window():
    yy, xx = np.mgrid[0:H, 0:W]
    e = ((xx - FACE['cx']) / FACE['rx']) ** 2 + ((yy - FACE['cy']) / FACE['ry']) ** 2 <= 1
    w = (e & head_inner()).astype(float)
    return ndi.gaussian_filter(w, FEATHER)

def main():
    win = window()
    rows = np.arange(H)[:, None]
    front_rows = np.clip((CHIN - rows) / 6.0, 0, 1)        # the hair on the head fades out over 6 rows at the chin
    for h in HAIRS:
        src = np.array(Image.open(os.path.join(HERE, 'src', f'hair-{h}.png')).convert('RGBA')).astype(float)
        a = src[..., 3] / 255.0
        front = src.copy(); front[..., 3] = 255 * a * front_rows * (1 - win)
        # A dark line where the hair meets the face, like the outline painted around every other shape.
        ring = ndi.binary_dilation(win > .5, iterations=5) & ~(win > .5)
        ring = ndi.gaussian_filter(ring.astype(float), 1.2)[..., None]
        front[..., :3] = front[..., :3] * (1 - .62 * ring) + np.array([44, 24, 18]) * (.62 * ring)
        # The behind layer starts a little above the cut so scaled-down copies never show a hairline seam; the head and
        # the front layer hide the overlap.
        behind = src.copy(); behind[..., 3] = 255 * a * (rows >= CHIN - 10)
        Image.fromarray(front.clip(0, 255).astype(np.uint8)).save(os.path.join(OUT, f'hair-{h}-front.png'), optimize=True)
        Image.fromarray(behind.clip(0, 255).astype(np.uint8)).save(os.path.join(OUT, f'hair-{h}.png'), optimize=True)
        print('split', h)

if __name__ == '__main__':
    main()
