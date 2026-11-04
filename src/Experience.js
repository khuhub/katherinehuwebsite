import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import Frame from './Frame';
import './Experience.css';

// Panel 3, experience: a horizontal scroll along one pink squiggle. The line starts at the left border and grows
// as you scroll, the view following its head; each experience sits a step along it, logo left of the name, role
// under. Crayon flowers and sprouts grow from the line as it passes. Once the line has reached the end she walks
// in from the right and waves, and an arrow at the bottom points back along the line. Same drawing as the film
// (hero-film/hero-text.html, panelExperience). What has grown stays grown: scrolling back only pans the view.
const EXPS = [
  { name: 'Meta', role: 'software engineer intern · ai infra', logo: '/lg-meta.png', link: 'https://www.meta.com' },
  { name: 'ElevenLabs', role: 'campus ambassador', logo: '/eleven-logo.png', link: 'https://elevenlabs.io/' },
  { name: 'Myovara', role: 'lead mobile engineer & team lead', logo: '/lg-myovara.png', link: 'https://tech.cornell.edu/built/myovara-labs/' },
  { name: 'Hack4Impact Cornell', role: 'technical lead & software developer', logo: '/lg-hack.png', link: 'https://www.cornellh4i.org/' },
  { name: 'Women in Computing at Cornell', role: 'technical committee member', logo: '/lg-wicc.png', link: 'https://wicc.cornell.edu/#/' },
  { name: 'Cornell CS 2112', role: 'teaching assistant', logo: '/lg-cornell.png', link: 'https://www.cs.cornell.edu/' },
];
const N = EXPS.length;
const LINE = '#e77f9e', INK = '#2a1b1b', SUB = '#6b5a52', GREEN = '#2e9e4f', FLOWER_COLS = ['#f0873a', '#f0a2a8', '#f2b531'];
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);

// ---- the world: everything in panel pixels, authored once per panel size ----------------------------------
function buildWorld(w, h) {
  const P = w < h, M = Math.round(Math.min(w, h) * .052), PB = P ? w * 1.1 : h, U = PB / 1080;
  const STEP = P ? w * .8 : w * .5, stopX = i => w * .5 + STEP * i, headEnd = stopX(N - 1) + w * .22, camMax = headEnd - w * .82;
  const rng = window.rng || (() => Math.random);
  // the squiggle: a smooth wander of varying swing, soft-limited so it eases toward the bounds
  const r = rng(47), x1 = stopX(N - 1) + w * .4, pts = [];
  const f = [1.3 + r() * .4, 2.6 + r() * .5, 5 + r() * .8, 11 + r() * 2], ph = [r() * TAU, r() * TAU, r() * TAU, r() * TAU];
  for (let x = M; x <= x1; x += 6) {
    const u = (x - M) / STEP, swing = .5 + .5 * Math.sin(u * 1.3 + .4) * Math.sin(u * .47 + 2.1);
    const y = h * .55 + (Math.sin(u * f[0] + ph[0]) * .13 + Math.sin(u * f[1] + ph[1]) * .07 + Math.sin(u * f[2] + ph[2]) * .02 + Math.sin(u * f[3] + ph[3]) * .004) * PB * (0.6 + swing) * 1.9;
    const dev = y - h * .55, lim = PB * .3; pts.push([x, h * .55 + lim * Math.tanh(dev / lim)]);
  }
  const at = x => { const i = clamp((x - M) / 6, 0, pts.length - 1), a = pts[Math.floor(i)], b = pts[Math.min(pts.length - 1, Math.ceil(i))], t = i - Math.floor(i); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; };
  // the cards: on the roomier side of the line, clear of its local rise and fall
  const cards = EXPS.map((e, i) => {
    const sx = stopX(i), [px, py] = at(sx), above = py > h * .5 && !(P && i === N - 1);
    let lo = py, hi = py; for (let xx = sx - w * .2; xx <= sx + w * .2; xx += 12) { const yy = at(xx)[1]; lo = Math.min(lo, yy); hi = Math.max(hi, yy); }
    const gap = P ? w * .1 : 70 * U, cy = above ? lo - gap : hi + gap;
    return { px, py, cy, above };
  });
  // the garden: flowers and sprouts, planted along the line, never under a card that sits above the line
  const g = rng(91), xEnd = headEnd - w * .2, plants = [];
  for (let x = M + w * .05; x < Math.min(x1, xEnd); x += (P ? w * (.16 + g() * .14) : w * (.06 + g() * .07))) {
    const i = EXPS.findIndex((_, k) => Math.abs(x - stopX(k)) < (P ? w * .45 : w * .17));
    if (i >= 0 && at(stopX(i))[1] > h * .5) { g(); g(); continue; }
    const kind = g() < .45 ? 3 : Math.floor(g() * 3), col = FLOWER_COLS[(plants.length + Math.floor(g() * 2)) % 3];
    const by = at(x)[1], room = (by - M - 24 * U) / 1.75;
    plants.push({ x, kind, col, h: Math.min(room, PB * (.09 + g() * .14) * (kind === 3 ? .6 : 1)), lean: (g() - .5) * .6, seed: Math.floor(g() * 9999), leafT: .3 + g() * .25, leafSide: g() < .5 ? -1 : 1 });
  }
  return { w, h, P, M, PB, U, STEP, stopX, headEnd, camMax, pts, at, cards, plants };
}

// ---- drawing ------------------------------------------------------------------------------------------
function part(c, pts, p, o) { const n = Math.ceil(pts.length * clamp(p, 0, 1)); if (n >= 2) window.brush(c, pts.slice(0, n), o); }
function loop(cx, cy, R, lobes, k, n, ph) { const o = []; for (let i = 0; i <= n; i++) { const a = i / n * TAU + ph, rr = R * (1 + k * Math.cos(lobes * a)); o.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return o; }
function drawPlant(c, W, f, p) {                                          // p 0..1: how far it has grown
  const [bx, by] = W.at(f.x), d = -1, K = Math.min(1, W.PB / 1080), w = 4.5 * K;
  c.save(); c.translate(bx, by);
  const stem = []; for (let i = 0; i <= 24; i++) { const t = i / 24; stem.push([f.lean * f.h * t * t + Math.sin(t * 5 + f.seed) * 3 * K, d * f.h * t]); }
  part(c, stem, p / .5, { w, color: GREEN, al: .9, seed: f.seed, amp: 1, taper: 0 });
  const tip = stem[24];
  const leafLoop = (ox, oy, L, an, side) => { const o = []; for (let i = 0; i <= 18; i++) { const a = i / 18 * TAU, u = (1 - Math.cos(a)) / 2 * L, v = Math.sin(a) * L * .22; o.push([ox + Math.cos(an) * u * side - Math.sin(an) * v, oy + d * (Math.sin(an) * u + Math.cos(an) * v)]); } return o; };
  if (f.kind === 3) {                                                     // a sprout: two leaf loops meeting at the tip
    part(c, leafLoop(tip[0], tip[1], f.h * .36, d * .6, -1), (p - .5) / .25, { w, color: GREEN, al: .9, seed: f.seed + 2, amp: 1, taper: 0 });
    part(c, leafLoop(tip[0], tip[1], f.h * .36, d * .6, 1), (p - .72) / .25, { w, color: GREEN, al: .9, seed: f.seed + 3, amp: 1, taper: 0 });
    c.restore(); return;
  }
  const lp = stem[Math.round(f.leafT * 24)];                              // a leaf off the stem
  part(c, leafLoop(lp[0], lp[1], f.h * .32, d * (-.35 + f.leafSide * .9), f.leafSide), (p - .3) / .3, { w, color: GREEN, al: .9, seed: f.seed + 1, amp: 1, taper: 0 });
  const R = f.h * (f.kind === 1 ? .34 : f.kind === 2 ? .2 : .26), hx = tip[0], hy = tip[1] + d * R * .8;   // the head
  const head = f.kind === 0 ? loop(hx, hy, R, 5, .3, 46, f.seed) : f.kind === 1 ? loop(hx, hy, R, 6, .5, 54, f.seed) : loop(hx, hy, R, 4, .22, 40, f.seed);
  part(c, head, (p - .5) / .38, { w, color: f.col, al: .9, seed: f.seed + 3, amp: 1, taper: 0 });
  if (p > .88) {                                                          // the face: two dots and a small smile
    const q = clamp((p - .88) / .12, 0, 1), e = R * .22; c.fillStyle = f.col; c.globalAlpha = q;
    [[-e, -R * .1], [e, -R * .1]].forEach(([ex, ey]) => { c.beginPath(); c.arc(hx + ex, hy + ey, 2.4 * K, 0, TAU); c.fill(); });
    const sm = []; for (let i = 0; i <= 8; i++) { const t = i / 8; sm.push([hx - e * .8 + t * e * 1.6, hy + R * .18 + Math.sin(t * Math.PI) * R * .12]); }
    window.brush(c, sm, { w: 2.2 * K, color: f.col, al: .9, seed: f.seed + 4, amp: .6, taper: 0 }); c.globalAlpha = 1;
  }
  c.restore();
}
let BODY = null;
function body() {
  if (BODY || !window.HeroBody) return BODY;
  BODY = window.HeroBody.build({ paper: '#ffffff' });
  const st = BODY.POSES.stand, CH = st.head[1];                           // a wave: the right arm up, the hand swinging
  BODY.POSES.wave1 = Object.assign({}, st, { head: [0, CH, -.03], armR: [[54, CH + 24], [92, CH - 30], [70, CH - 120]] });
  BODY.POSES.wave2 = Object.assign({}, st, { head: [0, CH, -.03], armR: [[54, CH + 24], [96, CH - 30], [118, CH - 110]] });
  return BODY;
}
const WALK_T = 3.6;
// one frame: the line to the furthest point reached, the garden grown to there, the dots, her, the arrow
function drawFrame(c, W, cam, grown, now, chibiAt, arrowAt) {
  const { w, h, M, pts, plants, stopX, U } = W;
  c.clearRect(0, 0, w, h);
  c.save(); c.beginPath(); c.rect(M, M, w - 2 * M, h - 2 * M); c.clip(); c.translate(-cam, 0);
  plants.forEach(f => { if (f.x - cam < -w * .3 || f.x - cam > w * 1.2) return; const p = (grown - f.x) / (w * .12); if (p > 0) drawPlant(c, W, f, p); });
  const i0 = Math.max(0, Math.floor((cam - w * .2 - M) / 6)), n = Math.max(i0 + 2, Math.min(pts.length, Math.ceil((grown - M) / 6) + 1));
  if (window.brush) window.brush(c, pts.slice(i0, n), { w: 5.2 * U, color: LINE, al: .95, seed: 9, amp: .7, taper: 0 });
  else { c.strokeStyle = LINE; c.lineWidth = 5 * U; c.beginPath(); pts.slice(i0, n).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }
  EXPS.forEach((_, i) => { const sx = stopX(i); if (grown >= sx) { const [px, py] = W.at(sx); c.fillStyle = INK; c.beginPath(); c.arc(px, py, 7 * U, 0, TAU); c.fill(); } });
  const B = body();
  if (chibiAt && B) {                                                     // she walks in from the right along the line and waves
    const tc = (now - chibiAt) / 1000, sc = Math.min(1, W.PB / 1080) * .55, xEnd = W.camMax + w * .72, xStart = W.camMax + w + 80, u = clamp(tc / WALK_T, 0, 1), wx = lerp(xStart, xEnd, easeOut(u));
    const lineEnd = pts[pts.length - 1], gy = (wx <= lineEnd[0] ? W.at(wx)[1] : lineEnd[1]) + (1 - easeOut(u)) * h * .08;
    const pose = u < 1 ? B.WALK[Math.floor(tc * 8) % 6] : (Math.floor((tc - WALK_T) * 4) % 2 ? 'wave2' : 'wave1');
    B.draw(c, pose, { x: wx, y: gy, scale: sc });
  }
  c.restore();
  if (arrowAt && window.brush) {                                          // the arrow at the bottom, pointing back along the line
    const ta = (now - arrowAt) / 1000, k = clamp(ta / .5, 0, 1), bob = Math.sin(ta * 3) * 6 * k, K = Math.min(1, W.PB / 1080), L = 52 * K;
    c.save(); c.globalAlpha = k * .9; c.translate(w / 2 + bob, h - M - 34 * K);
    window.brush(c, [[L, 0], [-L, 0]], { w: 3.4 * K, color: SUB, al: .9, seed: 71, amp: .6, taper: 0 });
    window.brush(c, [[-L + 20 * K, -14 * K], [-L, 0], [-L + 20 * K, 14 * K]], { w: 3.4 * K, color: SUB, al: .9, seed: 72, amp: .6, taper: 0 });
    c.restore();
  }
}

export default function Experience() {
  const secRef = useRef(null), boxRef = useRef(null), canvasRef = useRef(null), worldRef = useRef(null);
  const [world, setWorld] = useState(null);
  const S = useRef({ prog: 0, head: 0, grown: 0, cam: 0, chibiAt: 0, arrowAt: 0, endHold: 0, near: false, dirty: true }).current;
  const [portrait, setPortrait] = useState(() => window.innerWidth < window.innerHeight);

  // the world is authored for the panel's size
  useLayoutEffect(() => {
    const box = boxRef.current;
    const build = () => { const r = box.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height); if (!w || !h) return; setPortrait(w < h); setWorld(buildWorld(w, h)); S.dirty = true; };
    build();
    let t = 0; const onResize = () => { clearTimeout(t); t = setTimeout(build, 150); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, [S]);

  // scrolling: a wheel, a sideways swipe or the arrow keys move along the line while the panel is the one in view;
  // past either end the page scrolls on as usual
  useEffect(() => {
    const sec = secRef.current; if (!sec || !world) return;
    const total = world.headEnd - world.M;
    const active = () => { const r = sec.getBoundingClientRect(); return Math.abs(r.top) < 3; };
    const move = dpx => { S.prog = clamp(S.prog + dpx / total, 0, 1); S.dirty = true; };
    const onWheel = e => {
      if (!active()) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const atEnd = (d > 0 && S.prog >= 1) || (d < 0 && S.prog <= 0);
      if (atEnd) { if (performance.now() - S.endHold < 400) e.preventDefault(); return; }     // a short hold at the ends, so one gesture does not run straight into the next panel
      e.preventDefault(); move(d * 1.1); if (S.prog >= 1 || S.prog <= 0) S.endHold = performance.now();
    };
    let tx = 0, ty = 0, horiz = null;
    const onTouchStart = e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; horiz = null; };
    const onTouchMove = e => {
      if (!active()) return;
      const x = e.touches[0].clientX, y = e.touches[0].clientY, dx = tx - x, dy = ty - y;
      if (horiz === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) horiz = Math.abs(dx) > Math.abs(dy);
      if (!horiz) return;
      e.preventDefault(); move(dx * 1.25); tx = x; ty = y;
    };
    const onKey = e => { if (!active()) return; if (e.key === 'ArrowRight') { move(world.STEP * .5); e.preventDefault(); } else if (e.key === 'ArrowLeft') { move(-world.STEP * .5); e.preventDefault(); } };
    sec.addEventListener('wheel', onWheel, { passive: false });
    sec.addEventListener('touchstart', onTouchStart, { passive: true });
    sec.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => { sec.removeEventListener('wheel', onWheel); sec.removeEventListener('touchstart', onTouchStart); sec.removeEventListener('touchmove', onTouchMove); window.removeEventListener('keydown', onKey); };
  }, [world, S]);

  // the frame loop, running while the panel is near the viewport: the head eases toward where the scroll put it
  useEffect(() => {
    const sec = secRef.current, canvas = canvasRef.current; if (!sec || !canvas || !world) return;
    const c = canvas.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(world.w * dpr); canvas.height = Math.round(world.h * dpr); canvas.style.width = world.w + 'px'; canvas.style.height = world.h + 'px';
    S.head = world.M + S.prog * (world.headEnd - world.M); S.grown = Math.max(S.grown, S.head); S.dirty = true;
    const obs = new IntersectionObserver(([e]) => { S.near = e.isIntersecting; S.dirty = true; }, { threshold: 0 });
    obs.observe(sec);
    let raf = 0;
    const tick = now => {
      raf = requestAnimationFrame(tick);
      if (!S.near) return;
      const target = world.M + S.prog * (world.headEnd - world.M), d = target - S.head;
      if (Math.abs(d) > .3) { S.head += d * .14; S.dirty = true; } else if (S.head !== target) { S.head = target; S.dirty = true; }
      S.grown = Math.max(S.grown, S.head);
      if (!S.arrowAt && S.grown >= world.stopX(N - 1) - 1) S.arrowAt = now;
      if (!S.chibiAt && S.grown >= world.headEnd - 1) S.chibiAt = now;
      const animating = S.arrowAt || (S.chibiAt && now - S.chibiAt < 60000);
      if (!S.dirty && !animating) return;
      S.dirty = false;
      S.cam = clamp(S.head - world.w * .5, 0, world.camMax);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFrame(c, world, S.cam, S.grown, now, S.chibiAt, S.arrowAt);
      if (worldRef.current) worldRef.current.style.transform = `translateX(${-S.cam}px)`;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); obs.disconnect(); };
  }, [world, S]);

  return (
    <section ref={secRef} className={'exp' + (portrait ? ' is-portrait' : '')}>
      <div ref={boxRef} className="exp-box">
        <canvas ref={canvasRef} className="exp-canvas" aria-hidden="true" />
        <div ref={worldRef} className="exp-world">
          {world && EXPS.map((e, i) => {
            const k = world.cards[i], lh = world.P ? world.w * .045 : 46 * world.U;
            return (
              <div key={e.name} className={'exp-card' + (k.above ? ' is-above' : '')} style={{ left: k.px, top: k.cy, '--lh': lh + 'px', '--name': (world.P ? world.w * .038 : 38 * world.U) + 'px', '--role': (world.P ? world.w * .024 : 20 * world.U) + 'px', '--wrap': (world.P ? world.w * .8 : world.w * .34) + 'px' }}>
                <a className="exp-name mono" href={e.link} target="_blank" rel="noreferrer"><img src={e.logo} alt="" /><span>{e.name}</span></a>
                <p className="exp-role mono">{e.role}</p>
              </div>
            );
          })}
        </div>
        <span className="exp-label mono">experience</span><span className="exp-num mono">03</span>
        <Frame />
      </div>
    </section>
  );
}
