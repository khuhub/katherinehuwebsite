# Redesign v2 — brainstorm notes

Running list of references and what to take from each. Branch: `redesign/v2`.

## Resources

### hand-drawn-canvas-animation skill
`.claude/skills/hand-drawn-canvas-animation/` (from alesha-pro/tools)

- Canvas 2D engine for pencil / ink / riso / screen-print / doodle-on-photo looks.
- Seeded, time-pure drawing: same scroll position → same pixels. Drawings "hold" on twos like real cels.
- `pencilMinimal` palette was measured off a pencil-sketch personal site: cream `#f4efe4`, charcoal `#201f1b`, pale pink + sage sections.
- Useful bits for a website: `paper()` grain, `selfDraw` / `pen()` draw-on reveals, `handText`, `brush`/`wash`/`gouache`, `pastel()` sheets, whole-pose cels for a character.
- Engine is a classic script with global `const`s — load once from `public/`, wrap in a React hook, drive `tau` from scroll or rAF.

### somehowliving.tech (Nidhi Prajapati)
What makes the scroll feel smooth, measured in the browser:

- **Pinned horizontal track.** The "brain" section is `720vh` tall with a `sticky top-0 h-screen` viewport inside. A wide inner track gets `translateX` from scroll progress (at 2800px scrolled it was at −2494px). So vertical scrolling drives horizontal travel.
- **Lag = smoothness.** The track has `transition: all` on its transform, so it eases toward the target instead of snapping to the scroll position. No Lenis, GSAP or Framer — plain CSS + scroll listener.
- **Idle life.** Every cut-out object has a `animate-float-object` keyframe (slow bob + ~2–3° rotate), a blurred elliptical shadow under it, and a springy `cubic-bezier(0.34,1.56,0.64,1)` hover.
- **Depth of field.** Objects/text far along the track are `blur()`ed and sharpen as they arrive.
- **One continuous thread.** The hero scribble unravels into a single SVG line that runs through the whole track and connects sections (rough.js used for hand-drawn SVG strokes).
- **Type.** DM Sans (body/labels), Newsreader italic (display accents), Patrick Hand (handwritten notes like "an almost accurate map of everything on my mind").
- **Paper.** Background `oklch(0.975 0.003 85)` — warm off-white, very close to the skill's `pencilMinimal` paper.

Ideas it suggests for Katherine's site:
- Her existing cut-out illustrations (box, guitar, food, corgi, young/old) could live on a pinned horizontal track like Nidhi's objects, floating, with the skill's pencil doodles drawn *onto* them.
- The squiggly line already on the site could become the continuous thread that ties the whole scroll together — drawn with the skill's `pen()` so it draws itself as you scroll.
- Scroll-driven `tau` + eased transform gives the same smooth lag without a library.

### ASCII + pixel effects (Katherine likes these)
Already on the site: `src/Dither.js` — a three.js ordered-dither wave shader used as a strip over the grass.

Ways to use them that fit the hand-drawn direction:
- **ASCII as a drawing material.** The skill's engine renders to a canvas; sample that canvas on a coarse grid and print a glyph per cell (` .:-=+*#%@` or a custom set like `·-~=≈`). Her character or a project screenshot can start as ASCII and "resolve" into pencil lines on scroll — or the reverse, dissolve into characters as it leaves.
- **Dither as the screen-print finish.** The skill's `dotScreen` / `riso` finishes are already halftone; Bayer/ordered dither is the pixel cousin. One finish per section keeps it coherent (style.md rule).
- **Pixel reveal.** `mosaic()` in core.js is a block-pixelate transition — use it as the cut between sections instead of a fade.
- **Pixel sort / scanline on hover** for project thumbnails; CRT-ish scanlines over the dither strip.
- **ASCII text cursor / loading state**: the page could "type itself" in monospace before the pencil draws over it.
- Watch the mix: ASCII + dither + pencil + doodle is four textures. Pick a story reason for each (e.g. ASCII = "code", pencil = "me", dither = "transitions").

Type to try alongside: a monospace (JetBrains Mono / Geist Mono / IBM Plex Mono) for the ASCII and code-ish labels.

## Hero concept: the eyes (Katherine's idea)
Reference: `docs/ref/hero-eyes.webp` (her drawing, 1125×2000, shot vertically — the face reads correctly when turned 90° so the eyes sit side by side).

**The idea:** first screen is this face drawn out horizontally, filling the viewport. The eyes blink, then an eye *opens* and the site is revealed through it.

How it maps onto the skill:
- **Face as whole-pose cels.** Eyes open / half / closed / wide as 3–4 replacement drawings on an exposure sheet (`cels.js`). A blink is ~6 frames: open → half (1–2 frames) → closed (2 frames) → half → open. Hold open for a few seconds, with tiny drifts (pupil glance, lash settle) so it feels alive, not looping.
- **Marks that match her drawing:** dark hair = long pressure brush strokes (`brush` / ink cel) in near-black with warm brown; lashes = tapered ink flicks; freckles = seeded `grain`/dot field on the right cheek; stars in the pupils = tiny white gouache marks; the yellow star in the hair = `wash` + gouache. Skin is a flat peach wash (`#f3b98f`-ish) — paper shows through at the edges.
- **The reveal = `iris()`.** core.js already has `iris(c, cx, cy, r, fn, outsideColor)`: draws `fn` inside a growing circle. Center it on one pupil: the pupil's black fills the screen, then it opens as a circle onto the page underneath. Literally an iris-out through her eye.
- **Alternative reveal:** the eyelid closes (black frame), opens on the page — classic "waking up" shot. Or both: blink twice, then on the third blink the lids open onto the site.
- **Scroll or time?** Candidate: the face plays its idle blinks on a timer, and the *reveal* is scroll-driven — the first scroll opens the eye in proportion to scroll distance, so the user controls the pace (ties into the smooth-scroll feel from somehowliving.tech).
- **After the reveal** the eyes can shrink into a corner / nav mark and keep blinking occasionally, so the hero never fully leaves.

Needs from Katherine: the original drawing at full size if there's a bigger one, and whether the hair/star should be redrawn as strokes (true cel look) or kept as her painting with only the eyes animated on top.

## Open questions (waiting on Katherine)
- More examples / screenshots and what she likes in each.
- Base look: pencil vs doodle-on-photos vs a mix.
- Keep existing PNG drawings as cut-outs, or redraw some as stroke animation?
- Sections to keep/add; scroll-driven vs autoplay motion.
