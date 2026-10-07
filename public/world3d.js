// Real 3D characters and animals for Làng Mây (Three.js). Each one is drawn into a small canvas sitting where the painted
// picture used to be; avatar-world.js keeps moving those boxes around the scenes and asks the models to pose every frame.
// One WebGL renderer is shared: each view is rendered into its corner of the renderer's canvas and copied into the view's
// own 2D canvas, so any number of views costs a single WebGL context. Without WebGL nothing here runs and the painted
// pictures stay.
import * as THREE from './vendor/three.module.min.js';

const TAU = Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const approach = (v, t, rate, dt) => v + (t - v) * (1 - Math.exp(-rate * dt));
const spring = (s, target, k, c, dt) => { for (let i = 0; i < 2; i++) { const h = dt / 2; s.v += (k * (target - s.x) - c * s.v) * h; s.x += s.v * h } return s.x };
const angleTo = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d };
const PHONE = matchMedia('(pointer:coarse)').matches || matchMedia('(max-width:700px)').matches;
// Resolution of the 3D views: previews and herd animals at up to 1.5x on phones (1.25x elsewhere); the player view
// passes its own (the screen's density) so it stays sharp on high-density phone screens.
const SCREEN_DPR = window.devicePixelRatio || 1, DPR = Math.min(PHONE ? 1.5 : 1.25, SCREEN_DPR);
// Weak devices (few cores or little memory) start at a lighter quality, without antialiasing; then the quality follows
// the measured frame rate (see adaptQuality): lower 3D resolution and fewer background redraws when frames run late.
const WEAK = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3;

let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ antialias: !(WEAK && PHONE), alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(1); renderer.setClearColor(0x000000, 0); renderer.setSize(512, 512, false);
} catch { renderer = null }

// ---------- Look: toon shading in three tones with warm dark-brown outlines, like the painted art ----------
const INK = new THREE.Color('#5a3920');
const gradient = (() => { const d = new Uint8Array([105, 178, 228, 255]); const t = new THREE.DataTexture(d, 4, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t })();
const matCache = new Map();
function toon(color, opts = {}) {
  const key = color + JSON.stringify({ ...opts, map: opts.map?.uuid });
  if (matCache.has(key) && !opts.unique) return matCache.get(key);
  const { unique, ...rest } = opts, m = new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: gradient, ...rest });
  if (!opts.unique) matCache.set(key, m);
  return m;
}
// Outline: the back faces pushed out along the normals (in view space, so the line keeps one width on scaled parts).
const outlineMat = new THREE.ShaderMaterial({
  uniforms: { thickness: { value: .0075 }, color: { value: INK } }, side: THREE.BackSide,
  vertexShader: 'uniform float thickness;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vec3 n=normalize(normalMatrix*normal);mv.xyz+=n*thickness;gl_Position=projectionMatrix*mv;}',
  fragmentShader: 'uniform vec3 color;void main(){gl_FragColor=vec4(color,1.);\n#include <colorspace_fragment>\n}'
});
// Small parts (eyes, nostrils, buttons, hooves…) are drawn with coarser spheres and the tiniest skip the ink line:
// at game size the difference is invisible, and it keeps a whole herd within a weak phone's budget.
function mesh(geo, mat, { outline = true, parent, pos, rot, scale } = {}) {
  const k = scale === undefined ? 1 : typeof scale === 'number' ? scale : Math.max(...scale);
  if (geo === G.sphere || geo === G.sphereLo) { geo = k < .022 ? G.sphereTiny : k < .065 ? G.sphereLo : geo; if (k < .016) outline = false }
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); if (scale) typeof scale === 'number' ? m.scale.setScalar(scale) : m.scale.set(...scale);
  if (outline) { const o = new THREE.Mesh(geo, outlineMat); o.renderOrder = -1; m.add(o) }
  if (parent) parent.add(m);
  return m;
}
const node = (parent, pos = [0, 0, 0]) => { const g = new THREE.Group(); g.position.set(...pos); parent.add(g); return g };
const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t };
const shade = (hex, f) => { const c = new THREE.Color(hex); c.r = clamp(c.r * f, 0, 1); c.g = clamp(c.g * f, 0, 1); c.b = clamp(c.b * f, 0, 1); return '#' + c.getHexString() };

// Shared shapes (unit sizes, scaled where used).
// Geometry factories are memoised: models are rebuilt whenever a screen re-renders, and must not pile up new buffers.
const memo = f => { const c = new Map(); return (...a) => { const k = a.join(','); if (!c.has(k)) c.set(k, f(...a)); return c.get(k) } };
const G = {
  sphere: new THREE.SphereGeometry(1, 28, 18),
  sphereLo: new THREE.SphereGeometry(1, 18, 12),
  sphereTiny: new THREE.SphereGeometry(1, 10, 7),
  cap: memo((r, len) => new THREE.CapsuleGeometry(r, len, 6, 16)),
  cyl: memo((rt, rb, h, seg = 16, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)),
  cone: memo((r, h, seg = 32) => new THREE.ConeGeometry(r, h, seg, 1, true)),
  torus: memo((r, tube, rs, ts, arc = TAU) => new THREE.TorusGeometry(r, tube, rs, ts, arc)),
  box: memo((x, y, z) => new THREE.BoxGeometry(x, y, z, 4, 6, 1)),
};
const texMemo = new Map(); const memoTex = (key, make) => { if (!texMemo.has(key)) texMemo.set(key, make()); return texMemo.get(key) };
// A body of revolution with its seam at the back and u = .5 on the front (+z).
const lathe = (pts, seg = 32) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg, -Math.PI, TAU);

// ---------- Views ----------
const views = new Set();
class View {
  // host: element the canvas is placed in; box: {w,h} in host units (fractions of the host size) and where it sits
  constructor(host, { left = 0, top = 0, width = 1, height = 1, cls = 'w3d-view', zoom = 1, center = [0, .5], pitch = .26, live = false, dpr = DPR } = {}) {
    this.host = host; this.canvas = document.createElement('canvas'); this.canvas.className = cls; this.canvas.setAttribute('aria-hidden', 'true');
    Object.assign(this.canvas.style, { position: 'absolute', left: left * 100 + '%', top: top * 100 + '%', width: width * 100 + '%', height: height * 100 + '%', pointerEvents: 'none' });
    host.appendChild(this.canvas); this.ctx = this.canvas.getContext('2d');
    this.scene = new THREE.Scene(); this.zoom = zoom; this.center = center; this.pitch = pitch; this.live = live; this.dpr = Math.min(dpr, SCREEN_DPR, 3); this.dirty = true;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 50);
    const hemi = new THREE.HemisphereLight('#fff7e6', '#8a7b5c', 1.9), sun = new THREE.DirectionalLight('#fff1d6', 2.3);
    sun.position.set(-2.2, 4, 3.2); this.scene.add(hemi, sun);
    this.root = node(this.scene); views.add(this); this.measure();
  }
  measure() {
    const r = this.canvas.getBoundingClientRect(), scale = Math.min(this.priority ? this.dpr : this.dpr * QUALITY.scale, 512 / Math.max(1, this.canvas.offsetWidth, this.canvas.offsetHeight)), w = Math.max(1, Math.round(this.canvas.offsetWidth * scale)), h = Math.max(1, Math.round(this.canvas.offsetHeight * scale));
    this.visible = r.width > 0 && r.height > 0 && r.bottom > -50 && r.top < innerHeight + 50 && r.right > -50 && r.left < innerWidth + 50;
    if (w !== this.canvas.width || h !== this.canvas.height) { this.canvas.width = w; this.canvas.height = h; this.dirty = true }
    const projectionKey = [w, h, this.zoom, ...this.center, this.pitch].join(',');
    if (projectionKey === this.projectionKey) return;
    this.projectionKey = projectionKey;
    // Orthographic frame: `zoom` model units across the canvas height, centred on `center` (x, y in model units).
    const halfH = this.zoom / 2, halfW = halfH * w / h, [cx, cy] = this.center, cam = this.camera;
    cam.left = cx - halfW; cam.right = cx + halfW; cam.top = cy + halfH; cam.bottom = cy - halfH;
    cam.position.set(0, Math.sin(this.pitch) * 10, Math.cos(this.pitch) * 10); cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }
  render() {
    if (!renderer) return;
    const t0 = performance.now();
    const w = this.canvas.width, h = this.canvas.height, el = renderer.domElement;
    if (w > el.width || h > el.height) renderer.setSize(Math.max(w, el.width), Math.max(h, el.height), false);
    renderer.setViewport(0, 0, w, h); renderer.setScissor(0, 0, w, h); renderer.setScissorTest(true);
    renderer.render(this.scene, this.camera);
    this.ctx.clearRect(0, 0, w, h); this.ctx.drawImage(el, 0, el.height - h, w, h, 0, 0, w, h);
    this.dirty = false; renderMs = renderMs * .9 + (performance.now() - t0) * .1;
  }
  dispose() { views.delete(this); this.canvas.remove() }
}

// ---------- Faces: painted onto the head sphere's texture (front of the head = centre of the texture) ----------
const SKIN = '#ffd8b6', SKIN_SH = '#f2b996', HAIR = '#4a2d1d', BLUSH = '#ff9c9c';
function faceTex(kind, gender) {
  return canvasTex(1024, 512, (g, W, H) => {
    g.fillStyle = SKIN; g.fillRect(0, 0, W, H);
    const cx = W / 2, ey = 276, ex = 66;
    // blush
    for (const s of [-1, 1]) { const gr = g.createRadialGradient(cx + s * 104, 318, 2, cx + s * 104, 318, 34); gr.addColorStop(0, BLUSH + 'cc'); gr.addColorStop(1, BLUSH + '00'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx + s * 104, 318, 40, 24, 0, 0, TAU); g.fill() }
    g.lineCap = 'round'; g.lineJoin = 'round';
    // brows
    g.strokeStyle = '#4a2c1a'; g.lineWidth = gender === 'male' ? 7 : 5;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * (ex - 26), 208); g.quadraticCurveTo(cx + s * ex, 196, cx + s * (ex + 26), 206); g.stroke() }
    if (kind === 'open') {
      for (const s of [-1, 1]) {
        const x = cx + s * ex;
        // white, iris, pupil, two shines
        g.fillStyle = '#fffaf4'; g.beginPath(); g.ellipse(x, ey, 25, 33, 0, 0, TAU); g.fill();
        const ir = g.createLinearGradient(0, ey - 30, 0, ey + 30); ir.addColorStop(0, '#2a160c'); ir.addColorStop(.55, '#4a2a16'); ir.addColorStop(1, '#8a5630');
        g.fillStyle = ir; g.beginPath(); g.ellipse(x + s * 1, ey + 3, 21, 29, 0, 0, TAU); g.fill();
        g.fillStyle = '#1a0d07'; g.beginPath(); g.ellipse(x + s * 1, ey + 4, 10, 14, 0, 0, TAU); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - 7, ey - 11, 8, 10, -.3, 0, TAU); g.fill(); g.beginPath(); g.arc(x + 8, ey + 14, 4, 0, TAU); g.fill();
        // upper lid (+ lashes)
        g.strokeStyle = '#2b170d'; g.lineWidth = gender === 'male' ? 6 : 7.5;
        g.beginPath(); g.moveTo(x - s * 27, ey - 6); g.quadraticCurveTo(x, ey - 44, x + s * 28, ey - 12); g.stroke();
        if (gender !== 'male') { g.lineWidth = 4.5; g.beginPath(); g.moveTo(x + s * 26, ey - 12); g.lineTo(x + s * 38, ey - 20); g.moveTo(x + s * 22, ey - 22); g.lineTo(x + s * 32, ey - 33); g.stroke() }
      }
    } else {
      // closed: a soft smile-shaped line (blink) or ^ ^ (happy)
      g.strokeStyle = '#2b170d'; g.lineWidth = 7;
      for (const s of [-1, 1]) {
        const x = cx + s * ex; g.beginPath();
        if (kind === 'happy') { g.moveTo(x - 24, ey + 8); g.quadraticCurveTo(x, ey - 26, x + 24, ey + 8) }
        else { g.moveTo(x - 24, ey); g.quadraticCurveTo(x, ey + 14, x + 24, ey) }
        g.stroke();
        if (gender !== 'male' && kind !== 'happy') { g.lineWidth = 4; g.beginPath(); g.moveTo(x + s * 22, ey + 2); g.lineTo(x + s * 32, ey - 4); g.stroke(); g.lineWidth = 7 }
      }
    }
    // mouth
    g.strokeStyle = '#7a2c22'; g.lineWidth = 6;
    if (kind === 'happy') { g.fillStyle = '#9b3226'; g.beginPath(); g.moveTo(cx - 22, 342); g.quadraticCurveTo(cx, 386, cx + 22, 342); g.closePath(); g.fill(); g.fillStyle = '#ff8f86'; g.beginPath(); g.ellipse(cx, 366, 11, 7, 0, 0, TAU); g.fill() }
    else { g.beginPath(); g.moveTo(cx - 14, 348); g.quadraticCurveTo(cx, 360, cx + 14, 348); g.stroke() }
  });
}
const faceCache = new Map();
const faces = gender => { if (!faceCache.has(gender)) faceCache.set(gender, { open: faceTex('open', gender), blink: faceTex('blink', gender), happy: faceTex('happy', gender) }); return faceCache.get(gender) };

// ---------- Hair (head-local: head centre at 0, radius .22, face toward +z) ----------
const HEAD_R = .22;
// Make every normal point away from the vertical axis of the shape (hair shells are built as open surfaces).
function outward(g) {
  g.computeVertexNormals(); const p = g.attributes.position, n = g.attributes.normal; let dot = 0;
  for (let i = 0; i < p.count; i += 7) dot += p.getX(i) * n.getX(i) + p.getY(i) * n.getY(i) * .3 + p.getZ(i) * n.getZ(i);
  if (dot < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const s = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = s } g.index.needsUpdate = true; g.computeVertexNormals() }
  return g;
}
// A shell of hair over the skull ending at a hairline that is high at the front and low at the back. `front` is the
// hairline angle at the front (from the top), `back` at the back, `side` how far round the face opening reaches.
function hairCap({ front = .36, back = .74, side = .5, r = HEAD_R * 1.07, flare = 0 } = {}) {
  const seg = 48, rows = 18, pos = [], idx = [], uv = [];
  for (let i = 0; i <= seg; i++) {
    const phi = -Math.PI + TAU * i / seg, a = Math.abs(phi) / Math.PI;       // a: 0 front … 1 back
    const line = (a < side ? lerp(front, (front + back) / 2, Math.pow(a / side, 2)) : lerp((front + back) / 2, back, (a - side) / (1 - side))) * Math.PI;
    for (let j = 0; j <= rows; j++) {
      const th = line * j / rows, rr = r * (1 + flare * Math.pow(j / rows, 3));
      pos.push(rr * Math.sin(th) * Math.sin(phi), rr * Math.cos(th), rr * Math.sin(th) * Math.cos(phi)); uv.push(i / seg, 1 - j / rows);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < rows; j++) { const a = i * (rows + 1) + j, b = a + rows + 1; idx.push(a, b, a + 1, b, b + 1, a + 1) }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return outward(g);
}
// A curtain of hair hanging around the head from `top` (y) down to `bottom`, leaving the face open (|phi| < open).
// It hugs the skull, swells a little, then curls in at the tips; the lower edge is broken into soft points.
function hairCurtain({ top = .1, bottom = -.2, open = .42, r = HEAD_R * 1.08, wave = 0, swell = .07, curl = .035, points = .014 } = {}) {
  const seg = 56, rows = 16, pos = [], idx = [], uv = [], p0 = open * Math.PI, p1 = TAU - p0;
  for (let i = 0; i <= seg; i++) {
    const phi = p0 + (p1 - p0) * i / seg, edge = Math.min(1, Math.min(phi - p0, p1 - phi) / .5);
    const bot = bottom + points * Math.abs(Math.sin(phi * 7)) - (1 - edge) * .02;
    for (let j = 0; j <= rows; j++) {
      const t = j / rows, y = lerp(top, bot, t), skull = y > 0 ? Math.sqrt(Math.max(0, r * r - y * y)) : r;
      const rr = Math.max(skull, r * .93) * (1 + swell * Math.sin(Math.PI * Math.min(1, t * 1.15))) - curl * Math.pow(t, 5) + wave * Math.sin(t * 10 + i * .55) * t;
      pos.push(rr * Math.sin(phi), y, rr * Math.cos(phi)); uv.push(i / seg, 1 - t);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < rows; j++) { const a = i * (rows + 1) + j, b = a + rows + 1; idx.push(a, a + 1, b, b, a + 1, b + 1) }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return outward(g);
}
// One lock of hair: a tapered, slightly curved lens laid on the head surface at (phi, theta), hanging down.
function lock(parent, mat, phi, theta, { len = .1, wid = .05, thick = .022, tilt = 0, out = 1.08, droop = .2 } = {}) {
  const r = HEAD_R * out, p = [r * Math.sin(theta) * Math.sin(phi), r * Math.cos(theta), r * Math.sin(theta) * Math.cos(phi)];
  const g = node(parent, p); g.rotation.order = 'YXZ'; g.rotation.y = phi; g.rotation.x = theta - Math.PI / 2 + droop; g.rotation.z = tilt;
  mesh(G.sphere, mat, { parent: g, pos: [0, -len * .42, 0], scale: [wid / 2, len / 2, thick / 2] });
  return g;
}
const capG = memo(j => hairCap(JSON.parse(j))), curtainG = memo(j => hairCurtain(JSON.parse(j)));
function buildHair(head, style, mat) {
  const D = Math.PI;
  const fringe = (n, spread, theta, opt) => { for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : i / (n - 1) - .5; lock(head, mat, t * spread, theta, { ...opt, tilt: -t * .5 }) } };
  const chain = [];
  switch (style) {
    case 'short':
      mesh(capG(JSON.stringify({ front: .34, back: .68, side: .45 })), mat, { parent: head });
      fringe(5, 1.3, .3 * D, { len: 0.085, wid: 0.045, droop: .35 });
      for (const [p, t, l] of [[-.5, .12, .07], [.2, .08, .08], [.9, .16, .07], [2.4, .2, .07], [-2.2, .2, .07], [D, .25, .06]]) lock(head, mat, p, t * D, { len: l, wid: 0.04, droop: -.9 });
      lock(head, mat, -1.25, .42 * D, { len: 0.07, wid: 0.035, droop: .1 }); lock(head, mat, 1.25, .42 * D, { len: 0.07, wid: 0.035, droop: .1 });
      break;
    case 'bob':
      mesh(capG(JSON.stringify({ front: .3, back: .6, side: .4 })), mat, { parent: head });
      mesh(curtainG(JSON.stringify({ bottom: -.2, open: .3 })), mat, { parent: head });
      fringe(7, 1.2, .26 * D, { len: .12, wid: .075, droop: .3 });
      break;
    case 'pony': {
      mesh(capG(JSON.stringify({ front: .32, back: .7, side: .45 })), mat, { parent: head });
      fringe(4, .9, .27 * D, { len: 0.11, wid: 0.05, droop: .25 });
      lock(head, mat, -1.15, .4 * D, { len: 0.13, wid: 0.035, droop: .05 }); lock(head, mat, 1.15, .4 * D, { len: 0.13, wid: 0.035, droop: .05 });
      const tie = node(head, [0, .17, -.17]); mesh(G.torus(.032, .013, 8, 16), toon('#e05a4f'), { parent: tie, rot: [-.9, 0, 0] });
      // the tail leaves the tie going back, then hangs down past the shoulders
      let p = tie; for (let i = 0; i < 5; i++) { const s = node(p, [0, i ? -.07 : 0, i ? 0 : -.015]); s.rotation.x = [1.15, -.38, -.38, -.3, -.2][i]; mesh(G.sphere, mat, { parent: s, pos: [0, -.04, 0], scale: [.046 - i * .005, .052, .04 - i * .004] }); chain.push(s); p = s }
      break;
    }
    case 'wave':
      mesh(capG(JSON.stringify({ front: .3, back: .6, side: .4 })), mat, { parent: head });
      mesh(curtainG(JSON.stringify({ bottom: -.44, open: .33, swell: .12, curl: .02, wave: .012, points: .03 })), mat, { parent: head });
      lock(head, mat, -.25, .26 * D, { len: 0.16, wid: 0.07, droop: .35, tilt: .5 }); lock(head, mat, .3, .26 * D, { len: 0.15, wid: 0.07, droop: .35, tilt: -.5 });
      break;
    case 'curly': {
      mesh(capG(JSON.stringify({ front: .33, back: .66, side: .45, r: HEAD_R * 1.05 })), mat, { parent: head });
      for (let i = 0; i < 46; i++) { const th = Math.acos(1 - 2 * ((i + .5) / 46)) * .62, ph = i * 2.39996; if (Math.abs(angleTo(0, ph)) < .55 && th > .36 * D) continue; const r = HEAD_R * 1.1; mesh(G.sphereLo, mat, { parent: head, pos: [r * Math.sin(th) * Math.sin(ph), r * Math.cos(th), r * Math.sin(th) * Math.cos(ph)], scale: .05 }) }
      for (let i = 0; i < 6; i++) { const ph = (i / 5 - .5) * 1.25; mesh(G.sphereLo, mat, { parent: head, pos: [HEAD_R * 1.02 * Math.sin(ph), .11, HEAD_R * .98 * Math.cos(ph)], scale: .045 }) }
      break;
    }
    case 'buns':
      mesh(capG(JSON.stringify({ front: .32, back: .68, side: .45 })), mat, { parent: head });
      fringe(5, 1, .27 * D, { len: 0.1, wid: 0.048, droop: .25 });
      for (const s of [-1, 1]) { mesh(G.sphere, mat, { parent: head, pos: [s * .15, .17, -.05], scale: .075 }); mesh(G.torus(.04, .011, 8, 16), toon('#e05a4f'), { parent: head, pos: [s * .125, .135, -.04], rot: [1.2, 0, s * .6] }); lock(head, mat, s * 1.3, .45 * D, { len: 0.13, wid: 0.03, droop: .05 }) }
      break;
    case 'braid': {
      mesh(capG(JSON.stringify({ front: .3, back: .7, side: .45 })), mat, { parent: head });
      fringe(4, .9, .27 * D, { len: 0.11, wid: 0.05, droop: .25 });
      let p = node(head, [-.15, -.06, -.1]);
      for (let i = 0; i < 6; i++) { const s = node(p, [0, i ? -.055 : 0, 0]); s.rotation.x = i ? .05 : .1; mesh(G.sphere, mat, { parent: s, pos: [i % 2 ? .006 : -.006, -.025, 0], scale: [.04 - i * .003, .036, .034] }); chain.push(s); p = s }
      const tip = node(p, [0, -.06, 0]); mesh(G.torus(.02, .008, 8, 14), toon('#e05a4f'), { parent: tip, rot: [D / 2, 0, 0] });
      break;
    }
    case 'side':
      mesh(capG(JSON.stringify({ front: .3, back: .66, side: .42 })), mat, { parent: head });
      mesh(curtainG(JSON.stringify({ bottom: -.13, open: .45, swell: .05 })), mat, { parent: head });
      lock(head, mat, -.45, .2 * D, { len: 0.2, wid: 0.1, droop: .5, tilt: .9, thick: 0.03 });
      lock(head, mat, .45, .28 * D, { len: 0.1, wid: 0.04, droop: .3, tilt: -.3 });
      break;
  }
  return chain;
}

// Nón lá: a wide conical leaf hat with woven rings and ribs.
const hatTex = canvasTex(512, 256, (g, W, H) => {
  g.fillStyle = '#efcf8a'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#c9984d'; g.lineWidth = 3; for (let i = 0; i < 9; i++) { const y = 20 + i * 27; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke() }
  g.strokeStyle = '#d8ae66'; g.lineWidth = 2; for (let i = 0; i < 32; i++) { g.beginPath(); g.moveTo(i * W / 32, 0); g.lineTo(i * W / 32, H); g.stroke() }
});
function buildHat(head) {
  const g = node(head, [0, .17, .0]); g.rotation.set(-.1, 0, .06);
  mesh(G.cone(.34, .25, 40), toon('#fff', { map: hatTex, side: THREE.DoubleSide }), { parent: g, pos: [0, .1, 0] });
  mesh(G.torus(.338, .009, 6, 48), toon('#c9984d'), { parent: g, pos: [0, -.025, 0], rot: [Math.PI / 2, 0, 0], outline: false });
  return g;
}

// ---------- Clothes ----------
// Torso texture: u around the body (front at the middle), v from the hips (0) to the neck (1).
function torsoTex(o) {
  return canvasTex(512, 256, (g, W, H) => {
    const mid = W / 2, base = o.top === 'overalls' ? o.under : o.c;
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    const yv = v => H - v * H;
    // shading band at the sides
    const sg = g.createLinearGradient(0, 0, W, 0); sg.addColorStop(0, '#0002'); sg.addColorStop(.25, '#0000'); sg.addColorStop(.75, '#0000'); sg.addColorStop(1, '#0002'); g.fillStyle = sg; g.fillRect(0, 0, W, H);
    if (o.stripes) { g.fillStyle = o.stripes; for (let i = 0; i < 5; i++) g.fillRect(0, yv(.2 + i * .17), W, 18) }
    switch (o.top) {
      case 'tunic': g.strokeStyle = o.trim; g.lineWidth = 5; g.beginPath(); g.moveTo(mid, yv(1)); g.lineTo(mid, yv(.18)); g.stroke(); for (const v of [.82, .64, .46]) { g.fillStyle = o.trim; g.fillRect(mid - 14, yv(v) - 3, 28, 6); g.beginPath(); g.arc(mid + 15, yv(v), 4, 0, TAU); g.fill() } break;
      case 'overalls': g.fillStyle = o.c; g.fillRect(0, yv(.38), W, H); g.fillRect(mid - 52, yv(.82), 104, yv(.38) - yv(.82)); g.fillRect(mid + W / 2 - 52, yv(.8), 104, yv(.38) - yv(.8));
        g.fillRect(mid - 52, yv(1), 22, yv(.82) - yv(1)); g.fillRect(mid + 30, yv(1), 22, yv(.82) - yv(1)); g.fillStyle = o.btn; for (const x of [mid - 40, mid + 40]) { g.beginPath(); g.arc(x, yv(.78), 7, 0, TAU); g.fill() }
        g.strokeStyle = o.c2; g.lineWidth = 3; g.strokeRect(mid - 26, yv(.68), 52, 30); break;
      case 'tee': if (o.pocket) { g.strokeStyle = o.c2; g.lineWidth = 3; g.strokeRect(mid + 28, yv(.8), 34, 34) } if (o.collar) { g.fillStyle = shade(o.c, 1.1); g.beginPath(); g.moveTo(mid - 30, yv(1)); g.lineTo(mid, yv(.84)); g.lineTo(mid + 30, yv(1)); g.fill() } break;
      case 'hoodie': g.fillStyle = o.c2; g.fillRect(0, yv(.14), W, H); g.fillStyle = shade(o.c, .92); g.beginPath(); g.roundRect(mid - 50, yv(.52), 100, 46, 12); g.fill(); g.strokeStyle = '#f4efe6'; g.lineWidth = 5; for (const x of [mid - 14, mid + 14]) { g.beginPath(); g.moveTo(x, yv(.98)); g.lineTo(x, yv(.68)); g.stroke() } break;
      case 'jacket': case 'track': case 'cardigan':
        g.fillStyle = o.inner; g.fillRect(mid - 20, 0, 40, H); g.strokeStyle = shade(o.c, .75); g.lineWidth = 3; g.beginPath(); g.moveTo(mid - 20, 0); g.lineTo(mid - 20, H); g.moveTo(mid + 20, 0); g.lineTo(mid + 20, H); g.stroke();
        if (o.top === 'track') { g.fillStyle = o.stripe; g.fillRect(W * .25 - 6, 0, 12, H); g.fillRect(W * .75 - 6, 0, 12, H) }
        if (o.top === 'cardigan') { g.fillStyle = o.c2; for (const v of [.75, .55, .35]) { g.beginPath(); g.arc(mid + 28, yv(v), 6, 0, TAU); g.fill() } g.fillRect(0, yv(.12), W, H) }
        if (o.top === 'jacket') { g.strokeStyle = o.c2; g.lineWidth = 3; g.strokeRect(mid - 70, yv(.78), 36, 30); g.strokeRect(mid + 34, yv(.78), 36, 30) }
        break;
      case 'aodai': g.fillStyle = o.c2; g.fillRect(mid - 40, 0, 80, 22); g.strokeStyle = o.motif; g.lineWidth = 4; g.beginPath(); g.moveTo(mid + 6, yv(.92)); g.quadraticCurveTo(mid + 48, yv(.8), mid + 70, yv(.6)); g.stroke();
        for (const [x, v] of [[mid + 26, .84], [mid + 48, .74]]) { g.fillStyle = o.motif; g.beginPath(); g.arc(x, yv(v), 5, 0, TAU); g.fill() }
        motifs(g, o.motif, [[mid - 40, yv(.55), 1.2], [mid + 10, yv(.3), 1], [mid - 20, yv(.15), .8]]); break;
      case 'sash': g.fillStyle = o.sash; g.fillRect(0, yv(.3), W, 26); g.strokeStyle = o.c2; g.lineWidth = 4; g.beginPath(); g.moveTo(mid - 40, yv(1)); g.lineTo(mid + 40, yv(.45)); g.stroke(); break;
    }
    // trousers waistband at the hips
    if (!['aodai', 'overalls'].includes(o.top) && o.bottom !== 'skirt') { g.fillStyle = o.b; g.fillRect(0, yv(.1), W, H) }
  });
}
function motifs(g, c, at) { g.fillStyle = c; for (const [x, y, s] of at) { g.save(); g.translate(x, y); g.scale(s, s); for (let i = 0; i < 5; i++) { g.rotate(TAU / 5); g.beginPath(); g.ellipse(0, -9, 5, 9, 0, 0, TAU); g.fill() } g.beginPath(); g.arc(0, 0, 4, 0, TAU); g.fillStyle = shade(c, .8); g.fill(); g.fillStyle = c; g.restore() } }
const stripeTex = (base, stripe) => canvasTex(128, 64, (g, W, H) => { g.fillStyle = base; g.fillRect(0, 0, W, H); g.fillStyle = stripe; g.fillRect(W * .72, 0, W * .1, H) });
const bandTex = (base, band) => canvasTex(64, 128, (g, W, H) => { g.fillStyle = base; g.fillRect(0, 0, W, H); g.fillStyle = band; for (let i = 0; i < 4; i++) g.fillRect(0, i * 32 + 6, W, 12) });

// ---------- Character ----------
const torsoShape = lathe([[0, -.035], [.088, -.03], [.112, 0], [.112, .06], [.106, .14], [.098, .2], [.07, .225], [.03, .235]]);
const shadowMat = () => new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }), discG = new THREE.CircleGeometry(1, 32);
const charHead = new THREE.SphereGeometry(HEAD_R, 48, 32, -Math.PI / 2, TAU);
const CHAR = { hip: .3, thigh: .135, shin: .125, foot: .035 };
function outfitSpec(look) {
  const R = window.AvatarRig, g = look.gender === 'male' ? 'male' : 'female', O = R?.outfits || {}, raw = O[look.outfit] || O.base || {}, o = {};
  for (const k in raw) { const v = raw[k]; o[k] = v && typeof v === 'object' && !Array.isArray(v) ? (v[g] ?? v.female) : v }
  o.gender = g; o.hair = look.hair || (g === 'male' ? 'short' : 'bob'); o.shoeKey = look.shoe || o.shoe || 'sandals'; o.shoe = (R?.shoes || {})[o.shoeKey] || { type: 'sandal', c: '#8b5a33', c2: '#6b4226' };
  return o;
}
class Character {
  constructor(view, look) { this.view = view; this.root = node(view.root); this.st = { phase: 0, w: 0, run: 0, yaw: .45, yawTo: .45, t: Math.random() * 9, blinkAt: 2, blink: 0, cheer: 0, jump: 0, lean: { x: 0, v: 0 }, head: { x: 0, v: 0 }, look: { x: 0, v: 0 }, lookTo: 0, lookAt: 2, weight: { x: 0, v: 0 }, weightTo: 0, weightAt: 3, sway: [] }; this.setLook(look) }
  setLook(look) {
    const key = JSON.stringify(look); if (key === this.key) return; this.key = key;
    this.root.clear(); const o = this.o = outfitSpec(look), skin = toon(SKIN), sk2 = toon(SKIN_SH), hairMat = toon(HAIR), c1 = toon(o.c), c2 = toon(o.c2 || o.c), pants = toon(o.b || '#7a5236');
    const R = this.root, P = this.parts = {};
    // shadow
    if (!this.shadow) { const sh = new THREE.Mesh(discG, shadowMat()); sh.rotation.x = -Math.PI / 2; sh.position.y = .002; this.view.root.add(sh); this.shadow = sh }
    P.body = node(R, [0, CHAR.hip, 0]);                                   // hips: everything hangs from here
    P.spine = node(P.body, [0, .0, 0]);
    // torso
    const torsoGeo = torsoShape;
    const tMat = toon('#fff', { map: memoTex('torso' + JSON.stringify(o), () => torsoTex(o)) });
    P.torso = mesh(torsoGeo, tMat, { parent: P.spine, scale: [1, 1, .82] });
    if (o.top === 'hoodie') mesh(G.torus(.07, .03, 10, 24, Math.PI * 1.2), c2, { parent: P.spine, pos: [0, .2, -.045], rot: [-1.1, 0, Math.PI * -.1] });
    if (o.top === 'sash') { const kn = node(P.spine, [.07, .04, .085]); mesh(G.sphere, toon(o.sash), { parent: kn, scale: [.022, .018, .014] }); mesh(G.sphere, toon(o.sash), { parent: kn, pos: [.008, -.035, 0], scale: [.012, .03, .008] }) }
    // neck + head
    P.neck = node(P.spine, [0, .235, 0]);
    mesh(G.cyl(.032, .036, .05), skin, { parent: P.neck, pos: [0, .015, 0], outline: false });
    P.head = node(P.neck, [0, .2, .005]);
    this.faces = faces(o.gender);
    const headGeo = charHead;
        P.face = mesh(headGeo, toon('#fff', { map: this.faces.open, unique: true }), { parent: P.head, scale: [1.05, .96, .98] });
    const hairStyle = o.hat ? (o.gender === 'male' ? 'short' : 'bob') : o.hair;
    if (!['bob', 'wave', 'side'].includes(hairStyle)) for (const s of [-1, 1]) mesh(G.sphere, skin, { parent: P.head, pos: [s * .222, -.02, .0], scale: [.03, .045, .035] });
    this.chain = o.hat ? [] : buildHair(P.head, o.hair, hairMat);
    if (o.hat) { buildHair(P.head, o.gender === 'male' ? 'short' : 'bob', hairMat); buildHat(P.head) }
    // arms: shoulder → upper arm → elbow → forearm + hand
    const sleeve = o.top === 'overalls' ? toon(o.under) : c1, longSleeve = ['long'].includes(o.sleeve) || o.top === 'aodai', sleeveMat = o.top === 'track' ? toon('#fff', { map: memoTex('stripe' + o.c + o.stripe, () => stripeTex(o.c, o.stripe)) }) : o.stripes ? toon('#fff', { map: memoTex('band' + o.c + o.stripes, () => bandTex(o.c, o.stripes)) }) : sleeve;
    P.arms = [-1, 1].map(s => {
      const sh = node(P.spine, [s * .105, .2, 0]), up = mesh(G.cap(.03, .05), sleeveMat, { parent: sh, pos: [0, -.04, 0] });
      const el = node(sh, [0, -.085, 0]), fore = mesh(G.cap(.027, .045), longSleeve ? sleeveMat : skin, { parent: el, pos: [0, -.03, 0] });
      if (longSleeve) mesh(G.cyl(.031, .031, .016), toon(o.c2 || o.c), { parent: el, pos: [0, -.058, 0] });
      const hand = mesh(G.sphere, skin, { parent: el, pos: [0, -.075, 0], scale: [.033, .035, .031] });
      sh.rotation.z = s * .18; return { sh, el, hand, s };
    });
    // legs: hip → thigh → knee → shin → ankle → foot
    const shorts = o.bottom === 'shorts', skirt = o.bottom === 'skirt', dress = o.top === 'aodai', bare = !shorts && !skirt;
    const legMat = o.bottom === 'track' ? toon('#fff', { map: memoTex('stripe' + o.b + o.stripe, () => stripeTex(o.b, o.stripe || '#fff')) }) : pants;
    P.legs = [-1, 1].map(s => {
      const hip = node(P.body, [s * .05, -.01, 0]), thigh = mesh(G.cap(skirt ? .032 : shorts ? .042 : .038, CHAR.thigh - .04), skirt ? skin : legMat, { parent: hip, pos: [0, -CHAR.thigh / 2, 0] });
      const knee = node(hip, [0, -CHAR.thigh, 0]), shin = mesh(G.cap(.031, CHAR.shin - .04), bare ? legMat : skin, { parent: knee, pos: [0, -CHAR.shin / 2, 0] });
      if (shorts) mesh(G.cyl(.05, .053, .03), legMat, { parent: hip, pos: [0, -CHAR.thigh * .62, 0] });
      if (o.cuff) mesh(G.cyl(.04, .04, .022), toon(o.cuff), { parent: knee, pos: [0, -CHAR.shin + .03, 0] });
      const ankle = node(knee, [0, -CHAR.shin, 0]); buildShoe(ankle, o.shoe, skin);
      return { hip, knee, ankle, s };
    });
    if (skirt) P.skirt = mesh(G.cyl(.115, .17, .1, 32, true), toon('#fff', { map: memoTex('skirt' + o.b + o.motif, () => canvasTex(256, 64, (g, W, H) => { g.fillStyle = o.b; g.fillRect(0, 0, W, H); g.fillStyle = o.motif || '#f2d6a8'; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc((i * 37) % W, 10 + (i * 23) % 48, 3.5, 0, TAU); g.fill() } })), side: THREE.DoubleSide }), { parent: P.body, pos: [0, -.03, 0] });
    if (o.bottom === 'wide' || o.bottom === 'baggy') for (const L of P.legs) L.hip.children[0].scale.set(1.25, 1, 1.25);
    // áo dài: front and back panels from the waist, swaying with the stride
    if (dress) {
      const panTex = memoTex('panel' + o.c + o.motif, () => canvasTex(128, 256, (g, W, H) => { g.fillStyle = o.c; g.fillRect(0, 0, W, H); motifs(g, o.motif, [[W * .5, H * .35, 1.3], [W * .3, H * .7, 1], [W * .7, H * .85, .8]]) }));
      P.panels = [1, -1].map(z => { const p = node(P.body, [0, .015, z * .07]); mesh(G.box(.17, .22, .012), toon('#fff', { map: panTex }), { parent: p, pos: [0, -.11, 0] }); return p });
    }
    this.view.dirty = true;
  }
  cheer() { this.st.cheerT = 0 }
  // Fixed poses for still pictures: 'fish' sits on a low stool holding a fishing rod out in front.
  setPose(pose) {
    this.pose = pose; const P = this.parts; if (!P || pose !== 'fish' || P.rod) return;
    const stool = node(this.root, [0, 0, -.02]); mesh(G.cyl(.09, .08, .025), toon('#c08a52'), { parent: stool, pos: [0, .15, 0] }); for (const [x, z] of [[-.06, -.05], [.06, -.05], [-.06, .05], [.06, .05]]) mesh(G.cyl(.012, .012, .15), toon('#94623a'), { parent: stool, pos: [x, .075, z] });
    // the rod rests in the hands and points out over the water, its line dropping to a red float
    const rod = P.rod = node(this.root, [0, .3, .14]); rod.rotation.x = 1.0;
    mesh(G.cyl(.006, .011, .95, 8), toon('#c99a55'), { parent: rod, pos: [0, .44, 0] });
    const tip = node(rod, [0, .9, 0]); tip.rotation.x = -1.0;
    const line = new THREE.Mesh(G.cyl(.0018, .0018, .42, 4), new THREE.MeshBasicMaterial({ color: '#fff8ea' })); line.position.y = -.21; tip.add(line);
    mesh(G.sphere, toon('#e5483d'), { parent: tip, pos: [0, -.43, 0], scale: .018 });
  }
  // Facing: the way the figure walks on screen (vx right, vy down); idle it turns three-quarters toward the viewer.
  steer(vx, vy) { if (Math.hypot(vx, vy) > 1e-3) this.st.yawTo = Math.atan2(vx, vy) }
  // speed in model units / s
  update(dt, { speed = 0 } = {}) {
    const st = this.st, P = this.parts; if (!P) return false; dt = Math.min(dt, 1 / 20); st.t += dt;
    const moving = speed > .04; st.w = approach(st.w, moving ? 1 : 0, moving ? 8 : 6, dt); st.run = approach(st.run, clamp((speed - 1.5) / .8, 0, 1), 4, dt);
    const prev = st.phase; st.phase = (st.phase + speed * dt / lerp(.5, .78, st.run)) % 1; const stepped = moving && Math.floor(prev * 2) !== Math.floor(st.phase * 2);
    const w = st.w, rw = st.run, idle = 1 - w, p = st.phase * TAU;
    // turn toward the way it walks; when standing, settle three-quarters to the viewer on the side it was facing
    if (this.fixedYaw !== undefined) st.yawTo = this.fixedYaw;
    else if (!moving) { const side = Math.sin(st.yawTo) >= 0 ? 1 : -1; if (st.w < .3) st.yawTo = approach(st.yawTo, side * .5, 2.5, dt) }
    st.yaw += angleTo(st.yaw, st.yawTo) * (1 - Math.exp(-(moving ? 12 : 5) * dt)); this.root.rotation.y = st.yaw;
    // blink / happy face
    st.blinkAt -= dt; if (st.blinkAt <= 0) { st.blinkT = 0; st.blinkAt = 2 + Math.random() * 3.5 }
    if (st.blinkT !== undefined) { st.blinkT += dt; if (st.blinkT > .13) delete st.blinkT }
    if (st.cheerT !== undefined) { st.cheerT += dt; const u = st.cheerT / .8; st.cheer = u < 1 ? Math.sin(Math.PI * Math.min(1, u * 1.5)) ** .5 * (u < .75 ? 1 : 1 - (u - .75) / .25) : 0; st.jump = u < .55 ? .06 * Math.sin(Math.PI * u / .55) : 0; if (u >= 1) { delete st.cheerT; st.cheer = st.jump = 0 } }
    const map = st.cheer > .3 ? this.faces.happy : st.blinkT !== undefined ? this.faces.blink : this.faces.open; if (P.face.material.map !== map) { P.face.material.map = map; P.face.material.needsUpdate = true }
    // idle life
    st.weightAt -= dt * idle; if (st.weightAt <= 0) { st.weightTo = st.weightTo ? (Math.random() < .4 ? 0 : -st.weightTo) : (Math.random() < .5 ? -1 : 1); st.weightAt = 3.5 + Math.random() * 4 }
    st.lookAt -= dt; if (st.lookAt <= 0) { st.lookTo = Math.random() < .4 ? 0 : (Math.random() * 2 - 1) * .55; st.lookAt = 1.6 + Math.random() * 3 }
    const wt = spring(st.weight, st.weightTo * idle, 14, 7, dt), br = Math.sin(st.t * TAU / 3.6);
    // gait: feet planted on the ground (2-bone IK), heel strike / passing / toe off, hips lowest just after contact
    const stride = lerp(.12, .2, rw) * w, lift = lerp(.04, .085, rw) * w, u = 2 * p - .5, low = (1 + Math.cos(u)) / 2;
    const hipY = CHAR.hip - w * lerp(.006, .016, rw) * low + w * lerp(.004, .02, rw) * (1 - low) - Math.abs(wt) * .006 + st.jump;
    P.body.position.y = hipY; P.body.position.x = wt * .012;
    P.body.rotation.z = -wt * .05 + w * .03 * Math.sin(p); P.body.rotation.y = w * .12 * Math.sin(p);
    P.legs.forEach((L, i) => {
      const ph = p + (i ? Math.PI : 0), f = Math.cos(ph), swing = Math.sin(ph) < 0, up = swing ? Math.pow(-Math.sin(ph), 1.2) : 0;
      const fz = f * stride, fy = -hipY + CHAR.foot * .6 + up * lift + (st.jump > 0 ? st.jump * .4 : 0);
      const relaxed = (i ? wt > 0 : wt < 0) ? Math.abs(wt) * .035 : 0;
      const [a1, a2] = ik2(fz, fy + relaxed, CHAR.thigh, CHAR.shin);
      L.hip.rotation.x = a1 - P.body.rotation.x; L.knee.rotation.x = a2; L.hip.rotation.z = L.s * (.02 + relaxed * 1.2);
      L.ankle.rotation.x = -(a1 + a2) + (swing ? -.3 * up : f > 0 ? -.25 * f * w : .45 * -f * w);
    });
    // torso: counter-twist, lean into the walk, breathe
    const lean = spring(st.lean, w * lerp(.1, .3, rw), 46, 7.5, dt);
    P.spine.rotation.x = lean; P.spine.rotation.y = -w * .2 * Math.sin(p); P.spine.rotation.z = w * .03 * Math.sin(p) + wt * .04;
    P.torso.scale.y = 1 + idle * .012 * br;
    // head: steady against the body, a lagging bounce, glances around when idle
    const hb = spring(st.head, -w * .05 * Math.sin(u - 1.1), 60, 8, dt), lk = spring(st.look, st.lookTo * idle, 14, 6, dt);
    P.neck.rotation.x = -lean * .6 + hb - st.cheer * .15; P.neck.rotation.y = -P.spine.rotation.y * .8 + lk; P.neck.rotation.z = -P.spine.rotation.z * .7 + idle * .04 * Math.sin(st.t * .7);
    // arms: swing against the legs with a lagging forearm; up when cheering
    P.arms.forEach((A, i) => {
      const ph = p + (i ? 0 : Math.PI), sw = Math.cos(ph - .3) * lerp(.45, .9, rw) * w;
      A.sh.rotation.x = lerp(-sw + idle * .03 * br, -2.7, st.cheer); A.sh.rotation.z = A.s * (lerp(.16, .3, rw * w) + idle * .02 * br + st.cheer * .25);
      A.el.rotation.x = -(lerp(.15, .9, rw) * w + .1) * (1 - st.cheer) - Math.max(0, sw) * .4;
    });
    // hanging hair and dress panels swing after the body
    this.chain.forEach((s, i) => { const k = st.sway[i] || (st.sway[i] = { x: 0, v: 0 }); s.rotation.z = spring(k, -w * .25 * Math.sin(p * 2 - i * .6) - (i === 0 ? lean * .3 : 0), 40, 5, dt) * .6 });
    if (P.panels) P.panels.forEach((pn, i) => { pn.rotation.x = (i ? -1 : 1) * (w * .25 * Math.max(0, Math.cos(p + i * Math.PI)) + lean * .5) });
    if (P.skirt) P.skirt.rotation.z = w * .04 * Math.sin(p);
    // ground shadow
    if (this.pose === 'fish') {                                         // sitting: thighs forward, shins down, both hands on the rod
      P.body.position.set(0, .2, -.02); P.body.rotation.set(0, 0, 0); P.spine.rotation.set(.05, 0, 0);
      P.legs.forEach(L => { L.hip.rotation.set(-1.45, 0, L.s * .12); L.knee.rotation.x = 1.45; L.ankle.rotation.x = 0 });
      P.arms.forEach((A, i) => { A.sh.rotation.set(-1.1, 0, A.s * -.18); A.el.rotation.x = -.55 });
      P.neck.rotation.set(.12 + .02 * br, .1, 0);
    }
    const hgt = Math.max(0, hipY - CHAR.hip); this.shadow.scale.set(.17 * (1 - hgt * 3), .12 * (1 - hgt * 3), 1); this.shadow.material.opacity = 1 - hgt * 5;
    this.view.dirty = true;
    return stepped;
  }
}
// Two-bone IK in the leg plane: hip at the origin, foot at (z forward, y up); knees bend forward.
function ik2(z, y, a, b) {
  let d = Math.hypot(z, y); const max = (a + b) * .999; if (d > max) { z *= max / d; y *= max / d; d = max }
  const base = Math.atan2(z, -y), cosK = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), k = Math.acos(cosK);
  const thigh = -(base + k), cosKnee = clamp((a * a + b * b - d * d) / (2 * a * b), -1, 1), knee = Math.PI - Math.acos(cosKnee);
  return [thigh, knee];
}
const shadowTex = canvasTex(64, 64, (g, W, H) => { const gr = g.createRadialGradient(W / 2, H / 2, 2, W / 2, H / 2, W / 2); gr.addColorStop(0, '#3b2a1266'); gr.addColorStop(.6, '#3b2a1230'); gr.addColorStop(1, '#3b2a1200'); g.fillStyle = gr; g.fillRect(0, 0, W, H) });
function buildShoe(ankle, sh, skin) {
  const f = node(ankle, [0, -.01, .012]), c = toon(sh.c), c2 = toon(sh.c2 || sh.c);
  switch (sh.type) {
    case 'boot': mesh(G.cyl(.04, .038, .085), c, { parent: f, pos: [0, .03, -.006] }); mesh(G.sphere, c, { parent: f, pos: [0, -.008, .012], scale: [.044, .03, .06] }); mesh(G.cyl(.046, .046, .012), c2, { parent: f, pos: [0, -.032, .012], scale: [1, 1, 1.35] }); break;
    case 'sandal': mesh(G.sphere, skin, { parent: f, pos: [0, -.006, .012], scale: [.036, .024, .055] }); mesh(G.cyl(.042, .042, .012), c, { parent: f, pos: [0, -.03, .012], scale: [1, 1, 1.38] }); for (const z of [-.005, .03]) mesh(G.torus(.035, .007, 6, 18, Math.PI), c2, { parent: f, pos: [0, -.03, z], rot: [0, 0, 0], scale: [1.05, .7, 1] }); break;
    case 'sneaker': mesh(G.sphere, c, { parent: f, pos: [0, -.008, .012], scale: [.042, .032, .062] }); mesh(G.cyl(.044, .044, .016), toon(sh.sole || '#e8e0d0'), { parent: f, pos: [0, -.03, .012], scale: [1, 1, 1.42] }); if (sh.stripe) mesh(G.cyl(.043, .043, .006), toon(sh.stripe), { parent: f, pos: [0, -.012, .012], scale: [1, 1, 1.4], outline: false }); break;
    default: mesh(G.sphere, c, { parent: f, pos: [0, -.01, .012], scale: [.04, .028, .06] }); mesh(G.cyl(.042, .042, .01), c2, { parent: f, pos: [0, -.03, .012], scale: [1, 1, 1.4] }); if (sh.strap) mesh(G.torus(.035, .006, 6, 16, Math.PI), toon(sh.strap), { parent: f, pos: [0, -.018, .02], scale: [1.1, .9, 1] });
  }
}

// ---------- Animals (forward = +z, ground at y = 0) ----------
// Eyes are painted onto the head sphere like the characters' faces: glossy dark eyes (or a cat's gold ones), blush.
function animalFace({ eye = '#1c120c', iris = null, gap = 92, y = 250, size = 30, blush = '#ff9c9c', skin = '#fff', lash = false } = {}) {
  return canvasTex(1024, 512, (g, W, H) => {
    g.fillStyle = skin; g.fillRect(0, 0, W, H);
    const cx = W / 2;
    if (blush) for (const s of [-1, 1]) { const gr = g.createRadialGradient(cx + s * (gap + 20), y + 46, 2, cx + s * (gap + 20), y + 46, 30); gr.addColorStop(0, blush + 'aa'); gr.addColorStop(1, blush + '00'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx + s * (gap + 20), y + 46, 36, 22, 0, 0, TAU); g.fill() }
    for (const s of [-1, 1]) {
      const x = cx + s * gap;
      if (iris) { g.fillStyle = iris; g.beginPath(); g.ellipse(x, y, size * .9, size * 1.05, 0, 0, TAU); g.fill(); g.fillStyle = eye; g.beginPath(); g.ellipse(x, y, size * .3, size * .95, 0, 0, TAU); g.fill() }
      else { g.fillStyle = eye; g.beginPath(); g.ellipse(x, y, size * .78, size, 0, 0, TAU); g.fill() }
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - size * .28, y - size * .38, size * .3, size * .34, -.3, 0, TAU); g.fill(); g.beginPath(); g.arc(x + size * .25, y + size * .38, size * .13, 0, TAU); g.fill();
      if (lash) { g.strokeStyle = eye; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + s * size * .7, y - size * .6); g.lineTo(x + s * size * 1.1, y - size * .95); g.stroke() }
    }
  });
}
const spotTex = (base, spot, n = 9, seed = 1) => canvasTex(512, 256, (g, W, H) => { g.fillStyle = base; g.fillRect(0, 0, W, H); g.fillStyle = spot; let r = seed; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < n; i++) { const x = rnd() * W, y = 40 + rnd() * (H - 80), rx = 28 + rnd() * 34, ry = 20 + rnd() * 24; for (const dx of [-W, 0, W]) { g.beginPath(); g.ellipse(x + dx, y, rx, ry, rnd() * 3, 0, TAU); g.fill() } } });
const faceCacheA = new Map(); const aFace = (k, o) => { if (!faceCacheA.has(k)) faceCacheA.set(k, animalFace(o)); return faceCacheA.get(k) };
const headGeo = new THREE.SphereGeometry(1, 30, 20, -Math.PI / 2, TAU);

// Body shapes for animals (unit size, scaled where used). superBody: a sphere pushed toward a rounded box (p > 2),
// which reads as a solid barrel-chested farm animal instead of an egg. fluffy: one closed cloud-like mesh for wool,
// so the fleece has a single clean outline instead of a pile of separate balls.
const superBody = memo(p => {
  const g = new THREE.SphereGeometry(1, 48, 32), a = g.attributes.position;
  for (let i = 0; i < a.count; i++) { const x = a.getX(i), y = a.getY(i), z = a.getZ(i), s = Math.pow(Math.abs(x) ** p + Math.abs(y) ** p + Math.abs(z) ** p, 1 / p) || 1; a.setXYZ(i, x / s, y / s, z / s) }
  g.computeVertexNormals(); return g;
});
const fluffy = memo((n, amp, sigma, seed) => {
  const g = new THREE.SphereGeometry(1, 52, 34), a = g.attributes.position; let r = seed; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const C = Array.from({ length: n }, (_, i) => { const th = Math.acos(1 - 2 * (i + .5) / n) + (rnd() - .5) * .25, ph = i * 2.39996 + (rnd() - .5) * .4; return [Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)] });
  for (let i = 0; i < a.count; i++) { const x = a.getX(i), y = a.getY(i), z = a.getZ(i); let f = 0; for (const c of C) { const d = 1 - (x * c[0] + y * c[1] + z * c[2]); f = Math.max(f, Math.exp(-d / sigma)) } const k = 1 + amp * (f - .55); a.setXYZ(i, x * k, y * k, z * k) }
  g.computeVertexNormals(); return g;
});
// A tapered limb segment hanging down from its joint: rounded top of radius r0, rounded end of radius r1, length len.
const taper = memo((r0, r1, len) => {
  const pts = [], n = 4;
  for (let i = 0; i <= n; i++) { const a = Math.PI / 2 * i / n; pts.push(new THREE.Vector2(r1 * Math.sin(a), -len - r1 * Math.cos(a) * .9)) }
  for (let i = n; i >= 0; i--) { const a = Math.PI / 2 * i / n; pts.push(new THREE.Vector2(r0 * Math.sin(a), r0 * Math.cos(a) * .9)) }
  const g = new THREE.LatheGeometry(pts, 12); g.computeVertexNormals(); return g;
});
// A hoof: a short flared cylinder with a flat sole and a little notch line at the front.
const hoofG = memo(r => new THREE.CylinderGeometry(r * .92, r * 1.12, r * 1.05, 12));
// Round bodies for the chubby animals: a smooth sphere, so the big silhouette stays clean.
const ballG = new THREE.SphereGeometry(1, 36, 26);

// Each builder fills `a` (the Animal) with:// Each builder fills `a` (the Animal) with: body (group that bobs), torso mesh (scaled by mood), head (group), legs
// [{hip, side: -1/1, front: true/false}], tail (group), and sets kind ('quad' | 'bird'), legLen, gait {stride, rate}.
const SPECIES = {
  cow(a) {
    const white = toon('#fbf8f0'), dark = toon('#2f2a2a'), pink = toon('#f5b3ad'), horn = toon('#efe2c2');
    a.quad(.2256, [.1675, .153, .204], toon('#fff', { map: memoTex('cowspots', () => spotTex('#fbf8f0', '#2f2a2a', 10, 3)) }), { shape: superBody(2.3), legR: .032, legX: .083, legZ: .106, hoof: toon('#4a3a33'), legMat: white, hipAt: .52, upperR: 1.45 });
    mesh(G.sphere, pink, { parent: a.body, pos: [0, -.1375, -.07], scale: [.0525, .0335, .048] }); for (const x of [-.021, .021]) mesh(G.cyl(.008, .006, .021, 8), pink, { parent: a.body, pos: [x, -.165, -.07], outline: false });
    a.headAt([0, .125, .2425], .109, aFace('cow', { skin: '#fbf8f0', gap: 100, y: 236 }), white, { pivot: [0, .05, .155], r: .0525, mat: white });
    mesh(G.sphere, pink, { parent: a.head, pos: [0, -.055, .088], scale: [.082, .058, .058] }); for (const s of [-1, 1]) mesh(G.sphere, toon('#c97c74'), { parent: a.head, pos: [s * .028, -.05, .14], scale: [.011, .014, .008], outline: false });
    mesh(G.sphere, dark, { parent: a.head, pos: [-.048, .05, .07], scale: [.045, .038, .03], outline: false });
    for (const s of [-1, 1]) {
      const h = node(a.head, [s * .062, .095, -.005]); h.rotation.z = -s * .55; mesh(G.cone(.017, .055, 12), horn, { parent: h, pos: [0, .022, 0] });
      const e = node(a.head, [s * .1, .04, -.035]); e.rotation.set(0, s * .75, -s * .4); mesh(G.sphere, white, { parent: e, pos: [s * .045, 0, 0], scale: [.05, .02, .03] }); mesh(G.sphere, pink, { parent: e, pos: [s * .05, .004, 0], scale: [.034, .012, .018], outline: false }); a.ears.push(e);
    }
    a.tailAt([0, .0725, -.1975], () => { mesh(G.cap(.0085, .1), white, { parent: a.tail, pos: [0, -.055, 0] }); mesh(G.sphere, dark, { parent: a.tail, pos: [0, -.1175, 0], scale: [.02, .032, .02] }) }, .3);
    a.gait = { stride: .0675, cycle: .38 }; a.graze = true;
  },
  pig(a) {
    const pink = toon('#f7b6bc'), deep = toon('#ec97a2');
    a.quad(.1838, [.17, .152, .1937], pink, { shape: superBody(2.15), legR: .032, legX: .0826, legZ: .0938, hoof: toon('#b8636d'), shortLegs: true, hipAt: .52, upperR: 1.45 });
    a.headAt([0, .055, .1925], .11, aFace('pig', { skin: '#f7b6bc', gap: 92, y: 238, blush: '#f27f8c' }), pink);
    mesh(G.cyl(.0475, .0525, .038, 24), deep, { parent: a.head, pos: [0, -.0275, .1065], rot: [Math.PI / 2, 0, 0] }); for (const s of [-1, 1]) mesh(G.sphere, toon('#9c4552'), { parent: a.head, pos: [s * .017, -.0275, .127], scale: [.0085, .0125, .006], outline: false });
    for (const s of [-1, 1]) { const e = node(a.head, [s * .065, .0825, .0175]); e.rotation.set(.5, 0, -s * .35); mesh(G.cone(.04, .07, 12), pink, { parent: e, pos: [0, .03, 0] }); a.ears.push(e) }
    a.tailAt([0, .04, -.195], () => mesh(G.torus(.021, .0075, 8, 20, TAU * .8), deep, { parent: a.tail, pos: [0, -.02, -.01], rot: [0, Math.PI / 2, 0] }), .3);
    a.gait = { stride: .0475, cycle: .3 }; a.graze = true;
  },
  goat(a) {
    const cream = toon('#fbf3e3'), shade = toon('#efe2c8'), horn = toon('#b9a07a');
    a.quad(.2148, [.1325, .1235, .1633], cream, { shape: superBody(2.175), legR: .0225, legX: .064, legZ: .0847, hoof: toon('#5a4636'), hipAt: .52, upperR: 1.45 });
    a.headAt([0, .14, .19], .085, aFace('goat', { skin: '#fbf3e3', gap: 96, y: 238, size: 26 }), cream, { pivot: [0, .045, .115], r: .04, mat: cream });
    mesh(G.sphere, toon('#f8e6da'), { parent: a.head, pos: [0, -.045, .06], scale: [.048, .04, .045] });
    mesh(G.cone(.018, .055, 10), shade, { parent: a.head, pos: [0, -.1, .045], rot: [Math.PI + .2, 0, 0] });
    for (const s of [-1, 1]) {
      // horns sweep up and back in an arc
      const h = node(a.head, [s * .036, .07, -.01]); h.rotation.set(-.45, 0, -s * .18); mesh(taper(.014, .011, .04), horn, { parent: h, rot: [Math.PI, 0, 0] });
      const h2 = node(h, [0, .04, 0]); h2.rotation.x = -.75; mesh(taper(.011, .005, .04), horn, { parent: h2, rot: [Math.PI, 0, 0] });
      const e = node(a.head, [s * .078, .02, -.02]); e.rotation.set(0, s * .7, -s * .3); mesh(G.sphere, cream, { parent: e, pos: [s * .04, 0, 0], scale: [.045, .016, .022] }); a.ears.push(e);
    }
    a.tailAt([0, .075, -.155], () => mesh(G.cone(.016, .0475, 10), cream, { parent: a.tail, pos: [0, .02, 0] }), -.6);
    a.gait = { stride: .0675, cycle: .36 }; a.graze = true;
  },
  sheep(a) {
    const wool = toon('#fbf6ec'), face = toon('#f3dfcb'), leg = toon('#6e5a4e');
    a.quad(.2008, [.1675, .152, .1862], wool, { shape: fluffy(42, .18, .05, 11), legR: .02, legX: .0776, legZ: .0888, hoof: toon('#3e322c'), legMat: leg, upperMat: wool, hipAt: .52, upperR: 1.775 });
    a.headAt([0, .08, .195], .08, aFace('sheep', { skin: '#f3dfcb', gap: 90, y: 255, size: 27 }), face, { pivot: [0, .03, .14], r: .045, mat: wool });
    mesh(fluffy(16, .3, .07, 5), wool, { parent: a.head, pos: [0, .06, -.012], scale: [.08, .05, .07] });
    for (const s of [-1, 1]) { const e = node(a.head, [s * .074, .015, -.02]); e.rotation.set(0, s * .7, -s * .45); mesh(G.sphere, face, { parent: e, pos: [s * .04, 0, 0], scale: [.045, .017, .022] }); a.ears.push(e) }
    a.tailAt([0, .06, -.18], () => mesh(fluffy(8, .3, .1, 3), wool, { parent: a.tail, scale: .0375 }), .3);
    a.gait = { stride: .0575, cycle: .32 }; a.graze = true;
  },
  cat(a) {
    const fur = toon('#2d2932'), pink = toon('#f2a5b5');
    a.quad(.1382, [.0975, .0914, .1324], fur, { shape: ballG, legR: .021, legX: .0501, legZ: .0702, hoof: fur, paw: true, hipAt: .52, upperR: 1.45 });
    a.headAt([0, .095, .12], .0925, aFace('cat', { skin: '#2d2932', iris: '#f2c94e', gap: 96, y: 250, size: 36, blush: '#ff8fa8' }), fur);
    mesh(G.sphere, pink, { parent: a.head, pos: [0, -.012, .093], scale: [.013, .01, .008], outline: false });
    for (const s of [-1, 1]) { const e = node(a.head, [s * .055, .07, 0]); e.rotation.z = -s * .35; mesh(G.cone(.032, .06, 12), toon('#2d2932', { side: THREE.DoubleSide }), { parent: e, pos: [0, .025, 0] }); mesh(G.cone(.018, .035, 10), pink, { parent: e, pos: [0, .02, .008], outline: false }); a.ears.push(e) }
    a.tailAt([0, .03, -.13], () => { let p = a.tail; a.tailChain = []; for (let i = 0; i < 5; i++) { const s = node(p, [0, i ? .045 : 0, 0]); s.rotation.x = i ? -.25 : -.5; mesh(G.cap(.014, .03), fur, { parent: s, pos: [0, .022, 0] }); a.tailChain.push(s); p = s } }, 0);
    a.gait = { stride: .04, cycle: .27 }; a.sits = true;
  },
  dog(a) {
    const fur = toon('#2e2824'), curl = toon('#3a332e');
    a.quad(.1459, [.1025, .0963, .135], fur, { shape: ballG, legR: .024, legX: .0538, legZ: .0712, hoof: curl, paw: true, hipAt: .52, upperR: 1.45 });
    a.headAt([0, .095, .1225], .0925, aFace('dog', { skin: '#2e2824', gap: 92, y: 242, size: 30, eye: '#120c08' }), fur);
    mesh(G.sphere, curl, { parent: a.head, pos: [0, -.03, .075], scale: [.05, .04, .045] }); mesh(G.sphere, toon('#141010'), { parent: a.head, pos: [0, -.012, .118], scale: [.018, .014, .012], outline: false });
    a.tongue = mesh(G.sphere, toon('#f08a96'), { parent: a.head, pos: [0, -.075, .085], scale: [.016, .022, .01], outline: false });
    mesh(G.torus(.065, .012, 8, 24), toon('#c9443a'), { parent: a.head, pos: [0, -.085, -.01], rot: [Math.PI / 2 - .2, 0, 0] }); mesh(G.sphere, toon('#f2c25b'), { parent: a.head, pos: [0, -.105, .06], scale: .014 });
    for (const s of [-1, 1]) { const e = node(a.head, [s * .085, .03, 0]); e.rotation.z = s * .25; mesh(G.sphere, curl, { parent: e, pos: [0, -.045, 0], scale: [.025, .055, .02] }); a.ears.push(e) }
    a.tailAt([0, .055, -.1275], () => mesh(G.cap(.017, .0375), curl, { parent: a.tail, pos: [0, .03, 0] }), -.6);
    a.gait = { stride: .04, cycle: .27 }; a.sits = true; a.wags = true;
  },
  lion(a) {
    const gold = toon('#f4c25a'), mane = toon('#e8892e'), cream = toon('#fbe2b0');
    a.quad(.1611, [.1175, .1106, .1554], gold, { shape: ballG, legR: .029, legX: .0609, legZ: .0804, hoof: cream, paw: true, hipAt: .52, upperR: 1.45 });
    a.headAt([0, .1, .1425], .0975, aFace('lion', { skin: '#f4c25a', gap: 90, y: 246, size: 30, eye: '#3a2414' }), gold);
    // mane: tufts on a shell round the back and sides of the head, leaving the face clear
    for (let i = 0; i < 34; i++) { const th = Math.acos(1 - 2 * (i + .5) / 34), ph = i * 2.39996, d = [Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)]; if (d[2] > .55) continue; mesh(G.sphereLo, mane, { parent: a.head, pos: [d[0] * .115, d[1] * .115, d[2] * .1 - .02], scale: .052 }) }
    mesh(G.sphere, cream, { parent: a.head, pos: [0, -.035, .08], scale: [.055, .04, .04] }); mesh(G.sphere, toon('#8a4a2a'), { parent: a.head, pos: [0, -.015, .118], scale: [.016, .011, .008], outline: false });
    for (const s of [-1, 1]) { const e = node(a.head, [s * .075, .075, 0]); mesh(G.sphere, gold, { parent: e, scale: [.028, .028, .015] }); a.ears.push(e) }
    a.tailAt([0, .04, -.1525], () => { mesh(G.cap(.012, .12), gold, { parent: a.tail, pos: [0, -.06, -.02], rot: [.4, 0, 0] }); mesh(G.sphere, mane, { parent: a.tail, pos: [0, -.13, -.05], scale: [.028, .035, .028] }) }, .7);
    a.gait = { stride: .0475, cycle: .3 };
  },
  chicken(a) {
    const white = toon('#fffaf0'), red = toon('#e5483d'), beak = toon('#f0a030');
    a.bird(.155, [.11, .105, .1225], white, { legLen: .085, legMat: beak, legX: .0375 });
    a.headAt([0, .1, .0675], .068, aFace('chicken', { skin: '#fffaf0', gap: 120, y: 236, size: 22, blush: '#ff9c9c' }), white);
    for (let i = 0; i < 3; i++) mesh(G.sphere, red, { parent: a.head, pos: [0, .07 + (i === 1 ? .01 : 0), .02 - i * .025], scale: [.012, .022, .016] });
    mesh(G.cone(.022, .045, 12), beak, { parent: a.head, pos: [0, -.005, .085], rot: [Math.PI / 2, 0, 0] }); mesh(G.sphere, red, { parent: a.head, pos: [0, -.04, .06], scale: [.012, .02, .01] });
    for (const s of [-1, 1]) { const w = node(a.body, [s * .1035, .01, -.005]); w.rotation.y = s * .125; mesh(G.sphere, toon('#f4ecdc'), { parent: w, pos: [0, 0, -.0175], scale: [.0205, .051, .07] }); a.wings.push(w) }
    a.tailAt([0, .055, -.1075], () => { for (const [x, r] of [[-.02, .4], [.02, -.4], [0, 0]]) mesh(G.sphere, white, { parent: a.tail, pos: [x, .04, -.01], rot: [-.6, 0, r], scale: [.02, .06, .015] }) }, 0);
    a.gait = { stride: .09, cycle: .2 }; a.peck = true; a.bob = true;
  },
  duck(a) {
    const yel = toon('#fff2b3'), bill = toon('#f39a36');
    a.bird(.125, [.1075, .095, .1325], yel, { legLen: .06, legMat: bill, legX: .0425, web: true });
    a.headAt([0, .11, .0875], .066, aFace('duck', { skin: '#fff2b3', gap: 118, y: 236, size: 22 }), yel);
    mesh(G.sphere, bill, { parent: a.head, pos: [0, -.015, .075], scale: [.035, .012, .04] });
    for (const s of [-1, 1]) { const w = node(a.body, [s * .101, .01, -.005]); w.rotation.y = s * .125; mesh(G.sphere, toon('#fbe8a0'), { parent: w, pos: [0, 0, -.0175], scale: [.0205, .0475, .0725] }); a.wings.push(w) }
    a.tailAt([0, .045, -.1325], () => mesh(G.cone(.03, .05, 10), yel, { parent: a.tail, rot: [-1.9, 0, 0] }), 0);
    a.gait = { stride: .08, cycle: .22 }; a.waddle = true;
  },
  pigeon(a) {
    const grey = toon('#a3a9b8'), dark = toon('#7b8192');
    a.bird(.1075, [.0825, .0775, .1025], grey, { legLen: .05, legMat: toon('#e07c7c'), legX: .031 });
    mesh(G.sphere, toon('#6fae8c'), { parent: a.body, pos: [0, .05, .0625], scale: [.05, .04, .04] }); mesh(G.sphere, toon('#9a6fb8'), { parent: a.body, pos: [0, .035, .0775], scale: [.04, .03, .03], outline: false });
    a.headAt([0, .0975, .07], .0525, aFace('pigeon', { skin: '#9aa3b8', iris: '#e8963a', gap: 120, y: 236, size: 22, blush: null }), toon('#9aa3b8'));
    mesh(G.cone(.012, .035, 10), toon('#3f4350'), { parent: a.head, pos: [0, -.008, .07], rot: [Math.PI / 2, 0, 0] });
    for (const s of [-1, 1]) { const w = node(a.body, [s * .077, .01, -.005]); w.rotation.y = s * .125; mesh(G.sphere, dark, { parent: w, pos: [0, 0, -.0175], scale: [.017, .0405, .06] }); a.wings.push(w) }
    a.tailAt([0, .02, -.095], () => mesh(G.sphere, dark, { parent: a.tail, pos: [0, 0, -.04], scale: [.035, .01, .05] }), 0);
    a.gait = { stride: .07, cycle: .17 }; a.bob = true; a.peck = true;
  },
};
// species key for the painted pictures the game refers to (the 'buffalo' herd is raised as pigs)
const SPECIES_OF = { 'pens/cow-animal.png': 'cow', 'pens/buffalo-animal.png': 'pig', 'pens/goat-animal.png': 'goat', 'pens/sheep-animal.png': 'sheep', 'pens/chicken-animal.png': 'chicken', 'pens/duck-animal.png': 'duck', 'pets/black-cat.png': 'cat', 'pets/black-dog.png': 'dog', 'pets/lion.png': 'lion', 'pets/pigeon.png': 'pigeon' };
const PLUMP = { hungry: -1, fed: 1, ready: 1 };
class Animal {
  constructor(view, kind, { mood = '' } = {}) {
    this.view = view; this.kind = kind; this.mood = mood; this.root = node(view.root); this.ears = []; this.wings = []; this.legs = [];
    this.st = { phase: Math.random(), w: 0, t: Math.random() * 20, yaw: (Math.random() < .5 ? -1 : 1) * (.6 + Math.random() * .6), yawTo: null, act: null, actAt: 1 + Math.random() * 4, blinkAt: 2 + Math.random() * 3, plump: PLUMP[mood] || 0, sit: 0, tail: { x: 0, v: 0 }, head: { x: 0, v: 0 } };
    this.st.yawTo = this.st.yaw;
    const sh = new THREE.Mesh(discG, shadowMat()); sh.rotation.x = -Math.PI / 2; sh.position.y = .002; this.root.add(sh); this.shadow = sh;
    this.body = node(this.root); SPECIES[kind](this);
    this.shadow.scale.set(this.size[0] * 1.5, this.size[2] * 1.25, 1);
    view.dirty = true;
  }
  // builders
  // Four legs, each a thigh and a shin (tapered, meeting at a knee / hock) ending in a hoof or a paw. Front knees fold
  // backward and hind hocks forward, like the real animals; the feet are placed on the ground every frame (IK).
  quad(h, [rx, ry, rz], mat, { shape, legR, legX, legZ, hoof, legMat, paw, upperMat, upperR = 1.55, shortLegs, hipAt = .3 }) {
    this.kindOf = 'quad'; this.h = h; this.size = [rx, ry, rz]; this.body.position.y = h;
    this.torso = mesh(shape || G.sphere, mat, { parent: this.body, scale: [rx, ry, rz] });
    const hipY = -ry * hipAt, L = h + hipY, foot = paw ? legR * .7 : legR * 1.05;
    for (const [sx, sz, front] of [[-1, 1, true], [1, 1, true], [-1, -1, false], [1, -1, false]]) {
      const reach = L - foot, k = front ? 1.008 : 1.035, a = reach * (front ? .5 : .52) * k, b = reach * (front ? .5 : .48) * k;
      const hip = node(this.body, [sx * legX, hipY, sz * legZ]);
      mesh(taper(legR * upperR, legR * 1.08, a), upperMat || legMat || mat, { parent: hip });
      const knee = node(hip, [0, -a, 0]); mesh(taper(legR * 1.02, legR * .9, b), legMat || mat, { parent: knee });
      const ankle = node(knee, [0, -b, 0]);
      if (paw) mesh(G.sphere, hoof, { parent: ankle, pos: [0, -foot * .3, legR * .35], scale: [legR * 1.2, foot, legR * 1.5] });
      else { mesh(hoofG(legR), hoof, { parent: ankle, pos: [0, -foot * .5, 0] }); mesh(G.box(legR * .18, foot * .8, legR * .5), toon('#2a201c'), { parent: ankle, pos: [0, -foot * .5, legR * .95], outline: false }) }
      this.legs.push({ hip, knee, ankle, side: sx, front, a, b, foot, local: new THREE.Vector3(sx * legX, hipY, sz * legZ) });
    }
  }
  bird(h, [rx, ry, rz], mat, { legLen, legMat, legX, web }) {
    this.kindOf = 'bird'; this.h = h; this.size = [rx, ry, rz]; this.body.position.y = h;
    this.torso = mesh(ballG, mat, { parent: this.body, scale: [rx, ry, rz] });
    for (const sx of [-1, 1]) {
      const hip = node(this.body, [sx * legX, -ry * .7, .01]);
      const l = h - ry * .7;
      mesh(G.cyl(.008, .008, l, 8), legMat, { parent: hip, pos: [0, -l / 2, 0] });
      const foot = node(hip, [0, -l + .004, 0]);
      if (web) mesh(G.sphere, legMat, { parent: foot, pos: [0, 0, .02], scale: [.025, .006, .03] });
      else for (const r of [-.5, 0, .5]) mesh(G.cyl(.005, .005, .035, 6), legMat, { parent: foot, pos: [Math.sin(r) * .015, 0, Math.cos(r) * .015], rot: [Math.PI / 2, r, 0], outline: false });
      this.legs.push({ hip, side: sx, front: sx < 0 });
    }
  }
  // Head on a neck: with `neck` the head hangs from a pivot at the top of the chest through a thick neck, so lowering the
  // neck brings the head down to graze; without it the head sits right on the body (birds, chibi pets).
  headAt(pos, r, face, mat, neck) {
    if (neck) {
      this.neck = node(this.body, neck.pivot); const off = new THREE.Vector3(pos[0] - neck.pivot[0], pos[1] - neck.pivot[1], pos[2] - neck.pivot[2]);
      const nm = mesh(G.cap(neck.r, Math.max(.001, off.length() - neck.r)), neck.mat, { parent: this.neck }); nm.position.copy(off).multiplyScalar(.5); nm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), off.clone().normalize());
      this.head = node(this.neck, [off.x, off.y, off.z]); this.hasNeck = true;
    } else { this.neck = node(this.body, pos); this.head = node(this.neck) }
    this.headMesh = mesh(headGeo, toon('#fff', { map: face }), { parent: this.head, scale: r });
    this.headR = r;
  }
  tailAt(pos, build, lift) { this.tail = node(this.body, pos); this.tail.rotation.x = -lift; build() }
  steer(vx, vy) { if (Math.hypot(vx, vy) > 1e-3) this.st.yawTo = Math.atan2(vx, vy) }
  face(dir) { this.steer(dir, .25) }
  act(type, dur) { this.st.act = { type, u: 0, dur } }
  // speed in model units / s; idle lets it graze, peck, look around, sit; plump -1 (thin) … 1 (round)
  update(dt, { speed = 0, idle = true, plump } = {}) {
    const st = this.st, gt = this.gait; dt = Math.min(dt, 1 / 20); st.t += dt;
    const moving = speed > .02; st.w = approach(st.w, moving ? 1 : 0, moving ? 9 : 6, dt);
    const prev = st.phase; st.phase = (st.phase + speed * dt / gt.cycle) % 1;
    if (this.fixedYaw !== undefined && st.w < .1) st.yawTo = this.fixedYaw + (st.act?.type === 'look' ? 0 : 0);
    st.yaw += angleTo(st.yaw, st.yawTo) * (1 - Math.exp(-7 * dt)); this.root.rotation.y = st.yaw;
    st.plump = plump !== undefined ? plump : approach(st.plump, PLUMP[this.mood] || 0, 3, dt);
    const w = st.w, p = st.phase * TAU, idleW = 1 - w;
    // idle acts
    if (st.act) { st.act.u += dt / st.act.dur; if (st.act.u >= 1 || w > .3) st.act = null }
    else if (idle && w < .1) { st.actAt -= dt; if (st.actAt <= 0) { const r = Math.random(); if (this.sits && r < .35) this.act('sit', 3 + Math.random() * 4); else if (this.graze && r < .6) this.act('graze', 2 + Math.random() * 2.5); else if (this.peck && r < .65) this.act('peck', 1 + Math.random() * .8); else this.act('look', 1.4 + Math.random()); st.actAt = 1.5 + Math.random() * 4 } }
    const A = st.act, au = A ? A.u : 0, aw = A ? Math.min(1, Math.min(au, 1 - au) * 5) : 0;
    st.sit = approach(st.sit, A?.type === 'sit' ? 1 : 0, 4, dt);
    // mood: slimmer when hungry, plumped up when fed; the belly squashes on every footfall, stretches as it lifts,
    // and wobbles a little while it breathes
    const [rx, ry, rz] = this.size, pl = st.plump, wob = Math.sin(st.t * 2.6) * .009 * idleW + Math.sin(st.t * 7.3) * .003 * idleW, sq = w * .028 * Math.cos(p * 4);
    this.torso.scale.set(rx * (1 + pl * (pl < 0 ? .1 : .16)) * (1 + sq * .6 - wob * .5), ry * (1 + pl * (pl < 0 ? .08 : .13)) * (1 - sq + wob), rz * (1 + pl * (pl < 0 ? .03 : .075)) * (1 + sq * .6 - wob * .5));
    let headX = 0, headY = 0, headZ = 0;
    if (this.kindOf === 'quad') {
      // walk: left hind, left fore, right hind, right fore, a quarter cycle apart; the body rides level with a gentle bob
      const drop = st.sit * this.h * .28, pitch = -st.sit * .42 + w * .025 * Math.sin(p * 2);
      this.body.position.y = this.h + w * .009 * Math.abs(Math.sin(p * 2)) - drop; this.body.rotation.x = pitch; this.body.rotation.z = w * .035 * Math.sin(p);
      const stride = gt.stride * w, cp = Math.cos(pitch), sp = Math.sin(pitch);
      for (const L of this.legs) {
        const o = L.front ? (L.side < 0 ? .25 : .75) : (L.side < 0 ? 0 : .5), ph = p + o * TAU, f = Math.cos(ph), swing = Math.sin(ph) < 0, lift = swing ? Math.sin(-Math.sin(ph) * Math.PI / 2) : 0;
        // hip in world height (body pitched about its centre), foot target on the ground under it, moved by the stride
        const hy = this.body.position.y + L.local.y * cp + L.local.z * sp, hz = L.local.z * cp - L.local.y * sp;
        let fy = -hy + L.foot + lift * (L.front ? .045 : .04) * w, fz = f * stride;
        if (st.sit && !L.front) { fz = lerp(fz, .55 * (L.a + L.b), st.sit); fy = lerp(fy, -hy + L.foot * 1.2, st.sit) }
        if (st.sit && L.front) fz = lerp(fz, -.1 * (L.a + L.b) * st.sit + hz * 0, st.sit);
        // into the body's frame (undo the pitch), then two-bone IK; hind legs bend the other way
        const ly = fy * cp + fz * sp, lz = fz * cp - fy * sp;
        if (L.front) { const [a1, a2] = ik2(lz, ly, L.a, L.b); L.hip.rotation.x = a1; L.knee.rotation.x = a2 }
        else { const [a1, a2] = ik2(-lz, ly, L.a, L.b); L.hip.rotation.x = -a1; L.knee.rotation.x = -a2 }
        L.ankle.rotation.x = -(L.hip.rotation.x + L.knee.rotation.x) - pitch + (swing ? (L.front ? .45 : -.2) * lift : 0);
      }
      headX = w * .05 * Math.sin(p * 2) + (A?.type === 'graze' ? 1.15 * aw : 0) + (A?.type === 'sit' ? .25 * st.sit : 0) + (this.mood === 'hungry' ? .12 * idleW : 0);
      headY = A?.type === 'look' ? (Math.sin(au * TAU) * .6) * aw : 0;
    } else {
      this.legs.forEach((L, i) => { const ph = p + (i ? Math.PI : 0); L.hip.rotation.x = w * .55 * Math.sin(ph); L.hip.position.y = -this.size[1] * .7 + w * .01 * Math.max(0, Math.cos(ph)) });
      this.body.position.y = this.h + w * .011 * Math.abs(Math.sin(p));
      this.body.rotation.z = this.waddle ? w * .12 * Math.sin(p) : w * .04 * Math.sin(p);
      if (this.bob) { const u = (st.phase * 2) % 1; headZ = w * (u < .65 ? .025 - .05 * u / .65 : -.025 + .05 * (u - .65) / .35) }
      if (A?.type === 'peck') { const k = Math.max(0, Math.sin(Math.PI * ((au * 3) % 1))) * aw; headX = 1.1 * k; headZ = .03 * k }
      headY = A?.type === 'look' ? Math.sin(au * TAU) * .7 * aw : 0;
      this.wings.forEach((wg, i) => wg.rotation.z = (i ? -1 : 1) * (A?.type === 'look' && this.kind === 'chicken' ? .5 * Math.max(0, Math.sin(au * TAU * 4)) * aw : w * .1 * Math.sin(p * 2)));
    }
    const hb = spring(st.head, headX, 30, 8, dt);
    if (this.hasNeck) { this.neck.rotation.x = hb; this.head.rotation.set(-hb * .35, headY + idleW * .15 * Math.sin(st.t * .6), idleW * .06 * Math.sin(st.t * .9)) }
    else { this.head.rotation.set(hb, headY + idleW * .15 * Math.sin(st.t * .6), idleW * .06 * Math.sin(st.t * .9)); this.head.position.z = headZ }
    // ears flick now and then, tails swish / wag
    const flick = Math.sin(st.t * 1.3) > .95 ? Math.sin(st.t * 30) * .3 : 0; this.ears.forEach((e, i) => e.rotation.x = flick * (i ? 1 : -1));
    if (this.tail) { const tw = this.wags ? Math.sin(st.t * (w > .5 ? 16 : 11)) * .6 : spring(st.tail, Math.sin(st.t * 1.7) * .35 + w * .2 * Math.sin(p * 2), 20, 5, dt); this.tail.rotation.y = tw }
    if (this.tailChain) this.tailChain.forEach((s, i) => s.rotation.z = Math.sin(st.t * 1.6 - i * .5) * .18);
    if (this.tongue) this.tongue.visible = w > .3 || Math.sin(st.t * .4) > 0;
    // blink: squash the eyes by scaling the head texture's eye rows is overkill — a quick vertical squeeze reads as a blink
    st.blinkAt -= dt; if (st.blinkAt <= 0) { st.blinkT = 0; st.blinkAt = 2 + Math.random() * 4 }
    if (st.blinkT !== undefined) { st.blinkT += dt; if (st.blinkT > .12) delete st.blinkT }
    this.headMesh.scale.set(this.headR, this.headR * (st.blinkT !== undefined ? .93 : 1), this.headR);
    this.view.dirty = true;
    return Math.floor(prev * 2) !== Math.floor(st.phase * 2) && moving;
  }
}

// ---------- Still pictures (wardrobe, shoe shop, hair salon, profile picker, pet shop, lake, card table) ----------
// Any element with data-c3d gets a 3D view of what it describes and its painted picture is hidden:
//   char:<gender>:<outfit>:<hair>:<shoe>[:<pose>]   (pose: 'seat' frames head and shoulders, 'fish' sits with a rod)
//   animal:<kind>
// Visible ones keep breathing, blinking and looking around.
const FIT = { cow: .62, pig: .5, goat: .62, sheep: .55, chicken: .42, duck: .38, cat: .42, dog: .42, lion: .5, pigeon: .32 };
const previews = new Map();
function mountPreview(el) {
  const spec = el.dataset.c3d, cur = previews.get(el); if (cur && cur.spec === spec) return; if (cur) cur.view.dispose();
  const [type, ...a] = spec.split(':'); let view, model;
  try {
    if (type === 'char') {
      const pose = a[4] || '', seat = pose === 'seat', fish = pose === 'fish';
      view = new View(el, seat ? { zoom: .6, center: [0, .74], pitch: .2 } : fish ? { left: -.25, top: -.2, width: 1.9, height: 1.4, zoom: 1.5, center: [.4, .5], pitch: .3 } : { left: -.08, top: -.06, width: 1.16, height: 1.1, zoom: 1.24, center: [0, .54] });
      model = new Character(view, { gender: a[0], outfit: a[1], hair: a[2], shoe: a[3] }); model.fixedYaw = fish ? .9 : seat ? .15 : .35; model.st.yaw = model.fixedYaw; if (fish) model.setPose('fish');
    } else if (type === 'animal' && SPECIES[a[0]]) {
      const fit = (FIT[a[0]] || .5) * 1.25; view = new View(el, { left: -.1, top: -.1, width: 1.2, height: 1.2, zoom: fit * 1.2, center: [0, fit * .5] });
      model = new Animal(view, a[0]); model.st.yaw = model.st.yawTo = .65; model.fixedYaw = .65;
    } else return;
  } catch (e) { console.warn('3D preview failed', spec, e); return }
  model.update(1 / 60, {}); el.classList.add('c3d-on'); previews.set(el, { spec, view, model });
}
let scanQueued = false;
const scanPreviews = () => { scanQueued = false; document.querySelectorAll('[data-c3d]').forEach(mountPreview) };
new MutationObserver(() => { if (!scanQueued) { scanQueued = true; requestAnimationFrame(scanPreviews) } }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-c3d'] });

// ---------- Frame loop: render views that changed and are on screen ----------
// Views are rendered when something in them moved and they are on screen. If a frame's 3D work runs long (slow phones,
// a barn full of animals), the rest of the dirty views wait for the next frames, oldest first, so the game stays smooth.
// While the player walks the loop runs on every display frame so the walk stays at ~30 fps; otherwise it ticks slowly.
// On phones at most a few background views (herd animals) are drawn per frame, so a full barn never stalls the page.
let measureAt = 0, budget = PHONE ? 3 : 5, frameTimer = null, frameReq = null, renderMs = 0, gapMs = 33, lastFrame = 0, slowFor = 0, fastFor = 0;
// Quality levels: 3D resolution, how often background views redraw, how many of them per frame.
const LEVELS = [{ scale: 1, interval: 1, perFrame: 1 }, { scale: .8, interval: 1.4, perFrame: .75 }, { scale: .62, interval: 2, perFrame: .5 }];
const QUALITY = { level: 0, scale: 1, interval: 1, perFrame: 1 };
function setQuality(l) { Object.assign(QUALITY, LEVELS[l], { level: l }); const root = document.documentElement; if (root) root.dataset.w3dQuality = l }
setQuality(WEAK && PHONE ? 1 : 0);
const playerActive = () => { for (const v of views) if (v.priority && v.active && !v.suspended) return true; return false };
function scheduleFrame(){
  if(document.hidden||frameTimer!==null||frameReq!==null)return;
  if(playerActive()){frameReq=requestAnimationFrame(t=>{frameReq=null;frame(t)});return}
  frameTimer=setTimeout(()=>{frameTimer=null;frameReq=requestAnimationFrame(t=>{frameReq=null;frame(t)})},PHONE?50:33);
}
// Adapt the quality to the device: while the player walks the loop runs every display frame, so the gap between frames
// and the time a 3D view takes to draw (the copy waits for the GPU) show whether the device keeps up. A couple of seconds
// of late frames steps the quality down; a long smooth stretch steps it back up.
function adaptQuality(now, active) {
  const gap = now - lastFrame; lastFrame = now;
  if (!active || gap > 250) return;
  gapMs = gapMs * .9 + gap * .1;
  const slow = gapMs > 42 || renderMs > 9, fast = gapMs < 24 && renderMs < 3.5;
  slowFor = slow ? slowFor + gap : 0; fastFor = fast ? fastFor + gap : 0;
  if (slowFor > 1800 && QUALITY.level < LEVELS.length - 1) { setQuality(QUALITY.level + 1); slowFor = fastFor = 0; measureAt = 0 }
  else if (fastFor > 8000 && QUALITY.level > 0 && !(WEAK && PHONE && QUALITY.level <= 1)) { setQuality(QUALITY.level - 1); slowFor = fastFor = 0; measureAt = 0 }
}
function frame(now) {
  if(document.hidden)return;
  const active = playerActive(); adaptQuality(now, active);
  if (now - measureAt > 500) { measureAt = now; for (const v of views) { if (!v.canvas.isConnected) { v.dispose(); continue } v.measure() } for (const [el, p] of previews) if (!el.isConnected) { p.view.dispose(); previews.delete(el) } }
  const previewInterval=(PHONE?150:100)*QUALITY.interval, perFrame = Math.max(1, Math.round((PHONE ? 4 : 99) * QUALITY.perFrame));
  for (const p of previews.values()) if (p.view.visible && now-(p.updatedAt||0)>=previewInterval) {p.model.update(Math.min(.12,(now-(p.updatedAt||now-previewInterval))/1000), p.walkUntil>now?{speed:.45}:{});p.updatedAt=now}
  const t0 = performance.now(), queue = [...views].filter(v => v.visible && !v.suspended && (v.dirty || v.live) && now-(v.renderedAt||0)>=(v.priority&&v.active?28:previewInterval)).sort((a, b) => (b.priority || 0) - (a.priority || 0) || (a.renderedAt || 0) - (b.renderedAt || 0));
  let drawn = 0;
  for (const v of queue) { if (!v.priority && (performance.now() - t0 > budget || drawn >= perFrame)) break; v.render(); v.renderedAt = now; if (!v.priority) drawn++ }
  scheduleFrame();
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(frameTimer);frameTimer=null;if(frameReq!==null)cancelAnimationFrame(frameReq);frameReq=null}else{measureAt=0;scheduleFrame()}});
window.addEventListener('resize',()=>{measureAt=0});
window.addEventListener('scroll',()=>{measureAt=0},{passive:true,capture:true});

const World3D = renderer ? { QUALITY, setQuality, THREE, View, Character, Animal, SPECIES_OF, outfitSpec, views, walkPreview:(el,x,y)=>{const p=previews.get(el);if(p){p.walkUntil=performance.now()+900;p.model.steer?.(x,y)}}, render: v => v.render(), measure: v => v.measure() } : null;
if (World3D) { window.World3D = World3D; requestAnimationFrame(frame); window.dispatchEvent(new Event('world3d-ready')) }
export default World3D;
