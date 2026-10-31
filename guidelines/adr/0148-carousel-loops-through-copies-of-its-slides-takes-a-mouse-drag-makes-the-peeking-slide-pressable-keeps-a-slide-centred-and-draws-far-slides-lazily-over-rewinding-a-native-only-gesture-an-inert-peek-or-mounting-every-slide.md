# 0148 — `Carousel` loops through copies of its slides, takes a mouse drag, makes the peeking slide pressable, keeps a slide centred and draws far slides lazily, over rewinding, a native-only gesture, an inert peek or mounting every slide

**Status:** Accepted · **Date:** 2026-10-31 · Supersedes in part [ADR-0147](./0147-carousel-scrolls-natively-with-scroll-snap-and-hides-off-screen-slides-with-inert-and-owns-an-opt-in-auto-play-with-its-pause-control-over-a-transform-track-or-leaving-auto-play-to-the-app.md) (its loop and peeking-slide decisions; the native scroll-snap track, `inert` slides and auto-play stand)

## Context
The first `Carousel` wrapped by rewinding, left a mouse with no way to drag, made the peeking slide `inert`, and mounted every slide. A first review listed these as the gaps a person notices: a rewind is a visible jump, a desktop user cannot drag, a peeking slide shows content that cannot be used, and a long carousel of images costs memory. A fractional view and a centred slide were added with them, since both change which slide is "in view".

## Decision
- **`loop` is seamless through copies.** The track holds copies of the first and last `visible + 1` slides at its ends. A move across the seam takes the shorter way, onto a copy, and once the track settles there it jumps, without animating, to the real slide the copy matches, which looks the same. Copies are `aria-hidden` and `inert`, so assistive technology and the keyboard never meet them; an `id` inside a slide is repeated in them. A carousel that already shows every slide does not wrap. `value` is then any slide, and the view wraps round the end.
- **A mouse drags the slides** (`mouseDrag`, on by default): a press that moves five pixels scrolls the track by the pointer with snapping switched off, a quick release carries on to the next slide, and letting go switches snapping back on, so the browser settles on the nearest slide. Touch and pen scroll natively. A click that ends a drag is swallowed, and a press in a form field or media element never starts one.
- **The peeking slide is pressable, not `inert`**, and a slide that takes focus with only its edge in view is brought fully into view (the browser scrolls a partly visible element no further).
- **`align="center"` keeps the slide at `value` in the middle**, with spacers at each end of the track so the first and last can reach it. With it `value` is the middle slide and any slide can be one, and `peek` has no effect.
- **`slidesPerView` may be a fraction.** The slides a fraction cuts count as in view, and the last position is the one that scrolls the track to its end.
- **`lazy` draws a slide's content only within a reach of the view** (one slide for `true`), and its `placeholder` before that. A slide that has been drawn stays drawn.
- **Rotation is held by playing media and by the controller.** A `<video>` or `<audio>` playing in a slide holds it, and `controller.hold()` returns a release function, for content the carousel cannot see; holds add up.
- **A controlled owner that does not take a settled swipe gets the track put back**, in the commit after the report, rather than after a timer.
- **A vertical carousel with nothing to scroll warns in development** that it needs a height.

## Alternatives considered
- **Keep the rewind.** Rejected: it is the most visible flaw of `loop`, and the cost of copies is bounded and hidden from assistive technology.
- **Infinite scroll by moving slides in the DOM.** Rejected: it moves focus, breaks the scroll position and fights native snapping; copies at fixed ends leave the real slides alone.
- **Pointer-event drag with transforms.** Rejected for the same reason as in ADR-0147: the scroll position stays the single source of truth, and the drag only sets it.
- **Pressing a peeking slide advances the carousel instead.** Rejected: a button there that does nothing but scroll is worse than one that works.
- **A `slideHeight` or windowing for long carousels.** Rejected: windowing a snap track removes the scroll extent; a placeholder keeps the slide's box.

## Consequences
- A wrapping carousel has up to `2 × (visible + 1)` extra slides in the DOM, and their content renders again (unless `lazy`).
- `id`s inside a slide are duplicated in a wrapping carousel; the Docs page says so.
- Dragging swallows the click that ends it and stops the browser's own drag of images and links inside the track.

## Related
`05-component-api-conventions.md` §3; [ADR-0147](./0147-carousel-scrolls-natively-with-scroll-snap-and-hides-off-screen-slides-with-inert-and-owns-an-opt-in-auto-play-with-its-pause-control-over-a-transform-track-or-leaving-auto-play-to-the-app.md); `component-reviews/Carousel.md`.
