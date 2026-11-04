import { useEffect, useRef, useState, useCallback } from 'react';
import Frame from './Frame';
import './Experience.css';

// Panel 3, experience: a row of little music players drifting left in a loop over watercolour stripes, with
// paper clouds along the bottom and a couple at the top. Each card is a company: the photo as the album art, the logo and
// name (a link) with the role under it, a progress bar with times, and transport controls. Hover lifts a card;
// a click pops it to the front and holds the row; the play button plays that card's song (the bar follows it);
// a click on the stripes lets the row drift on and stops the music. Same drawing as the film (hero-text.html).
const EXPS = [
  { key: 'meta', name: 'Meta', role: 'software engineer intern · ai infra', logo: '/lg-meta.png', photo: '/exp-meta.jpg', link: 'https://www.meta.com', song: '/songs/meta.mp3' },
  { key: 'elevenlabs', name: 'ElevenLabs', role: 'campus ambassador', logo: '/eleven-logo.png', photo: '/exp-eleven.jpg', link: 'https://elevenlabs.io/', song: '/songs/elevenlabs.mp3' },
  { key: 'myovara', name: 'Myovara', role: 'lead mobile engineer & team lead', logo: '/lg-myovara.png', photo: '/exp-myovara.jpg', link: 'https://tech.cornell.edu/built/myovara-labs/', song: '/songs/myovara.mp3' },
  { key: 'hack4impact', name: 'Hack4Impact Cornell', role: 'technical lead & software developer', logo: '/lg-hack.png', photo: '/exp-hack.jpg', link: 'https://www.cornellh4i.org/', song: '/songs/hack4impact.mp3' },
  { key: 'wicc', name: 'Women in Computing at Cornell', role: 'technical committee member', logo: '/lg-wicc.png', photo: '/exp-wicc.jpg', link: 'https://wicc.cornell.edu/#/', song: '/songs/wicc.mp3' },
  { key: 'cs2112', name: 'Cornell CS 2112', role: 'teaching assistant', logo: '/lg-cornell.png', photo: '/exp-cornell.jpg', link: 'https://www.cs.cornell.edu/', song: '/songs/cs2112.mp3' },
];
const N = EXPS.length;
// paper clouds (public/cloud-bright.png): mostly along the bottom, big and small overlapping, a couple small ones up top
// [x, y (fractions of the panel), width (fraction of the panel's width), tilt (rad), flipped]
const CLOUDS = [
  [.09, .07, .156, .04, true], [.9, .12, .135, -.03, false],
  [.05, .78, .105, .05, false], [.09, .92, .28, .02, false], [.19, .8, .13, -.04, true], [.27, .96, .225, -.03, true], [.37, .9, .155, .03, false],
  [.66, .94, .115, -.05, true], [.86, .93, .23, .02, true], [.97, .8, .1, .06, false],
];
const CLOUDS_P = [
  [.15, .08, .3, .04, true], [.85, .13, .34, -.03, false],
  [.12, .9, .55, .02, false], [.42, .96, .4, -.04, true], [.78, .9, .6, .03, false], [.95, .8, .22, .06, true], [.3, .82, .18, -.02, true],
];
const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

// the stripes photo, fitted to the panel's height and tiled across with every other tile mirrored, so it stays
// sharp and joins without a seam (as in the film)
function Stripes() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, c = canvas.getContext('2d'), img = new Image(); img.src = '/paper.jpg';
    const draw = () => {
      if (!img.naturalWidth) return;
      const box = canvas.parentElement.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(box.width), h = Math.round(box.height); if (!w || !h) return;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const k = h / img.naturalHeight, dw = img.naturalWidth * k; let n = 0;
      for (let x = 0; x < w; x += dw, n++) { c.save(); if (n % 2) { c.translate(x + dw, 0); c.scale(-1, 1); c.drawImage(img, 0, 0, dw, h); } else c.drawImage(img, x, 0, dw, h); c.restore(); }
    };
    img.onload = draw; draw();
    let t = 0; const onResize = () => { clearTimeout(t); t = setTimeout(draw, 150); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, []);
  return <canvas ref={ref} className="exp-stripes" aria-hidden="true" />;
}

const Icon = ({ kind }) => {                                          // the transport glyphs, in plum
  switch (kind) {
    case 'shuffle': return <svg viewBox="0 0 24 24"><path d="M3 7h3.5l9 10H21M3 17h3.5l2.2-2.4M13.3 9.4 15.5 7H21" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M18 4l4 3-4 3zM18 14l4 3-4 3z" fill="currentColor" /></svg>;
    case 'rewind': return <svg viewBox="0 0 24 24"><path d="M12 5 2 12l10 7zM22 5l-10 7 10 7z" fill="currentColor" /></svg>;
    case 'forward': return <svg viewBox="0 0 24 24"><path d="M12 5l10 7-10 7zM2 5l10 7-10 7z" fill="currentColor" /></svg>;
    case 'play': return <svg viewBox="0 0 24 24"><path d="M6 3l15 9-15 9z" fill="currentColor" /></svg>;
    case 'pause': return <svg viewBox="0 0 24 24"><path d="M5 3h5v18H5zM14 3h5v18h-5z" fill="currentColor" /></svg>;
    case 'repeat': return <svg viewBox="0 0 24 24"><path d="M4 12V9a4 4 0 0 1 4-4h9M20 12v3a4 4 0 0 1-4 4H7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /><path d="M15 2l4 3-4 3zM9 16l-4 3 4 3z" fill="currentColor" /></svg>;
    default: return null;
  }
};

export default function Experience() {
  const secRef = useRef(null), boxRef = useRef(null), rowRef = useRef(null), audioRef = useRef(null);
  const [portrait, setPortrait] = useState(() => window.innerWidth < window.innerHeight);
  const [held, setHeld] = useState(null);                            // the popped card's index
  const [playing, setPlaying] = useState(null);                      // the card whose song is playing
  const [prog, setProg] = useState({});                              // key → { t, d }
  const S = useRef({ off: 0, last: 0, near: false, raf: 0, held: null, idx: 0, portrait: false }).current;

  useEffect(() => { const on = () => setPortrait(window.innerWidth < window.innerHeight); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  useEffect(() => { S.held = held; }, [held, S]);
  useEffect(() => { S.portrait = portrait; }, [portrait, S]);

  // the drift: the row moves left while nothing is held, looping over the six cards (laid out three times for the wrap)
  useEffect(() => {
    const sec = secRef.current, row = rowRef.current; if (!sec || !row) return;
    const obs = new IntersectionObserver(([e]) => { S.near = e.isIntersecting; }, { threshold: 0 }); obs.observe(sec);
    const tick = now => {
      S.raf = requestAnimationFrame(tick);
      const dt = Math.min(.05, (now - (S.last || now)) / 1000); S.last = now;
      if (!S.near) return;
      const box = boxRef.current.getBoundingClientRect(), pitch = row.children.length > 1 ? row.children[1].getBoundingClientRect().left - row.children[0].getBoundingClientRect().left : 0, loop = N * pitch;
      if (loop <= 0) return;
      if (S.portrait) {                                               // phones: one card at a time, the arrows slide to the next
        const target = S.idx * pitch, d = target - S.off; S.off += Math.abs(d) < .3 ? d : d * .16;
        if (Math.abs(d) < .3) { if (S.idx >= N) { S.idx -= N; S.off -= loop; } else if (S.idx < 0) { S.idx += N; S.off += loop; } }
      } else if (S.held == null) S.off = (S.off + box.width * .055 * dt) % loop;   // desktop: a steady drift, wrapping exactly one loop
      row.style.transform = `translateX(${-S.off}px)`;
    };
    S.raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(S.raf); obs.disconnect(); };
  }, [S]);

  // the music: one audio element; the bar and times follow it
  const play = useCallback(i => {
    const a = audioRef.current, e = EXPS[i];
    if (!a.src.endsWith(e.song)) { a.src = e.song; a.load(); }
    a.play().then(() => setPlaying(i)).catch(() => {});
    setHeld(i);
  }, []);
  const pause = useCallback(() => { audioRef.current.pause(); setPlaying(null); }, []);
  useEffect(() => {
    const a = audioRef.current;
    const onTime = () => { const i = playing; if (i == null) return; setProg(p => ({ ...p, [EXPS[i].key]: { t: a.currentTime, d: a.duration || 45 } })); };
    const onEnd = () => setPlaying(null);
    a.addEventListener('timeupdate', onTime); a.addEventListener('ended', onEnd);
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('ended', onEnd); };
  }, [playing]);

  // a click on the stripes lets the row go and stops the music
  const onBackground = e => { if (e.target.closest('.exp-card')) return; if (held != null) { setHeld(null); pause(); } };

  return (
    <section ref={secRef} className={'exp' + (portrait ? ' is-portrait' : '')}>
      <div ref={boxRef} className="exp-box" onPointerDown={onBackground}>
        <Stripes />
        {(portrait ? CLOUDS_P : CLOUDS).map(([x, y, w, tilt, flip], k) => (
          <img key={k} className="exp-cloud" src="/cloud-bright.png" alt="" draggable="false" style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, '--tilt': `${tilt}rad`, '--flip': flip ? -1 : 1 }} />
        ))}
        <div ref={rowRef} className="exp-row">
          {[-1, 0, 1].map(rep => EXPS.map((e, i) => {
            const p = prog[e.key], played = p ? p.t / p.d : .22 + .11 * i, dur = p ? p.d : 45, isHeld = held === i, isPlaying = playing === i;
            return (
              <div key={rep + e.key} className={'exp-card' + (isHeld ? ' is-up' : '')} style={{ '--i': rep * N + i }} onPointerDown={ev => { ev.stopPropagation(); if (!ev.target.closest('button, a')) setHeld(i); }}>
                <div className="exp-art"><img src={e.photo} alt="" draggable="false" /></div>
                <a className="exp-name mono" href={e.link} target="_blank" rel="noreferrer" onPointerDown={ev => ev.stopPropagation()}><img src={e.logo} alt="" /><span>{e.name}</span></a>
                <p className="exp-role mono">{e.role}</p>
                <div className="exp-bar"><div className="exp-bar-fill" style={{ width: `${played * 100}%` }} /><div className="exp-bar-dot" style={{ left: `${played * 100}%` }} /></div>
                <div className="exp-times serif"><span>{fmt(p ? p.t : played * dur)}</span><span>-{fmt(p ? p.d - p.t : (1 - played) * dur)}</span></div>
                <div className="exp-ctrl">
                  <button aria-label="shuffle" onPointerDown={ev => ev.stopPropagation()}><Icon kind="shuffle" /></button>
                  <button aria-label="rewind" onPointerDown={ev => ev.stopPropagation()} onClick={() => { if (isPlaying) audioRef.current.currentTime = 0; }}><Icon kind="rewind" /></button>
                  <button aria-label={isPlaying ? 'pause' : 'play'} className="exp-play" onPointerDown={ev => ev.stopPropagation()} onClick={() => isPlaying ? pause() : play(i)}><Icon kind={isPlaying ? 'pause' : 'play'} /></button>
                  <button aria-label="forward" onPointerDown={ev => ev.stopPropagation()} onClick={() => { if (isPlaying) audioRef.current.currentTime = Math.min(audioRef.current.duration - .5, audioRef.current.currentTime + 10); }}><Icon kind="forward" /></button>
                  <button aria-label="repeat" onPointerDown={ev => ev.stopPropagation()} onClick={() => { audioRef.current.loop = !audioRef.current.loop; }}><Icon kind="repeat" /></button>
                </div>
              </div>
            );
          }))}
        </div>
        {portrait && <>
          <button className="exp-arrow is-left" aria-label="previous" onPointerDown={e => e.stopPropagation()} onClick={() => { S.idx -= 1; setHeld(null); pause(); }}>‹</button>
          <button className="exp-arrow is-right" aria-label="next" onPointerDown={e => e.stopPropagation()} onClick={() => { S.idx += 1; setHeld(null); pause(); }}>›</button>
        </>}
        <span className="exp-label mono">experience</span><span className="exp-num mono">03</span>
        <span className="exp-credit mono" tabIndex="0" aria-label="music by Kevin MacLeod (incompetech.com), CC BY 4.0">♪<span className="exp-credit-text">music by Kevin MacLeod (incompetech.com) · CC BY 4.0</span></span>
        <audio ref={audioRef} preload="none" />
        <Frame />
      </div>
    </section>
  );
}
