import { useEffect, useRef, useState } from 'react';

// The hero intro: Katherine's hand-drawn face fills the screen, idles (blinks,
// glances, hair sways, stars twinkle), then on the first scroll / tap / key — or
// after a few seconds — she blinks, the screen's eyelids close with hers, and they
// open onto the page underneath. The drawing lives in public/engine/face.js
// (window.HeroFace), shared with the film in hero-film/face.html.
//
// Phases: idle → blink (0.9 s) → open (0.3 s hold + 1.1 s) → done (unmounted).
const BLINK_DUR = 0.9, OPEN_HOLD = 0.3, OPEN_DUR = 1.1, AUTO_AFTER = 7;

export default function HeroIntro() {
  const canvasRef = useRef(null);
  const [done, setDone] = useState(() =>
    typeof window === 'undefined' || !window.HeroFace ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  );

  useEffect(() => {
    if (done) return;
    const canvas = canvasRef.current;
    const R = window.HeroFace.makeRenderer(canvas);
    R.resize();

    // lock the page behind the intro
    const html = document.documentElement, body = document.body;
    const prev = { html: html.style.overflow, body: body.style.overflow };
    html.style.overflow = 'hidden'; body.style.overflow = 'hidden';

    let phase = 'idle', t0 = performance.now(), start = t0, raf = 0, warmed = false, alive = true;
    const now = () => (performance.now() - t0) / 1000;

    const trigger = () => { if (phase === 'idle') { phase = 'blink'; start = performance.now(); } };
    const onKey = e => { if (!e.metaKey && !e.ctrlKey && !e.altKey) trigger(); };
    const opts = { passive: true };
    window.addEventListener('wheel', trigger, opts);
    window.addEventListener('touchstart', trigger, opts);
    window.addEventListener('pointerdown', trigger, opts);
    window.addEventListener('keydown', onKey);
    const auto = setTimeout(trigger, AUTO_AFTER * 1000);

    let resizeTimer = 0;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { R.resize(); warmed = false; }, 150); };
    window.addEventListener('resize', onResize);

    const frame = () => {
      if (!alive) return;
      const t = now();
      if (phase === 'idle') {
        R.idle(t);
        if (!warmed) warmed = R.warm();            // one more cached drawing per frame, so the blink never stutters
      } else if (phase === 'blink') {
        const k = Math.min(1, (performance.now() - start) / 1000 / BLINK_DUR);
        R.blink(t, k * k * (3 - 2 * k));
        if (k >= 1) { phase = 'open'; start = performance.now(); }
      } else if (phase === 'open') {
        const s = (performance.now() - start) / 1000, k = Math.max(0, Math.min(1, (s - OPEN_HOLD) / OPEN_DUR));
        R.open(1 - Math.pow(1 - k, 3));
        if (s >= OPEN_HOLD + OPEN_DUR) { alive = false; setDone(true); return; }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      alive = false; cancelAnimationFrame(raf); clearTimeout(auto); clearTimeout(resizeTimer);
      window.removeEventListener('wheel', trigger); window.removeEventListener('touchstart', trigger);
      window.removeEventListener('pointerdown', trigger); window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      html.style.overflow = prev.html; body.style.overflow = prev.body;
      window.scrollTo(0, 0);
    };
  }, [done]);

  if (done) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-label="Katherine, drawn, blinking"
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'block', touchAction: 'none', cursor: 'pointer' }}
    />
  );
}
