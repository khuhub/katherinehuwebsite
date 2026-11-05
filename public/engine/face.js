'use strict';
// ------------------------------------------------------------------
// Katherine's face, traced from her own chibi drawing (docs/ref/vibe-chibi.jpg,
// shapes in chibi-data.js from hero-film/trace.py) and redrawn with the engine:
// soft pencil fills, big round eyes with the pupil against the upper lid, short
// lashes, thin brows, blush, freckles, a tiny nose and mouth, near-black hair with
// a smooth edge and even strand texture. Only the head. Pink paper around it.
// Every part is points, so it can be redrawn: blink, glance, hair sway.
//
// Loads after core.js, studio.js, cels.js and chibi-data.js (classic scripts).
// Exposes window.HeroFace = { build, makeRenderer }.
//   build()  reads the engine's current format (W, H, CX...) and returns the drawing
//            functions for it: face(c, {open, gx, gy}), hair(c, phase), sparkles(c, t, d),
//            lids(c, k), plus DRAWINGS / SHEET / drawingAt, EYES.
//   makeRenderer(canvas) wraps that for the website: sizes the engine to the viewport,
//            caches the drawings, and draws idle / blink / open frames.
// ------------------------------------------------------------------
window.HeroFace = (() => {

const BG = '#f0c3b8';
const SKIN = '#f9c9ad', SKIN_LINE = '#8a4e3e', LID = '#eeb79c';
const INK = '#1a1212', EYE_WHITE = '#fdfaf6', PUPIL = '#120d0d';
const HAIR_BASE = '#1a1414', HAIR_S1 = '#272020', HAIR_S2 = '#352a29', HAIR_S3 = '#473938';
const FRECKLE = '#b0604e';

const P2 = (pts, corner = 1.2) => { const p = new Path2D(); const s = smoothPts(pts, true, 4, corner); s.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; };
const bbox = pts => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; };

// smoothLoop: a traced outline made calm — resample evenly, moving average, Chaikin corner cutting.
function resampleLoop(pts, step = 10) {
  const out = []; let carry = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let d = carry; while (d < L) { const t = d / L; out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]); d += step; } carry = d - L; }
  return out;
}
function smoothLoop(pts, win = 2, passes = 2) {
  pts = resampleLoop(pts, 10);
  const wf = typeof win === 'function' ? win : () => win;
  const n = pts.length; let out = pts.map((p, i) => { const w = wf(p); let x = 0, y = 0; for (let k = -w; k <= w; k++) { const q = pts[((i + k) % n + n) % n]; x += q[0]; y += q[1]; } return [x / (2 * w + 1), y / (2 * w + 1)]; });
  for (let p = 0; p < passes; p++) { const nx = []; for (let i = 0; i < out.length; i++) { const a = out[i], b = out[(i + 1) % out.length]; nx.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } out = nx; }
  return out;
}
function star4(c, x, y, r, rot = 0) { c.beginPath(); for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, rr = i % 2 ? r * .28 : r; i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }

// Exposure sheet for the idle loop: hold, blink, hold, glance, hold, blink. 24 fps.
const DRAWINGS = { open: { open: 1 }, openL: { open: 1, gx: -22, gy: 8 }, half: { open: .45 }, closed: { open: 0 }, halfUp: { open: .55 } };
for (const o of [.8, .6, .4, .2]) DRAWINGS['bl' + o] = { open: o };   // the blink-out steps
const SHEET = [['open', 40], ['half', 2], ['closed', 2], ['halfUp', 2], ['open', 30], ['openL', 22], ['open', 26], ['half', 2], ['closed', 3], ['halfUp', 2], ['open', 24]];
const NFRAMES = SHEET.reduce((a, [, n]) => a + n, 0);
function drawingAt(frame) { let f = frame; for (const [id, n] of SHEET) { if (f < n) return id; f -= n; } return SHEET[SHEET.length - 1][0]; }
const blinkId = k => { const o = Math.round((1 - k) * 5) / 5; return o >= 1 ? 'open' : o <= 0 ? 'closed' : 'bl' + o; };

// ---- build the drawing for the engine's current format ------------------
// build({ scale, cx, cy }): a small, free-standing head (chin centre at cx,cy, `scale` frame units per image pixel)
// instead of the frame-filling hero framing. Used by body.js for chibi-her.
function build(opt = {}) {
  // Framing. Landscape: the head fills the height, chin at the bottom edge. Portrait: the
  // whole head fits the width, centred vertically, pink above and below.
  const PORTRAIT = W < H;
  const SMALL = opt.scale !== undefined;
  // small heads are built at the full working scale (smoothing is tuned there) and scaled down when drawn
  const SC = SMALL ? 3.3 : PORTRAIT ? (W * .98) / 473 : 3.05, OX = 368, OY = SMALL ? 439 : PORTRAIT ? 346 - (H / 2) / SC : 68;
  const K = SC / 3.3, SS = SMALL ? opt.scale / 3.3 : 1;
  const T = SMALL ? (p => [(p[0] - OX) * SC, (p[1] - OY) * SC]) : (p => [CX + (p[0] - OX) * SC, (p[1] - OY) * SC]);
  const TT = pts => pts.map(T);

  // traced shapes, in frame units
  const HEAD_C = T([368, 330]);
  const HAIR_PTS0 = smoothLoop(TT(CHIBI.hair), p => Math.round(13 + 11 * clamp((Math.hypot(p[0] - HEAD_C[0], (p[1] - HEAD_C[1]) * .85) / K - 470) / 180, 0, 1)), 3);
  const PARTX = T([412, 0])[0];
  const HAIR_PTS = smoothLoop(HAIR_PTS0.map(([x, y]) => { const near = Math.hypot(x - HEAD_C[0], (y - HEAD_C[1]) * .85) < 560 * K, k = Math.max(0, 1 - Math.abs(x - PARTX) / (170 * K)); return near && y < HEAD_C[1] - 250 * K ? [x, y + 95 * K * k * k] : [x, y]; }), 7, 1);
  const FACE_PTS = (() => { const p = smoothLoop(TT(CHIBI.face), 3, 2); const cx = p.reduce((a, q) => a + q[0], 0) / p.length, cy = p.reduce((a, q) => a + q[1], 0) / p.length; return p.map(([x, y]) => [cx + (x - cx) * 1.018, cy + (y - cy) * 1.018]); })();
  const EYES = CHIBI.whites.map((w, i) => {
    const pts = smoothLoop(TT(w), 3, 2), [x0, y0, x1, y1] = bbox(pts), pu = CHIBI.pupils[i], pc = T([pu.cx, pu.cy]);
    const side = pc[0] < CX ? -1 : 1;
    return { pts, box: [x0, y0, x1, y1], pc, pr: Math.min(pu.r * SC * 1.12, (y1 - y0) * .46), side };
  });
  const NOSE = T([340, 347]), MOUTH = T([342, 400]);
  const BLUSHES = [T([262, 372]), T([452, 380])];
  const pupilAt = (e, gx, gy) => { const [x0, y0, x1, y1] = e.box, h = y1 - y0; return [(x0 + x1) / 2 + gx, Math.max(y0 + e.pr * .98, (y0 + y1) / 2 - h * .04) + gy]; };

  // ---- hair ----
  // sway(p, phase, k): lower points move more; the crown and the hairline stay put.
  function sway(p, phase, k) {
    if (SMALL) return p;
    const t = clamp((p[1] - H * .39) / (H * .83), 0, 1), d = t * t;
    const a = (Math.sin(TAU * phase + k * .9) * 22 * d + Math.sin(TAU * phase * 2 + k * 1.7) * 6 * d) * K;
    return [p[0] + a, p[1] + Math.sin(TAU * phase + k * .6) * 4 * d * K];
  }
  const HAIR_STROKES = (() => {
    const s = [], r = rng(7), part = T([392, 150]);
    for (const side of [-1, 1]) for (let i = 0; i < 70; i++) {
      const u = r(), j = () => (r() - .5);
      const pts = [
        [part[0] + side * (10 + u * 90) * K + j() * 30, part[1] + (-60 + j() * 20) * K],
        [part[0] + side * (160 + u * 320) * K + j() * 50, part[1] + (60 + u * 160 + j() * 40) * K],
        [part[0] + side * (340 + u * 300) * K + j() * 60, part[1] + (420 + u * 260 + j() * 50) * K],
        [part[0] + side * (380 + u * 300) * K + j() * 70, part[1] + (900 + u * 300 + j() * 60) * K],
        [part[0] + side * (360 + u * 320) * K + j() * 80, part[1] + 1500 * K],
      ];
      const t = r(), color = t < .5 ? HAIR_S1 : t < .85 ? HAIR_S2 : HAIR_S3;
      s.push({ pts, w: (7 + r() * 10) * K, color, al: .16 + r() * .16, seed: 2000 + i + (side + 1) * 300 });
    }
    const cen = T([368, 330]);
    for (let i = 0; i < 170; i++) {
      const rad = (330 + r() * 760) * K, a0 = Math.PI * (1.05 + r() * .5), span = .5 + r() * 1.1, pts = [];
      for (let k = 0; k <= 8; k++) { const a = a0 + span * k / 8 + (r() - .5) * .04; pts.push([cen[0] + Math.cos(a) * rad * (1 + (r() - .5) * .02), cen[1] + Math.sin(a) * rad * 1.08]); }
      const t = r(), color = t < .5 ? HAIR_S1 : t < .85 ? HAIR_S2 : HAIR_S3;
      s.push({ pts, w: (7 + r() * 10) * K, color, al: .16 + r() * .16, seed: 4000 + i });
    }
    return s;
  })();
  function hairInner(c, phase = 0) {
    const sw = (pts, k) => pts.map(p => sway(p, phase, k));
    const outline = sw(HAIR_PTS, 0);
    const hairPath = P2(outline, 1.0);
    gouache(c, hairPath, HAIR_BASE, 1);
    c.save(); c.clip(hairPath);
    for (const s of HAIR_STROKES) brush(c, sw(s.pts, s.seed % 11), { w: s.w, color: s.color, al: s.al, seed: s.seed, amp: 2, taper: .6 });
    { const hb = bbox(HAIR_PTS); grain(c, hairPath, [hb[0] - 20, hb[1] - 20, hb[2] - hb[0] + 40, hb[3] - hb[1] + 40], Math.round(9000 * K * K), '#6a5552', .10, 17, 2.2 * K); }
    c.restore();
    brush(c, outline, { w: 4 * K, color: '#15100f', al: .9, seed: 950, amp: .15, taper: 0, close: true });
  }
  // The website sways a single cached hair drawing by sliding horizontal bands of it
  // (the same wave as sway(), by y only). swayBand(y, phase) gives the x offset for a row.
  const swayBand = (y, phase) => { const t = clamp((y - H * .39) / (H * .83), 0, 1), d = t * t; return (Math.sin(TAU * phase) * 22 * d + Math.sin(TAU * phase * 2 + 1.7) * 6 * d) * K; };

  // ---- eyes ----
  function drawEye(c, e, open = 1, gx = 0, gy = 0) {
    const { pts, box, pr, side } = e, [x0, y0, x1, y1] = box, h = y1 - y0, white = P2(pts, 1.6);
    if (open > .04) {
      gouache(c, white, EYE_WHITE, 1);
      c.save(); c.clip(white);
      const [px, py] = pupilAt(e, gx, gy);
      c.fillStyle = PUPIL; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.arc(px, py, pr, 0, TAU); c.clip();
      const r = rng(300 + side);
      c.strokeStyle = '#3a2f2f'; c.lineCap = 'round';
      for (let i = 0; i < 40; i++) { const a = r() * TAU, d = r() * pr * .9, len = 6 + r() * 18, ang = r() * TAU; const x = px + Math.cos(a) * d, y = py + Math.sin(a) * d; c.lineWidth = 1 + r() * 2; c.globalAlpha = .1 + r() * .2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); c.stroke(); }
      c.globalAlpha = 1;
      const g2 = c.createRadialGradient(px - pr * .38, py - pr * .38, 0, px - pr * .38, py - pr * .38, pr * .16); g2.addColorStop(0, 'rgba(255,252,246,.55)'); g2.addColorStop(1, 'rgba(255,252,246,0)'); c.fillStyle = g2; c.beginPath(); c.arc(px - pr * .38, py - pr * .38, pr * .16, 0, TAU); c.fill();
      c.restore();
      const sh = c.createLinearGradient(0, y0, 0, y0 + h * .35); sh.addColorStop(0, 'rgba(120,70,60,.35)'); sh.addColorStop(1, 'rgba(120,70,60,0)');
      c.fillStyle = sh; c.fillRect(x0 - 10, y0 - 10, x1 - x0 + 20, h * .4);
      if (open < 1) {
        const ly = y0 + (1 - open) * h * 1.02, bow = h * .12 * open;
        c.fillStyle = LID; c.beginPath(); c.moveTo(x0 - 20, y0 - 30); c.lineTo(x1 + 20, y0 - 30); c.lineTo(x1 + 20, ly - bow); c.quadraticCurveTo((x0 + x1) / 2, ly + bow * 1.5, x0 - 20, ly - bow); c.closePath(); c.fill();
      }
      c.restore();
    }
    if (open >= .98) brush(c, pts, { w: 4.2 * K, color: INK, al: .95, seed: 20 + side, amp: .15, taper: 0, close: true });
    else {
      const ly = y0 + (1 - open) * h * 1.02, bow = h * .12 * open, cx = (x0 + x1) / 2, cym0 = (y0 + y1) / 2;
      brush(c, [[x0 + 6, ly - bow + 4], [cx, ly + bow * 1.3], [x1 - 6, ly - bow + 4]], { w: 5 * K, color: INK, al: .95, seed: 24 + side, amp: .5, taper: .6 });
      if (open > .04) { const low = pts.filter(p => p[1] > ly + 4).sort((a, b) => Math.atan2(a[1] - cym0, a[0] - cx) - Math.atan2(b[1] - cym0, b[0] - cx)); if (low.length > 2) brush(c, low, { w: 4 * K, color: INK, al: .9, seed: 20 + side, amp: .5, taper: .4 }); }
    }
    const q = smoothPts(pts, true, 6, 1.6), cxm = (x0 + x1) / 2, cym = (y0 + y1) / 2;
    const lash = (p, len, w, al) => { let nx = p[0] - cxm, ny = p[1] - cym; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L; const lean = -side * .55; brush(c, [[p[0] - nx * 2, p[1] - ny * 2], [p[0] + nx * len * .55 + ny * lean * len * .3, p[1] + ny * len * .55 - nx * lean * len * .3], [p[0] + nx * len + ny * lean * len * .5, p[1] + ny * len - nx * lean * len * .5]], { w, color: INK, al, seed: 40 + Math.round(p[0]), amp: .3, taper: 1.3 }); };
    const upperOuter = q.filter(p => p[1] < cym + h * .05 && (p[0] - cxm) * side > h * .05 && p[1] < y0 + h * .6 && open > .5);
    for (let i = 0; i < 4; i++) { const p = upperOuter[Math.floor((i + .5) / 4 * upperOuter.length)]; if (p) lash(p, (36 + i * 5) * K, 12 * K, .95); }
    const upperInner = q.filter(p => p[1] < cym - h * .1 && (p[0] - cxm) * side < -h * .25 && open > .5);
    { const p = upperInner[Math.floor(upperInner.length * .5)]; if (p) lash(p, 34 * K, 11 * K, .95); }   // one lash at the inner corner
    const lower = q.filter(p => p[1] > cym + h * .25);
    for (let i = 0; i < 6; i++) { const p = lower[Math.floor((i + .5) / 6 * lower.length)]; if (p) lash(p, 16 * K, 2.6 * K, .8); }
  }

  // Twinkling stars in each pupil: drawn every frame so each breathes on its own rhythm.
  const STARS = [[-.34, -.36, .24, 0], [.40, -.46, .07, 2.1], [-.50, .30, .06, 4.0], [.42, .42, .055, 1.2], [.10, .58, .05, 3.0]];
  function sparkles(c, tau, { open = 1, gx = 0, gy = 0 } = {}) {
    if (open < .7) return;
    for (const e of EYES) {
      const pr = e.pr, [px, py] = pupilAt(e, gx, gy);
      c.save(); c.beginPath(); c.arc(px, py, pr - 2, 0, TAU); c.clip();
      STARS.forEach(([dx, dy, sz, ph], i) => {
        const tw = .5 + .5 * Math.sin(TAU * tau / (3.6 + i * .9) + ph + e.side);
        const r = pr * sz * (.8 + .3 * tw), al = .6 + .4 * tw;
        c.fillStyle = `rgba(255,250,240,${al})`;
        star4(c, px + dx * pr, py + dy * pr, r, tw * .5);
        if (tw > .9) { c.fillStyle = `rgba(255,250,240,${(tw - .9) * 4})`; star4(c, px + dx * pr, py + dy * pr, r * 1.35, Math.PI / 4); }
      });
      c.restore();
    }
  }

  // ---- the face ----
  function faceInner(c, { open = 1, gx = 0, gy = 0 } = {}) {
    const skin = P2(FACE_PTS, 1.2);
    gouache(c, skin, SKIN, 1);
    c.save(); c.clip(skin);
    { const fb = bbox(FACE_PTS); grain(c, skin, [fb[0], fb[1], fb[2] - fb[0], fb[3] - fb[1]], Math.round(3000 * K * K), '#d99a80', .16, 9, 1.8 * K); }
    for (const [bx, by] of BLUSHES) {
      const rg = c.createRadialGradient(bx, by, 0, bx, by, 190 * K); rg.addColorStop(0, 'rgba(232,110,105,.5)'); rg.addColorStop(.5, 'rgba(232,110,105,.22)'); rg.addColorStop(1, 'rgba(232,110,105,0)');
      c.save(); c.fillStyle = rg; c.translate(bx, by); c.scale(1.3, .85); c.translate(-bx, -by); c.fillRect(bx - 300, by - 300, 600, 600); c.restore();
    }
    const r = rng(44); c.fillStyle = FRECKLE;
    for (const [bx, by] of [...BLUSHES, NOSE]) for (let i = 0; i < 16; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 110 * K; c.globalAlpha = .25 + r() * .45; c.beginPath(); c.arc(bx + Math.cos(a) * d * 1.3, by + Math.sin(a) * d * .7 + 10 * K, (1.5 + r() * 3) * K, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    c.restore();
    brush(c, FACE_PTS, { w: 3 * K, color: SKIN_LINE, al: .5, seed: 60, amp: .3, taper: 0, close: true });
    brush(c, [[NOSE[0] - 14 * K, NOSE[1] - 4 * K], [NOSE[0] - 4 * K, NOSE[1] + 10 * K], [NOSE[0] + 10 * K, NOSE[1] + 2 * K]], { w: 3.5 * K, color: SKIN_LINE, al: .9, seed: 80, amp: .4, taper: .6 });
    brush(c, [[MOUTH[0] - 16 * K, MOUTH[1]], [MOUTH[0], MOUTH[1] + 4 * K], [MOUTH[0] + 16 * K, MOUTH[1] - 1]], { w: 3.2 * K, color: SKIN_LINE, al: .85, seed: 81, amp: .4, taper: .6 });
    for (const e of EYES) { const [x0, y0, x1, y1] = e.box, w = x1 - x0, h = y1 - y0, by = y0 - h * .26, cxm = (x0 + x1) / 2;
      const sh = -e.side * w * .14; brush(c, [[cxm + sh - w * .3, by + h * .01], [cxm + sh + e.side * w * .06, by - h * .025], [cxm + sh + w * .3, by + h * .01]], { w: 3.6 * K, color: '#2a1d1b', al: .85, seed: 90 + e.side, amp: .4, taper: 1.2 }); }
    for (const e of EYES) drawEye(c, e, open, gx, gy);
  }

  // A thinking scribble on the left, white, a little bigger, overlapping the hair a touch.
  // It draws itself on over ~2.2 s: a single line that winds up into a confused tangle,
  // then the tangle holds and boils gently (three redrawn variants). Three little thought
  // bubbles lead from the hair to it, appearing as the line starts.
  const hairBox = bbox(HAIR_PTS);
  const SCRIB = PORTRAIT ? { x: W * .27, y: hairBox[1] + H * .005, r: W * .27 } : { x: hairBox[0] + W * .02, y: H * .27, r: H * .30 };
  const SCRIB_FROM = PORTRAIT ? [hairBox[0] + W * .30, hairBox[1] + H * .03] : [hairBox[0] + W * .11, hairBox[1] + H * .30];   // where the thought leaves the hair
  const MAT = Math.round(Math.min(W, H) * .052);                 // the comic panel's white mat
  const SCRIB_INK = '#fffaf4', SCRIB_T = 9, SCRIB_DELAY = .6, MONO = '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';   // the line keeps growing for 9 s, then holds
  // One long wandering pen line, authored once (seeded, so it never changes shape). It
  // starts loose near the bubbles and tangles up more and more as it goes: the turning gets
  // tighter and the reach shrinks toward the middle, so the longer it is, the more knotted.
  // One long wandering pen line, authored once (seeded, so it never changes shape). It
  // starts in the middle as a tiny knot and works outward: the reach grows with length,
  // so the ball keeps getting bigger as the line gets longer.
  const tangle = (() => {
    const r = rng(703), pts = [];
    let x = SCRIB.x, y = SCRIB.y, dir = r() * TAU;
    const f1 = 1.7, f2 = 4.1, ph1 = r() * TAU, ph2 = r() * TAU, N = 420;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1), reach = .08 + .92 * Math.pow(u, .8), step = SCRIB.r * (.035 + u * .04);
      dir += (Math.sin(u * TAU * f1 * 3 + ph1) * .45 + Math.sin(u * TAU * f2 * 3 + ph2) * .30) * .9 + (r() - .5) * .25;
      const ox = (x - SCRIB.x) / (SCRIB.r * reach), oy = (y - SCRIB.y) / (SCRIB.r * .8 * reach), d2 = ox * ox + oy * oy;
      if (d2 > .5) { const back = Math.atan2(SCRIB.y - y, SCRIB.x - x); let da = back - dir; da = Math.atan2(Math.sin(da), Math.cos(da)); dir += da * (d2 - .5) * 1.1; }
      x += Math.cos(dir) * step; y += Math.sin(dir) * step;
      pts.push([x, y]);
    }
    return pts;
  })();
  function scribble(c, tau) {
    const t = tau - SCRIB_DELAY; if (t < 0) return;
    const p = clamp(t / SCRIB_T, 0, 1);                           // how much of the line has been drawn
    const bubbles = Math.min(3, Math.floor(t / .25) + 1);
    for (let i = 0; i < bubbles; i++) { const q = (i + 1) / 4, bob = (7 + i * 3) * K, x = lerp(SCRIB_FROM[0], SCRIB.x + SCRIB.r * (PORTRAIT ? .55 : .75), q) + Math.sin(tau * 1.3 + i * 2.1) * bob, y = lerp(SCRIB_FROM[1], SCRIB.y + SCRIB.r * (PORTRAIT ? .85 : .75), q) + Math.cos(tau * 1.7 + i * 1.4) * bob * .8, rr = (6 + i * 5) * K * (1 + .12 * Math.sin(tau * 2.2 + i)); c.save(); c.strokeStyle = SCRIB_INK; c.globalAlpha = .95; c.lineWidth = 2.6 * K; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.stroke(); c.restore(); }
    // the line keeps growing, and the whole drawn line drifts: each point rides a slow, large,
    // low-frequency wave with its own phase along the line, so loops swing past each other and
    // the lines really change position, like the earlier boil, but as one continuous growing line.
    const n = Math.max(2, Math.floor(tangle.length * easeOut(p) * .999)), live = [];
    for (let i = 0; i < n; i++) {
      const u = i / tangle.length, a = SCRIB.r * .30 * (.15 + .85 * easeOut(p));
      const ph1 = u * 3.2 + tau * 1.1, ph2 = u * 5.1 - tau * .7;
      live.push([tangle[i][0] + (Math.sin(ph1) * .6 + Math.sin(ph2 + 1.3) * .4) * a, tangle[i][1] + (Math.cos(ph1 * .9 + 2) * .6 + Math.sin(ph2 * 1.3) * .4) * a * .85]);
    }
    brush(c, live, { w: 3.6 * K, color: SCRIB_INK, al: .95, seed: 710, amp: 1.2, taper: 0 });
    // the caption: a status line under the scribble, in monospace, with a counter that climbs
    // with the tangle and hangs at 99% like every real build; the dots tick
    const dots = '.'.repeat(1 + Math.floor(t * 2) % 3), label = `compiling thoughts${dots}`;
    // to the right of the ball, past the bubbles, like a label on the thought: on the hair in
    // landscape (white on dark), in the pink above the hair in portrait
    const fs = Math.round(28 * K * (PORTRAIT ? 1.25 : 1)), cx = CX, cy = MAT + fs * 2.4;   // centred, a little below the top of the panel
    c.save(); c.font = `${fs}px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = SCRIB_INK; c.globalAlpha = .95 * clamp(t / .4, 0, 1);
    c.fillText(label, cx, cy); c.restore();
  }
  // A small hand-drawn scroll cue, bottom centre: a mouse outline with a little wheel that
  // drops and fades, drawn on over half a second once `k` (0..1) starts.
  // A comic-book panel: a thick white mat round the screen and a bold, slightly
  // hand-drawn black line where the panel edge is.
  function frame(c) {
    resetT(c); c.save(); c.fillStyle = '#fffaf4';
    c.fillRect(0, 0, W, MAT); c.fillRect(0, H - MAT, W, MAT); c.fillRect(0, 0, MAT, H); c.fillRect(W - MAT, 0, MAT, H);
    c.restore();
    const rect = resampleLoop([[MAT, MAT], [W - MAT, MAT], [W - MAT, H - MAT], [MAT, H - MAT]], 12);   // dense points, so the corners stay corners
    brush(c, rect, { w: 7 * K, color: '#1a1212', al: .95, seed: 830, amp: .8, taper: 0, close: true, smooth: false });
  }

  const face = (c, o) => { c.save(); if (SMALL) { c.translate(opt.cx || 0, opt.cy || 0); c.scale(SS, SS); } faceInner(c, o); c.restore(); };
  const hair = (c, ph) => { c.save(); if (SMALL) { c.translate(opt.cx || 0, opt.cy || 0); c.scale(SS, SS); } hairInner(c, ph); c.restore(); };

  // Two full-screen eyelids, k = 0 shut, 1 fully open. Edges are arcs like the drawn lids.
  function lids(c, k) {
    resetT(c); c.fillStyle = PUPIL;
    const gap = lerp(-90, H / 2 + 120, k), bow = 110 * (1 - k * .3);
    c.beginPath(); c.moveTo(-10, -10); c.lineTo(W + 10, -10); c.lineTo(W + 10, CY - gap + bow); c.quadraticCurveTo(CX, CY - gap - bow * 1.6, -10, CY - gap + bow); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-10, H + 10); c.lineTo(W + 10, H + 10); c.lineTo(W + 10, CY + gap - bow); c.quadraticCurveTo(CX, CY + gap + bow * 1.6, -10, CY + gap - bow); c.closePath(); c.fill();
  }
  const eyeCentre = () => [CX, EYES.reduce((a, e) => a + (e.box[1] + e.box[3]) / 2, 0) / EYES.length];

  return { BG, K, EYES, HAIR_PTS, FACE_PTS, MOUTH, face, hair, swayBand, sparkles, scribble, frame, lids, eyeCentre, DRAWINGS, SHEET, NFRAMES, drawingAt, blinkId, dims: () => ({ W, H, S, CX, CY, OUT_W, OUT_H }) };
}

// ---- website renderer ------------------------------------------------------
// Sizes the engine to the viewport (one logical frame of the viewport's aspect, short
// side 1080), caches the face drawings and one hair drawing, and draws frames.
function makeRenderer(canvas) {
  let F = null, cache = new Map(), c = canvas.getContext('2d');
  function resize() {
    const vw = Math.max(1, window.innerWidth), vh = Math.max(1, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2), width = Math.min(Math.round(vw * dpr), 1600, Math.round(Math.sqrt(1.6e6 * vw / vh)));   // line art: 1600 px across is plenty, and each cached drawing is a full-frame bitmap, so a tall screen (an iPad) is held to 1.6 Mpx a drawing
    setFormat({ ar: `${vw}:${vh}`, width });
    canvas.width = OUT_W; canvas.height = OUT_H;
    canvas.style.width = vw + 'px'; canvas.style.height = vh + 'px';
    cache = new Map(); F = build();
  }
  function cached(key, draw) {
    if (!cache.has(key)) { const L = layer(); const g = L.getContext('2d'); g.setTransform(S, 0, 0, S, 0, 0); draw(g); cache.set(key, L); }
    return cache.get(key);
  }
  const faceLayer = id => cached('face/' + id, g => F.face(g, F.DRAWINGS[id]));
  const hairLayer = () => cached('hair', g => F.hair(g, 0));
  // Draw the hair with the sway: horizontal bands of the cached layer, each slid by the wave at its row.
  function drawHair(ctx, phase) {
    const L = hairLayer(), bands = 28, bh = H / bands;
    for (let i = 0; i < bands; i++) { const y = i * bh, dx = F.swayBand(y + bh / 2, phase); ctx.drawImage(L, 0, y * S, L.width, bh * S + 1, dx, y, W, bh + 1 / S); }
  }
  function drawScene(ctx, id, t, { zoom = 1, at } = {}) {
    ctx.save(); resetT(ctx);
    if (zoom !== 1) { const p = at || F.eyeCentre(); ctx.translate(p[0], p[1]); ctx.scale(zoom, zoom); ctx.translate(-p[0], -p[1]); }
    ctx.drawImage(faceLayer(id), 0, 0, W, H);
    F.sparkles(ctx, t, F.DRAWINGS[id]);
    drawHair(ctx, (t % 4) / 4);
    F.scribble(ctx, t);
    ctx.restore();
  }
  // the background: the pink paper photo (public/paper-pink.jpg) covering the frame; the flat pink until it loads
  const PAPER_IMG = new Image(); PAPER_IMG.src = '/paper-pink.jpg';
  const bg = () => { paper(c, F.BG, null, 31); if (PAPER_IMG.complete && PAPER_IMG.naturalWidth) { const k = Math.max(W / PAPER_IMG.naturalWidth, H / PAPER_IMG.naturalHeight), dw = PAPER_IMG.naturalWidth * k, dh = PAPER_IMG.naturalHeight * k; c.drawImage(PAPER_IMG, (W - dw) / 2, (H - dh) / 2, dw, dh); } };
  return {
    resize,
    get dims() { return F ? F.dims() : null; },
    // warm one more drawing into the cache; returns true when there is nothing left to warm
    warm() { const ids = ['open', 'half', 'closed', 'halfUp', 'openL', 'bl0.8', 'bl0.6', 'bl0.4', 'bl0.2']; for (const id of ids) if (!cache.has('face/' + id)) { faceLayer(id); return false; } hairLayer(); return true; },
    // idle: the exposure sheet loops; t in seconds
    idle(t) { bg(); drawScene(c, F.drawingAt(Math.floor(t * 24) % F.NFRAMES), t); F.frame(c); },
    // blink out: k 0..1, her lids close as the camera pushes in, the screen's lids close with them
    blink(t, k) { bg(); drawScene(c, F.blinkId(k), t, { zoom: 1 + k * 1.3 }); F.frame(c); F.lids(c, 1 - easeIn(k)); },
    // open: k 0..1, only the lids are drawn; the page shows through the rest
    open(k) { resetT(c); c.clearRect(0, 0, W, H); F.lids(c, k); },
    clear() { resetT(c); c.clearRect(0, 0, W, H); },
    // the intro is over: every cached drawing gives its bitmap back
    dispose() { for (const L of cache.values()) dropLayer(L); cache = new Map(); },
  };
}

return { build, makeRenderer, DRAWINGS, SHEET, NFRAMES, drawingAt, blinkId, BG };
})();
