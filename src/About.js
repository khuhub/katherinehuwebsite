import { useEffect, useRef, useState, useCallback } from 'react';
import Frame from './Frame';
import './About.css';

// Panel 2, about: a lawn seen from above (mottled greens drawn once into a canvas), "ABOUT ME" in letter beads,
// a short bio, and ten cut-out objects along the bottom that rise in edge-first when the panel scrolls into view.
// Hover an object and it pops forward; click it and a paper note appears beside it; drag it anywhere on the lawn.
// On touch, a tap pops it and shows the note together. The corgi runs across low, exits right, and comes back in
// high, for as long as the panel is on screen.  Same layout as the film (hero-film/hero-text.html).
const OBJECTS = [   // [name, x, y (fractions of the panel), height (px at 1080 tall), rotation (rad)]
  ['guitar2', .08, .83, 420, -.30], ['boba', .17, .86, 220, .12], ['cheese', .26, .88, 190, -.2], ['toy', .35, .83, 270, .08], ['mic', .45, .84, 300, -.62],
  ['ipod', .55, .88, 230, -.1], ['celsius', .65, .84, 260, .15], ['violin', .76, .82, 340, .35], ['nugget', .86, .87, 240, -.45], ['pencil', .94, .83, 300, -.88]];
const OBJECTS_P = [   // portrait: two rows; height as a fraction of a 400px-at-1080-wide unit
  ['guitar2', .13, .76, 1.0, -.30], ['boba', .33, .80, .62, .12], ['cheese', .52, .82, .55, -.2], ['toy', .70, .78, .72, .08], ['mic', .89, .80, .8, -.62],
  ['ipod', .13, .92, .62, -.1], ['celsius', .32, .91, .7, .15], ['violin', .52, .90, .9, .35], ['nugget', .71, .92, .62, -.25], ['pencil', .90, .91, .8, -.88]];
const NOTES = {
  guitar2: 'currently teaching myself how to play, one chord at a time', boba: "i'm always down for a boba run", cheese: 'my emotional support stress relievers',
  toy: 'my hirono collection is getting out of hand', mic: 'will never say no to karaoke', ipod: 'a little bit of everything on my playlist',
  celsius: 'atp celsius should sponsor me', violin: 'forced beginnings, but always fun to play', nugget: 'constantly finding new spots to add to my beli', pencil: 'love doodling whenever i get the chance' };
const BIO = "hi! i'm katherine, a computer science student at cornell university interested in ai, complex systems, and solving challenging technical problems. i love exploring new ideas, building meaningful technology, and collaborating with people who are curious and excited to push boundaries together :)";

// the lawn, drawn once per size: patches of darker and lighter green, grain, little blades (same recipe as the film)
function Lawn() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, c = canvas.getContext('2d');
    const draw = () => {
      const box = canvas.parentElement.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.round(box.width), h = Math.round(box.height); if (!w || !h) return;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rng = window.rng ? window.rng(77) : Math.random, r = rng;
      c.fillStyle = '#8db458'; c.fillRect(0, 0, w, h);
      const n = Math.round(26 * (w * h) / (1920 * 1080)) + 8;
      for (let i = 0; i < n; i++) { const x = r() * w, y = r() * h, rx = (120 + r() * 320) * w / 1920, ry = rx * (.45 + r() * .5), a = r() * Math.PI * 2; c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = r() < .55 ? '#6f9a42' : '#a3c56a'; c.globalAlpha = .55 + r() * .35; c.beginPath(); for (let k = 0; k <= 24; k++) { const t = k / 24 * Math.PI * 2, j = 1 + .14 * Math.sin(t * 3 + i) + .08 * Math.cos(t * 5 + i * 2); const px = Math.cos(t) * rx * j, py = Math.sin(t) * ry * j; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.fill(); c.restore(); }
      c.globalAlpha = 1;
      const dots = Math.round(15000 * (w * h) / (1920 * 1080));
      for (let i = 0; i < dots; i++) { const x = r() * w, y = r() * h; c.fillStyle = i % 5 < 3 ? 'rgba(63,107,42,.10)' : 'rgba(214,234,154,.12)'; c.fillRect(x, y, 2, 2); }
      c.strokeStyle = 'rgba(70,110,40,.45)'; c.lineWidth = 2; const blades = Math.round(700 * (w * h) / (1920 * 1080));
      for (let i = 0; i < blades; i++) { const x = r() * w, y = r() * h, L = 6 + r() * 10, a = -Math.PI / 2 + (r() - .5) * 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke(); }
    };
    draw();
    let t = 0; const onResize = () => { clearTimeout(t); t = setTimeout(draw, 150); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, []);
  return <canvas ref={ref} className="about-lawn" aria-hidden="true" />;
}

// the running corgi: the 7-frame sprite (public/corgi-run.png), crossing left to right on alternating lanes
function Corgi({ running, portrait }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!running) return;
    const el = ref.current, lanes = portrait ? [.58, .11] : [.56, .145];
    let raf = 0; const t0 = performance.now();
    const tick = () => {
      const box = el.parentElement.getBoundingClientRect(), W = box.width, H = box.height;
      const speed = 230 * Math.min(1, W / 1920 * 1.6), cross = (W * 1.24) / speed, t = (performance.now() - t0) / 1000 + .2;
      const n = Math.floor(t / cross), u = (t - n * cross) / cross, x = -.12 * W + u * 1.24 * W, y = lanes[n % 2] * H;
      const frame = Math.floor(t * 14) % 7, size = 175 * Math.min(1, W / 1920 * 1.6);
      el.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px) scaleX(-1)`;
      el.style.width = el.style.height = size + 'px';
      el.style.backgroundPosition = `${-frame * size}px 0`; el.style.backgroundSize = `${size * 7}px ${size}px`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, portrait]);
  return <div ref={ref} className="about-corgi" aria-hidden="true" style={{ backgroundImage: 'url(/corgi-run.png)' }} />;
}

export default function About() {
  const ref = useRef(null);
  const [on, setOn] = useState(false);                       // the panel has scrolled into view: objects rise in, corgi runs
  const [portrait, setPortrait] = useState(() => typeof window !== 'undefined' && window.innerHeight > window.innerWidth);
  const [hover, setHover] = useState(null);
  const [open, setOpen] = useState(null);                    // which object's note is showing
  const [moved, setMoved] = useState({});                    // dragged objects: name → [dx, dy] px
  const drag = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setOn(true); }, { threshold: .35 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  useEffect(() => {
    const onResize = () => setPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {                                           // a click anywhere else closes the note
    if (!open) return;
    const close = e => { if (!e.target.closest('.about-obj')) setOpen(null); };
    window.addEventListener('pointerdown', close); return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  // drag: pointer capture on the object; a short move counts as a click (pop + note), a longer one moves it
  const onDown = useCallback((e, name) => {
    const el = e.currentTarget; el.setPointerCapture(e.pointerId);
    const start = moved[name] || [0, 0];
    drag.current = { name, x0: e.clientX, y0: e.clientY, sx: start[0], sy: start[1], dist: 0 };
    setHover(name);
  }, [moved]);
  const onMove = useCallback(e => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0; d.dist = Math.max(d.dist, Math.hypot(dx, dy));
    if (d.dist > 6) setMoved(m => ({ ...m, [d.name]: [d.sx + dx, d.sy + dy] }));
  }, []);
  const onUp = useCallback(e => {
    const d = drag.current; if (!d) return; drag.current = null;
    if (d.dist <= 6) setOpen(o => (o === d.name ? null : d.name));
    if (e.pointerType !== 'mouse') setHover(null);
  }, []);

  const objs = portrait ? OBJECTS_P : OBJECTS;
  const kAt = fx => (1 - Math.abs(fx - .5) * 2) * .35;      // edges first, the middle a beat later
  return (
    <section ref={ref} className={'about' + (on ? ' is-on' : '') + (portrait ? ' is-portrait' : '')} aria-label="About me">
      <div className="about-box" ref={boxRef}>
        <Lawn />
        <div className="about-label mono">about me</div><div className="about-num mono">02</div>
        <div className="about-head" aria-label="About me">
          {'ABOUT ME'.split('').map((ch, i) => ch === ' ' ? <span key={i} className="about-sp" /> :
            <img key={i} src={`/bead-${ch}.png`} alt="" style={{ transform: `rotate(${Math.sin(i * 2.3) * 7}deg) translateY(${Math.sin(i * 1.7) * 4}px)` }} />)}
        </div>
        <p className="about-bio mono">{BIO}</p>
        <Corgi running={on} portrait={portrait} />
        {objs.map(([name, fx, fy, h, rot], i) => {
          const m = moved[name] || [0, 0], isOpen = open === name, isHover = hover === name;
          return (
            <div key={name} className={'about-obj' + (isHover || isOpen ? ' is-up' : '')}
              style={{ left: `${fx * 100}%`, top: `${fy * 100}%`, '--h': portrait ? `${h * 37}vw` : `${h / 1080 * 100}cqh`, '--rot': `${rot}rad`, '--dx': `${m[0]}px`, '--dy': `${m[1]}px`, transitionDelay: on ? `${kAt(fx)}s` : '0s', zIndex: isHover || isOpen ? 15 : 3 + i }}
              onPointerDown={e => onDown(e, name)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
              onMouseEnter={() => setHover(name)} onMouseLeave={() => setHover(h => (h === name ? null : h))}>
              <img src={`/about-${name}.png`} alt={name} draggable="false" />
            </div>
          );
        })}
        {open && (() => {                                   // the note: above all the objects, beside the open one, kept inside the panel
          const o = objs.find(x => x[0] === open); if (!o) return null; const [name, fx, fy, h] = o, m = moved[name] || [0, 0];
          const box = boxRef.current ? boxRef.current.getBoundingClientRect() : { width: 1920, height: 1080 };
          const M = Math.min(box.width, box.height) * .052 + 8, nw = portrait ? box.width * .46 : box.width * .19, nh = nw * 616 / 846;
          const hpx = portrait ? h * box.width * .37 : h / 1080 * box.height;   // the object's height in px
          const ox = fx * box.width + m[0], oy = fy * box.height + m[1] - hpx * .28, left = fx > .6 ? ox - 20 - nw : ox + 20;
          const x = Math.max(M, Math.min(box.width - M - nw, left)), y = Math.max(M, Math.min(box.height - M - nh, oy - nh));
          return <div className={'about-note' + (fx > .6 ? ' is-left' : '')} style={{ left: x, top: y, width: nw }}><div className="paper" style={{ backgroundImage: 'url(/about-bubble.png)' }} /><span className="mono">{NOTES[name]}</span></div>;
        })()}
        <Frame />
      </div>
    </section>
  );
}
