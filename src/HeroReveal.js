import { useEffect, useRef } from 'react';

const BLUE = [133, 185, 202];
const PAUSE_MS = 300;

function mkRng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function buildStroke(x0, y0, x1, y1, lw, alpha, rng) {
  const dx  = x1 - x0;
  const dy  = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy);
  const px  = -dy / len;
  const py  =  dx / len;
  const pts = [];
  // larger step → fewer points per stroke (faster to process, still smooth)
  const steps = Math.round(len / (7 + rng() * 6));
  for (let i = 0; i <= steps; i++) {
    const t   = i / steps;
    const bx  = x0 + dx * t;
    const by  = y0 + dy * t;
    const dev = (rng() - 0.5) * 12;
    pts.push([bx + px * dev, by + py * dev]);
  }
  return { pts, lw, alpha };
}

function buildStrokes(W, H, seed) {
  const rng     = mkRng(seed);
  const strokes = [];
  const STEP    = 22;
  const OVER    = 30;

  const addStroke = (x0, y0, x1, y1) => {
    const lw    = 22 + rng() * 22;
    const alpha = 0.5 + rng() * 0.45;
    strokes.push(buildStroke(
      x0 + (rng() - 0.5) * 6, y0 + (rng() - 0.5) * 6,
      x1 + (rng() - 0.5) * 6, y1 + (rng() - 0.5) * 10,
      lw, alpha, rng
    ));
  };

  // left → right and right → left (horizontal bands)
  for (let y = -STEP; y < H + STEP; y += STEP) {
    const yj = y + (rng() - 0.5) * STEP * 0.5;
    const passes = 2 + (rng() > 0.6 ? 1 : 0);
    for (let p = 0; p < passes; p++) {
      const yp = yj + (rng() - 0.5) * 6;
      if (rng() > 0.5) addStroke(-OVER, yp, W + OVER, yp + (rng() - 0.5) * 8);
      else             addStroke(W + OVER, yp, -OVER, yp + (rng() - 0.5) * 8);
    }
  }

  // top → bottom and bottom → top (vertical bands)
  for (let x = -STEP; x < W + STEP; x += STEP) {
    const xj = x + (rng() - 0.5) * STEP * 0.5;
    const passes = 2 + (rng() > 0.6 ? 1 : 0);
    for (let p = 0; p < passes; p++) {
      const xp = xj + (rng() - 0.5) * 6;
      if (rng() > 0.5) addStroke(xp, -OVER, xp + (rng() - 0.5) * 8, H + OVER);
      else             addStroke(xp, H + OVER, xp + (rng() - 0.5) * 8, -OVER);
    }
  }

  shuffle(strokes, rng);
  return strokes;
}

// Draw a full stroke (cover or full erase)
function paintStroke(ctx, { pts, alpha, lw }, erase) {
  if (pts.length < 2) return;
  ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i+1][0]) / 2;
    const my = (pts[i][1] + pts[i+1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  ctx.lineTo(pts[pts.length-1][0], pts[pts.length-1][1]);
  ctx.strokeStyle = erase ? 'rgba(0,0,0,1)' : `rgba(${BLUE[0]},${BLUE[1]},${BLUE[2]},${alpha})`;
  ctx.lineWidth = erase ? lw + 12 : lw;
  ctx.lineCap   = 'round';
  ctx.lineJoin  = 'round';
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}

// Draw a segment of a stroke from pts[a] to pts[b] using destination-out
function eraseSegment(ctx, pts, a, b, lw) {
  const slice = pts.slice(a, b + 1);
  if (slice.length < 2) return;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(slice[0][0], slice[0][1]);
  for (let i = 1; i < slice.length - 1; i++) {
    const mx = (slice[i][0] + slice[i+1][0]) / 2;
    const my = (slice[i][1] + slice[i+1][1]) / 2;
    ctx.quadraticCurveTo(slice[i][0], slice[i][1], mx, my);
  }
  ctx.lineTo(slice[slice.length-1][0], slice[slice.length-1][1]);
  ctx.strokeStyle = 'rgba(0,0,0,1)';
  ctx.lineWidth   = lw + 12;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}

// ease-in cubic
function easeIn(t)  { return t * t * t; }
// bell: slow → fast → slow (peaks at t=0.5)
function bell(t)    { return Math.sin(t * Math.PI); }

function HeroReveal({ onRevealStart, onComplete }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const W      = canvas.width  = window.innerWidth;
    const H      = canvas.height = window.innerHeight;

    const coverStrokes = buildStrokes(W, H, 42);

    // Reveal queue: reverse of cover so last-painted stroke retracts first
    // Each entry tracks how far back the retraction cursor has moved
    const revealQueue = [...coverStrokes].reverse().map(s => ({
      ...s,
      cursor: s.pts.length - 1, // starts at end
    }));

    const COVER_MIN = 3,  COVER_MAX = 80;
    // Points to retract per active stroke per frame
    const RETRACT_PTS = 14;
    // How many strokes to retract simultaneously — ramps with bell curve
    const CONCUR_MIN = 3, CONCUR_MAX = 20;

    let phase    = 'covering';
    let coverIdx = 0;
    let revealIdx = 0;           // next stroke to activate from revealQueue
    let active   = [];           // currently retracting strokes
    let animId;

    function draw() {
      if (phase === 'covering') {
        const t   = coverIdx / coverStrokes.length;
        const spf = Math.max(1, Math.round(COVER_MIN + (COVER_MAX - COVER_MIN) * easeIn(t)));
        for (let i = 0; i < spf && coverIdx < coverStrokes.length; i++) {
          paintStroke(ctx, coverStrokes[coverIdx++]);
        }
        if (coverIdx >= coverStrokes.length) {
          phase = 'pausing';
          if (onRevealStart) onRevealStart();
          setTimeout(() => {
            phase  = 'revealing';
            animId = requestAnimationFrame(draw);
          }, PAUSE_MS);
          return;
        }

      } else if (phase === 'revealing') {
        const totalDone = revealQueue.length - revealIdx - active.length;
        const t = totalDone / revealQueue.length;

        // How many concurrent retractions we want right now
        const targetConcur = Math.max(CONCUR_MIN, Math.round(CONCUR_MIN + (CONCUR_MAX - CONCUR_MIN) * bell(t)));

        // Activate new strokes up to target concurrency
        while (active.length < targetConcur && revealIdx < revealQueue.length) {
          active.push(revealQueue[revealIdx++]);
        }

        // Advance each active retraction this frame
        const nextActive = [];
        for (const s of active) {
          const from = Math.max(0, s.cursor - RETRACT_PTS);
          const to   = s.cursor;
          eraseSegment(ctx, s.pts, from, to, s.lw);
          s.cursor = from;
          if (s.cursor > 0) nextActive.push(s);
          // if cursor == 0 the stroke is fully retracted, drop it
        }
        active = nextActive;

        if (active.length === 0 && revealIdx >= revealQueue.length) {
          if (onComplete) onComplete();
          return;
        }
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}
    />
  );
}

export default HeroReveal;
