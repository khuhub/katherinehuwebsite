import { useEffect, useRef, useState } from 'react';

// The hero intro: Katherine's hand-drawn face fills the screen, idles (blinks,
// glances, hair sways, stars twinkle), then on the first scroll / tap / key — or
// after a few seconds — she blinks, the screen's eyelids close with hers, and they
// open onto the page underneath. The drawing lives in public/engine/face.js
// (window.HeroFace), shared with the film in hero-film/face.html.
//
// After the blink the screen stays dark: only her eyes, wandering; she pulls a hanging lamp on, off, on,
// and the cone of light opens to white, which fades out onto the page (public/engine/lamp.js, window.HeroLamp).
//
// Phases: idle → blink (0.9 s) → dark (the lamp beat, ~7.5 s) → reveal (0.6 s fade) → done (unmounted).
const BLINK_DUR = 0.9, REVEAL_DUR = 0.6, AUTO_AFTER = 7;

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
    let L = window.HeroLamp.make(), lampWarm = false;              // the lamp beat, sized to the viewport

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
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { R.resize(); L = window.HeroLamp.make(); warmed = false; lampWarm = false; }, 150); };
    window.addEventListener('resize', onResize);

    const frame = () => {
      if (!alive) return;
      const t = now();
      if (phase === 'idle') {
        R.idle(t);
        if (!warmed) warmed = R.warm();            // one more cached drawing per frame, so the blink never stutters
        else if (!lampWarm) lampWarm = L.warm();   // then the lamp beat's black-and-white drawings
      } else if (phase === 'blink') {
        const k = Math.min(1, (performance.now() - start) / 1000 / BLINK_DUR);
        R.blink(t, k * k * (3 - 2 * k));
        if (k >= 1) { phase = 'dark'; start = performance.now(); }
      } else if (phase === 'dark') {
        const s = (performance.now() - start) / 1000;
        if (L.draw(canvas.getContext('2d'), s)) { phase = 'reveal'; start = performance.now(); }
      } else if (phase === 'reveal') {
        const s = (performance.now() - start) / 1000;
        canvas.style.opacity = String(Math.max(0, 1 - s / REVEAL_DUR));
        if (s >= REVEAL_DUR) { alive = false; setDone(true); return; }
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
