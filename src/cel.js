// Her, drawn once per pose at a size (public/engine/body.js), with her shadow (her own silhouette, blurred) on a
// second small canvas. The projects walker and the footer lamp draw these two pictures each frame instead of
// redrawing her strokes and blurring them every time, which was most of the frame on a slow phone.
export default function cel(B, pose, lw, lh, sc, dpr) {
  const body = document.createElement('canvas'); body.width = Math.round(lw * dpr); body.height = Math.round(lh * dpr);
  const g = body.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); B.draw(g, pose, { x: lw / 2, y: lh - 20 * sc, scale: sc });
  const shadow = document.createElement('canvas'); shadow.width = body.width; shadow.height = body.height;
  const s = shadow.getContext('2d'); s.setTransform(dpr, 0, 0, dpr, 0, 0); s.filter = 'brightness(0) blur(5px)'; s.drawImage(body, 0, 0, lw, lh);
  return { body, shadow };
}
