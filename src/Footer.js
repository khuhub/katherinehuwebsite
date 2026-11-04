import { useEffect, useRef, useState } from 'react';
import './Footer.css';

// The last panel, the sign-off: the lamp from the opening hangs on the cream page and pulls its own string.
// The page goes dark except for the cone of light, she stands in it waving goodbye, the cone slowly closes
// to nothing (taking her and the lamp with it), and "thanks for stopping by :)" with the links comes up out
// of the black. Drawn on a canvas with the engine (public/engine/core.js, body.js); the note is real DOM so
// the links work. It is fixed behind the page (an empty slot keeps its place in the scroll), so the projects panel lifts
// off to uncover it; it plays once, when more than half of it is showing, and then holds on the note.
//
// Timeline (seconds after the panel is seen): tug 1.3, dark 1.55, the cone closes 2.4–5.0, note 5.3.
const T_TUG = 1.3, T_DARK = 1.55, T_CLOSE = 2.4, T_CLOSED = 5.0, T_NOTE = 5.3;
const REDUCED = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Lamp({ on, portrait, onNote }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas || !on) return;
    const c = canvas.getContext('2d'); let raf = 0, t0 = 0, noted = false;
    const B = window.HeroBody && window.HeroBody.build({ paper: '#fffaf4' }), brush = window.brush;
    if (!B || !brush || REDUCED()) { onNote(); return; }
    if (!B.POSES.wave1) { const st = B.POSES.stand, CH = st.head[1];                          // a wave: the right arm up, the hand swinging
      B.POSES.wave1 = Object.assign({}, st, { head: [0, CH, -.03], armR: [[54, CH + 24], [92, CH - 30], [70, CH - 120]] });
      B.POSES.wave2 = Object.assign({}, st, { head: [0, CH, -.03], armR: [[54, CH + 24], [96, CH - 30], [118, CH - 110]] }); }
    const layer = document.createElement('canvas');
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, TAU = Math.PI * 2;
    const tick = now => {
      raf = requestAnimationFrame(tick); if (!t0) t0 = now; const t = (now - t0) / 1000;
      const box = canvas.parentElement.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(box.width), h = Math.round(box.height); if (!w || !h) return;
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; }
      const s = (portrait ? w * 1.1 : h) / 1080, K = Math.min(h / 1080, w / 1920 * 1.9), M = Math.round(Math.min(w, h) * .052);
      const LX = w * .5, LY = M + 70 * K, floor = h - M - 10 * s, sc = s * .62, cx = LX - 170 * s;
      const dark = clamp((t - T_DARK) / .2, 0, 1), closing = easeIO(clamp((t - T_CLOSE) / (T_CLOSED - T_CLOSE), 0, 1));
      const pose = t < T_DARK + .4 ? 'stand' : (Math.floor((t - T_DARK - .4) * 4) % 2 ? 'wave2' : 'wave1');   // she waves goodbye once the light is on her
      const tug = t < T_TUG ? 0 : t < T_TUG + .18 ? (t - T_TUG) / .18 : t < T_TUG + .5 ? 1 - (t - T_TUG - .18) / .32 : 0;   // the string goes down and comes back
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      if (dark > 0) { c.fillStyle = `rgba(14,12,12,${dark})`; c.fillRect(0, 0, w, h); }
      let cone = null;
      if (dark > 0 && closing < 1) {                                       // the cone, narrowing to nothing as the light closes
        const spread = .78 * (1 - closing), ap = [LX, LY + 24 * K], L = h * 1.6, aL = Math.PI / 2 + spread, aR = Math.PI / 2 - spread;
        cone = new Path2D(); cone.moveTo(ap[0], ap[1]); cone.lineTo(ap[0] + Math.cos(aL) * L, ap[1] + Math.sin(aL) * L); cone.lineTo(ap[0] + Math.cos(aR) * L, ap[1] + Math.sin(aR) * L); cone.closePath();
        c.save(); c.globalAlpha = dark * (1 - Math.pow(closing, 3)) * clamp((1 - closing) / .12, 0, 1); c.fillStyle = '#fffaf4'; c.fill(cone);   // the last sliver dims to nothing
        if (closing < .7) { const al = .9 * dark * Math.pow(1 - closing / .7, 2); for (const [a, sd] of [[aL, 11], [aR, 12]]) { const pts = []; for (let i = 0; i <= 30; i++) pts.push([ap[0] + Math.cos(a) * L * i / 30, ap[1] + Math.sin(a) * L * i / 30]); brush(c, pts, { w: 9 * K, color: '#fffaf4', al, seed: sd, amp: .5 * K, taper: 0 }); } }   // the chalky edges go before the cone shuts
        c.restore();
      }
      // the lamp: cord from the top, bell shade, the string with its pull; it fades out with the light
      const lampAl = dark > 0 ? Math.pow(1 - closing, 1.5) : 1;
      if (lampAl > 0) { const ink = dark > .5 ? '#fff' : '#1a1212';
        const pts = [[-110, 30], [-82, -22], [-34, -56], [34, -56], [82, -22], [110, 30]].map(([u, v]) => [LX + u * K, LY + v * K]);
        brush(c, [[LX, -10], [LX, LY - 56 * K]], { w: 5 * K, color: dark > .5 ? '#000' : '#1a1212', al: lampAl, seed: 3, amp: .3, taper: 0 });
        c.save(); c.globalAlpha = lampAl; c.fillStyle = '#000'; c.beginPath(); pts.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath(); c.fill(); c.restore();
        brush(c, pts, { w: 5 * K, color: ink, al: lampAl, seed: 4, amp: .6 * K, taper: 0, close: true });
        const hy = LY + (260 + 70 * tug) * K;
        brush(c, [[LX, LY + 30 * K], [LX + 2, (LY + hy) / 2], [LX + 1, hy]], { w: 3.5 * K, color: ink, al: lampAl, seed: 8, amp: .4 * K, taper: 0 });
        c.save(); c.globalAlpha = lampAl; c.fillStyle = ink; c.beginPath(); c.arc(LX + 1, hy + 4 * K, 7 * K, 0, TAU); c.fill(); c.restore(); }
      // her, waving goodbye in the cone while the light lasts: only what the cone lights is drawn
      if (closing < 1) {
        const lw = Math.round(460 * sc), lh = Math.round(520 * sc), ox = cx - lw / 2, oy = floor - lh + 20 * sc;
        if (layer.width !== Math.round(lw * dpr) || layer.height !== Math.round(lh * dpr)) { layer.width = Math.round(lw * dpr); layer.height = Math.round(lh * dpr); }
        const g = layer.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, -ox * dpr, -oy * dpr); g.clearRect(ox, oy, lw, lh); B.draw(g, pose, { x: cx, y: floor, scale: sc });
        c.save(); if (cone) c.clip(cone);
        c.save(); c.filter = 'brightness(0) blur(5px)'; c.globalAlpha = .3; c.drawImage(layer, ox + 10 * s, oy + 12 * s, lw, lh); c.restore(); c.drawImage(layer, ox, oy, lw, lh); c.restore();
      }
      if (t >= T_NOTE && !noted) { noted = true; onNote(); }
      if (t > T_CLOSED + .5) cancelAnimationFrame(raf);                 // the frame is black and stays that way: nothing more to draw
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, portrait, onNote]);
  return <canvas ref={ref} className="foot-lamp" aria-hidden="true" />;
}

export default function Footer() {
  const secRef = useRef(null);
  const [portrait, setPortrait] = useState(() => window.innerWidth < window.innerHeight);
  const [on, setOn] = useState(false), [note, setNote] = useState(false);
  useEffect(() => { const f = () => setPortrait(window.innerWidth < window.innerHeight); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  useEffect(() => {                                             // it plays once, when the page above has lifted off more than half of it
    const check = () => { const page = document.querySelector('.page'); if (!page) return; if (page.getBoundingClientRect().bottom < window.innerHeight * .5) { setOn(true); window.removeEventListener('scroll', check); } };
    window.addEventListener('scroll', check, { passive: true }); check();
    return () => window.removeEventListener('scroll', check);
  }, []);
  const onNote = useRef(() => setNote(true)).current;
  return (<>
    <div className="foot-slot" aria-hidden="true" />
    <footer ref={secRef} className={'foot' + (portrait ? ' is-portrait' : '') + (on ? ' is-on' : '') + (note ? ' is-note' : '')}>
      <div className="foot-box">
        <Lamp on={on} portrait={portrait} onNote={onNote} />
        <div className="foot-note">
          <p className="foot-thanks mono">thanks for stopping by :)</p>
          <div className="foot-social">
            <a href="https://github.com/khuhub" target="_blank" rel="noreferrer" aria-label="GitHub"><img src="/git-ink.png" alt="" /></a>
            <a href="https://www.linkedin.com/in/katherine-hu317" target="_blank" rel="noreferrer" aria-label="LinkedIn"><img src="/linkedin-ink.png" alt="" /></a>
            <a href="mailto:katherine.y.hu@gmail.com" aria-label="Email"><img src="/email-ink.png" alt="" /></a>
          </div>
          <p className="foot-credit mono">made by katherine hu · 2026</p>
        </div>
      </div>
    </footer>
  </>);
}
