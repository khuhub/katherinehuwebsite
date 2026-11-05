// A canvas that is drawn once (the lawn, the cork, the stripes) is turned into a picture: the drawing becomes the
// element's background image and the bitmap is released. Safari keeps a tight budget for canvas memory and a
// full-panel canvas at retina density is 10–20 MB; as a picture it is cheap, and the browser can drop and
// re-decode it as it likes. It waits until the intro is over and the hero has settled, so the picture's decode
// never lands in the middle of the reveal (a stall Safari shows as white tiles). Returns a function that
// releases the picture (for the next draw, or unmount).
export default function freeze(canvas) {
  let url = null, dead = false;
  const go = () => { if (dead) return; canvas.toBlob(blob => {
    if (dead || !blob) return;
    url = URL.createObjectURL(blob);
    canvas.style.backgroundImage = `url(${url})`; canvas.style.backgroundSize = '100% 100%';
    canvas.width = 0; canvas.height = 0;                                  // the bitmap goes; the CSS box and its background stay
  }, 'image/jpeg', .92); };
  const later = () => {
    if (dead) return;
    if (document.querySelector('canvas[aria-label]')) { window.addEventListener('hero:done', () => setTimeout(later, 2500), { once: true }); return; }
    if (window.requestIdleCallback) window.requestIdleCallback(go, { timeout: 4000 }); else setTimeout(go, 0);
  };
  later();
  return () => { dead = true; if (url) { URL.revokeObjectURL(url); url = null; } canvas.style.backgroundImage = ''; };
}
