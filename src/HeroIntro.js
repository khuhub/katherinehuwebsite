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
// Speed. A redraw at most every 12 ms: every frame on a 60 Hz screen, every other on a 120/144 Hz one (the
// drawings change 24 times a second; a fast screen only doubled the work). The cached drawings are built one at
// a time in idle moments, never two frames running. And if the browser still can't keep up (a PC drawing the
// canvas without its GPU manages a few frames a second at full size), the intro is drawn smaller: the median gap
// between frames over a second or so decides (not counting frames that built a drawing, a stutter every machine
// has), so a machine that keeps up never changes.
const MIN_GAP = 12, SLOW_GAP = 40, CAPS = [1e9, 1400, 960];
const whenIdle = fn => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1000 }) : setTimeout(fn, 30));

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

    let level = 0;                                                  // index into CAPS: how far the intro has been shrunk
    const remake = () => { R.dispose(); L.dispose(); R.resize(CAPS[level]); L = window.HeroLamp.make(); warmed = false; lampWarm = false; };
    let resizeTimer = 0;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (!alive) return; remake(); }, 150); };
    window.addEventListener('resize', onResize);

    // the cached drawings (blink, lamp) are built one per idle moment, so the blink never stutters
    let warming = false;
    let building = false;                                           // a drawing was built since the last frame
    const warmStep = () => {
      warming = false;
      if (!alive || phase !== 'idle') return;
      building = true;
      if (!warmed) warmed = R.warm(); else if (!lampWarm) lampWarm = L.warm();
    };
    // is the browser keeping up? gaps between frames after a settling moment, leaving out any gap in which a
    // drawing was built
    let lastTick = 0, probeFrom = performance.now() + 600, gaps = [], probing = true;
    const probe = ms => {
      if (document.hidden) { lastTick = 0; return; }                 // a hidden tab gets no frames: that pause isn't slowness
      const skip = building; building = false;
      if (lastTick && ms > probeFrom && !skip) gaps.push(ms - lastTick);
      lastTick = ms;
      if (gaps.length < 4 || gaps.reduce((a, b) => a + b, 0) < 1200) return;
      const median = [...gaps].sort((a, b) => a - b)[gaps.length >> 1];
      if (median > SLOW_GAP && level < CAPS.length - 1) { level++; remake(); gaps = []; probeFrom = performance.now() + 600; }
      else probing = false;                                          // keeping up (or as small as it goes): stop watching
    };

    let lastDraw = 0;
    const frame = () => {
      if (!alive) return;
      const ms = performance.now();
      if (probing && phase === 'idle') probe(ms);
      if (ms - lastDraw < MIN_GAP) { raf = requestAnimationFrame(frame); return; }
      lastDraw = ms;
      const t = now();
      if (phase === 'idle') {
        const b = R.built; R.idle(t); if (R.built !== b) building = true;
        if (!warming && !(warmed && lampWarm)) { warming = true; whenIdle(warmStep); }
      } else if (phase === 'blink') {
        const k = Math.min(1, (performance.now() - start) / 1000 / BLINK_DUR);
        R.blink(t, k * k * (3 - 2 * k));
        if (k >= 1) { phase = 'dark'; start = performance.now(); }
      } else if (phase === 'dark') {
        const s = (performance.now() - start) / 1000 + lampSkip, ctx = canvas.getContext('2d');
        if (!opened && s >= window.HeroLamp.OPENING) { opened = true; window.dispatchEvent(new Event('hero:open')); }   // the hero starts its own timeline now
        // inside the cone the overlay is cleared, so the page itself is what the light reveals
        if (L.draw(ctx, s, g => { g.clearRect(0, 0, canvas.width, canvas.height); })) { alive = false; const Ld = L; setTimeout(() => { R.dispose(); Ld.dispose(); canvas.width = 0; canvas.height = 0; }, 1500); setDone(true); window.dispatchEvent(new Event('hero:done')); return; }   // the cached drawings (tens of MB) go once the hero has finished coming in, not whenever the collector gets to them
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
