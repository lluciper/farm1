// Generates public/critter-joints.js and the critter animation block in public/theme.css.
// Leg columns were measured from each picture's alpha channel (pixel x boundaries between legs, y where legs leave the body).
// Run: node tools/rig/critters.cjs
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '../..');

// type: quad = four-legged walker, bird = two-legged waddler, sitter = sitting pet that hops.
const CRITTERS = {
  'pens/cow-animal.png':     { w: 344, h: 303, type: 'quad', top: 244, bounds: [44, 89, 148, 198, 246] },
  'pens/buffalo-animal.png': { w: 357, h: 306, type: 'quad', top: 239, bounds: [40, 95, 152, 208, 257] },
  'pens/goat-animal.png':    { w: 316, h: 326, type: 'quad', top: 258, bounds: [21, 70, 124, 175, 217] },
  'pens/sheep-animal.png':   { w: 295, h: 277, type: 'quad', top: 236, bounds: [34, 75, 112, 159, 196] },
  'pets/lion.png':           { w: 560, h: 560, type: 'quad', top: 436, bounds: [125, 219, 343, 455] },
  'pens/chicken-animal.png': { w: 241, h: 301, type: 'bird', top: 266, bounds: [76, 132, 188] },
  'pens/duck-animal.png':    { w: 240, h: 311, type: 'bird', top: 264, bounds: [70, 138, 188] },
  'pets/pigeon.png':         { w: 560, h: 560, type: 'bird', top: 466, bounds: [232, 334, 440], peck: -1 },
  'pets/black-cat.png':      { w: 560, h: 560, type: 'sitter' },
  'pets/black-dog.png':      { w: 560, h: 560, type: 'sitter' },
};

const { execSync } = require('child_process');
const pct = (v, total) => +(v / total * 100).toFixed(2) + '%';
const poly = (pts, w, h) => 'polygon(' + pts.map(([x, y]) => pct(x, w) + ' ' + pct(y, h)).join(',') + ')';

function alpha(src, w, h) {
  const buf = execSync(`magick "${path.join(ROOT, 'public', src)}" -alpha extract -depth 8 gray:-`, { maxBuffer: 1 << 26 });
  if (buf.length !== w * h) throw Error(`${src}: expected ${w}x${h}`);
  return buf;
}
// A boundary between two legs, followed from the feet upward through the transparent gap between them.
// It ends (merge) at the first row where no see-through pixel is within reach: there the legs join the body.
function gapLine(a, w, h, x0, reach = 20) {
  const clear = (x, y) => x < 0 || x >= w || a[y * w + x] < 60;
  const xs = new Array(h).fill(x0);
  // Feet that touch for a few rows (e.g. the duck's) are cut straight through; 18 solid rows in a row = the body.
  let x = x0, merge = 0, blocked = 0;
  for (let y = h - 1; y >= 0; y--) {
    if (!clear(x, y)) {
      let found = null;
      for (let d = 1; d <= reach && found === null; d++) found = clear(x - d, y) ? x - d : clear(x + d, y) ? x + d : null;
      if (found === null) { if (++blocked >= 18) { merge = y + blocked; break; } xs[y] = x; continue; }
      x = found;
    }
    blocked = 0;
    xs[y] = x;
  }
  for (let y = 0; y < merge; y++) xs[y] = xs[merge];
  return { xs, merge };
}
// Points of a boundary between rows y0 and y1 (either direction), thinned to every 3rd row plus the ends.
function along(B, y0, y1) {
  const out = [], dir = y1 >= y0 ? 1 : -1;
  for (let y = y0; dir > 0 ? y <= y1 : y >= y1; y += dir) if (y === y0 || y === y1 || (y - y0) % 3 === 0) out.push([B.xs[Math.min(y, B.xs.length - 1)], y]);
  return out;
}

const data = {};
for (const [src, c] of Object.entries(CRITTERS)) {
  const d = { w: c.w, h: c.h, type: c.type };
  if (c.peck) d.peck = c.peck;
  if (c.bounds) {
    const a = alpha(src, c.w, c.h), b = c.bounds, n = b.length - 1, H = c.h;
    // Outer edges follow the outside of the first/last leg the same way, so no belly is cut off with a leg.
    const B = b.map(x => gapLine(a, c.w, H, x));
    // A leg starts where it parts from its neighbours (never far above the measured belly line).
    const tops = b.slice(0, -1).map((_, i) => Math.min(H - 10, Math.max(c.top - 8, B[i].merge, B[i + 1].merge)));
    // A swinging leg drops its top corners by halfWidth·sin(angle); the leg reaches that far up into the body and the
    // body keeps 3 extra rows below the hip, so neither a gap nor a hairline opens while walking.
    const angle = (c.type === 'bird' ? 18 : 10) * Math.PI / 180, keep = 3;
    const liftOf = (i, top) => Math.max(3, Math.ceil((B[i + 1].xs[top] - B[i].xs[top]) / 2 * Math.sin(angle)) + 2);
    d.pivot = [Math.round(c.w / 2), c.top];
    // Body = the picture minus every leg piece: walk round the bite the legs take out of the bottom.
    const bite = [[c.w, 0], [c.w, H], ...along(B[n], H, tops[n - 1])];
    const low = tops.map(y => Math.min(H - 1, y + keep));
    bite.length = 0; bite.push([c.w, 0], [c.w, H], ...along(B[n], H, low[n - 1]));
    for (let i = n - 1; i >= 1; i--) bite.push(...along(B[i], low[i], low[i - 1]));
    bite.push(...along(B[0], low[0], H), [0, H]);
    d.body = poly([[0, 0], ...bite], c.w, H);
    d.legs = tops.map((top, i) => {
      // Diagonal pairs step together: with four legs the outer two (far hind + near front) are pair a.
      const group = n === 4 ? 'abba'[i] : 'ab'[i % 2], t = top - liftOf(i, top);
      const pts = [...along(B[i], t, H), ...along(B[i + 1], H, t)];
      return { g: group, clip: poly(pts, c.w, H), ox: Math.round((B[i].xs[top] + B[i + 1].xs[top]) / 2), oy: top };
    });
  }
  data[src] = d;
}
fs.writeFileSync(path.join(ROOT, 'public/critter-joints.js'),
  '// Generated by tools/rig/critters.cjs. Leg cut-outs for animal pictures: body / leg clip polygons and leg pivots (px).\n' +
  'window.XOM_CRITTERS=' + JSON.stringify(data) + ';\n');

// ---------- Keyframes kept in step with the walk paths in theme.css (xom-pet-gait 16s, xom-herd-walk 11s) ----------
const CYCLES = {
  pet: { moving: [[0, 20], [32, 58], [70, 90]], step: 2 },
  herd: { moving: [[0, 14], [34, 50], [72, 86]], step: 2 },
};
function frames(cycle, valueAt) {
  const kf = new Map();
  const put = (t, v) => kf.set(+t.toFixed(2), v);
  put(0, valueAt(null));
  for (const [a, b] of cycle.moving) {
    put(a, valueAt(null));
    for (let t = a + cycle.step; t < b; t += cycle.step) put(t, valueAt(Math.round((t - a) / cycle.step) % 2));
    put(b, valueAt(null));
  }
  put(100, valueAt(null));
  return [...kf.entries()].sort((x, y) => x[0] - y[0]).map(([t, v]) => `${t}%{${v}}`).join('');
}
function pauseFrames(cycle, valueAt) {
  // Rest value everywhere, plus a peck in the middle of each pause.
  const kf = new Map([[0, valueAt(false)], [100, valueAt(false)]]);
  const bounds = cycle.moving.flat();
  for (let i = 1; i + 1 < bounds.length; i += 2) {
    const a = bounds[i], b = bounds[i + 1], m = (a + b) / 2;
    kf.set(+(m - 2).toFixed(2), valueAt(false)); kf.set(+(m - 1).toFixed(2), valueAt(true));
    kf.set(+m.toFixed(2), valueAt(false)); kf.set(+(m + 1).toFixed(2), valueAt(true)); kf.set(+(m + 2).toFixed(2), valueAt(false));
  }
  return [...kf.entries()].sort((x, y) => x[0] - y[0]).map(([t, v]) => `${t}%{${v}}`).join('');
}
let css = '/* critters:begin (generated by tools/rig/critters.cjs) */\n';
css += '/* ---------- Animal walk cycles: legs step in diagonal pairs, birds waddle and peck, sitting pets hop ---------- */\n';
css += 'svg[data-critter]{overflow:visible}\nsvg[data-critter] image{transform-box:view-box}\n[data-peck="-1"]{--peck:-1}\n';
for (const [name, cyc] of Object.entries(CYCLES)) {
  const leg = sign => p => `transform:rotate(${p === null ? '0deg' : 'calc(var(--swing,10deg) * ' + (p ? sign : -sign) + ')'})`;
  css += `@keyframes xom-${name}-leg-a{${frames(cyc, leg(1))}}\n`;
  css += `@keyframes xom-${name}-leg-b{${frames(cyc, leg(-1))}}\n`;
  css += `@keyframes xom-${name}-waddle{${frames(cyc, p => `transform:rotate(${p === null ? 0 : (p ? 5 : -5)}deg)`)}}\n`;
  css += `@keyframes xom-${name}-hop{${frames(cyc, p => p === null ? 'transform:translateY(0) scale(1,1)' : p ? 'transform:translateY(-9%) scale(.97,1.04)' : 'transform:translateY(0) scale(1.05,.95)')}}\n`;
  css += `@keyframes xom-${name}-peck{${pauseFrames(cyc, down => `transform:rotate(${down ? 'calc(var(--peck,1) * 14deg)' : '0deg'})`)}}\n`;
}
const timing = {
  pet: '16s linear infinite;animation-delay:calc(var(--pet-delay,0s) * -7)',
  herd: '11s linear infinite;animation-delay:calc(var(--animal-delay,0s) * -13)',
};
for (const [name, where] of [['pet', '.farm-pet'], ['herd', '.herd']]) {
  const t = timing[name];
  css += `.xom ${where} [data-critter=quad] .cr-leg-a,.xom ${where} [data-critter=bird] .cr-leg-a{animation:xom-${name}-leg-a ${t}}\n`;
  css += `.xom ${where} [data-critter=quad] .cr-leg-b,.xom ${where} [data-critter=bird] .cr-leg-b{animation:xom-${name}-leg-b ${t}}\n`;
  css += `.xom ${where} [data-critter=bird] .cr-rig{animation:xom-${name}-waddle ${t}}\n`;
  css += `.xom ${where} [data-critter=bird] .cr-body{animation:xom-${name}-peck ${t}}\n`;
  css += `.xom ${where} [data-critter=sitter] .cr-rig{animation:xom-${name}-hop ${t}}\n`;
}
css += '[data-critter=bird]{--swing:18deg}\n';

// ---------- Farm pets: the whole pet (picture + name tag) roams the path; the picture only faces, bobs and hops ----------
// Walkers follow the pet cycle above (legs step while it moves). Sitting pets (no legs to step) travel in real hops.
const kfs = map => [...map.entries()].sort((a, b) => a[0] - b[0]).map(([t, v]) => `${+t.toFixed(2)}%{${v}}`).join('');
const ROAM = [[0, 0], [20, 1], [32, 1], [58, -0.75], [70, -0.75], [90, 0], [100, 0]];
const dirAt = t => (t < 20 || (t >= 70 && t < 90) || t >= 90 ? 1 : t < 32 ? 1 : -1);
{
  const roam = new Map(ROAM.map(([t, k]) => [t, `translate:calc(var(--roam,90px) * ${k}) 0`]));
  css += `@keyframes xom-pet-roam{${kfs(roam)}}\n`;
  // Facing flips just before each leg of the walk; while moving the body bobs and rocks with every step.
  const stride = new Map(), face = d => `scaleX(calc(var(--face,1) * ${d}))`;
  const pet = CYCLES.pet;
  for (const [a, b] of pet.moving) {
    const d = dirAt(a + 0.5);
    stride.set(a, `transform:${face(d)} translateY(0) rotate(0deg)`);
    for (let t = a + pet.step; t < b; t += pet.step) { const up = Math.round((t - a) / pet.step) % 2; stride.set(t, `transform:${face(d)} translateY(${up ? '-5%' : '0'}) rotate(${up ? -2.5 : 2.5}deg)`); }
    stride.set(b, `transform:${face(d)} translateY(0) rotate(0deg)`);
  }
  stride.set(0, `transform:${face(1)} translateY(0) rotate(0deg)`);
  stride.set(31.6, `transform:${face(1)} translateY(0) rotate(0deg)`);
  stride.set(69.6, `transform:${face(-1)} translateY(0) rotate(0deg)`);
  stride.set(100, `transform:${face(1)} translateY(0) rotate(0deg)`);
  css += `@keyframes xom-pet-stride{${kfs(stride)}}\n`;
}
{
  // Sitting pets: three short hop runs, long rests in between with a look over the shoulder.
  const HOPS = [[0, 12, 0, 1], [40, 52, 1, -0.75], [72, 81, -0.75, 0]];
  const roam = new Map(), body = new Map(), face = d => `scaleX(calc(var(--face,1) * ${d}))`;
  const at = (t, x, y) => roam.set(t, `translate:calc(var(--roam,90px) * ${x.toFixed(3)}) calc(var(--hop,-22px) * ${y})`);
  const pose = (t, d, sx, sy) => body.set(t, `transform:${face(d)} scale(${sx},${sy})`);
  at(0, 0, 0); at(100, 0, 0); pose(0, 1, 1, 1); pose(100, 1, 1, 1);
  for (const [a, b, x0, x1] of HOPS) {
    const n = Math.floor((b - a) / 3), d = x1 > x0 ? 1 : -1;
    for (let i = 0; i < n; i++) {
      const t0 = a + i * 3, xa = x0 + (x1 - x0) * i / n, xb = x0 + (x1 - x0) * (i + 1) / n;
      at(t0, xa, 0); at(t0 + 1.25, (xa + xb) / 2, 1); at(t0 + 2.5, xb, 0); at(t0 + 3, xb, 0);
      pose(t0, d, 1.08, 0.9); pose(t0 + 0.5, d, 0.95, 1.07); pose(t0 + 1.25, d, 1, 1.03); pose(t0 + 2.5, d, 1.1, 0.88); pose(t0 + 3, d, 1, 1);
    }
    // Rest after the run: face the way it came from for a moment, then turn back.
    const rest = a + n * 3, next = HOPS.find(h => h[0] > a)?.[0] ?? 100, mid = (rest + next) / 2;
    pose(rest + 0.1, d, 1, 1); pose(mid - 3, d, 1, 1); pose(mid - 2.9, -d, 1, 1); pose(mid + 2.9, -d, 1, 1); pose(mid + 3, d, 1, 1);
    const nd = next < 100 ? (HOPS.find(h => h[0] === next)[3] > HOPS.find(h => h[0] === next)[2] ? 1 : -1) : 1;
    pose(next - 0.4, d, 1, 1); if (next < 100) pose(next - 0.1, nd, 1, 1);
  }
  css += `@keyframes xom-pet-hoproam{${kfs(roam)}}\n@keyframes xom-pet-hopface{${kfs(body)}}\n`;
  css += '@keyframes xom-pet-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,1.03)}}\n';
}
const petT = '16s linear infinite;animation-delay:calc(var(--pet-delay,0s) * -7)';
css += `.xom .game .world.zone-farm .farm-pet:has(svg[data-critter]){--roam:75px;animation:xom-pet-roam ${petT}}\n`;
css += `.xom .game .world.zone-farm .farm-pet:has(svg[data-critter=sitter]){animation-name:xom-pet-hoproam}\n`;
css += `.xom .game .farm-pet svg.critter[data-critter]{transform-origin:50% 100%;animation:xom-pet-stride ${petT}}\n`;
css += `.xom .game .farm-pet svg.critter[data-critter=sitter]{animation-name:xom-pet-hopface}\n`;
css += `.xom .game .farm-pet svg[data-critter=sitter] .cr-rig{animation:xom-pet-breathe 3.2s ease-in-out infinite}\n`;
css += '.xom .game .farm-pet:has(svg[data-critter]) span{animation:none}\n';
css += '@media(max-width:650px){.xom .game .world.zone-farm .farm-pet{left:var(--pet-x-m,var(--pet-x));top:var(--pet-y-m,var(--pet-y))}.xom .game .world.zone-farm .farm-pet:has(svg[data-critter]){--roam:20px;--hop:-12px}}\n';
css += '@media(prefers-reduced-motion:reduce){.xom [data-critter] .cr-rig,.xom [data-critter] image,.xom .game .farm-pet,.xom .game .farm-pet svg{animation:none!important}}\n';
css += '/* critters:end */\n';

const themePath = path.join(ROOT, 'public/theme.css');
let theme = fs.readFileSync(themePath, 'utf8');
const begin = theme.indexOf('/* critters:begin'), end = theme.indexOf('/* critters:end */');
theme = begin >= 0 ? theme.slice(0, begin) + css + theme.slice(end + '/* critters:end */\n'.length) : theme + '\n' + css;
fs.writeFileSync(themePath, theme);
console.log('critters:', Object.keys(data).length, '· css bytes', css.length);
