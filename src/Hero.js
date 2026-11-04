import { useEffect, useRef, useState } from 'react';
import Frame from './Frame';
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
    if (!started) { setN(0); return; }                             // reset, so it types again next time
    const t0 = performance.now() + delay * 1000; let raf = 0;
    const tick = () => { const k = (performance.now() - t0) / 1000 / dur; setN(Math.max(0, Math.min(text.length, Math.floor(Math.max(0, k) * (text.length + 1))))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, text, delay, dur]);
  return n;
}

export default function Hero() {
  const [started, setStarted] = useState(() => !INTRO_WILL_RUN());
  const ref = useRef(null), everStarted = useRef(false), autoSlid = useRef(false);
  useEffect(() => {
    if (started) { everStarted.current = true; return; }
    const go = () => setStarted(true);
    window.addEventListener('hero:open', go);
    const fallback = setTimeout(go, 20000);                      // never stay blank
    return () => { window.removeEventListener('hero:open', go); clearTimeout(fallback); };
  }, [started]);
  // the photo gives a very soft shake each time the hero scrolls back into view; nothing else replays
  const [photoIn, setPhotoIn] = useState(false), [shake, setShake] = useState(0);
  useEffect(() => { if (started) setPhotoIn(true); }, [started]);
  useEffect(() => {
    const el = ref.current; if (!el) return; let away = false;
    const obs = new IntersectionObserver(([e]) => { if (!everStarted.current) return; if (!e.isIntersecting) away = true; else if (away) { away = false; setShake(n => n + 1); } }, { threshold: .35 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  // five seconds after the hero has finished typing in, the page slides on to the about panel by itself —
  // unless the visitor has already scrolled or touched the page
  useEffect(() => {
    if (!started || autoSlid.current) return;
    autoSlid.current = true;
    let moved = false; const mark = () => { moved = true; };
    const opts = { passive: true };
    window.addEventListener('wheel', mark, opts); window.addEventListener('touchstart', mark, opts); window.addEventListener('keydown', mark); window.addEventListener('pointerdown', mark, opts);
    const t = setTimeout(() => { if (moved || window.scrollY > 10) return; const next = document.querySelector('.about'); if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, (2.9 + 5) * 1000);
    return () => { clearTimeout(t); window.removeEventListener('wheel', mark); window.removeEventListener('touchstart', mark); window.removeEventListener('keydown', mark); window.removeEventListener('pointerdown', mark); };
  }, [started]);
  const hiN = useTypewriter("hi, i'm", started, 1.2, .7);
  const csN = useTypewriter('cs @ cornell', started, 1.9, 1.0);
  const on = started ? ' is-on' : '';
  return (
    <section ref={ref} className={'hero' + on} aria-label="Hi, I'm Katherine Hu">
      <div className="hero-box">
        <div className="hero-hi mono">{"hi, i'm".slice(0, hiN)}{started && hiN < 7 && <span className="hero-cursor" />}</div>
        <div className="hero-kat"><img src="/kat-pink.png" alt="Katherine" fetchPriority="high" decoding="async" /></div>
        <img key={shake} className={'hero-photo' + (photoIn ? ' is-in' : '') + (shake ? ' is-shake' : '')} src="/me-cut.png" alt="Katherine Hu" fetchPriority="high" decoding="async" />
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
