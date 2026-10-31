# 0151 — `ImageViewer` zooms with hand-rolled pointer and wheel gestures that write one transform from a view held in a ref, over native scroll zoom, a pan-zoom dependency or state per move

**Status:** Accepted · **Date:** 2026-10-31 · **Amended 2026-10-31** — a drag past an edge gives and a quick release coasts; the decision itself is unchanged

## Context
The viewer needs wheel and pinch zoom about a point, drag to pan, double-tap to zoom, and, at the fitted size, a swipe to change image or dismiss. These share one pointer, so which gesture a drag is has to be decided, and the cost of a gesture has to stay below the cost of a frame. The project takes no animation or gesture library ([ADR-0140](./0140-the-design-system-takes-no-animation-library-and-animates-with-css-and-the-motion-tokens-over-keeping-motion-as-an-optional-peer-dependency.md)).

## Decision
- **The geometry is pure code** (`imageViewerMath.ts`: fit, pan limits, zoom about a point, steps, wheel factor), tested without a DOM.
- **The view (zoom and offset) lives in a ref and is written straight to one element's `transform`** (`translate(x, y) rotate(r) scale(s)`, in screen coordinates), so a drag, a pinch or a wheel turn re-renders nothing. React is told only the zoom, for the toolbar, when it changes. The image is laid out at its fitted size in pixels (`fitSize`, never larger than its own pixels) and the stage is observed for resizes.
- **One native listener set on the stage** (pointer down, move, up, cancel, and a non-passive `wheel`) reads the latest options through a ref:
  - a wheel zooms about the cursor, finer with the control key (a trackpad pinch);
  - two pointers pinch and move together, and the finger left carries on as a pan;
  - one pointer pans a zoomed image; at the fitted size a finger (touch or pen, not a mouse, which has arrows) swipes, locked to one axis: sideways beyond a distance or a speed changes image, downwards dismisses, otherwise it settles back;
  - a tap on the image twice zooms to 2× about the point and back; a tap on the stage beside the image is a press on the scrim.
- **Every gesture has a button and a key**, handled on the panel: arrows, `+`, `-`, `0`, `r`, `f`, Page Up and Down, Home and End. While zoomed the arrow keys pan and Page Up and Down move between images.
- **Easing is a CSS transition on `transform`** keyed by a `data-animate` attribute that is off during a gesture and absent under `prefers-reduced-motion`; a new image fades up and does not slide.

## Alternatives considered
- **Native scroll zoom (a scrolling box over a scaled image).** Rejected: pinch and zoom about a point are not scroll operations, a scrolled image cannot be swiped, and the platform's own page-zoom gesture would compete.
- **A pan-zoom library.** Rejected: a runtime dependency for about 300 lines, and one that would own the pointer the swipe arbitration needs.
- **State per move.** Rejected: a re-render per pointer move on a stage holding a large image and the toolbar; a ref and one style write is the same output with none of the cost.
- **Edge resistance on a drag past the limit.** *(Amended 2026-10-31: this was originally not done and the offset was clamped. A drag now follows the finger a shorter and shorter way past an edge, up to 64px, and settles back when let go, and a quick release coasts and stops by itself, except under reduced motion.)*

## Consequences
- The real gestures are checked in a real browser (wheel and drag through the protocol; touch as the pointer events a touch screen raises, since a protocol touch is unreliable in some runners), and the maths in jsdom.
- A synthetic or already-ended pointer can't be captured, so capture is wrapped in a commented `try/catch`.
- A zoomed image's coast is hand-rolled (an exponential decay over animation frames), so it is not the platform's momentum.

## Related
`06-engineering-standards.md` §9 (real-browser checks, `prefers-reduced-motion`); [ADR-0150](./0150-imageviewer-is-a-prop-driven-radix-dialog-over-an-images-array-with-its-own-single-stage-and-fixed-dark-controls-over-composing-dialog-embedding-carousel-or-reusing-iconbutton.md); [ADR-0063](./0063-drawer-gets-swipe-to-dismiss-from-its-handle-and-header-a-size-that-can-be-a-length-and-a-back-button-recipe.md) (the swipe it follows); `component-reviews/ImageViewer.md`.
