// The lights-off beat of the hero intro (after the "Doomscrolling" reference): black; only her eyes,
// wandering; she finds a hanging lamp's pull-string and tugs it — light on, off, on — and the cone of
// light opens to a white screen. Drawn in flat black-and-white: she is drawn normally (HeroBody) and
// thresholded. Classic script: needs core.js, face.js (HeroFace) and body.js (HeroBody). Exposes
// window.HeroLamp = { make() } → { draw(c, t), warm(), DUR }, sized to the current format (W, H).
'use strict';
window.HeroLamp = (() => {
  const PULLS = [2.6, 4.2, 5.3], OPEN_AT = 5.4, OPENING = OPEN_AT + .3, DUR = OPENING + 1.3 + .5;   // tugs: on · off · on; then the light opens
  // pupils (gx, gy) and where the whole pair of eyes has moved to (dx, dy; in 1080-high units): slow confused looks,
  // then at ~2.1 s she spots the string and settles on it; after the first pull she just looks up at it
  const GAZE = [[0, 0, 2, 0, 0], [.35, 0, 2, 0, 0], [.5, -9, 1, -220, -50], [.9, -9, 1, -220, -50], [1.05, 9, -4, 230, 70], [1.45, 9, -4, 230, 70], [1.6, -3, 6, -60, 130], [1.95, -3, 6, -60, 130], [2.1, 2, -7, 0, 0], [2.55, 2, -7, 0, 0], [9, 2, -7, 0, 0]];
  // a tap during the beat: how far to jump the clock so the next tug (or the opening) happens right now
  const skipTo = t => { for (const p of [...PULLS, OPENING]) if (p > t + .02) return p - t; return 0; };
  const blink = (t, p = 2.9) => { const u = t % p; if (u < p - .5) return 1; const v = (u - (p - .5)) / .5; return v < .3 ? 1 - v / .3 : v < .5 ? 0 : (v - .5) / .5; };
  const bbox = pts => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; };
  const P2 = (pts, corner = 1.2) => { const p = new Path2D(); const s = smoothPts(pts, true, 4, corner); s.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; };
  function gaze(t) { let i = 0; while (i < GAZE.length - 1 && t >= GAZE[i + 1][0]) i++; const a = GAZE[i], b = GAZE[Math.min(i + 1, GAZE.length - 1)]; const k = easeIO(clamp((t - b[0] + .3) / .3, 0, 1)); return [1, 2, 3, 4].map(j => lerp(a[j], b[j], k)); }

  function make() {
    const B = HeroBody.build({ paper: '#f4efe4' }), CHIN = B.CHIN;
    const K = Math.min(H / 1080, W / 1920 * 1.9), MAT = 44 * K;        // authored for a 1080-high frame; on narrow screens she shrinks so the lamp stays in view
    B.POSES.pull = { ...B.POSES.stand, head: [0, CHIN, 0], armL: [[-54, CHIN + 24], [-100, CHIN + 66], [-74, CHIN + 98]], armR: [[54, CHIN + 24], [112, CHIN - 60], [86, CHIN - 180]] };
    B.POSES.pullDown = { ...B.POSES.pull, armR: [[54, CHIN + 24], [116, CHIN - 40], [90, CHIN - 152]] };
    for (const id of ['pull', 'pullDown']) B.POSES[id + 'Body'] = { ...B.POSES[id], armR: [[54, 3000], [54, 3060], [54, 3120]] };   // its own arm pushed off the canvas; the arm is drawn on top
    const FACE = HeroFace.build({ scale: 190 / 473, cx: 0, cy: 0 }), FSS = (190 / 473) / 3.3;   // the hero's eye shapes, in head units
    const DK = { scale: 2.6 * K, x: W * .46 }; DK.y = H * .67 - 2.6 * K * CHIN;     // her feet below the frame: head, raised arm and the lamp fill it
    const headPt = ([x, y]) => [DK.x + DK.scale * (x * FSS), DK.y + DK.scale * (CHIN - 3 + y * FSS)];
    const bodyPt = ([x, y]) => [DK.x + DK.scale * x, DK.y + DK.scale * y];
    const handPt = id => bodyPt(B.POSES[id].armR[2]);
    const LAMP = [bodyPt(B.POSES.pull.armR[2])[0] + 6 * K, MAT + 70 * K];         // where the shade hangs, straight above her hand

    const cache = new Map();
    function silhouette(id, open, gx, gy) {                            // her, drawn normally then thresholded to pure black / white
      const key = [id, Math.round(open * 4), Math.round(gx), Math.round(gy)].join();
      if (cache.has(key)) return cache.get(key);
      const o = layer(), g = o.getContext('2d'); g.setTransform(S, 0, 0, S, 0, 0);
      B.draw(g, id + 'Body', { x: DK.x, y: DK.y, scale: DK.scale, open: Math.round(open * 4) / 4, gx, gy });
      const im = g.getImageData(0, 0, o.width, o.height), d = im.data;
      for (let i = 0; i < d.length; i += 4) { const a = d[i + 3]; if (a < 90) { d[i + 3] = 0; continue; } const l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255; const v = l < .68 ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      g.putImageData(im, 0, 0);
      const arm = B.POSES[id].armR.map(bodyPt), [hx, hy] = handPt(id), sp = spline(arm, 8);   // the raised arm: white with a pen edge
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (const [col, w] of [['#000', 15 * DK.scale + 8 * K], ['#fff', 15 * DK.scale]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); sp.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(hx, hy, w * .62, 0, TAU); g.fill(); }
      cache.set(key, o); return o;
    }
    function eyesOnly(c, open, gx, gy, dx = 0, dy = 0) {               // in the dark: just the eyes, floating wherever she has turned to
      c.save(); c.translate(dx * Math.min(K, W / 1400), dy * K);              // on a narrow screen the wander is reined in
      for (const e of FACE.EYES) {
        const pts = e.pts.map(headPt), q = P2(pts, 1.2), [x0, y0, x1, y1] = bbox(pts), h = y1 - y0;
        c.save(); c.clip(q); c.fillStyle = '#fff'; c.fillRect(x0 - 5, y0 - 5, x1 - x0 + 10, h + 10);
        const pc = headPt([(e.box[0] + e.box[2]) / 2 + gx * 3, Math.max(e.box[1] + e.pr * .98, (e.box[1] + e.box[3]) / 2 - (e.box[3] - e.box[1]) * .04) + gy * 3]);
        c.fillStyle = '#000'; c.beginPath(); c.arc(pc[0], pc[1], e.pr * FSS * DK.scale, 0, TAU); c.fill();
        c.fillRect(x0 - 5, y0 - 5, x1 - x0 + 10, (1 - open) * h * 1.04 + 5); c.restore();
      }
      c.restore();
    }
    function string(c, id, lit) {                                      // the pull-string, from the shade down to her hand
      const [hx, hy] = handPt(id); brush(c, [[LAMP[0], LAMP[1] + 30 * K], [LAMP[0] + 2, (LAMP[1] + hy) / 2], [hx, hy - 6 * K]], { w: 3.5 * K, color: lit ? '#000' : '#fff', al: 1, seed: 8, amp: .4 * K, taper: 0 });
      c.fillStyle = lit ? '#000' : '#fff'; c.beginPath(); c.arc(hx, hy - 2 * K, 7 * K, 0, TAU); c.fill();
    }
    function lampShade(c) {                                            // the lamp: a cord from the top, a bell shade, black with a white edge
      const [x, y] = LAMP, pts = [[-110, 30], [-82, -22], [-34, -56], [34, -56], [82, -22], [110, 30]].map(([u, v]) => [x + u * K, y + v * K]);
      brush(c, [[x, -10], [x, y - 56 * K]], { w: 5 * K, color: '#000', al: 1, seed: 3, amp: .3, taper: 0 });
      c.fillStyle = '#000'; c.beginPath(); pts.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath(); c.fill();
      brush(c, pts, { w: 5 * K, color: '#fff', al: 1, seed: 4, amp: .6 * K, taper: 0, close: true });
    }
    function wedge(c, spread) {                                        // the lamp's cone of light: apex at the shade, opening downward, chalky edges
      const ap = [LAMP[0], LAMP[1] + 24 * K - spread * 900 * K], L = 3200 * Math.max(K, W / 1920);
      const aL = Math.PI / 2 + .62 + spread * 1.0, aR = Math.PI / 2 - .62 - spread * 1.0;
      const e1 = [ap[0] + Math.cos(aL) * L, ap[1] + Math.sin(aL) * L], e2 = [ap[0] + Math.cos(aR) * L, ap[1] + Math.sin(aR) * L];
      const poly = [ap, e1, [e1[0], 6000 * K], [e2[0], 6000 * K], e2];
      const q = new Path2D(); q.moveTo(...poly[0]); for (const p of poly.slice(1)) q.lineTo(...p); q.closePath();
      c.fillStyle = '#fff'; c.fill(q);
      for (const [a, sd] of [[aL, 11], [aR, 12]]) { const pts = []; for (let i = 0; i <= 30; i++) pts.push([ap[0] + Math.cos(a) * L * i / 30, ap[1] + Math.sin(a) * L * i / 30]); brush(c, pts, { w: 9 * K, color: '#fff', al: .9, seed: sd, amp: 5 * K, taper: 0 }); brush(c, pts, { w: 5 * K, color: '#000', al: .5, seed: sd + 5, amp: 7 * K, taper: 0 }); }
      return q;
    }
    // draw(c, t, under): t = seconds since the dark began. Returns true once the screen is fully white.
    // under(c), if given, is drawn inside the cone while it opens (spread > 0): what the light reveals.
    function draw(c, t, under) {
      resetT(c); c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      const tug = PULLS.some(p => t > p && t < p + .28), id = tug ? 'pullDown' : 'pull';
      const lit = (t > PULLS[0] + .15 && t < PULLS[1] + .15) || t > PULLS[2] + .15;
      const spread = t > OPEN_AT + .3 ? easeIn(clamp((t - OPEN_AT - .3) / 1.3, 0, 1)) : 0, sink = easeIn(clamp((t - OPEN_AT - .2) / 1.0, 0, 1));
      const open = t < .3 ? clamp((t - .12) / .18, 0, 1) : blink(t + 1.0), [gx, gy, ex, ey] = lit ? [1, -3, 0, 0] : gaze(t);
      if (!lit) { eyesOnly(c, open, gx, gy, ex, ey); string(c, id, false); return false; }
      const q = wedge(c, spread);
      c.save(); c.clip(q); if (under && spread > 0) under(c, spread);
      c.translate(0, sink * 1100 * K);                                 // after the last pull she drops out of the bottom of the frame
      c.drawImage(silhouette(id, open, gx, gy), 0, 0, W, H); c.restore();
      const lampAl = 1 - clamp((t - OPENING) / .4, 0, 1);               // the lamp and its string go quickly once the light opens
      if (lampAl > 0) { c.save(); c.globalAlpha = lampAl; string(c, id, true); lampShade(c); c.restore(); }   // the string hangs from the lamp whether or not she is holding it
      return spread >= 1;
    }
    // warm one more thresholded drawing into the cache; true when there is nothing left to warm
    function warm() { for (const id of ['pull', 'pullDown']) for (const open of [1, .75, .5, .25, 0]) { const key = [id, Math.round(open * 4), 1, -3].join(); if (!cache.has(key)) { silhouette(id, open, 1, -3); return false; } } return true; }
    function dispose() { for (const o of cache.values()) dropLayer(o); cache.clear(); }
    return { draw, warm, skipTo, dispose, DUR, OPENING };
  }
  return { make, skipTo, DUR, OPENING };
})();
