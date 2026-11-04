import { useEffect, useRef } from 'react';

// The comic panel's frame: a white mat and the engine's wobbly ink edge (public/engine/core.js brush),
// drawn into a canvas that covers its parent. Shared by the hero and the other panels.
export default function Frame({ mat = '#fffaf4' }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, c = canvas.getContext('2d');
    const draw = () => {
      const box = canvas.parentElement.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(box.width), h = Math.round(box.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      const M = Math.round(Math.min(w, h) * .052), K = Math.min(w, h) / 1080;
      c.fillStyle = mat; c.fillRect(0, 0, w, M); c.fillRect(0, h - M, w, M); c.fillRect(0, 0, M, h); c.fillRect(w - M, 0, M, h);
      if (!window.brush) { c.strokeStyle = '#1a1212'; c.lineWidth = 7 * K; c.strokeRect(M, M, w - 2 * M, h - 2 * M); return; }
      // the same dense path the intro uses (a point every 12px), so the wobble is smooth and the corners close cleanly
      const pts = [], corners = [[M, M], [w - M, M], [w - M, h - M], [M, h - M]]; let carry = 0;
      for (let i = 0; i < 4; i++) { const a = corners[i], b = corners[(i + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let d = carry; while (d < L) { const t = d / L; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); d += 12; } carry = d - L; }
      window.brush(c, pts, { w: 7 * K, color: '#1a1212', al: .95, seed: 830, amp: .8, taper: 0, close: true, smooth: false });
    };
    draw();
    let t = 0; const onResize = () => { clearTimeout(t); t = setTimeout(draw, 120); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, [mat]);
  return <canvas ref={ref} className="panel-frame" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20 }} />;
}
