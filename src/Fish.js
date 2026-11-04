import { useEffect, useRef } from 'react';

// Big ASCII fish swimming slowly across the hero's background: each one is a fish silhouette sampled on a
// grid of characters (denser characters toward the spine, dots at the edges), drifting left to right with a
// slow sway and a flick of the tail, faint grey so the name and photo stay in front.
const RAMP = ['.', ':', '-', '~', '=', 'o', 'x', '8', '@'];
const FISH = [   // [length px at 1920 wide, lane (fraction of height), speed px/s, starting x fraction, direction]
  [640, .28, 26, .10, 1], [460, .64, 34, .70, -1], [360, .84, 22, .40, 1]];

export default function Fish() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, c = canvas.getContext('2d');
    let raf = 0, w = 0, h = 0, dpr = 1;
    const size = () => { const box = canvas.parentElement.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 1.5); w = Math.round(box.width); h = Math.round(box.height); canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; };
    size();
    const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
    const t0 = performance.now();
    const draw = () => {
      const t = (performance.now() - t0) / 1000, k = w / 1920;
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      FISH.forEach(([L0, lane, v0, x0, dir], fi) => {
        const L = L0 * k, cell = Math.max(9, L / 34), span = w + L * 1.4, v = v0 * k;
        let x = ((x0 * w + dir * v * t) % span + span) % span - L * .7;   // wraps around the panel
        if (dir < 0) x = w - x;
        const y = lane * h + Math.sin(t * .6 + fi * 2) * h * .02;
        const cols = Math.ceil(L / cell) + 2, rows = Math.ceil(L * .5 / cell) + 2, flick = Math.sin(t * 2.2 + fi) * .18;
        c.font = `${Math.round(cell * 1.15)}px "JetBrains Mono", Menlo, monospace`;
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          const px = (i - cols / 2 + .5) * cell, py = (j - rows / 2 + .5) * cell;     // fish-local, nose at +x
          const u = px / (L * .5), vv = py / (L * .25);                             // body ellipse: u in -1..1
          let d = 0;
          if (u > -.55) { const body = 1 - (u * u) / 1 - (vv * vv) / (1 - .35 * Math.max(0, u)); d = Math.max(0, body); }   // the body, tapering to the nose
          else { const tu = (-u - .55) / .45, tail = 1 - Math.abs(vv - flick * tu * 2) / (.25 + tu * 1.0); if (tu <= 1 && tail > 0) d = Math.max(0, tail * .7); }   // the tail fin, flicking
          if (d <= .02) continue;
          const eye = Math.hypot(u - .55, vv) < .13;
          const ch = eye ? 'o' : RAMP[Math.min(RAMP.length - 1, Math.floor((d * .8 + .15 * hash(i, j + fi * 7)) * RAMP.length))];
          c.fillStyle = eye ? 'rgba(95,88,82,.95)' : `rgba(125,118,110,${.3 + d * .5})`;
          c.fillText(ch, x + px * dir, y + py);
        }
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    let rt = 0; const onResize = () => { clearTimeout(rt); rt = setTimeout(size, 120); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); clearTimeout(rt); };
  }, []);
  return <canvas ref={ref} className="hero-fish" aria-hidden="true" />;
}
