import { useEffect, useRef } from 'react';

// The comic panel's frame: a white mat and the engine's wobbly ink edge (public/engine/core.js brush).
// Drawn into four strip canvases along the edges rather than one covering the panel: the same drawing, but the
// bitmaps are a few percent of the area (a full-panel canvas at retina density is 10–20 MB, and Safari's canvas
// budget is tight). Shared by the hero and the other panels.
export default function Frame({ mat = '#fffaf4' }) {
  const ref = useRef(null);
  useEffect(() => {
    const host = ref.current, strips = [...host.children];
    const draw = () => {
      const box = host.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(box.width), h = Math.round(box.height); if (!w || !h) return;
      const M = Math.round(Math.min(w, h) * .052), K = Math.min(w, h) / 1080, T = M + Math.ceil(14 * K);   // the strips reach past the line's wobble
      // the same dense path the intro uses (a point every 12px), so the wobble is smooth and the corners close cleanly
      const pts = [], corners = [[M, M], [w - M, M], [w - M, h - M], [M, h - M]]; let carry = 0;
      for (let i = 0; i < 4; i++) { const a = corners[i], b = corners[(i + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let d = carry; while (d < L) { const t = d / L; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); d += 12; } carry = d - L; }
      const rects = [[0, 0, w, T], [0, h - T, w, T], [0, T, T, h - 2 * T], [w - T, T, T, h - 2 * T]];   // top, bottom, left, right: no overlap, so nothing is drawn twice
      strips.forEach((canvas, i) => {
        const [x, y, sw, sh] = rects[i]; if (sw <= 0 || sh <= 0) { canvas.width = 0; canvas.height = 0; return; }
        canvas.width = Math.round(sw * dpr); canvas.height = Math.round(sh * dpr);
        canvas.style.left = x + 'px'; canvas.style.top = y + 'px'; canvas.style.width = sw + 'px'; canvas.style.height = sh + 'px';
        const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, -x * dpr, -y * dpr); c.clearRect(x, y, sw, sh);
        c.fillStyle = mat; c.fillRect(0, 0, w, M); c.fillRect(0, h - M, w, M); c.fillRect(0, 0, M, h); c.fillRect(w - M, 0, M, h);
        if (!window.brush) { c.strokeStyle = '#1a1212'; c.lineWidth = 7 * K; c.strokeRect(M, M, w - 2 * M, h - 2 * M); return; }
        window.brush(c, pts, { w: 7 * K, color: '#1a1212', al: .95, seed: 830, amp: .8, taper: 0, close: true, smooth: false });
      });
    };
    draw();
    let t = 0; const onResize = () => { clearTimeout(t); t = setTimeout(draw, 120); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, [mat]);
  const strip = { position: 'absolute', left: 0, top: 0, display: 'block' };
  return (
    <div ref={ref} className="panel-frame" aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
      <canvas style={strip} /><canvas style={strip} /><canvas style={strip} /><canvas style={strip} />
    </div>
  );
}
