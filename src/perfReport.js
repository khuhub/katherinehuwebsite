// A hidden diagnostic: open the site with ?perf (katherineyhu.com/?perf) and a small box in the corner times every
// frame, by what is on screen (the intro, then each panel), and in Chrome records what each slow frame spent its
// time on. "Copy report" puts it all on the clipboard. Nothing is sent anywhere; without ?perf none of this runs.
export default function perfReport() {
  const t0 = performance.now();
  const info = {
    url: window.location.href, ua: navigator.userAgent, platform: (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform,
    dpr: window.devicePixelRatio, screen: `${window.screen.width}x${window.screen.height}`, viewport: `${window.innerWidth}x${window.innerHeight}`,
    cores: navigator.hardwareConcurrency, memoryGB: navigator.deviceMemory,
  };
  // what draws the page: the graphics card's name, and whether the browser calls it a slow (software) one
  try {
    const g = document.createElement('canvas').getContext('webgl');
    if (!g) info.webgl = 'none';
    else { const x = g.getExtension('WEBGL_debug_renderer_info'); info.webgl = x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER); const l = g.getExtension('WEBGL_lose_context'); if (l) l.loseContext(); }
    const s = document.createElement('canvas').getContext('webgl', { failIfMajorPerformanceCaveat: true });
    info.gpuOK = !!s; if (s) { const l = s.getExtension('WEBGL_lose_context'); if (l) l.loseContext(); }
  } catch (e) { info.webgl = 'error ' + e.message; }

  // what is on screen right now
  const where = () => {
    const intro = document.querySelector('canvas[aria-label]');
    if (intro) return `intro (${intro.width}px)`;
    const y = window.innerHeight / 2;
    for (const el of document.querySelectorAll('#root section')) { const r = el.getBoundingClientRect(); if (r.top <= y && r.bottom > y) return el.className.split(' ')[0] || 'section'; }
    return 'footer';                                               // the footer sits fixed under the panels and shows once they have scrolled past
  };

  // every frame's length, filed under what was on screen
  const phases = new Map(); let cur = where(), last = 0, live = [];
  const file = (name, d) => { if (!phases.has(name)) phases.set(name, { d: [], from: performance.now() }); phases.get(name).d.push(d); };
  const tick = n => {
    if (document.hidden) last = 0;
    else { if (last) { const d = n - last; file(cur, d); live.push(d); } last = n; }
    cur = where();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // the slow frames, and what ran in them (Chrome 123+); the plain long-task list elsewhere
  const slow = []; let loafs = 0;
  try {
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        loafs++;
        const render = e.renderStart ? Math.round(e.startTime + e.duration - e.renderStart) : null;
        const scripts = (e.scripts || []).map(s => ({ ms: Math.round(s.duration), fn: s.sourceFunctionName || s.invoker || '?', src: (s.sourceURL || '').split('/').pop().split('?')[0], forced: Math.round(s.forcedStyleAndLayoutDuration || 0) })).sort((a, b) => b.ms - a.ms).slice(0, 3);
        slow.push({ at: Math.round(e.startTime), ms: Math.round(e.duration), blocking: Math.round(e.blockingDuration || 0), render, on: cur, scripts });
      }
    }).observe({ type: 'long-animation-frame', buffered: true });
  } catch (e) {
    try { new PerformanceObserver(list => { for (const e of list.getEntries()) slow.push({ at: Math.round(e.startTime), ms: Math.round(e.duration), on: cur, longtask: true }); }).observe({ type: 'longtask', buffered: true }); } catch (e2) { /* neither */ }
  }
  let lcp = null;
  try { new PerformanceObserver(l => { const e = l.getEntries().pop(); if (e) lcp = Math.round(e.startTime); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) { /* not supported */ }

  const stats = d => {
    const s = [...d].sort((a, b) => a - b), tot = d.reduce((a, b) => a + b, 0);
    return { secs: +(tot / 1000).toFixed(1), fps: Math.round(d.length / (tot / 1000)), median: Math.round(s[s.length >> 1]), p95: Math.round(s[Math.floor(s.length * .95)]), worst: Math.round(s[s.length - 1]), over50ms: d.filter(x => x > 50).length };
  };
  const report = () => {
    const nav = performance.getEntriesByType('navigation')[0];
    const out = {
      ...info, secondsOpen: Math.round((performance.now() - t0) / 1000),
      load: nav ? { domReady: Math.round(nav.domContentLoadedEventEnd), loaded: Math.round(nav.loadEventEnd), lcp } : { lcp },
      canvases: [...document.querySelectorAll('canvas')].filter(c => c.width).map(c => `${c.width}x${c.height}${c.className ? ' ' + c.className : ''}`),
      frames: Object.fromEntries([...phases].map(([k, v]) => [k, stats(v.d)])),
      slowFrames: { count: slow.length, observed: loafs ? 'long-animation-frame' : 'longtask', worst: [...slow].sort((a, b) => b.ms - a.ms).slice(0, 25) },
    };
    return JSON.stringify(out, null, 1);
  };

  // the box: live frame rate, what's on screen, and the copy button. Its taps don't reach the page (they would end the intro).
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483647;background:rgba(20,20,20,.88);color:#fff;font:12px/1.4 Consolas,Menlo,monospace;padding:8px 10px;border-radius:6px;max-width:300px';
  const line = document.createElement('div'), btn = document.createElement('button'), note = document.createElement('div');
  btn.textContent = 'Copy report'; btn.style.cssText = 'margin-top:6px;font:inherit;padding:3px 8px;cursor:pointer';
  note.style.cssText = 'margin-top:4px;opacity:.8';
  note.textContent = 'Watch the intro, click it, then scroll through every section. Then copy the report.';
  box.append(line, btn, note);
  for (const ev of ['pointerdown', 'touchstart', 'wheel', 'keydown']) box.addEventListener(ev, e => e.stopPropagation());
  btn.addEventListener('click', async () => {
    const text = report();
    try { await navigator.clipboard.writeText(text); note.textContent = 'Copied. Paste it into a message.'; }
    catch (e) { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'width:280px;height:120px;font:10px monospace'; box.append(ta); ta.select(); note.textContent = 'Select all of the text below and copy it.'; }
  });
  const add = () => document.body.append(box);
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
  setInterval(() => { const d = live; live = []; if (!d.length) return; const tot = d.reduce((a, b) => a + b, 0); line.textContent = `${Math.round(d.length / (tot / 1000))} fps · worst ${Math.round(Math.max(...d))} ms · ${cur}`; }, 500);
}
