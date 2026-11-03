import { useEffect, useRef, useState } from 'react';
import './Hero.css';

// The hero: what the lamp's light opens onto. A comic panel (white, with the intro's mat and ink edge)
// holding "hi, i'm" in mono, KATHERINE in the hand lettering (pink), real-you big and centred in front of
// it, HU over her hair, "cs @ cornell", and the social links. Everything comes in on the film's timeline,
// starting when the intro says the light is opening (the 'hero:open' event), or at once if there is no intro.
//
// Timeline (seconds after the light starts to open): KATHERINE wipes on .3, photo .7, HU 1.0,
// "hi, i'm" types 1.2–1.9, "cs @ cornell" types 1.9–2.9, socials 2.4.
const INTRO_WILL_RUN = () => typeof window !== 'undefined' && !!window.HeroFace && !!window.HeroLamp &&
  !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

function useTypewriter(text, started, delay, dur) {
  const [n, setN] = useState(started ? text.length : 0);
  useEffect(() => {
    if (!started) return;
    const t0 = performance.now() + delay * 1000; let raf = 0;
    const tick = () => { const k = (performance.now() - t0) / 1000 / dur; setN(Math.max(0, Math.min(text.length, Math.floor(Math.max(0, k) * (text.length + 1))))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, text, delay, dur]);
  return n;
}

// the comic panel's frame, drawn with the engine's brush so the edge wobbles like the intro's
function Frame() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, c = canvas.getContext('2d');
    const draw = () => {
      const box = canvas.parentElement.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(box.width), h = Math.round(box.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      const M = Math.round(Math.min(w, h) * .052), K = Math.min(w, h) / 1080;
      c.fillStyle = '#fffaf4'; c.fillRect(0, 0, w, M); c.fillRect(0, h - M, w, M); c.fillRect(0, 0, M, h); c.fillRect(w - M, 0, M, h);
      if (!window.brush) { c.strokeStyle = '#1a1212'; c.lineWidth = 7 * K; c.strokeRect(M, M, w - 2 * M, h - 2 * M); return; }
      const pts = [], corners = [[M, M], [w - M, M], [w - M, h - M], [M, h - M]];
      for (let i = 0; i < 4; i++) { const a = corners[i], b = corners[(i + 1) % 4], n = 12; for (let j = 0; j < n; j++) pts.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); }
      window.brush(c, pts, { w: 7 * K, color: '#1a1212', al: .95, seed: 830, amp: .8, taper: 0, close: true, smooth: false });   // the engine's wobbly ink edge, like the intro's
    };
    draw();
    let t = 0; const onResize = () => { clearTimeout(t); t = setTimeout(draw, 120); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, []);
  return <canvas ref={ref} className="hero-frame" aria-hidden="true" />;
}

export default function Hero() {
  const [started, setStarted] = useState(() => !INTRO_WILL_RUN());
  useEffect(() => {
    if (started) return;
    const go = () => setStarted(true);
    window.addEventListener('hero:open', go);
    const fallback = setTimeout(go, 20000);                      // never stay blank
    return () => { window.removeEventListener('hero:open', go); clearTimeout(fallback); };
  }, [started]);
  const hiN = useTypewriter("hi, i'm", started, 1.2, .7);
  const csN = useTypewriter('cs @ cornell', started, 1.9, 1.0);
  const on = started ? ' is-on' : '';
  return (
    <section className={'hero' + on} aria-label="Hi, I'm Katherine Hu">
      <div className="hero-box">
        <div className="hero-hi mono">{"hi, i'm".slice(0, hiN)}{started && hiN < 7 && <span className="hero-cursor" />}</div>
        <div className="hero-kat"><img src="/kat-pink.png" alt="Katherine" fetchPriority="high" decoding="async" /></div>
        <img className="hero-photo" src="/me-cut.png" alt="Katherine Hu" fetchPriority="high" decoding="async" />
        <img className="hero-hu" src="/hu-pink.png" alt="Hu" decoding="async" />
        <div className="hero-cs mono">{'cs @ cornell'.slice(0, csN)}{started && csN > 0 && csN < 12 && <span className="hero-cursor" />}</div>
        <div className="hero-social">
          <a href="https://github.com/khuhub" target="_blank" rel="noreferrer" aria-label="GitHub"><img src="/git-ink.png" alt="" /></a>
          <a href="https://www.linkedin.com/in/katherine-hu317" target="_blank" rel="noreferrer" aria-label="LinkedIn"><img src="/linkedin-ink.png" alt="" /></a>
          <a href="mailto:katherine.y.hu@gmail.com" aria-label="Email"><img src="/email-ink.png" alt="" /></a>
        </div>
        <Frame />
      </div>
    </section>
  );
}
