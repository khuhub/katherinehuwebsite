import { useEffect, useRef, useState, useCallback } from 'react';
import Frame from './Frame';
import './Projects.css';

// Panel 4, projects: a corkboard. The project screenshots sit in real polaroid frames (public/frame-*.png) held by
// washi tape or push pins, with "projects" spelled in ransom-note cut-outs across the top. The cards drop onto the
// board one after another when the panel comes into view, and she walks in carrying the last one and pins it up.
// Hover lifts a card; a click flips it over to the write-up and the link on its back; a click on the cork flips it
// back. Drag a card anywhere on the board and it stays there. Same layout as the film (hero-film/hero-text.html).
const PROJECTS = [
  { key: 'brandr', title: 'Brandr', img: '/pj-brandr.jpg', desc: 'AI agents that scrape TikTok to audit creator content for brand compliance — built at the YC × Browser Use hackathon', link: 'https://github.com/khuhub/Brandr?tab=readme-ov-file', x: .17, y: .40, tilt: -.05, hold: ['tape-polka'], frame: 'frame-red' },
  { key: 'momentum', title: 'Momentum', img: '/pj-momentum.jpg', desc: 'A Slack AI assistant that turns Slack into a command center — drafting emails, creating Notion docs and summarizing conversations without leaving the app', link: 'https://github.com/khuhub/Momentum', x: .385, y: .41, tilt: .04, hold: 'pin-teal', frame: 'frame-sun' },
  { key: 'greenzone', title: 'Greenzone', img: '/pj-greenzone.jpg', desc: 'Data visualization helping Mongolian herders combat overgrazing and climate change through rangeland carrying-capacity warnings', link: 'https://github.com/cornellh4i/greenzone', x: .6, y: .40, tilt: -.04, hold: ['tape-grid', 'tape-cream'], frame: 'frame-bluered' },
  { key: 'lockedin', title: 'LockedIn', img: '/pj-lockedin.jpg', desc: 'Tinder for networking — swipe right to connect with people who actually want to meet you. Award-winning app at the Cornell AppDev Hack Challenge', link: 'https://github.com/akh1lk/LockedIn', x: .82, y: .41, tilt: .05, hold: 'pin-red', frame: 'frame-yellow' },
  { key: 'escalate', title: 'Escalate', img: '/pj-escalate.jpg', desc: 'An adaptive AI loop that runs engineering tasks through increasingly capable models, evaluates each attempt and carries learned feedback forward', link: 'https://github.com/khuhub/cursor-escalate', x: .27, y: .78, tilt: .04, hold: ['tape-blue'], frame: 'frame-sun' },
  { key: 'traceback', title: 'Traceback', img: '/pj-traceback.jpg', desc: 'Award-winning at the YC RSI/RL hackathon: an adversarial evaluation loop that forks critical agent states, uncovers hidden reward hacks and turns each exploit into a regression test', link: 'https://github.com/ashtonchew/traceback', x: .5, y: .78, tilt: -.03, hold: 'pin-wood', frame: 'frame-red', last: true },
  { key: 'patchtst', title: 'PatchTST', img: '/pj-patchtst.jpg', desc: 'A deep-learning reimplementation of PatchTST, a transformer for long-term time-series forecasting, reproducing the paper within a 1–3% margin', link: 'https://github.com/khuhub', x: .77, y: .78, tilt: -.05, hold: ['tape-green', 'tape-cyan'], frame: 'frame-bluered' },
];
// phones: two columns, smaller, the same holders
const PROJECTS_P = PROJECTS.map((p, i) => ({ ...p, x: i % 2 ? .73 : .27, y: .24 + Math.floor(i / 2) * .205 }));
PROJECTS_P[6].x = .5;
// where the photo window sits in each frame (fractions of the frame), measured from the cut-outs
const WIN = { 'frame-red': [.059, .066, .872, .728], 'frame-bluered': [.07, .061, .86, .729], 'frame-yellow': [.072, .061, .86, .724], 'frame-sun': [.068, .062, .866, .73] };
const TITLE_OFF = { 'frame-red': -.1, 'frame-bluered': .03, 'frame-yellow': .06, 'frame-sun': 0 };
const WORD = ['p', 'r', 'o', 'j', 'e', 'c', 't', 's'];
const WORD_H = [1.15, 1, 1.04, .92, 1.1, 1, .92, 1.04].map((v, i) => v * (.92 + ((i * 7) % 3) * .06));
const WORD_JIT = [[.02, -.06, .05], [-.04, .08, -.07], [.03, .03, .04], [-.02, -.09, -.03], [.04, .05, .06], [-.03, -.04, -.05], [.01, .07, .02], [-.04, -.02, -.06]];

// the cork: drawn once per size, the same recipe as the film
function Cork() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, c = canvas.getContext('2d');
    const draw = () => {
      const box = canvas.parentElement.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 1.5), w = Math.round(box.width), h = Math.round(box.height); if (!w || !h) return;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = '#c99c67'; c.fillRect(0, 0, w, h);
      const r = window.rng ? window.rng(61) : Math.random, k = (w * h) / (1920 * 1080);
      const speck = (n, col, al, size) => { c.fillStyle = col; c.globalAlpha = al; for (let i = 0; i < n * k; i++) { const s = size * (.4 + r()); c.fillRect(r() * w, r() * h, s, s); } };
      speck(26000, '#8a5f36', .35, 2.2); speck(18000, '#e6c58f', .4, 2.0); speck(9000, '#6e4522', .3, 3.2); speck(40000, '#b98a55', .5, 1.4); c.globalAlpha = 1;
      const v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .4, w / 2, h / 2, Math.max(w, h) * .8); v.addColorStop(0, 'rgba(60,35,15,0)'); v.addColorStop(1, 'rgba(60,35,15,.3)'); c.fillStyle = v; c.fillRect(0, 0, w, h);
    };
    draw();
    let t = 0; const onResize = () => { clearTimeout(t); t = setTimeout(draw, 150); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, []);
  return <canvas ref={ref} className="pj-cork" aria-hidden="true" />;
}

// she walks in from the left carrying the last card, pins it, then stands at the bottom left; drawn on a canvas.
// Her shadow is her own silhouette blurred, done on a small layer around her so it stays cheap. While she carries
// the card its element is moved directly (no React state per frame).
function Walker({ on, portrait, onPinned, cardRef, cardAt }) {
  const ref = useRef(null), pinned = useRef(false);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const c = canvas.getContext('2d'); let raf = 0, t0 = 0;
    if (!on) { c.clearRect(0, 0, canvas.width, canvas.height); return; }
    if (pinned.current) return;                                   // she only comes in once
    const B = window.HeroBody && window.HeroBody.build({ paper: '#fffaf4' }); if (!B) { onPinned(); return; }
    const layer = document.createElement('canvas');
    const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, easeOut = t => 1 - Math.pow(1 - t, 3);
    const tick = now => {
      raf = requestAnimationFrame(tick); if (!t0) t0 = now; const t = (now - t0) / 1000;
      const box = canvas.parentElement.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(box.width), h = Math.round(box.height); if (!w || !h) return;
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; }
      const s = (portrait ? w * 1.1 : h) / 1080, floor = h - Math.round(Math.min(w, h) * .052) - 10 * s, sc = s * .62, tx = cardAt[0] * w, stop = tx - 150 * s - 70 * s;
      const T_IN = .8, T_ARRIVE = 3.4, T_PIN = 4.2, T_BACK = 4.8, T_HOME = 6;
      let cx, pose = 'stand';
      if (t < T_IN) cx = -200 * s; else if (t < T_ARRIVE) { const u = easeIO(clamp((t - T_IN) / (T_ARRIVE - T_IN), 0, 1)); cx = lerp(-200 * s, stop, u); pose = B.WALK[Math.floor(t * 8) % 6]; }
      else if (t < T_PIN) { cx = stop; pose = 'reach'; }
      else if (t < T_BACK) { cx = stop; }
      else { const u = easeIO(clamp((t - T_BACK) / (T_HOME - T_BACK), 0, 1)); cx = lerp(stop, w * .065, u); pose = u < 1 ? B.WALK[Math.floor(t * 8) % 6] : 'stand'; }
      // the card she carries: at her hands until she reaches up, then it glides to its spot and grows to full size
      const card = cardRef.current;
      if (card) {
        if (t >= T_IN && t < T_PIN) { const hx = cx + 6 * s, hy = floor - 70 * s, k = t < T_ARRIVE ? 0 : easeOut((t - T_ARRIVE) / (T_PIN - T_ARRIVE));
          card.style.visibility = 'visible'; card.style.left = `${lerp(hx, tx, k) / w * 100}%`; card.style.top = `${lerp(hy, cardAt[1] * h, k) / h * 100}%`;
          card.style.transform = `translate(-50%, -50%) rotate(${lerp(-.1, cardAt[2], k)}rad) scale(${lerp(.5, 1, k)})`; card.style.zIndex = 7; card.style.animation = 'none'; }
        else if (t >= T_PIN && !pinned.current) { pinned.current = true; card.style.visibility = ''; card.style.left = `${cardAt[0] * 100}%`; card.style.top = `${cardAt[1] * 100}%`; card.style.transform = ''; card.style.zIndex = ''; card.style.animation = ''; onPinned(); }
      }
      // her shadow and herself, from a small layer around her
      const lw = Math.round(460 * sc), lh = Math.round(520 * sc), ox = cx - lw / 2, oy = floor - lh + 20 * sc;
      if (layer.width !== Math.round(lw * dpr) || layer.height !== Math.round(lh * dpr)) { layer.width = Math.round(lw * dpr); layer.height = Math.round(lh * dpr); }
      const g = layer.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, -ox * dpr, -oy * dpr); g.clearRect(ox, oy, lw, lh); if (t >= T_IN) B.draw(g, pose, { x: cx, y: floor, scale: sc });
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, canvas.width, canvas.height); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.save(); c.filter = 'brightness(0) blur(5px)'; c.globalAlpha = .3; c.drawImage(layer, ox + 10 * s, oy + 12 * s, lw, lh); c.restore(); c.drawImage(layer, ox, oy, lw, lh);
      if (t > T_HOME + .5) { cancelAnimationFrame(raf); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, portrait, onPinned, cardRef, cardAt]);
  return <canvas ref={ref} className="pj-walker" aria-hidden="true" />;
}

export default function Projects() {
  const secRef = useRef(null), boxRef = useRef(null);
  const [portrait, setPortrait] = useState(() => window.innerWidth < window.innerHeight);
  const [on, setOn] = useState(false), [pinned, setPinned] = useState(false), [flipped, setFlipped] = useState(null), [moved, setMoved] = useState({});
  const [seen, setSeen] = useState(false);                             // the entrance plays once
  const [hover, setHover] = useState(null), drag = useRef(null), [unit, setUnit] = useState(0);
  useEffect(() => { const f = () => setPortrait(window.innerWidth < window.innerHeight); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  useEffect(() => {                                           // the word's letters are sized from the box (the minifier cannot do calc with container units)
    const box = boxRef.current; if (!box) return; const m = () => { const r = box.getBoundingClientRect(); setUnit(portrait ? r.width * .065 : r.height * .0685); }; m();
    let t = 0; const onResize = () => { clearTimeout(t); t = setTimeout(m, 150); }; window.addEventListener('resize', onResize); return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, [portrait]);
  useEffect(() => {
    const el = secRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); setSeen(true); } else setFlipped(null); }, { threshold: .35 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  const onPinned = useCallback(() => setPinned(true), []);
  const lastRef = useRef(null), lastP = PROJECTS.find(p => p.last), cardAt = useRef([lastP.x, lastP.y, lastP.tilt]).current;
  const items = portrait ? PROJECTS_P : PROJECTS;

  // dragging: a card follows the pointer; a press without a move is a click, which flips
  const onDown = (e, key) => {
    if (e.target.closest('a')) return;
    const box = boxRef.current.getBoundingClientRect();
    drag.current = { key, x0: e.clientX, y0: e.clientY, start: moved[key] || { dx: 0, dy: 0 }, box, did: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = e => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0; if (!d.did && Math.hypot(dx, dy) < 5) return; d.did = true;
    setMoved(m => ({ ...m, [d.key]: { dx: d.start.dx + dx / d.box.width, dy: d.start.dy + dy / d.box.height } }));
  };
  const onUp = (e, key) => { const d = drag.current; drag.current = null; if (d && !d.did) setFlipped(f => f === key ? null : key); };
  const onBoard = e => { if (!e.target.closest('.pj-card')) setFlipped(null); };

  return (
    <section ref={secRef} className={'pj' + (portrait ? ' is-portrait' : '') + (on ? ' is-on' : '')}>
      <div ref={boxRef} className="pj-box" onPointerDown={onBoard}>
        <Cork />
        <div className="pj-word" aria-label="projects">
          {WORD.map((ch, i) => <img key={i} src={`/cut-${ch}.png`} alt="" draggable="false" style={{ height: unit * WORD_H[i] + 'px', transform: `translate(${WORD_JIT[i][0] * unit}px, ${WORD_JIT[i][1] * unit}px) rotate(${WORD_JIT[i][2]}rad)` }} />)}
        </div>
        {items.map((p, i) => {
          const m = moved[p.key] || { dx: 0, dy: 0 }, win = WIN[p.frame], isFlip = flipped === p.key, isHover = hover === p.key && !isFlip;
          const show = p.last ? (pinned || portrait) : on;
          return (
            <div key={p.key} ref={p.last ? lastRef : null} className={'pj-card' + (show ? ' is-in' : '') + (isFlip ? ' is-flip' : '') + (isHover ? ' is-hover' : '') + (p.last && !portrait ? ' is-placed' : '')}
              style={{ left: `${(p.x + m.dx) * 100}%`, top: `${(p.y + m.dy) * 100}%`, '--tilt': `${p.tilt}rad`, '--delay': p.last ? '0s' : `${.2 + i * .28}s` }}
              onPointerDown={e => onDown(e, p.key)} onPointerMove={onMove} onPointerUp={e => onUp(e, p.key)} onPointerEnter={() => setHover(p.key)} onPointerLeave={() => setHover(null)}>
              <div className="pj-flip">
                <div className="pj-front">
                  <img className="pj-shot" src={p.img} alt={p.title} draggable="false" style={{ left: `${win[0] * 100}%`, top: `${win[1] * 100}%`, width: `${win[2] * 100}%`, height: `${win[3] * 100}%` }} />
                  <img className="pj-frame" src={`/${p.frame}.png`} alt="" draggable="false" />
                  <span className="pj-title serif" style={{ left: `${50 + (TITLE_OFF[p.frame] || 0) * 100}%`, top: `${(win[1] + win[3] + (1 - win[1] - win[3]) / 2) * 100}%` }}>{p.title}</span>
                </div>
                <div className="pj-back">
                  <h3 className="serif">{p.title}</h3>
                  <p className="serif">{p.desc}</p>
                  <a className="serif" href={p.link} target="_blank" rel="noreferrer" onPointerDown={e => e.stopPropagation()}>{p.link.replace('https://', '')} →</a>
                </div>
              </div>
              {Array.isArray(p.hold)
                ? p.hold.length === 1
                  ? <img className="pj-tape is-top" src={`/${p.hold[0]}.png`} alt="" draggable="false" />
                  : <><img className="pj-tape is-tl" src={`/${p.hold[0]}.png`} alt="" draggable="false" /><img className="pj-tape is-br" src={`/${p.hold[1]}.png`} alt="" draggable="false" /></>
                : <img className="pj-pin" src={`/${p.hold}.png`} alt="" draggable="false" />}
            </div>
          );
        })}
        {!portrait && seen && <Walker on={on} portrait={portrait} onPinned={onPinned} cardRef={lastRef} cardAt={cardAt} />}
        <span className="pj-num mono">04</span>
        <Frame />
      </div>
    </section>
  );
}
