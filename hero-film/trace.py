# Trace the face from docs/ref/vibe-chibi.jpg into point lists for the engine.
import json, sys
import numpy as np
from PIL import Image
from skimage import measure, morphology

im = np.asarray(Image.open('docs/ref/vibe-chibi.jpg').convert('RGB')).astype(int)
R, G, B = im[..., 0], im[..., 1], im[..., 2]
L = (R + G + B) / 3
H, W = L.shape

from scipy import ndimage
dark = L < 75
hair = L < 42                              # the headphones are a lighter grey and drop out here
hair = morphology.remove_small_objects(hair, 300)
lab = measure.label(hair)
sizes = np.bincount(lab.ravel()); sizes[0] = 0
hair_lab = sizes.argmax(); hair_mask = ndimage.binary_fill_holes(lab == hair_lab)
hair_mask = morphology.binary_opening(hair_mask, morphology.disk(3))

skin = (R > 200) & (G > 130) & (G < 225) & (B > 110) & (B < 215) & (R - B > 25)
skin = morphology.remove_small_holes(morphology.remove_small_objects(skin, 300), 2000)
slab = measure.label(skin); face_lab = slab[320, 355]; face_mask = slab == face_lab
interior = morphology.convex_hull_image(face_mask)            # the eyes aren't closed holes (lashes touch the hair), so use the hull
pupil_mask = morphology.binary_opening(dark & interior, morphology.disk(9))   # big round blobs survive, lashes and bang tips don't
plab = measure.label(pupil_mask)
pupils = [p for p in measure.regionprops(plab) if 2500 < p.area < 20000 and p.centroid[0] < 400]
pupil_mask = np.isin(plab, [p.label for p in pupils])
hair_mask = hair_mask & ~morphology.binary_dilation(pupil_mask, morphology.disk(4))
white = (L > 236)
# the head under the hair: skin + eyes + lashes, bang bites closed, as one smooth shape (the hair is drawn over it)
head = face_mask | pupil_mask | (white & interior) | (dark & interior & ~hair_mask)
head = ndimage.binary_fill_holes(morphology.binary_closing(head, morphology.disk(28)))
head = morphology.binary_opening(head, morphology.disk(6))
mouth = [p for p in measure.regionprops(measure.label((L < 150) & interior & ~pupil_mask & ~hair_mask)) if 20 < p.area < 400 and p.centroid[0] > 360]

white = (L > 236)
wlab = measure.label(white)
border = set(np.unique(np.concatenate([wlab[0], wlab[-1], wlab[:, 0], wlab[:, -1]])))
whites = [p for p in measure.regionprops(wlab) if p.label not in border and 800 < p.area < 20000 and p.centroid[0] < 400]
# each eye = its white plus the pupil that sits in it, closed into one smooth oval
eyes = []
for p in whites:
    m = wlab == p.label
    for q in pupils:
        if abs(q.centroid[1] - p.centroid[1]) < 80: m = m | (plab == q.label)
    m = ndimage.binary_fill_holes(morphology.binary_closing(m, morphology.disk(10)))
    eyes.append(m)

def contour(mask, tol=2.5):
    cs = measure.find_contours(mask.astype(float), .5)
    c = max(cs, key=len)
    c = measure.approximate_polygon(c, tol)
    return [[float(x), float(y)] for y, x in c]      # find_contours gives (row, col)

out = {
  'hair': contour(hair_mask, 2.0),
  'face': contour(head, 2.5),
  'whites': [contour(m, 1.5) for m in eyes],
  'pupils': [{'cx': float(p.centroid[1]), 'cy': float(p.centroid[0]), 'r': float(np.sqrt(p.area / np.pi)), 'bbox': [int(v) for v in p.bbox]} for p in pupils],
  'size': [W, H],
  'mouth': [{'cx': float(p.centroid[1]), 'cy': float(p.centroid[0]), 'bbox': [int(v) for v in p.bbox]} for p in mouth],
}
print({k: (len(v) if isinstance(v, list) else v) for k, v in out.items()})
print('pupils', out['pupils']); print('mouth', out['mouth']); print('whites', [ (len(w), w[0]) for w in out['whites']])
open('hero-film/chibi-data.js', 'w').write('const CHIBI = ' + json.dumps(out) + ';\n')

# a check sheet: masks tinted over the image
dbg = im.copy()
dbg[hair_mask] = (dbg[hair_mask] * .3 + np.array([200, 40, 40]) * .7)
dbg[head] = (dbg[head] * .3 + np.array([40, 200, 40]) * .7)
for m in eyes: dbg[m] = [40, 80, 255]
for p in pupils: dbg[plab == p.label] = [255, 220, 0]
Image.fromarray(dbg.astype(np.uint8)).save('hero-film/out/trace-check.png')
