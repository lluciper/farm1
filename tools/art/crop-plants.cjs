// Draws the growing-plant pictures for crops that had only an emoji (public/crops/<key>.svg, 200x300 like the crop atlas).
// Same recipe as the painted crops: a sandy soil mound with grass tufts, the plant on top, warm brown outlines,
// two-tone leaves with a highlight, glossy fruit. Run: node tools/art/crop-plants.cjs
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '../../public/crops');
fs.mkdirSync(OUT, { recursive: true });

const INK = '#5A3920';
const f = n => +n.toFixed(1);
let uid = 0;

// ---------- shared pieces ----------
const defs = `<defs>
<linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0cd85"/><stop offset=".55" stop-color="#d9a55c"/><stop offset="1" stop-color="#b47a3c"/></linearGradient>
<linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a9d860"/><stop offset=".5" stop-color="#6fae3e"/><stop offset="1" stop-color="#3f7a26"/></linearGradient>
<linearGradient id="leafDark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fb14a"/><stop offset=".55" stop-color="#3f8a2e"/><stop offset="1" stop-color="#245a1c"/></linearGradient>
<linearGradient id="leafLight" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2f5a6"/><stop offset=".5" stop-color="#b3df6b"/><stop offset="1" stop-color="#6fae3e"/></linearGradient>
<linearGradient id="leafPurple" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b878b0"/><stop offset=".55" stop-color="#7d3f7f"/><stop offset="1" stop-color="#4f2552"/></linearGradient>
<radialGradient id="red" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff8a72"/><stop offset=".5" stop-color="#d8392b"/><stop offset="1" stop-color="#9a1f1a"/></radialGradient>
<radialGradient id="cherry" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff7a82"/><stop offset=".55" stop-color="#c62f37"/><stop offset="1" stop-color="#7d1420"/></radialGradient>
<radialGradient id="orange" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffc06a"/><stop offset=".55" stop-color="#ef7a2a"/><stop offset="1" stop-color="#b94a14"/></radialGradient>
<radialGradient id="gacFruit" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#ffa060"/><stop offset=".5" stop-color="#ee4a22"/><stop offset="1" stop-color="#a51e14"/></radialGradient>
<radialGradient id="unripe" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#e3f39a"/><stop offset=".55" stop-color="#9cc24a"/><stop offset="1" stop-color="#5d8a2a"/></radialGradient>
<linearGradient id="cucumber" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f6b22"/><stop offset=".45" stop-color="#5fa83a"/><stop offset=".7" stop-color="#7fc04a"/><stop offset="1" stop-color="#2f6b22"/></linearGradient>
<linearGradient id="bamboo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a07834"/><stop offset=".45" stop-color="#e3c27a"/><stop offset="1" stop-color="#9a7230"/></linearGradient>
<linearGradient id="trunk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e4422"/><stop offset=".45" stop-color="#b07a44"/><stop offset="1" stop-color="#6a3f1e"/></linearGradient>
<radialGradient id="coconut" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#cfe08a"/><stop offset=".55" stop-color="#8fae42"/><stop offset="1" stop-color="#55702a"/></radialGradient>
<radialGradient id="tuber" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#e48ab8"/><stop offset=".5" stop-color="#b0457a"/><stop offset="1" stop-color="#6e2650"/></radialGradient>
<radialGradient id="petal" cx=".5" cy=".9" r="1"><stop offset="0" stop-color="#fff2f5"/><stop offset=".45" stop-color="#ffc2d4"/><stop offset="1" stop-color="#e45d8c"/></radialGradient>
<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe0f0"/><stop offset="1" stop-color="#3e9fc4"/></linearGradient>
<linearGradient id="pod" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3c6a24"/><stop offset=".5" stop-color="#7fb244"/><stop offset="1" stop-color="#3c6a24"/></linearGradient>
<linearGradient id="podDark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1f2a18"/><stop offset=".5" stop-color="#4a5a34"/><stop offset="1" stop-color="#1f2a18"/></linearGradient>
</defs>`;

function mound(rx = 80, cy = 280) {
  const tufts = [[-62, 0], [-30, 4], [22, 5], [58, 1], [-8, 6]].map(([dx, dy]) => {
    const x = 100 + dx, y = cy - 4 + dy;
    return `<path d="M${x} ${y} q-3 -9 -7 -12 M${x} ${y} q0 -11 1 -15 M${x} ${y} q4 -8 8 -10" stroke="#5f9a2e" stroke-width="2.2" stroke-linecap="round" fill="none"/>`;
  }).join('');
  return `<ellipse cx="100" cy="${cy + 2}" rx="${rx + 2}" ry="15" fill="#3b2a12" opacity=".18"/>
<ellipse cx="100" cy="${cy}" rx="${rx}" ry="15" fill="url(#soil)" stroke="${INK}" stroke-width="2.4"/>
<ellipse cx="100" cy="${cy - 3}" rx="${rx * 0.62}" ry="7" fill="#9c5e2c" opacity=".45"/>
<circle cx="${100 - rx * 0.55}" cy="${cy + 4}" r="2.6" fill="#c8b8a0" stroke="${INK}" stroke-width="1"/><circle cx="${100 + rx * 0.62}" cy="${cy + 2}" r="2" fill="#c8b8a0" stroke="${INK}" stroke-width="1"/>
${tufts}`;
}
// Almond leaf with its base at (x,y), pointing up, rotated by rot degrees (clockwise).
function leaf(x, y, len, w, rot, fill = 'url(#leaf)', vein = true) {
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><path d="M0 0 C${f(w * 0.95)} ${f(-len * 0.22)} ${f(w * 0.75)} ${f(-len * 0.8)} 0 ${f(-len)} C${f(-w * 0.75)} ${f(-len * 0.8)} ${f(-w * 0.95)} ${f(-len * 0.22)} 0 0Z" fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>${vein ? `<path d="M0 ${f(-len * 0.08)} Q${f(w * 0.12)} ${f(-len * 0.5)} 0 ${f(-len * 0.86)}" stroke="#2c5a18" stroke-width="1.1" opacity=".55" fill="none"/><path d="M${f(-w * 0.3)} ${f(-len * 0.28)} Q${f(-w * 0.45)} ${f(-len * 0.55)} ${f(-w * 0.12)} ${f(-len * 0.76)}" stroke="#f0ffd0" stroke-width="1.4" opacity=".55" fill="none" stroke-linecap="round"/>` : ''}</g>`;
}
// Heart-shaped leaf (sweet potato), base at (x,y).
function heartLeaf(x, y, s, rot, fill = 'url(#leaf)') {
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})"><path d="M0 0 C-14 -6 -20 -20 -12 -30 C-7 -36 -1 -34 0 -28 C1 -34 7 -36 12 -30 C20 -20 14 -6 0 0Z" transform="translate(0 2) rotate(180 0 -16)" fill="${fill}" stroke="${INK}" stroke-width="${f(2 / s)}" stroke-linejoin="round"/><path d="M0 -2 L0 -26" stroke="#2c5a18" stroke-width="${f(1 / s)}" opacity=".5"/></g>`;
}
// Five-lobed vine leaf (cucumber, gac), centre (x,y).
function lobedLeaf(x, y, r, rot, fill = 'url(#leaf)') {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = (-90 + i * 72) * Math.PI / 180, a2 = a + 36 * Math.PI / 180;
    pts.push([Math.cos(a) * r, Math.sin(a) * r], [Math.cos(a2) * r * 0.55, Math.sin(a2) * r * 0.55]);
  }
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i <= pts.length; i++) {
    const p = pts[i % pts.length], q = pts[i - 1];
    const mx = (p[0] + q[0]) / 2 * 1.18, my = (p[1] + q[1]) / 2 * 1.18;
    d += ` Q${f(mx)} ${f(my)} ${f(p[0])} ${f(p[1])}`;
  }
  const veins = [0, 1, 2, 3, 4].map(i => { const a = (-90 + i * 72) * Math.PI / 180; return `M0 0 L${f(Math.cos(a) * r * 0.75)} ${f(Math.sin(a) * r * 0.75)}`; }).join(' ');
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><path d="${d}Z" fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="${veins}" stroke="#2c5a18" stroke-width="1.1" opacity=".5" fill="none"/></g>`;
}
function ball(x, y, r, fill, hl = true) {
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" stroke="${INK}" stroke-width="1.8"/>${hl ? `<ellipse cx="${f(x - r * 0.35)}" cy="${f(y - r * 0.38)}" rx="${f(r * 0.32)}" ry="${f(r * 0.22)}" fill="#fff" opacity=".6"/>` : ''}`;
}
// Stem drawn as an outlined stroke (ink underneath, colour on top).
function stem(d, w, color = '#5f9a2e') {
  return `<path d="${d}" stroke="${INK}" stroke-width="${w + 3}" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
}
function bamboo(x0, y0, x1, y1, w = 7) {
  const len = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
  let nodes = '';
  for (let t = 28; t < len - 8; t += 34) nodes += `<path d="M${f(t)} ${-w / 2} L${f(t)} ${w / 2}" stroke="#7a5420" stroke-width="1.6"/>`;
  return `<g transform="translate(${f(x0)} ${f(y0)}) rotate(${f(ang)})"><rect x="0" y="${-w / 2}" width="${f(len)}" height="${w}" rx="${w / 2}" fill="url(#bamboo)" stroke="${INK}" stroke-width="1.8"/>${nodes}</g>`;
}
function svg(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300">${defs}${body}</svg>\n`;
}
const rnd = (() => { let s = 7; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();

// ---------- richer helpers ----------
// Union outline: every shape is stroked first, then filled on top, so overlapping shapes read as one blob.
function blob(shapes, fill, sw = 4) {
  return `<g>${shapes.map(s => s.replace('/>', ` fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`)).join('')}${shapes.map(s => s.replace('/>', ` fill="${fill}"/>`)).join('')}</g>`;
}
// Rounded five-lobed vine leaf (cucumber, gac): five overlapping circles under one outline, veins on top.
function vineLeaf(x, y, r, rot, fill = 'url(#leaf)') {
  const lobes = [-90, -45, -135, 0, 180].map((a, i) => {
    const d = i === 0 ? r * 0.5 : i < 3 ? r * 0.45 : r * 0.36, rr = i === 0 ? r * 0.5 : i < 3 ? r * 0.44 : r * 0.36, ar = a * Math.PI / 180;
    return `<circle cx="${f(Math.cos(ar) * d)}" cy="${f(Math.sin(ar) * d)}" r="${f(rr)}"/>`;
  });
  lobes.push(`<circle cx="0" cy="0" r="${f(r * 0.46)}"/>`);
  const veins = [-90, -45, -135, -10, -170].map(a => { const ar = a * Math.PI / 180; return `M0 ${f(r * 0.2)} L${f(Math.cos(ar) * r * 0.82)} ${f(Math.sin(ar) * r * 0.82)}`; }).join(' ');
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">${blob(lobes, fill, 3.4)}<path d="${veins}" stroke="#2c5a18" stroke-width="1.1" opacity=".45" fill="none"/><circle cx="${f(-r * 0.3)}" cy="${f(-r * 0.45)}" r="${f(r * 0.18)}" fill="#f0ffd0" opacity=".35"/></g>`;
}
// Leaf with a scalloped (frilly) edge, base at (x,y), pointing up.
function frillyLeaf(x, y, len, w, rot, fill, bump = 3.2, n = 9) {
  const side = sgn => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([sgn * w * Math.pow(Math.sin(Math.PI * Math.min(t, 0.96)), 0.75), -len * t]); }
    return pts;
  };
  const R = side(1), L = side(-1).reverse();
  let d = 'M0 0';
  const seg = (pts, sgn) => { for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; d += ` Q${f((x0 + x1) / 2 + sgn * bump)} ${f((y0 + y1) / 2)} ${f(x1)} ${f(y1)}`; } };
  seg(R, 1); seg(L, -1);
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><path d="${d}Z" fill="${fill}" stroke="${INK}" stroke-width="1.9" stroke-linejoin="round"/><path d="M0 -3 Q${f(w * 0.08)} ${f(-len * 0.45)} 0 ${f(-len * 0.8)}" stroke="#f0ffd0" stroke-width="2.6" opacity=".55" fill="none" stroke-linecap="round"/></g>`;
}
// A rounded pile of soil like the painted crops: sandy mound, dark crumbs, pebbles, plenty of grass.
function pile(rx = 86, cy = 278) {
  let g = `<ellipse cx="100" cy="${cy + 6}" rx="${rx + 4}" ry="14" fill="#3b2a12" opacity=".2"/>`;
  g += blob([`<ellipse cx="100" cy="${cy}" rx="${rx}" ry="16"/>`, `<ellipse cx="${100 - rx * 0.45}" cy="${cy - 4}" rx="${rx * 0.4}" ry="12"/>`, `<ellipse cx="${100 + rx * 0.45}" cy="${cy - 3}" rx="${rx * 0.42}" ry="12"/>`, `<ellipse cx="100" cy="${cy - 7}" rx="${rx * 0.5}" ry="12"/>`], 'url(#soil)', 3);
  g += `<ellipse cx="100" cy="${cy - 6}" rx="${rx * 0.55}" ry="7" fill="#a86a32" opacity=".4"/>`;
  for (const [dx, dy, r] of [[-0.7, 6, 3], [0.66, 7, 2.6], [-0.2, 10, 2.2], [0.3, 9, 1.8]]) g += `<circle cx="${f(100 + dx * rx)}" cy="${cy + dy}" r="${r}" fill="#d8ccb6" stroke="${INK}" stroke-width="1"/>`;
  for (const [dx, dy] of [[-0.92, 2], [-0.6, -6], [-0.25, 4], [0.1, -8], [0.42, 3], [0.75, -4], [0.95, 3]]) {
    const x = 100 + dx * rx, y = cy + dy;
    g += `<path d="M${f(x)} ${y} q-4 -9 -8 -12 M${f(x)} ${y} q-1 -12 1 -16 M${f(x)} ${y} q4 -9 9 -11" stroke="#4e8a2a" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M${f(x)} ${y} q-1 -12 1 -16" stroke="#9fd35a" stroke-width="1" stroke-linecap="round" fill="none"/>`;
  }
  return g;
}
const R = (() => { let s = 11; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();
const jitter = (v, amt) => v + (R() - 0.5) * 2 * amt;
const GREENS = ['url(#leafDark)', 'url(#leaf)', 'url(#leafLight)'];

// ---------- plants ----------
const P = {};

P.coffee = () => {
  let b = pile(80);
  b += stem('M100 282 C99 250 101 214 100 96', 8, '#8a5a30');
  // Opposite branches, longest at the bottom: a cone-shaped shrub.
  const levels = [[246, 74], [224, 70], [202, 64], [180, 56], [158, 48], [136, 38], [116, 26]];
  const nodes = [];
  for (const [y, len] of levels) for (const dir of [-1, 1]) {
    const ex = 100 + dir * len, ey = y - 10;
    b += stem(`M100 ${y} Q${100 + dir * len * 0.5} ${y - 2} ${ex} ${ey}`, 3, '#9a6a3a');
    nodes.push([y, dir, len]);
  }
  for (const pass of [0, 1]) for (const [y, dir, len] of nodes) for (let k = 1; k <= 4; k++) {
    const x = 100 + dir * len * k / 4.2, yy = y - 2 - k * 2.4, l = 28 - k * 1.5;
    if (pass === 0) b += leaf(x, yy, l, 9.5, dir * 60 - 28 + k * 4, 'url(#leafDark)') + leaf(x, yy, l - 2, 9, dir * 120 + 20, 'url(#leafDark)');
    else if (k % 2) b += leaf(x, yy, l - 4, 8.5, dir * 85, 'url(#leaf)');
  }
  b += leaf(100, 100, 30, 10, -26, 'url(#leaf)') + leaf(100, 100, 30, 10, 26, 'url(#leaf)') + leaf(100, 98, 26, 9, 0, 'url(#leafLight)');
  for (const [y, dir, len] of nodes) {
    if (len < 30) continue;
    for (const k of [0.5]) {
      const cx = 100 + dir * len * k, cy = y - 3 - k * 6;
      const fills = ['url(#cherry)', 'url(#cherry)', 'url(#cherry)', 'url(#orange)', 'url(#cherry)', 'url(#unripe)'];
      [[0, 0], [6.5, -1], [-6, 1.5], [3, 6]].forEach(([dx, dy], i) => { b += ball(cx + dx * dir, cy + dy, 5, fills[(i + Math.round(y / 22)) % fills.length]); });
    }
  }
  return svg(b);
};

P.chili = () => {
  let b = pile(78);
  ['M100 282 C96 246 84 220 62 196', 'M100 282 C104 246 118 220 140 196', 'M100 282 C100 236 100 196 100 150', 'M100 268 C82 258 62 250 40 236', 'M100 268 C120 258 140 252 160 238'].forEach(d => { b += stem(d, 4, '#4e8a2a'); });
  // Back leaves dark, front leaves lighter, scattered over an oval canopy.
  for (let pass = 0; pass < 3; pass++) for (let i = 0; i < 16; i++) {
    const a = R() * Math.PI * 2, rr = Math.sqrt(R()), x = 100 + Math.cos(a) * 66 * rr, y = 200 + Math.sin(a) * 58 * rr;
    if (y > 258) continue;
    const rot = Math.atan2(y - 236, x - 100) * 180 / Math.PI + 90 + jitter(0, 20);
    b += leaf(x, y, jitter(30, 4), 10, rot, GREENS[pass]);
  }
  const chili = (x, y, rot, s, fill) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 C7 4 9 20 4 42 C2.5 47 -1.5 47 -2 42 C-1 23 -6 7 0 0Z" fill="${fill}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M1.5 8 C3.5 18 3.5 28 2 36" stroke="#fff" stroke-width="1.8" opacity=".55" fill="none" stroke-linecap="round"/><path d="M-4.5 1 L0 -3.5 L4.5 1 L2.5 4.5 L-2.5 4.5Z" fill="#4e8a2a" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><path d="M0 -3 Q1 -9 -2 -12" stroke="#4e8a2a" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>`;
  [[80, 176, 22, 1.15, 'url(#red)'], [120, 172, -16, 1.15, 'url(#red)'], [62, 202, 34, 1.05, 'url(#red)'], [138, 198, -32, 1.05, 'url(#orange)'], [100, 168, 4, 1.2, 'url(#red)'], [86, 214, 12, 1, 'url(#unripe)'], [114, 216, -10, 1.05, 'url(#red)'], [48, 226, 40, .95, 'url(#red)'], [152, 226, -40, .95, 'url(#red)']].forEach(c => { b += chili(...c); });
  for (const [x, y] of [[108, 150], [72, 186], [132, 190]]) b += `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-4" rx="2.8" ry="4.2" transform="rotate(${a})" fill="#fffaf0" stroke="${INK}" stroke-width="1"/>`).join('')}<circle r="2" fill="#f8ca4c"/></g>`;
  return svg(b);
};

P.cucumber = () => {
  let b = pile(86);
  b += bamboo(46, 284, 54, 50, 8) + bamboo(154, 284, 146, 50, 8) + bamboo(40, 92, 160, 92, 6) + bamboo(38, 160, 162, 160, 6) + bamboo(38, 226, 162, 226, 6);
  b += stem('M100 280 C70 250 130 230 92 200 C64 176 130 160 100 128 C82 108 118 92 100 62', 3.5, '#4e8a2a') + stem('M92 200 C114 192 132 190 150 176', 2.6, '#4e8a2a') + stem('M100 128 C78 122 64 114 50 100', 2.6, '#4e8a2a');
  for (const [x, y] of [[54, 92], [150, 160], [42, 226]]) b += `<path d="M${x} ${y} c-4 -6 4 -10 6 -4 c2 6 -8 8 -6 0" stroke="#5f9a2e" stroke-width="1.8" fill="none"/>`;
  [[100, 66, 22, 10, 0], [66, 100, 24, -20, 1], [134, 108, 24, 25, 1], [58, 150, 25, 10, 2], [142, 156, 25, -15, 0], [80, 196, 24, 30, 1], [124, 212, 24, -25, 2], [100, 140, 22, 0, 0], [70, 244, 22, 15, 1], [134, 250, 22, -20, 0], [100, 236, 20, 5, 2], [48, 200, 20, -30, 0], [152, 200, 20, 30, 1]].forEach(([x, y, r, rot, g]) => { b += vineLeaf(x, y, r, rot, GREENS[g]); });
  const cuke = (x, y, rot, len = 60) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0 C10 0 11 ${len * 0.3} 10 ${len * 0.75} C9 ${len} -9 ${len} -10 ${len * 0.75} C-11 ${len * 0.3} -10 0 0 0Z" fill="url(#cucumber)" stroke="${INK}" stroke-width="2"/>${[0.22, 0.4, 0.58, 0.76].map(t => `<circle cx="-4" cy="${f(len * t)}" r="1.2" fill="#d6f0a0"/><circle cx="4" cy="${f(len * t + 5)}" r="1.2" fill="#d6f0a0"/>`).join('')}<path d="M-4 3 L-4 ${f(len * 0.7)}" stroke="#d6f0a0" stroke-width="1.6" opacity=".55"/><path d="M-3.5 -1 L0 -7 L3.5 -1" fill="#4e8a2a" stroke="${INK}" stroke-width="1.3"/></g>`;
  b += cuke(118, 120, -8) + cuke(82, 166, 10, 56) + cuke(128, 186, -4, 52) + cuke(96, 210, 4, 46);
  const flower = (x, y) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-5.5" rx="4" ry="5.5" transform="rotate(${a})" fill="#f8ca4c" stroke="${INK}" stroke-width="1.1"/>`).join('')}<circle r="2.6" fill="#e08a1e"/></g>`;
  b += flower(60, 126) + flower(144, 132) + flower(84, 84) + flower(112, 250);
  return svg(b);
};

P.sweetpotato = () => {
  let b = pile(90, 276);
  b += `<g transform="translate(64 282) rotate(-16)"><ellipse rx="27" ry="13" fill="url(#tuber)" stroke="${INK}" stroke-width="2.2"/><ellipse cx="-9" cy="-5" rx="9" ry="3" fill="#fff" opacity=".45"/><path d="M-27 2 l-8 3 M25 4 l7 4" stroke="${INK}" stroke-width="1.4"/></g>`;
  b += `<g transform="translate(138 284) rotate(14)"><ellipse rx="24" ry="12" fill="url(#tuber)" stroke="${INK}" stroke-width="2.2"/><ellipse cx="-7" cy="-5" rx="8" ry="2.6" fill="#fff" opacity=".45"/></g>`;
  for (let i = 0; i < 9; i++) { const a = -160 + i * 17.5, ar = a * Math.PI / 180, l = 70 + (i % 3) * 18; b += stem(`M100 270 Q${f(100 + Math.cos(ar) * l * 0.5)} ${f(250 + Math.sin(ar) * l * 0.4)} ${f(100 + Math.cos(ar) * l)} ${f(270 + Math.sin(ar) * l * 0.9)}`, 2.6, '#8a3a5a'); }
  for (let pass = 0; pass < 3; pass++) for (let i = 0; i < 11; i++) {
    const a = (-170 + R() * 160) * Math.PI / 180, rr = 0.45 + R() * 0.55, x = 100 + Math.cos(a) * 70 * rr, y = 262 + Math.sin(a) * 100 * rr;
    const rot = Math.atan2(y - 270, x - 100) * 180 / Math.PI + 90 + jitter(0, 15);
    b += heartLeaf(x, y, jitter(1.2, 0.12), rot, GREENS[pass]);
  }
  return svg(b);
};

P.lotus = () => {
  let b = `<ellipse cx="100" cy="280" rx="96" ry="22" fill="#3b2a12" opacity=".18"/><ellipse cx="100" cy="274" rx="94" ry="22" fill="#9c6a34" stroke="${INK}" stroke-width="2.6"/><ellipse cx="100" cy="272" rx="86" ry="17" fill="url(#water)" stroke="${INK}" stroke-width="1.6"/>
<path d="M30 270 q12 -4 24 0 M140 280 q12 -4 24 0 M88 286 q8 -3 16 0" stroke="#fff" stroke-width="1.8" opacity=".75" fill="none" stroke-linecap="round"/>`;
  for (const [x, y] of [[22, 270], [180, 268]]) b += `<path d="M${x} ${y} q-2 -14 -6 -20 M${x} ${y} q1 -18 3 -26 M${x} ${y} q5 -12 10 -16" stroke="#4e8a2a" stroke-width="2.6" stroke-linecap="round" fill="none"/>`;
  const pad = (x, y, rx, ry, rot = 0, fill = 'url(#leafDark)') => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 ${ry} L${f(rx * 0.22)} 0 A${rx} ${ry} 0 1 1 ${f(-rx * 0.22)} 0 Z" transform="translate(0 ${-ry})" fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>${[20, 60, 100, 140, 180, 220, 260, 300, 340].map(a => `<path d="M0 0 L${f(Math.cos(a * Math.PI / 180) * rx * 0.85)} ${f(Math.sin(a * Math.PI / 180) * ry * 0.85)}" stroke="#a9d860" stroke-width="1" opacity=".5"/>`).join('')}</g>`;
  b += pad(50, 268, 34, 11, -4) + pad(150, 270, 30, 10, 6, 'url(#leaf)') + pad(104, 284, 24, 7, 0, 'url(#leaf)');
  b += stem('M128 272 C132 238 140 212 148 190', 3.4, '#5f9a2e');
  b += `<g transform="translate(150 184) rotate(-14)"><path d="M-32 8 C-24 -14 24 -14 32 8 C16 0 -16 0 -32 8Z" fill="url(#leafDark)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M0 -6 L-22 3 M0 -6 L22 3 M0 -6 L0 4 M0 -6 L-11 3 M0 -6 L11 3" stroke="#a9d860" stroke-width="1" opacity=".6"/></g>`;
  b += stem('M98 272 C96 220 98 170 100 118', 4, '#5f9a2e');
  const petal = (rot, len, w) => `<path d="M0 0 C${w} ${-len * 0.25} ${w * 0.7} ${-len * 0.85} 0 ${-len} C${-w * 0.7} ${-len * 0.85} ${-w} ${-len * 0.25} 0 0Z" transform="rotate(${rot})" fill="url(#petal)" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M0 -4 Q${w * 0.2} ${-len * 0.5} 0 ${-len * 0.82}" transform="rotate(${rot})" stroke="#fff" stroke-width="1.4" opacity=".6" fill="none"/>`;
  b += `<g transform="translate(100 120) scale(1.45)">${petal(-78, 28, 11)}${petal(78, 28, 11)}${petal(-52, 34, 12)}${petal(52, 34, 12)}${petal(-28, 38, 12)}${petal(28, 38, 12)}<ellipse cx="0" cy="-14" rx="11" ry="6" fill="#f8ca4c" stroke="${INK}" stroke-width="1.5"/>${[-5, 0, 5].map(x => `<circle cx="${x}" cy="-15" r="1.3" fill="#9a7a20"/>`).join('')}${petal(-12, 42, 12)}${petal(12, 42, 12)}${petal(0, 46, 12)}</g>`;
  b += stem('M78 272 C70 240 62 214 56 192', 3, '#5f9a2e');
  b += `<g transform="translate(56 190) scale(1.3)"><path d="M0 0 C-9 -4 -10 -19 0 -32 C10 -19 9 -4 0 0Z" fill="url(#petal)" stroke="${INK}" stroke-width="1.6"/><path d="M0 -2 C-3 -10 -2 -21 0 -28" stroke="#fff" stroke-width="1.3" opacity=".6" fill="none"/><path d="M-4 0 C-8 -6 -8 -14 -5 -20 M4 0 C8 -6 8 -14 5 -20" stroke="${INK}" stroke-width="1" opacity=".5" fill="none"/></g>`;
  b += stem('M114 272 C118 254 120 240 118 226', 2.8, '#5f9a2e');
  b += `<g transform="translate(118 224) scale(1.2)"><path d="M-10 0 L10 0 L13 -11 L-13 -11Z" fill="#9fc24a" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>${[[-7, -7], [0, -7], [7, -7], [-3.5, -3], [3.5, -3]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#5d7a2a"/>`).join('')}</g>`;
  return svg(b);
};

P.coconut = () => {
  let b = pile(70);
  for (const [x, y, r, rot] of [[56, 270, 14, -20], [146, 272, 13, 20]]) b += vineLeaf(x, y, r, rot, 'url(#leafDark)');
  b += `<path d="M106 282 C112 230 114 170 98 100" stroke="${INK}" stroke-width="21" stroke-linecap="round" fill="none"/><path d="M106 282 C112 230 114 170 98 100" stroke="url(#trunk)" stroke-width="16" stroke-linecap="round" fill="none"/>`;
  for (let t = 0.06; t < 0.95; t += 0.075) {
    const x = (1 - t) ** 3 * 106 + 3 * (1 - t) ** 2 * t * 112 + 3 * (1 - t) * t * t * 114 + t ** 3 * 98, y = (1 - t) ** 3 * 282 + 3 * (1 - t) ** 2 * t * 230 + 3 * (1 - t) * t * t * 170 + t ** 3 * 100;
    b += `<path d="M${f(x - 7.5)} ${f(y)} q7.5 3.5 15 0" stroke="#5a3418" stroke-width="1.6" fill="none" opacity=".75"/>`;
  }
  const frond = (ex, ey, cx, cy, back) => {
    let g = '';
    const sx = 98, sy = 98;
    for (let t = 0.1; t <= 1; t += 0.065) {
      const x = (1 - t) ** 2 * sx + 2 * (1 - t) * t * cx + t * t * ex, y = (1 - t) ** 2 * sy + 2 * (1 - t) * t * cy + t * t * ey;
      const dx = 2 * (1 - t) * (cx - sx) + 2 * t * (ex - cx), dy = 2 * (1 - t) * (cy - sy) + 2 * t * (ey - cy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
      const len = 30 * (1 - t * 0.6);
      g += leaf(x, y, len, 5.5, ang + 90 + 48, back ? 'url(#leafDark)' : 'url(#leaf)', false) + leaf(x, y, len, 5.5, ang - 90 - 48 + 360, back ? 'url(#leafDark)' : 'url(#leafLight)', false);
    }
    return g + `<path d="M${sx} ${sy} Q${cx} ${cy} ${ex} ${ey}" stroke="#4e7a26" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  };
  b += frond(36, 96, 58, 60, true) + frond(166, 100, 146, 58, true) + frond(84, 26, 86, 50, true) + frond(124, 28, 118, 50, true);
  b += ball(86, 114, 13, 'url(#coconut)') + ball(110, 116, 13, 'url(#coconut)') + ball(98, 128, 13, 'url(#coconut)') + ball(121, 102, 11, '#8a5a30');
  b += frond(24, 150, 44, 78, false) + frond(176, 150, 156, 78, false) + frond(100, 22, 100, 46, false);
  return svg(b);
};

P.gac = () => {
  let b = pile(86);
  b += bamboo(50, 284, 58, 58, 8) + bamboo(150, 284, 142, 58, 8) + bamboo(42, 72, 158, 72, 8) + bamboo(44, 170, 156, 170, 6);
  b += stem('M100 282 C64 250 136 226 96 196 C64 172 136 152 104 120 C90 104 78 92 60 78', 3.6, '#4e8a2a') + stem('M104 120 C122 106 136 92 146 78', 2.8, '#4e8a2a');
  [[58, 76, 21, 0, 0], [100, 80, 22, 20, 1], [142, 80, 21, -10, 0], [72, 118, 23, -15, 1], [130, 122, 23, 20, 0], [54, 172, 22, 10, 0], [146, 176, 22, -20, 1], [96, 226, 22, 15, 2], [62, 236, 20, -10, 1], [136, 240, 20, 20, 0], [100, 150, 18, 0, 2], [150, 214, 18, 10, 2]].forEach(([x, y, r, rot, g]) => { b += vineLeaf(x, y, r, rot, GREENS[g]); });
  const gac = (x, y, rx, ry, fill) => {
    let spikes = '';
    for (let i = 0; i < 30; i++) { const a = R() * Math.PI * 2, rr = Math.sqrt(R()) * 0.8; spikes += `<circle cx="${f(x + Math.cos(a) * rx * rr)}" cy="${f(y + Math.sin(a) * ry * rr)}" r="1.4" fill="#8a1a10" opacity=".5"/>`; }
    let rim = '';
    for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; rim += `<path d="M${f(x + Math.cos(a) * rx)} ${f(y + Math.sin(a) * ry)} l${f(Math.cos(a) * 3.5)} ${f(Math.sin(a) * 3.5)}" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`; }
    return `<path d="M${x} ${y - ry} l0 -9" stroke="#4e8a2a" stroke-width="2.6"/>${rim}<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${INK}" stroke-width="2.1"/>${spikes}<ellipse cx="${f(x - rx * 0.38)}" cy="${f(y - ry * 0.42)}" rx="${f(rx * 0.3)}" ry="${f(ry * 0.18)}" fill="#fff" opacity=".55"/>`;
  };
  b += gac(80, 142, 18, 22, 'url(#gacFruit)') + gac(124, 150, 17, 21, 'url(#gacFruit)') + gac(102, 198, 16, 20, 'url(#orange)') + gac(148, 112, 13, 16, 'url(#gacFruit)');
  return svg(b);
};

P.herbs = () => {
  let b = pile(86);
  for (const [x, top] of [[146, 126], [152, 140], [158, 120], [140, 146], [164, 150]]) b += stem(`M${x} 276 C${x + 2} 220 ${x - 2} 180 ${x + 3} ${top}`, 3.6, '#7fc04a');
  // Perilla (tía tô): big purple-green leaves at the back left.
  for (const [x, y, r] of [[42, 214, -50], [56, 194, -25], [72, 180, -8], [40, 240, -75], [66, 212, -35], [80, 200, -15], [52, 228, -55]]) b += stem(`M74 278 L${x} ${y}`, 2.2, '#5a3a5a') + frillyLeaf(x, y, 36, 15, r, 'url(#leafPurple)', 2.2, 8);
  // Basil: dense bright leaves in the middle.
  b += stem('M104 278 L104 150', 3, '#4e8a2a');
  for (let i = 0; i < 26; i++) {
    const a = (-150 + R() * 120) * Math.PI / 180, rr = 0.25 + R() * 0.75, x = 104 + Math.cos(a) * 44 * rr, y = 230 + Math.sin(a) * 84 * rr;
    b += leaf(x, y, jitter(26, 3), 12, Math.atan2(y - 262, x - 104) * 180 / Math.PI + 90, GREENS[1 + (i % 2)]);
  }
  // Mint (húng): small round frilly leaves at the front right.
  for (const [x, y, r] of [[136, 236, 30], [150, 246, 60], [126, 250, 15], [160, 260, 80], [142, 262, 45], [118, 262, 0]]) b += frillyLeaf(x, y, 22, 11, r, 'url(#leafLight)', 1.6, 7);
  return svg(b);
};

P.lettuce = () => {
  let b = pile(84);
  [[-78, 80], [78, 80], [-58, 92], [58, 92]].forEach(([r, len]) => { b += frillyLeaf(100, 270, len, 34, r, 'url(#leafDark)', 4, 10); });
  [[-38, 100], [38, 100], [-18, 108], [18, 108]].forEach(([r, len]) => { b += frillyLeaf(100, 270, len, 32, r, 'url(#leaf)', 4, 10); });
  [[-26, 86], [26, 86], [-8, 92], [8, 92]].forEach(([r, len]) => { b += frillyLeaf(100, 272, len, 28, r, 'url(#leafLight)', 3.4, 9); });
  b += frillyLeaf(100, 272, 70, 26, -4, 'url(#leafLight)', 3, 8) + frillyLeaf(100, 274, 58, 24, 6, 'url(#leafLight)', 3, 8);
  return svg(b);
};

P.greenbean = () => {
  let b = pile(80);
  ['M100 282 C96 246 84 216 64 184', 'M100 282 C104 246 116 216 136 186', 'M100 282 C100 236 100 196 100 140', 'M100 266 C82 258 62 248 42 236', 'M100 266 C120 258 140 250 158 238'].forEach(d => { b += stem(d, 3.4, '#5f9a2e'); });
  const tri = (x, y, rot, s, g) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">${leaf(0, 0, 28, 12, 0, GREENS[g])}${leaf(0, 0, 24, 11, -58, GREENS[g])}${leaf(0, 0, 24, 11, 58, GREENS[g])}</g>`;
  [[64, 184, -24, 1.05, 0], [136, 186, 24, 1.05, 0], [100, 140, 0, 1.15, 1], [42, 236, -64, .95, 0], [158, 238, 64, .95, 1], [80, 208, -44, 1, 1], [120, 210, 44, 1, 0], [100, 176, -6, 1, 2], [60, 214, -50, .9, 2], [140, 216, 50, .9, 2], [88, 236, -20, .85, 1], [114, 238, 20, .85, 2]].forEach(([x, y, r, s, g]) => { b += tri(x, y, r, s, g); });
  const pod = (x, y, rot, dark) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0 C4.5 2 5.5 20 3.5 42 C2 46 -1.5 46 -2.5 42 C-3.5 20 -3.5 2 0 0Z" fill="${dark ? 'url(#podDark)' : 'url(#pod)'}" stroke="${INK}" stroke-width="1.6"/>${[8, 16, 24, 32, 39].map(t => `<circle cx="0.5" cy="${t}" r="1.2" fill="${dark ? '#6a7a50' : '#c8e890'}"/>`).join('')}</g>`;
  [[82, 196, 20, false], [88, 196, 6, true], [118, 198, -10, false], [124, 200, -24, true], [98, 168, 4, false], [104, 168, -6, true], [62, 222, 32, false], [138, 224, -32, true], [70, 220, 18, true], [130, 222, -16, false]].forEach(([x, y, r, d]) => { b += pod(x, y, r, d); });
  for (const [x, y] of [[110, 152], [76, 190], [128, 192]]) b += `<g transform="translate(${x} ${y})">${[0, 120, 240].map(a => `<ellipse cx="0" cy="-4" rx="3" ry="4" transform="rotate(${a})" fill="#f8ca4c" stroke="${INK}" stroke-width="1"/>`).join('')}</g>`;
  return svg(b);
};

// Low plants are enlarged around the foot of the mound so they fill the plot like the painted crops; tall trellised ones keep their size.
const SCALE = { coffee: 1.18, chili: 1.16, sweetpotato: 1.12, lotus: 1.1, herbs: 1.16, lettuce: 1.16, greenbean: 1.16, cucumber: 1.02, gac: 1.02, coconut: 1.08 };

// A young, squat palm so its crown stays inside its own plot instead of hiding behind the row above.
P.coconut = () => {
  let b = pile(78);
  for (const [x, y, r, rot] of [[50, 270, 15, -20], [152, 272, 14, 20]]) b += vineLeaf(x, y, r, rot, 'url(#leafDark)');
  const T = [106, 282, 110, 250, 110, 196, 100, 156];
  const bz = (t, i) => (1 - t) ** 3 * T[i] + 3 * (1 - t) ** 2 * t * T[i + 2] + 3 * (1 - t) * t * t * T[i + 4] + t ** 3 * T[i + 6];
  const trunk = `M${T[0]} ${T[1]} C${T[2]} ${T[3]} ${T[4]} ${T[5]} ${T[6]} ${T[7]}`;
  b += `<path d="${trunk}" stroke="${INK}" stroke-width="23" stroke-linecap="round" fill="none"/><path d="${trunk}" stroke="url(#trunk)" stroke-width="18" stroke-linecap="round" fill="none"/>`;
  for (let t = 0.08; t < 0.95; t += 0.12) b += `<path d="M${f(bz(t, 0) - 8.5)} ${f(bz(t, 1))} q8.5 4 17 0" stroke="#5a3418" stroke-width="1.7" fill="none" opacity=".75"/>`;
  const sx = 100, sy = 152;
  const frond = (ex, ey, cx, cy, back) => {
    let g = '';
    for (let t = 0.1; t <= 1; t += 0.07) {
      const x = (1 - t) ** 2 * sx + 2 * (1 - t) * t * cx + t * t * ex, y = (1 - t) ** 2 * sy + 2 * (1 - t) * t * cy + t * t * ey;
      const dx = 2 * (1 - t) * (cx - sx) + 2 * t * (ex - cx), dy = 2 * (1 - t) * (cy - sy) + 2 * t * (ey - cy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
      const len = 28 * (1 - t * 0.6);
      g += leaf(x, y, len, 6, ang + 90 + 48, back ? 'url(#leafDark)' : 'url(#leaf)', false) + leaf(x, y, len, 6, ang - 90 - 48 + 360, back ? 'url(#leafDark)' : 'url(#leafLight)', false);
    }
    return g + `<path d="M${sx} ${sy} Q${cx} ${cy} ${ex} ${ey}" stroke="#4e7a26" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  };
  b += frond(30, 150, 52, 112, true) + frond(170, 152, 148, 112, true) + frond(70, 84, 78, 106, true) + frond(130, 86, 122, 106, true);
  b += ball(86, 168, 13, 'url(#coconut)') + ball(110, 170, 13, 'url(#coconut)') + ball(98, 182, 13, 'url(#coconut)') + ball(121, 156, 11, '#8a5a30');
  b += frond(26, 206, 46, 132, false) + frond(174, 206, 154, 132, false) + frond(100, 80, 100, 108, false);
  return svg(b);
};
for (const [key, draw] of Object.entries(P)) {
  const k = SCALE[key] || 1, g = k === 1 ? '<g>' : '<g transform="translate(100 296) scale(' + k + ') translate(-100 -296)">';
  fs.writeFileSync(path.join(OUT, key + '.svg'), draw().replace('</defs>', '</defs>' + g).replace('</svg>', '</g></svg>'));
}
console.log('wrote', Object.keys(P).length, 'plants to public/crops/:', Object.keys(P).join(', '));

// ======================================================================================
// Harvest products (public/goods/<key>.svg, 100x100): what lands in the basket, used for the harvest pop-up, the bag
// and orders. Same outline and palette as the plants.
// ======================================================================================
const GOUT = path.join(__dirname, '../../public/goods');
fs.mkdirSync(GOUT, { recursive: true });
const gdefs = defs.replace('</defs>', `
<radialGradient id="bean" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#b9875a"/><stop offset=".55" stop-color="#7a4a24"/><stop offset="1" stop-color="#43240f"/></radialGradient>
<radialGradient id="grape" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c9a0e8"/><stop offset=".5" stop-color="#7d3fb0"/><stop offset="1" stop-color="#43206a"/></radialGradient>
<radialGradient id="blue" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#9fc0f0"/><stop offset=".5" stop-color="#3f63b8"/><stop offset="1" stop-color="#1f3170"/></radialGradient>
<radialGradient id="melon" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#9fd86a"/><stop offset=".55" stop-color="#3f8a2e"/><stop offset="1" stop-color="#1f5a1c"/></radialGradient>
<radialGradient id="pine" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffe08a"/><stop offset=".55" stop-color="#f0a83a"/><stop offset="1" stop-color="#b8661a"/></radialGradient>
<radialGradient id="sun" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#f2a81e"/></radialGradient>
<radialGradient id="seedHead" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#8a5a30"/><stop offset="1" stop-color="#3f2410"/></radialGradient>
<linearGradient id="weave" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3c27a"/><stop offset="1" stop-color="#a87a36"/></linearGradient>
</defs>`);
const gsvg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${gdefs}<ellipse cx="50" cy="90" rx="34" ry="6" fill="#3b2a12" opacity=".16"/>${body}</svg>\n`;
const sleaf = (x, y, len, w, rot, fill = 'url(#leaf)') => leaf(x, y, len, w, rot, fill).replace(/stroke-width="2"/, 'stroke-width="1.8"');
const G = {};

G.coffee = () => {
  const bean = (x, y, rot, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><ellipse rx="11" ry="14" fill="url(#bean)" stroke="${INK}" stroke-width="2"/><path d="M-1 -12 C4 -5 -4 3 1 12" stroke="#2a1608" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="-5" cy="-6" rx="3" ry="4.5" fill="#fff" opacity=".28"/></g>`;
  return gsvg(sleaf(64, 36, 30, 10, 40, 'url(#leafDark)') + sleaf(60, 38, 26, 9, 95, 'url(#leafDark)') + ball(56, 34, 9, 'url(#cherry)') + ball(70, 30, 8.5, 'url(#cherry)') + ball(66, 44, 8, 'url(#orange)') + bean(30, 66, -25) + bean(54, 74, 15) + bean(74, 64, 40, 0.9) + bean(40, 82, 70, 0.85));
};
G.chili = () => {
  const chili = (x, y, rot, s, fill) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 C7 4 9 20 4 42 C2.5 47 -1.5 47 -2 42 C-1 23 -6 7 0 0Z" fill="${fill}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M1.5 8 C3.5 18 3.5 28 2 36" stroke="#fff" stroke-width="1.8" opacity=".55" fill="none" stroke-linecap="round"/><path d="M-4.5 1 L0 -3.5 L4.5 1 L2.5 4.5 L-2.5 4.5Z" fill="#4e8a2a" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><path d="M0 -3 Q1 -9 -3 -13" stroke="#4e8a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;
  return gsvg(chili(36, 20, -28, 1.4, 'url(#red)') + chili(58, 18, 22, 1.45, 'url(#red)') + chili(48, 30, -4, 1.2, 'url(#orange)'));
};
G.cucumber = () => {
  const cuke = (x, y, rot, len) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0 C11 0 12 ${len * 0.3} 11 ${len * 0.75} C10 ${len} -10 ${len} -11 ${len * 0.75} C-12 ${len * 0.3} -11 0 0 0Z" fill="url(#cucumber)" stroke="${INK}" stroke-width="2"/>${[0.2, 0.4, 0.6, 0.8].map(t => `<circle cx="-4" cy="${f(len * t)}" r="1.3" fill="#d6f0a0"/><circle cx="4.5" cy="${f(len * t + 5)}" r="1.3" fill="#d6f0a0"/>`).join('')}<path d="M-4.5 3 L-4.5 ${f(len * 0.72)}" stroke="#d6f0a0" stroke-width="1.8" opacity=".55"/><path d="M-3.5 -1 L0 -7 L3.5 -1" fill="#4e8a2a" stroke="${INK}" stroke-width="1.3"/></g>`;
  const slice = (x, y) => `<g transform="translate(${x} ${y})"><circle r="13" fill="#3f8a2e" stroke="${INK}" stroke-width="2"/><circle r="10.5" fill="#d8f0a8"/><circle r="6" fill="#bfe08a"/>${[0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="0" cy="-4" rx="1.2" ry="2" transform="rotate(${a})" fill="#fffbe0"/>`).join('')}</g>`;
  return gsvg(cuke(38, 14, -20, 70) + cuke(62, 18, 16, 64) + slice(72, 76));
};
G.coconut = () => gsvg(`${ball(40, 52, 28, 'url(#coconut)')}<path d="M28 34 Q40 28 52 34" stroke="#55702a" stroke-width="2" fill="none" opacity=".6"/><g transform="translate(70 66)"><ellipse rx="24" ry="17" fill="#8a5a30" stroke="${INK}" stroke-width="2.2"/><ellipse cy="-2" rx="19" ry="12" fill="#fffaf0" stroke="${INK}" stroke-width="1.6"/><ellipse cy="0" rx="13" ry="7" fill="#e6f3f6"/><ellipse cx="-6" cy="-4" rx="5" ry="2" fill="#fff"/></g><path d="M34 26 l6 -14" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/><path d="M34 26 l6 -14" stroke="#f3e6c8" stroke-width="1.6" stroke-linecap="round"/>`);
G.sweetpotato = () => gsvg(`<g transform="translate(38 54) rotate(-28)"><ellipse rx="30" ry="15" fill="url(#tuber)" stroke="${INK}" stroke-width="2.2"/><ellipse cx="-10" cy="-6" rx="10" ry="3.4" fill="#fff" opacity=".45"/><path d="M-30 2 l-8 3 M28 4 l8 4" stroke="${INK}" stroke-width="1.5"/></g><g transform="translate(66 72) rotate(18)"><path d="M-24 0 C-24 -14 0 -16 4 -12 L8 14 C0 16 -24 14 -24 0Z" fill="url(#tuber)" stroke="${INK}" stroke-width="2.2"/><ellipse cx="6" cy="1" rx="5" ry="13" fill="#ffd36a" stroke="${INK}" stroke-width="1.8"/><ellipse cx="5" cy="-3" rx="2" ry="5" fill="#fff3b0"/></g>`);
G.lotus = () => {
  const petal = (rot, len, w) => `<path d="M0 0 C${w} ${-len * 0.25} ${w * 0.7} ${-len * 0.85} 0 ${-len} C${-w * 0.7} ${-len * 0.85} ${-w} ${-len * 0.25} 0 0Z" transform="rotate(${rot})" fill="url(#petal)" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/>`;
  return gsvg(`<path d="M18 80 C30 70 70 70 82 80 C70 88 30 88 18 80Z" fill="url(#leafDark)" stroke="${INK}" stroke-width="2"/><g transform="translate(50 76)">${petal(-75, 30, 11)}${petal(75, 30, 11)}${petal(-48, 38, 12)}${petal(48, 38, 12)}${petal(-22, 44, 12)}${petal(22, 44, 12)}<ellipse cx="0" cy="-18" rx="10" ry="6" fill="#f8ca4c" stroke="${INK}" stroke-width="1.5"/>${petal(-8, 46, 11)}${petal(8, 46, 11)}</g>`);
};
G.gac = () => {
  let spikes = '', rim = '';
  for (let i = 0; i < 40; i++) { const a = R() * Math.PI * 2, rr = Math.sqrt(R()) * 0.8; spikes += `<circle cx="${f(42 + Math.cos(a) * 26 * rr)}" cy="${f(52 + Math.sin(a) * 30 * rr)}" r="1.6" fill="#8a1a10" opacity=".5"/>`; }
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; rim += `<path d="M${f(42 + Math.cos(a) * 26)} ${f(52 + Math.sin(a) * 30)} l${f(Math.cos(a) * 4)} ${f(Math.sin(a) * 4)}" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`; }
  const seeds = [[0, 0], [7, -5], [-7, -4], [5, 6], [-5, 6], [0, -10]].map(([x, y]) => `<ellipse cx="${74 + x}" cy="${70 + y}" rx="3.6" ry="4.6" fill="#b81e18" stroke="#6a0e0a" stroke-width="1"/>`).join('');
  return gsvg(`<path d="M42 22 l2 -10" stroke="#4e8a2a" stroke-width="3" stroke-linecap="round"/>${rim}<ellipse cx="42" cy="52" rx="26" ry="30" fill="url(#gacFruit)" stroke="${INK}" stroke-width="2.2"/>${spikes}<ellipse cx="32" cy="38" rx="8" ry="5" fill="#fff" opacity=".5"/><ellipse cx="74" cy="70" rx="18" ry="20" fill="#f6c24a" stroke="${INK}" stroke-width="2"/><ellipse cx="74" cy="70" rx="13" ry="15" fill="#e8401e"/>${seeds}`);
};
G.herbs = () => {
  let b = '';
  for (const [x, rot, fill] of [[30, -34, 'url(#leafPurple)'], [40, -14, 'url(#leafLight)'], [50, 2, 'url(#leaf)'], [60, 18, 'url(#leafLight)'], [70, 34, 'url(#leafPurple)'], [46, -6, 'url(#leafDark)'], [56, 10, 'url(#leaf)']]) b += stem(`M50 84 L${x} 40`, 1.6, '#4e8a2a') + sleaf(x, 44, 30, 11, rot, fill);
  return gsvg(b + `<rect x="40" y="62" width="20" height="9" rx="3" fill="url(#weave)" stroke="${INK}" stroke-width="1.8"/><path d="M44 62 l0 9 M50 62 l0 9 M56 62 l0 9" stroke="#8a6020" stroke-width="1.2"/>`);
};
G.lettuce = () => {
  let b = '';
  [[-62, 40, 'url(#leafDark)'], [62, 40, 'url(#leafDark)'], [-36, 50, 'url(#leaf)'], [36, 50, 'url(#leaf)'], [-14, 56, 'url(#leafLight)'], [14, 56, 'url(#leafLight)'], [0, 48, 'url(#leafLight)']].forEach(([r, len, fill]) => { b += frillyLeaf(50, 84, len, 19, r, fill, 2.4, 8); });
  return gsvg(b);
};
G.greenbean = () => {
  let beans = '';
  for (let i = 0; i < 26; i++) { const x = 30 + R() * 40, y = 58 + R() * 12 - Math.abs(x - 50) * 0.18; beans += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="3.6" ry="2.8" transform="rotate(${f(R() * 180)} ${f(x)} ${f(y)})" fill="#6aa83a" stroke="#2c5a18" stroke-width="1"/>`; }
  const pod = `<g transform="translate(66 22) rotate(30)"><path d="M0 0 C5 2 6 22 4 46 C2.5 50 -1.5 50 -2.5 46 C-4 22 -4 2 0 0Z" fill="url(#pod)" stroke="${INK}" stroke-width="1.7"/>${[9, 18, 27, 36, 43].map(t => `<circle cx="0.5" cy="${t}" r="1.4" fill="#c8e890"/>`).join('')}</g>`;
  return gsvg(`${pod}<path d="M16 62 C18 86 82 86 84 62Z" fill="url(#weave)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>${beans}<path d="M14 62 L86 62" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M22 70 l56 0 M28 78 l44 0" stroke="#8a6020" stroke-width="1.3" opacity=".6"/>`);
};
G.grape = () => {
  let b = `<path d="M50 14 C48 22 50 26 50 30" stroke="#6a4420" stroke-width="3.2" stroke-linecap="round" fill="none"/>` + sleaf(52, 22, 28, 12, 60, 'url(#leaf)');
  const rows = [[5, 28], [4, 40], [4, 51], [3, 62], [2, 72], [1, 81]];
  rows.forEach(([n, y]) => { for (let i = 0; i < n; i++) b += ball(50 + (i - (n - 1) / 2) * 11.5, y, 6.6, 'url(#grape)'); });
  return gsvg(b);
};
G.blueberry = () => {
  let b = sleaf(30, 46, 30, 11, -50, 'url(#leafDark)') + sleaf(70, 44, 30, 11, 50, 'url(#leafDark)');
  for (const [x, y, r] of [[38, 58, 12], [60, 56, 12], [50, 74, 12], [28, 76, 10], [72, 76, 10], [50, 44, 10]]) b += ball(x, y, r, 'url(#blue)') + `<path d="M${x - 3} ${y - r * 0.15} l3 -3 l3 3" stroke="#1a2650" stroke-width="1.4" fill="none"/>`;
  return gsvg(b);
};
G.watermelon = () => {
  let stripes = '';
  for (const dx of [-18, -6, 6, 18]) stripes += `<path d="M${36 + dx} 24 C${36 + dx * 1.4} 40 ${36 + dx * 1.4} 60 ${36 + dx} 76" stroke="#1f4a18" stroke-width="4" fill="none" opacity=".75"/>`;
  return gsvg(`<clipPath id="melonClip"><ellipse cx="36" cy="50" rx="27" ry="25"/></clipPath><ellipse cx="36" cy="50" rx="28" ry="26" fill="url(#melon)" stroke="${INK}" stroke-width="2.2"/><g clip-path="url(#melonClip)">${stripes}</g><ellipse cx="26" cy="36" rx="8" ry="4" fill="#fff" opacity=".4"/><path d="M48 88 L90 88 L69 50Z" fill="#e84a3a" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M46 88 L92 88" stroke="#3f8a2e" stroke-width="6" stroke-linecap="round"/><path d="M46 88 L92 88" stroke="${INK}" stroke-width="1" opacity=".6"/>${[[62, 78], [72, 76], [67, 68], [78, 82], [58, 84]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry="2.2" fill="#2a1a10"/>`).join('')}`);
};
G.pineapple = () => {
  let scales = '';
  for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { const x = 36 + c * 9.5 + (r % 2) * 4.5, y = 50 + r * 7.6; if (Math.hypot((x - 50) / 18, (y - 66) / 24) < 1) scales += `<path d="M${x - 4} ${y} L${x} ${y - 4} L${x + 4} ${y} L${x} ${y + 4}Z" fill="none" stroke="#9a5a14" stroke-width="1.3"/><circle cx="${x}" cy="${y}" r="1" fill="#6a3a0a"/>`; }
  let crown = '';
  for (const [rot, len, fill] of [[-40, 30, 'url(#leafDark)'], [40, 30, 'url(#leafDark)'], [-20, 36, 'url(#leaf)'], [20, 36, 'url(#leaf)'], [0, 40, 'url(#leafLight)']]) crown += sleaf(50, 44, len, 6, rot, fill);
  return gsvg(`${crown}<ellipse cx="50" cy="66" rx="19" ry="25" fill="url(#pine)" stroke="${INK}" stroke-width="2.2"/>${scales}<ellipse cx="42" cy="56" rx="4" ry="8" fill="#fff" opacity=".35"/>`);
};
G.sunflower = () => {
  let petals = '';
  for (let i = 0; i < 16; i++) petals += `<ellipse cx="50" cy="${50 - 30}" rx="6.5" ry="13" transform="rotate(${i * 22.5} 50 50)" fill="url(#sun)" stroke="${INK}" stroke-width="1.6"/>`;
  let seeds = '';
  for (let i = 0; i < 30; i++) { const a = i * 2.4, r = Math.sqrt(i) * 3; seeds += `<circle cx="${f(50 + Math.cos(a) * r)}" cy="${f(50 + Math.sin(a) * r)}" r="1.3" fill="#2a1608"/>`; }
  return gsvg(`${petals}<circle cx="50" cy="50" r="18" fill="url(#seedHead)" stroke="${INK}" stroke-width="2"/>${seeds}`);
};
G.cotton = () => {
  const puffs = [[50, 40, 14], [36, 52, 13], [64, 52, 13], [42, 64, 12], [58, 64, 12], [50, 54, 12]];
  const calyx = [-50, -18, 18, 50].map(r => `<path d="M50 80 L${f(50 + Math.sin(r * Math.PI / 180) * 30)} ${f(80 - Math.cos(r * Math.PI / 180) * 26)}" stroke="#6a4420" stroke-width="5" stroke-linecap="round"/><path d="M50 80 L${f(50 + Math.sin(r * Math.PI / 180) * 30)} ${f(80 - Math.cos(r * Math.PI / 180) * 26)}" stroke="#a8743c" stroke-width="2.4" stroke-linecap="round"/>`).join('');
  return gsvg(`${calyx}${blob(puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`), '#fffaf0', 3.2)}${puffs.map(([x, y, r]) => `<circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.35}" fill="#fff"/><path d="M${x - r * 0.5} ${y + r * 0.4} q${r * 0.5} ${r * 0.3} ${r} 0" stroke="#d8ccb6" stroke-width="1.4" fill="none"/>`).join('')}<path d="M50 80 L50 92" stroke="#6a4420" stroke-width="3.4" stroke-linecap="round"/>`);
};
for (const [key, draw] of Object.entries(G)) fs.writeFileSync(path.join(GOUT, key + '.svg'), draw());
console.log('wrote', Object.keys(G).length, 'products to public/goods/:', Object.keys(G).join(', '));
