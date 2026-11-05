import { useEffect, useRef, useState } from 'react';

// The hero intro: Katherine's hand-drawn face fills the screen, idles (blinks,
// glances, hair sways, stars twinkle), then on the first scroll / tap / key — or
// after a few seconds — she blinks, the screen's eyelids close with hers, and they
// open onto the page underneath. The drawing lives in public/engine/face.js
// (window.HeroFace), shared with the film in hero-film/face.html.
//
// After the blink the screen stays dark: only her eyes, wandering; she pulls a hanging lamp on, off, on,
// and the cone of light opens onto the page itself (public/engine/lamp.js, window.HeroLamp): inside the cone
// the overlay is cleared, and the hero underneath runs its own entrance from the 'hero:open' event.
//
// Phases: idle → blink (0.9 s) → dark (the lamp beat, ~7.5 s, ending fully open) → done (unmounted).
const BLINK_DUR = 0.9, AUTO_AFTER = 7;

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

    let phase = 'idle', t0 = performance.now(), start = t0, raf = 0, warmed = false, alive = true, opened = false;
    const now = () => (performance.now() - t0) / 1000;

    // a scroll / tap / key ends the idle; during the dark beat a tap pulls the string at once (jumps to the next tug)
    let lampSkip = 0;
    const trigger = () => { if (phase === 'idle') { phase = 'blink'; start = performance.now(); } else if (phase === 'dark') { lampSkip += L.skipTo((performance.now() - start) / 1000 + lampSkip); } };
    const onKey = e => { if (!e.metaKey && !e.ctrlKey && !e.altKey) trigger(); };
    const opts = { passive: true };
    const onWheel = () => { if (phase === 'idle') trigger(); };
    window.addEventListener('wheel', onWheel, opts);
    window.addEventListener('touchstart', trigger, opts);
    window.addEventListener('pointerdown', trigger, opts);
    window.addEventListener('keydown', onKey);
    const auto = setTimeout(trigger, AUTO_AFTER * 1000);

    let resizeTimer = 0;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (!alive) return; R.dispose(); L.dispose(); R.resize(); L = window.HeroLamp.make(); warmed = false; lampWarm = false; }, 150); };
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
        const s = (performance.now() - start) / 1000 + lampSkip, ctx = canvas.getContext('2d');
        if (!opened && s >= window.HeroLamp.OPENING) { opened = true; window.dispatchEvent(new Event('hero:open')); }   // the hero starts its own timeline now
        // inside the cone the overlay is cleared, so the page itself is what the light reveals
        if (L.draw(ctx, s, g => { g.clearRect(0, 0, canvas.width, canvas.height); })) { alive = false; R.dispose(); L.dispose(); canvas.width = 0; canvas.height = 0; setDone(true); return; }   // the cached drawings (tens of MB) go at once, not whenever the collector gets to them
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      alive = false; cancelAnimationFrame(raf); clearTimeout(auto); clearTimeout(resizeTimer);
      window.removeEventListener('wheel', onWheel); window.removeEventListener('touchstart', trigger);
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
