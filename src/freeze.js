// A canvas that is drawn once (the lawn, the cork, the stripes) is turned into a picture: the drawing becomes the
// element's background image and the bitmap is released. Safari keeps a tight budget for canvas memory and a
// full-panel canvas at retina density is 10–20 MB; as a picture it is cheap, and the browser can drop and
// re-decode it as it likes. Returns a function that releases the picture (for the next draw, or unmount).
export default function freeze(canvas) {
  let url = null, dead = false;
  canvas.toBlob(blob => {
    if (dead || !blob) return;
    url = URL.createObjectURL(blob);
    canvas.style.backgroundImage = `url(${url})`; canvas.style.backgroundSize = '100% 100%';
    canvas.width = 0; canvas.height = 0;                                  // the bitmap goes; the CSS box and its background stay
  }, 'image/png');
  return () => { dead = true; if (url) { URL.revokeObjectURL(url); url = null; } canvas.style.backgroundImage = ''; };
}
