'use strict';
// ------------------------------------------------------------------
// Chibi Katherine, full figure, in pen: the traced head from chibi-data.js at a
// small scale (same hair silhouette, big dark eyes, blush, freckles) on a simple
// body drawn with the engine's brush. Each pose is a whole drawing authored as
// points in character units (origin between the feet, +y down, about 440 tall),
// so poses are exposed on a sheet like the face: stand, a 6-drawing walk cycle,
// two hold-up drawings (reaching, holding), and sit.
//
// Loads after core.js, studio.js, cels.js, chibi-data.js. Exposes window.HeroBody
// = { build() } → { draw(c, poseId, opts), POSES, WALK, headTop }.
// ------------------------------------------------------------------
window.HeroBody = (() => {

// The hero's look: flat soft fills with a thin warm pencil line (face.js's SKIN_LINE), no black pen.
const INK = '#6b4a3e', LINE = '#6b4a3e', SKIN = '#f9c9ad', TEE = '#fbf5ec', PANTS = '#5a4a52', HAIR_BASE = '#1a1414', BLUSH = 'rgba(236,120,118,.35)';
let PAPER = '#f4efe4';                                        // set per scene via build({ paper })
const PEN = (seed, w = 2.2, al = .7, close = false) => ({ w, color: LINE, al, seed, amp: .5, taper: .3, close });
const P2 = (pts, corner = 1.2) => { const p = new Path2D(); const s = smoothPts(pts, true, 3, corner); s.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; };
const bbox = pts => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; };
function resampleLoop(pts, step = 6) { const out = []; let carry = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let d = carry; while (d < L) { const t = d / L; out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]); d += step; } carry = d - L; } return out; }
function smoothLoop(pts, win = 2, passes = 2) { pts = resampleLoop(pts, 6); const n = pts.length; let out = pts.map((p, i) => { let x = 0, y = 0; for (let k = -win; k <= win; k++) { const q = pts[((i + k) % n + n) % n]; x += q[0]; y += q[1]; } return [x / (2 * win + 1), y / (2 * win + 1)]; }); for (let p = 0; p < passes; p++) { const nx = []; for (let i = 0; i < out.length; i++) { const a = out[i], b = out[(i + 1) % out.length]; nx.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } out = nx; } return out; }
const mirror = pts => pts.map(([x, y]) => [-x, y]);

function build({ paper } = {}) {
  if (paper) PAPER = paper;
  // ---- the head, from the traced drawing, scaled to ~190 wide ----
  // Image space: hair x 132..605 (centre 368), top y 20, chin y 439. Head origin = chin centre.
  const HS = 190 / 473, HT = p => [(p[0] - 368) * HS, (p[1] - 439) * HS];
  // the hair: smoothed hard below the chin so the ends are two clean rounded lobes
const HAIR_PTS = (() => { const raw = smoothLoop(CHIBI.hair.map(HT), 9, 3); const n = raw.length, out = []; for (let i = 0; i < n; i++) { const w = raw[i][1] > -20 ? 22 : 9; let x = 0, y = 0; for (let k = -w; k <= w; k++) { const q = raw[((i + k) % n + n) % n]; x += q[0]; y += q[1]; } out.push([x / (2 * w + 1), y / (2 * w + 1)]); } return smoothLoop(out, 3, 2); })(), FACE_PTS = smoothLoop(CHIBI.face.map(HT), 2, 2);
  const EYES = CHIBI.whites.map((w, i) => { const pts = smoothLoop(w.map(HT), 2, 2), b = bbox(pts), pu = CHIBI.pupils[i], pc = HT([pu.cx, pu.cy]); return { pts, box: b, pc, pr: Math.min(pu.r * HS * 1.12, (b[3] - b[1]) * .46), side: pc[0] < 0 ? -1 : 1 }; });
  const NOSE = HT([340, 347]), MOUTH = HT([342, 400]), BLUSHES = [HT([262, 372]), HT([452, 380])];
  const HAIR_BOX = bbox(HAIR_PTS);                                 // y from -177 (top) to +93 (hair ends below the chin)
  const hairStrokes = (() => { const r = rng(5), s = []; for (let i = 0; i < 26; i++) { const u = r(), x0 = (u - .5) * 120, pts = [[x0 * .3, -165 + r() * 10], [x0 * .8, -120 + u * 40], [x0 * 1.1 + (r() - .5) * 20, -40 + u * 60], [x0 * 1.15 + (r() - .5) * 30, 40 + u * 50]]; s.push({ pts, w: 2.2 + r() * 2.5, al: .18 + r() * .18, seed: 300 + i }); } return s; })();

  // the hair scribble: many short zigzag strokes clipped to the hair shape, paper showing through a little
  const scribbles = (() => { const r = rng(11), out = [], [x0, y0, x1, y1] = HAIR_BOX; for (let i = 0; i < 420; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), a = Math.PI / 2 + (r() - .5) * 1.4 + (r() < .3 ? Math.PI / 2 : 0), L = 16 + r() * 30, pts = []; for (let k = 0; k < 7; k++) { const t = k / 6, z = (k % 2 ? 1 : -1) * (1 + r() * 1.5); pts.push([x + Math.cos(a) * L * (t - .5) - Math.sin(a) * z, y + Math.sin(a) * L * (t - .5) + Math.cos(a) * z]); } out.push({ pts, w: 1.3 + r() * 1.2, al: .6 + r() * .4, seed: 500 + i }); } return out; })();
  const HERO = window.HeroFace.build({ scale: HS, cx: 0, cy: 0 });   // the hero's face + hair, 190 wide, chin at the origin
  function head(c, { open = 1, gx = 0, gy = 0, tilt = 0 } = {}) {
    c.save(); c.rotate(tilt);
    HERO.face(c, { open, gx: gx * 3, gy: gy * 3 });
    HERO.hair(c, 0);
    c.restore();
  }

  // ---- the head from the side and from behind (hand-authored to match the front) ----
  // Profile, facing +x (flip the context for the other way). Face outline with a tiny nose bump;
  // the hair is a mass covering the back and top of the head, falling past the shoulders.
  // profile: a plain round face (an ellipse, nothing sticking out), hair behind it and a thick lock hanging in front of the ear
  const SIDE_FACE = Array.from({ length: 40 }, (_, i) => { const t = i / 40 * TAU, b = Math.max(0, Math.cos(t)) * Math.max(0, Math.sin(t)); return [14 + 72 * Math.cos(t) + 16 * b, -90 + 86 * Math.sin(t) + 10 * b]; });   // b: a soft chin on the lower front
  const LOCK_EDGE = smoothPts([[24, -172], [58, -166], [76, -146], [60, -122], [44, -92], [36, -52], [36, -10], [44, 30], [40, 64], [20, 78], [-20, 72]], false, 4, 1.4);   // the lock's front + bottom edge, the part that meets the face
  const FRONT_LOCK = smoothLoop([[-28, -152], [24, -172], [58, -166], [76, -146], [60, -122], [44, -92], [36, -52], [36, -10], [44, 30], [40, 64], [20, 78], [-20, 72], [-36, 34], [-40, -16], [-40, -80], [-34, -130]], 2, 2);
  const SIDE_HAIR = smoothLoop([[64, -126], [58, -158], [36, -180], [4, -190], [-34, -190], [-70, -176], [-96, -140], [-104, -90], [-104, -30], [-100, 40], [-92, 88], [-70, 96], [-46, 88], [-32, 40], [-26, -20], [-22, -70], [-10, -110], [22, -132]], 2, 2);
  const BACK_HAIR = smoothLoop([[0, -186], [50, -178], [84, -146], [97, -100], [98, -50], [94, -4], [88, 30], [76, 52], [50, 64], [20, 70], [0, 71], [-20, 70], [-50, 64], [-76, 52], [-88, 30], [-94, -4], [-98, -50], [-97, -100], [-84, -146], [-50, -178]], 2, 2);
  // strand texture like the hero's: long translucent strokes in three browns flowing from the crown down, clipped to the shape
  const HAIR_S1 = '#272020', HAIR_S2 = '#352a29', HAIR_S3 = '#473938';
  function strands(c, path, pts, seed, n, crown, spread = .15) {
    const r = rng(seed), [x0, y0, x1, y1] = bbox(pts), h = y1 - y0;
    c.save(); c.clip(path);
    for (let i = 0; i < n; i++) {
      const u = r(), j = () => (r() - .5), t = r(), color = t < .5 ? HAIR_S1 : t < .85 ? HAIR_S2 : HAIR_S3;
      const sx = lerp(x0, x1, u), p = [[crown[0] + (sx - crown[0]) * spread + j() * 8, crown[1] + j() * 6], [crown[0] + (sx - crown[0]) * .7 + j() * 10, y0 + h * (.22 + j() * .1)], [sx + j() * 12, y0 + h * (.55 + j() * .1)], [sx + j() * 14, y1 + 10]];
      brush(c, p, { w: 2.2 + r() * 3, color, al: .16 + r() * .16, seed: seed + i, amp: 1.2, taper: .6 });
    }
    grain(c, path, [x0 - 10, y0 - 10, x1 - x0 + 20, y1 - y0 + 20], 900, '#6a5552', .10, seed + 7, 1.2);
    c.restore();
  }
  function headSide(c, { open = 1, tilt = 0, hairPts = SIDE_HAIR } = {}) {
    c.save(); c.rotate(tilt);
    const hair = P2(hairPts, 1.0), face = P2(SIDE_FACE, .6), lock = P2(FRONT_LOCK, 1.0);
    gouache(c, hair, PAPER, 1); gouache(c, face, PAPER, 1);
    gouache(c, face, SKIN, 1);
    const g = c.createRadialGradient(62, -48, 0, 62, -48, 26); g.addColorStop(0, 'rgba(232,110,105,.5)'); g.addColorStop(1, 'rgba(232,110,105,0)'); c.save(); c.clip(face); c.fillStyle = g; c.fillRect(30, -80, 70, 70); c.restore();
    brush(c, SIDE_FACE, { w: 1.4, color: LINE, al: .5, seed: 61, amp: .15, taper: 0, close: true, smooth: 0 });
    // one big dark eye with a star, like the front view
    if (open > .4) { c.fillStyle = '#fdfaf6'; c.beginPath(); c.ellipse(58, -74, 13, 15, 0, 0, TAU); c.fill(); c.fillStyle = '#120d0d'; c.beginPath(); c.ellipse(60, -72, 10, 12, 0, 0, TAU); c.fill(); c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(56, -78, 2.6, 0, TAU); c.fill(); brush(c, [[45, -74], [52, -88], [64, -89], [71, -76]], { w: 1.8, color: '#1a1212', al: .9, seed: 26, amp: .1, taper: 0 });
      for (const [x, y, dx, dy] of [[48, -80, -9, -7], [51, -86, -6, -9], [56, -89, -3, -10], [47, -72, -10, -2], [71, -80, 7, -7]]) brush(c, [[x, y], [x + dx * .55, y + dy * .55], [x + dx, y + dy]], { w: 2.4, color: '#1a1212', al: .95, seed: 30 + x, amp: .2, taper: 1.3 }); }
    else brush(c, [[48, -74], [60, -70], [72, -74]], { w: 2, color: '#1a1212', al: .9, seed: 25, amp: .2, taper: .5 });
    brush(c, [[48, -102], [62, -105], [74, -102]], { w: 1.6, color: '#2a1d1b', al: .8, seed: 91, amp: .2, taper: 1 });   // brow
    c.fillStyle = SKIN; c.beginPath(); c.moveTo(79, -59); c.lineTo(91, -49); c.lineTo(78, -43); c.closePath(); c.fill();   // tiny nose
    brush(c, [[81, -58], [90, -49], [80, -44]], { w: 1.5, color: LINE, al: .8, seed: 83, amp: .15, taper: .6 });
    brush(c, [[54, -32], [61, -30]], { w: 1.6, color: LINE, al: .85, seed: 82, amp: .2, taper: .5 });                     // mouth
    c.save(); c.clip(hair); c.fillStyle = HAIR_BASE; c.fill(hair); c.restore();
    brush(c, hairPts, { w: 2 * .9, color: '#15100f', al: .9, seed: 951, amp: .15, taper: 0, close: true });
    c.fillStyle = HAIR_BASE; c.fill(lock);
    for (const clipTo of [hair, lock]) { strands(c, clipTo, [...hairPts, ...FRONT_LOCK], 600, 80, [-4, -172]); strands(c, clipTo, FRONT_LOCK, 700, 44, [30, -176], .9); }   // the same strokes clipped to each chunk: one continuous texture, no seam
    brush(c, LOCK_EDGE, { w: 1.8, color: '#15100f', al: .9, seed: 953, amp: .15, taper: 0 }); brush(c, FRONT_LOCK, { w: 1.8, color: '#15100f', al: .9, seed: 952, amp: .15, taper: 0, close: true });
    c.restore();
  }
  function headBack(c, { tilt = 0 } = {}) {
    c.save(); c.rotate(tilt);
    const hair = P2(BACK_HAIR, 1.0);
    c.save(); c.clip(hair); c.fillStyle = HAIR_BASE; c.fill(hair); c.restore();
    strands(c, hair, BACK_HAIR, 800, 70, [0, -185]);
    brush(c, BACK_HAIR, { w: 1.8, color: '#15100f', al: .9, seed: 952, amp: .15, taper: 0, close: true });
    c.restore();
  }

  // ---- body poses -----------------------------------------------------
  // Character units: feet at y = 0, head chin at about y = -250 (so the head's top is ~ -430).
  // A pose: head {x, y, tilt}, torso outline (shirt), two arms (shoulder→elbow→hand), two legs
  // (hip→knee→ankle), two feet, optional held object anchor. L/R are the viewer's left/right.
  const CHIN = -232;
  const torsoBase = (dy = 0, lean = 0) => { const T = CHIN + 16 + dy; return [[-20 + lean, T], [20 + lean, T], [40 + lean, T + 12], [54 + lean * .7, T + 36], [57 + lean * .5, CHIN + 70 + dy], [56, CHIN + 128 + dy], [-56, CHIN + 128 + dy], [-57 + lean * .5, CHIN + 70 + dy], [-54 + lean * .7, T + 36], [-40 + lean, T + 12]]; };   // rounded shoulders
  const POSES = {
    stand:  { head: [0, CHIN, 0], torso: torsoBase(), armL: [[-54, CHIN + 24], [-70, CHIN + 80], [-62, CHIN + 134]], armR: [[54, CHIN + 24], [70, CHIN + 80], [62, CHIN + 134]], legL: [[-30, CHIN + 126], [-32, -60], [-30, -8]], legR: [[30, CHIN + 126], [32, -60], [30, -8]], footL: [-30, -6, 0], footR: [30, -6, 0] },
    // walk cycle, frontal like the character: the legs alternate lifting (knee bends, foot comes
    // up and forward), the body bobs, the arms swing a little, the head tilts with the step
    w1: { head: [0, CHIN - 1, .012], torso: torsoBase(-1), armL: [[-54, CHIN + 23], [-68, CHIN + 80], [-56, CHIN + 132]], armR: [[54, CHIN + 23], [72, CHIN + 80], [70, CHIN + 132]], legL: [[-30, CHIN + 125], [-33, -62], [-31, -8]], legR: [[30, CHIN + 125], [35, -66], [33, -16]], footL: [-31, -6, 0], footR: [33, -13, -.14] },
    w2: { head: [0, CHIN + 1, .006], torso: torsoBase(1), armL: [[-54, CHIN + 25], [-69, CHIN + 81], [-60, CHIN + 134]], armR: [[54, CHIN + 25], [70, CHIN + 81], [65, CHIN + 134]], legL: [[-30, CHIN + 127], [-32, -61], [-30, -8]], legR: [[30, CHIN + 127], [33, -62], [32, -9]], footL: [-30, -6, 0], footR: [32, -7, -.05] },
    w3: { head: [0, CHIN - 1, -.012], torso: torsoBase(-1), armL: [[-54, CHIN + 23], [-72, CHIN + 80], [-70, CHIN + 132]], armR: [[54, CHIN + 23], [68, CHIN + 80], [56, CHIN + 132]], legL: [[-30, CHIN + 125], [-35, -66], [-33, -16]], legR: [[30, CHIN + 125], [33, -62], [31, -8]], footL: [-33, -13, .14], footR: [31, -6, 0] },
    w4: { head: [0, CHIN + 1, -.006], torso: torsoBase(1), armL: [[-54, CHIN + 25], [-70, CHIN + 81], [-65, CHIN + 134]], armR: [[54, CHIN + 25], [69, CHIN + 81], [60, CHIN + 134]], legL: [[-30, CHIN + 127], [-33, -62], [-32, -9]], legR: [[30, CHIN + 127], [32, -61], [30, -8]], footL: [-32, -7, .05], footR: [30, -6, 0] },
    // reaching up for something, then holding it in front (a photo, a sign)
    reach: { head: [0, CHIN - 4, -.04], torso: torsoBase(-2), armL: [[-54, CHIN + 24], [-90, CHIN - 10], [-80, CHIN - 70]], armR: [[54, CHIN + 24], [90, CHIN - 10], [80, CHIN - 70]], legL: [[-30, CHIN + 126], [-32, -60], [-30, -8]], legR: [[30, CHIN + 126], [32, -60], [30, -8]], footL: [-30, -6, 0], footR: [30, -6, 0], hold: [0, CHIN - 70] },
    hold:  { head: [0, CHIN, .02], torso: torsoBase(), armL: [[-54, CHIN + 24], [-92, CHIN + 90], [-96, CHIN + 128]], armR: [[54, CHIN + 24], [92, CHIN + 90], [96, CHIN + 128]], legL: [[-30, CHIN + 126], [-32, -60], [-30, -8]], legR: [[30, CHIN + 126], [32, -60], [30, -8]], footL: [-30, -6, 0], footR: [30, -6, 0], hold: [0, CHIN + 118] },
    // sitting (on a chair/desk edge at y = -110), hands forward on a laptop
    sit:   { head: [0, CHIN + 110, .05], torso: torsoBase(110, 0), armL: [[-54, CHIN + 134], [-70, CHIN + 190], [-44, CHIN + 214]], armR: [[54, CHIN + 134], [70, CHIN + 190], [44, CHIN + 214]], legL: [[-30, CHIN + 236], [-26, -70], [-46, -8]], legR: [[30, CHIN + 236], [26, -70], [46, -8]], footL: [-46, -6, 0], footR: [46, -6, 0] },
  };
  const WALK = ['w1', 'w2', 'stand', 'w3', 'w4', 'stand'];        // lift right, down, pass, lift left, down, pass
  // Profile poses, facing +x. The torso is narrower; the far arm is drawn behind, the near arm in front.
  const sideTorso = (dy = 0) => { const T = CHIN + 16 + dy; return [[-20, T], [24, T], [38, T + 8], [45, T + 28], [46, CHIN + 70 + dy], [44, CHIN + 128 + dy], [-40, CHIN + 128 + dy], [-44, CHIN + 70 + dy], [-42, T + 26], [-34, T + 8]]; };
  Object.assign(POSES, {
    sideStand: { view: 'side', head: [0, CHIN, 0], torso: sideTorso(), armL: [[0, CHIN + 22], [-6, CHIN + 80], [2, CHIN + 134]], armR: [[0, CHIN + 22], [4, CHIN + 80], [10, CHIN + 134]], legL: [[-8, CHIN + 126], [-10, -60], [-8, -8]], legR: [[10, CHIN + 126], [12, -60], [14, -8]], footL: [-2, -6, 0], footR: [20, -6, 0], sideFeet: true },
    // profile walk, a proper cycle: contact (both feet down, legs apart) → recoil (rear foot lifting) → passing
    // (lifted leg swinging under the body) → the same with the legs swapped. Small stride, feet stay low, tiny bob.
    s1: { view: 'side', head: [2, CHIN - 1, .01], torso: sideTorso(-1), armL: [[0, CHIN + 22], [-16, CHIN + 76], [-24, CHIN + 124]], armR: [[0, CHIN + 22], [14, CHIN + 76], [22, CHIN + 124]], legL: [[-6, CHIN + 125], [-16, -66], [-26, -10]], legR: [[8, CHIN + 125], [22, -68], [30, -10]], footL: [-20, -6, 0], footR: [36, -6, 0], sideFeet: true },
    s2: { view: 'side', head: [2, CHIN + 1, .01], torso: sideTorso(1), armL: [[0, CHIN + 22], [-10, CHIN + 78], [-12, CHIN + 128]], armR: [[0, CHIN + 22], [8, CHIN + 78], [10, CHIN + 128]], legL: [[-6, CHIN + 127], [-12, -64], [-14, -8]], legR: [[8, CHIN + 127], [12, -78], [6, -28]], footL: [-8, -6, 0], footR: [12, -24, -.3], sideFeet: true },
    sp1: { view: 'side', head: [2, CHIN - 2, 0], torso: sideTorso(-2), armL: [[0, CHIN + 22], [-4, CHIN + 80], [0, CHIN + 134]], armR: [[0, CHIN + 22], [2, CHIN + 80], [6, CHIN + 134]], legL: [[-6, CHIN + 124], [-8, -62], [-6, -8]], legR: [[8, CHIN + 124], [18, -80], [22, -24]], footL: [0, -6, 0], footR: [28, -20, -.25], sideFeet: true },
    s3: { view: 'side', head: [2, CHIN - 1, .01], torso: sideTorso(-1), armL: [[0, CHIN + 22], [14, CHIN + 76], [22, CHIN + 124]], armR: [[0, CHIN + 22], [-16, CHIN + 76], [-24, CHIN + 124]], legL: [[-6, CHIN + 125], [8, -68], [16, -10]], legR: [[8, CHIN + 125], [-8, -66], [-18, -10]], footL: [22, -6, 0], footR: [-12, -6, 0], sideFeet: true },
    s4: { view: 'side', head: [2, CHIN + 1, .01], torso: sideTorso(1), armL: [[0, CHIN + 22], [8, CHIN + 78], [10, CHIN + 128]], armR: [[0, CHIN + 22], [-10, CHIN + 78], [-12, CHIN + 128]], legL: [[-6, CHIN + 127], [-2, -78], [-8, -28]], legR: [[8, CHIN + 127], [2, -64], [0, -8]], footL: [-2, -24, -.3], footR: [6, -6, 0], sideFeet: true },
    sp2: { view: 'side', head: [2, CHIN - 2, 0], torso: sideTorso(-2), armL: [[0, CHIN + 22], [2, CHIN + 80], [6, CHIN + 134]], armR: [[0, CHIN + 22], [-4, CHIN + 80], [0, CHIN + 134]], legL: [[-6, CHIN + 124], [4, -80], [8, -24]], legR: [[8, CHIN + 124], [6, -62], [8, -8]], footL: [14, -20, -.25], footR: [14, -6, 0], sideFeet: true },
    // from behind: hair only, arms at the sides (or raised: brushing teeth, looking at something)
    back: { view: 'back', head: [0, CHIN, 0], torso: torsoBase(), armL: [[-54, CHIN + 24], [-70, CHIN + 80], [-62, CHIN + 134]], armR: [[54, CHIN + 24], [70, CHIN + 80], [62, CHIN + 134]], legL: [[-30, CHIN + 126], [-32, -60], [-30, -8]], legR: [[30, CHIN + 126], [32, -60], [30, -8]], footL: [-30, -6, 0], footR: [30, -6, 0] },
    backUp: { view: 'back', head: [0, CHIN, 0], torso: torsoBase(), armL: [[-54, CHIN + 24], [-108, CHIN + 10], [-96, CHIN - 70]], armR: [[54, CHIN + 24], [108, CHIN + 10], [96, CHIN - 70]], legL: [[-30, CHIN + 126], [-32, -60], [-30, -8]], legR: [[30, CHIN + 126], [32, -60], [30, -8]], footL: [-30, -6, 0], footR: [30, -6, 0] },
    // stretching / changing: both arms straight up, a little lean
    armsUp: { head: [6, CHIN - 2, .06], torso: torsoBase(-2, 6), armL: [[-54, CHIN + 22], [-96, CHIN - 50], [-84, CHIN - 190]], armR: [[54, CHIN + 22], [100, CHIN - 50], [90, CHIN - 190]], legL: [[-30, CHIN + 126], [-34, -60], [-32, -8]], legR: [[30, CHIN + 126], [34, -60], [32, -8]], footL: [-32, -6, 0], footR: [32, -6, 0] },
  });
  const SIDE_WALK = ['s1', 's2', 'sp1', 's3', 's4', 'sp2'];

  // limbs: an outline of a tube, in pen. Arms are bare (short sleeves); legs are the trouser legs.
  function tube(c, pts, w, seed, fill) { const q = spline(pts, 5), L = [], R = []; for (let i = 0; i < q.length; i++) { const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)]; let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const n = Math.hypot(nx, ny) || 1; nx /= n * 2 / w; ny /= n * 2 / w; L.push([q[i][0] + nx, q[i][1] + ny]); R.push([q[i][0] - nx, q[i][1] - ny]); } const path = P2([...L, ...R.reverse()], 2.5); gouache(c, path, fill || SKIN, 1); brush(c, L, PEN(seed, 1.6, .55)); brush(c, R, PEN(seed + 1, 1.6, .55)); const end = q[q.length - 1]; brush(c, [L[L.length - 1], [end[0], end[1] + w * .3], R[0]], PEN(seed + 2, 1.6, .5)); }
  function foot(c, [x, y, rot], seed, side = false) { c.save(); c.translate(x, y + 5); c.rotate(rot); const pts = side ? [[-14, 0], [22, 0], [24, -8], [14, -14], [-8, -14], [-14, -8]] : [[-15, 0], [15, 0], [16, -9], [9, -15], [-9, -15], [-16, -9]]; gouache(c, P2(pts, 1.1), SKIN, 1); brush(c, pts, PEN(seed, 1.6, .55, true)); c.restore(); }
  // the tee: body outline, crew neck, two short set-in sleeves (only the near one in profile)
  function shirt(c, p) {
    const t = p.torso, path = P2(t, 1.1); gouache(c, path, TEE, 1); brush(c, t, PEN(430, 1.8, .6, true));
    const y0 = t[0][1], side = p.view === 'side';
    const nl = side ? [[-6, y0 - 1], [-2, y0 + 7], [10, y0 + 10], [22, y0 + 7], [26, y0 - 1]] : [[-22, y0 - 1], [-14, y0 + 8], [0, y0 + 11], [14, y0 + 8], [22, y0 - 1]];
    if (p.view !== 'back') { c.save(); c.fillStyle = SKIN; c.beginPath(); c.moveTo(nl[0][0], y0 - 3); for (const q of nl) c.lineTo(q[0], q[1]); c.lineTo(nl[4][0], y0 - 3); c.closePath(); c.fill(); c.restore(); }
    brush(c, nl, PEN(431, 1.8, .8));
    const by = Math.max(...t.map(q => q[1])), bx = t.filter(q => q[1] === by).map(q => q[0]);
    brush(c, [[Math.min(...bx) + 6, by - 4], [Math.max(...bx) - 6, by - 4]], PEN(434, 1.6, .5));   // hem
  }
  // pants: the leg tubes plus a cuff line above each foot
  function pantLeg(c, pts, seed) { tube(c, pts, 26, seed, PANTS); const e = pts[pts.length - 1], d = pts[pts.length - 2]; let nx = -(e[1] - d[1]), ny = e[0] - d[0]; const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n; brush(c, [[e[0] - nx * 14, e[1] - ny * 14 - 12], [e[0] + nx * 14, e[1] + ny * 14 - 12]], PEN(seed + 3, 1.6, .6)); }

  // draw(c, poseId, { x, y, scale, flip, open, gx, gy, heldW, heldH, drawHeld })
  // x,y = where the feet stand (frame units). Order: back arm, legs, shirt, head, front arm, held object.
  function draw(c, id, o = {}) {
    const p = POSES[id] || POSES.stand, { x = 0, y = 0, scale = 1, flip = false, open = 1, gx = 0, gy = 0, heldW = 0, heldH = 0, drawHeld = null } = o;
    c.save(); c.translate(x, y); c.scale(flip ? -scale : scale, scale);
    const side = p.view === 'side', back = p.view === 'back';
    const LIFT = 3;                                     // the head sits a little above the collar: room for a neck
    const neck = () => { if (back) return; const hx = p.head[0], hy = p.head[1] - LIFT, y0 = p.torso[0][1], w = side ? 10 : 13; c.save(); c.fillStyle = SKIN; c.fillRect(hx - w, hy - 10, w * 2, y0 - hy + 14); c.restore(); brush(c, [[hx - w, hy - 8], [hx - w, y0 + 3]], PEN(450, 1.6, .55)); brush(c, [[hx + w, hy - 8], [hx + w, y0 + 3]], PEN(451, 1.6, .55)); };
    const drawHead = () => { c.save(); c.translate(p.head[0], p.head[1] - LIFT); if (side) headSide(c, { open, tilt: p.head[2], hairPts: SIDE_HAIR }); else if (back) headBack(c, { tilt: p.head[2] }); else head(c, { open, gx, gy, tilt: p.head[2] }); c.restore(); };
    {
      const arm = a => side ? a : a.map(q => [q[0] * .88, q[1]]);       // frontal: arms a little closer in
      tube(c, arm(p.armL), 13, 400);                                 // far / left arm behind
      const legIn = side ? 0 : 10, ground = side ? 0 : -2;              // frontal: legs closer together, trouser legs run to the floor
      const leg = l => l.map((q, i) => [q[0] - Math.sign(q[0]) * legIn * (i === 0 ? .6 : 1), q[1] + (i === l.length - 1 ? ground : 0)]);
      const spread = side ? 9 : 0, sl = l => l.map(q => [q[0] - spread, q[1]]), sr = l => l.map(q => [q[0] + spread, q[1]]);   // profile: legs a little apart
      pantLeg(c, sl(leg(p.legL)), 410); pantLeg(c, sr(leg(p.legR)), 414);
      const ft = f => [f[0] - Math.sign(f[0]) * legIn, f[1], f[2]];
      foot(c, p.sideFeet ? [p.footL[0] - spread, p.footL[1], p.footL[2]] : ft(p.footL), 420, p.sideFeet); foot(c, p.sideFeet ? [p.footR[0] + spread, p.footR[1], p.footR[2]] : ft(p.footR), 421, p.sideFeet);
      shirt(c, p);
      if (back) { tube(c, arm(p.armR), 13, 402); drawHead(); } else { neck(); drawHead(); tube(c, arm(p.armR), 13, 402); }
    }
    if (p.hold && heldW) { c.save(); c.translate(p.hold[0], p.hold[1]); if (drawHeld) drawHeld(c, heldW, heldH); else { const q = [[-heldW / 2, -heldH / 2], [heldW / 2, -heldH / 2], [heldW / 2, heldH / 2], [-heldW / 2, heldH / 2]]; gouache(c, P2(q, .6), PAPER, 1); brush(c, q, PEN(440, 2.4, .9, true)); } c.restore(); }
    c.restore();
  }
  // ---- the traced routine figures (public/engine/routine-data.js, from hero-film/trace_routine.py) ----
  // Each figure's strokes are in units of its head width, origin at its hair centre. We scale one
  // unit to our head width and draw our head where the hair was, top edges aligned.
  // facing pinned per figure (detection from the cut-out face is unreliable); mirror: [dx, dy, scale] in head widths
  const ROUTINE_TWEAKS = { wake: { facing: 'front', open: .12 }, sleepmore: { facing: 'back', tilt: -1.35, centre: true }, change: { facing: 'front' }, toilet: { facing: 'front' }, water: { facing: 'front' }, turtle: { facing: 'front', tilt: -.35 }, breakfast: { facing: 'front' }, teeth: { facing: 'back', mirror: [-.88, -.16, .86] }, play: { facing: 'front' } };
  const HEAD_W = HAIR_BOX[2] - HAIR_BOX[0], HEAD_TOP = HAIR_BOX[1];
  const ROUTINE_BY_NAME = Object.fromEntries((typeof ROUTINE !== 'undefined' ? ROUTINE : []).map(f => [f.name, f]));
  // drawRoutine(c, name, { x, y, scale, open }): x,y = where the figure's feet stand (its lowest point)
  function drawRoutine(c, name, o = {}) {
    const f = ROUTINE_BY_NAME[name]; if (!f) return;
    const { x = 0, y = 0, scale = 1, open: openIn = 1 } = o, tw = ROUTINE_TWEAKS[name] || {}, U = HEAD_W;
    const facing = tw.facing || f.facing, open = tw.open ?? openIn;
    c.save(); c.translate(x, y - f.feet * U * scale); c.scale(scale, scale);
    for (const [i, st] of f.strokes.entries()) brush(c, st.map(([px, py]) => [px * U, py * U]), { w: 2.2, color: LINE, al: .8, seed: 600 + i, amp: .5, taper: .2, smooth: st.length > 3 });
    // our head where the hair was: the traced hair's top is at -hairH/2 units
    const HEAD_CY = (HAIR_BOX[1] + HAIR_BOX[3]) / 2, HS2 = 1.08;
    c.save();
    if (tw.centre) { c.rotate(tw.tilt || 0); c.scale(HS2, HS2); c.translate(0, -HEAD_CY); }           // rotate about the hair centre (a head on the floor)
    else { c.translate(0, -f.hairH / 2 * U); c.scale(HS2, HS2); c.translate(0, -HEAD_TOP); }
    if (facing === 'back') headBack(c, { tilt: tw.centre ? 0 : (tw.tilt || 0) });
    else if (facing === 'side') { if (f.side < 0) c.scale(-1, 1); headSide(c, { open, tilt: tw.tilt || 0 }); }
    else head(c, { open, tilt: tw.tilt || 0 });
    c.restore();
    if (tw.mirror) { const [mx, my, ms] = tw.mirror; c.save(); c.translate(mx * U, my * U); c.scale(ms, ms); c.translate(0, -HEAD_CY); head(c, { open }); c.restore(); }   // her reflection
    c.restore();
  }
  const ROUTINE_NAMES = Object.keys(ROUTINE_BY_NAME);
  return { draw, drawRoutine, ROUTINE_NAMES, head, headSide, headBack, POSES, WALK, SIDE_WALK, CHIN, HAIR_BOX };
}
return { build };
})();
