# 0149 — `Carousel` draws edge effects with scroll-linked CSS, sizes a vertical track from its slides by measuring them, repeats a held button and resists a drag past an end, over script-driven effects, a container height or no repeat

**Status:** Accepted · **Date:** 2026-10-31

## Context
After [ADR-0148](./0148-carousel-loops-through-copies-of-its-slides-takes-a-mouse-drag-makes-the-peeking-slide-pressable-keeps-a-slide-centred-and-draws-far-slides-lazily-over-rewinding-a-native-only-gesture-an-inert-peek-or-mounting-every-slide.md) four finishing touches were still missing: slides that react as they scroll towards an edge, a vertical carousel that needs no container height, a button that keeps stepping while held, and some feel at the ends of a mouse drag.

## Decision
- **`effect` is the browser's scroll-linked animation** (`animation-timeline: view()`), in a `@supports` block, using the opacity and scale tokens. It runs off the main thread with no scroll listener, is simply absent where unsupported, and is switched off under `prefers-reduced-motion`.
- **`autoHeight` measures the slides** (a `ResizeObserver` on each) and sets the track's height to the tallest window of `slidesPerView` slides, gaps included, as a custom property. The tallest window, not the current one, keeps the height from changing as the track moves. It applies to a vertical, non-centred carousel; slides take their own heights.
- **`repeatOnHold` is on by default**: a press past 500 ms steps, then steps every 450 ms until let go, out of the button or at the end of the range. The click that ends a held press is swallowed. It is a pointer shortcut; the keys already repeat.
- **`edgeResistance` is on by default for a mouse drag that has ends** (not a wrapping carousel): what the browser refused of the drag is a pull of 35% on the slides through a `--carousel-pull` property, limited by a spacing token in CSS and eased back with the motion tokens on release. It is skipped under reduced motion.

## Alternatives considered
- **Scroll listeners that set opacity and scale from JS.** Rejected: a listener on every scroll frame, and no reduced-motion or support fallback for free.
- **Requiring a container height for a vertical carousel.** Kept as the default; `autoHeight` is the opt-out for content of its own height.
- **Sizing `autoHeight` from CSS alone.** Rejected: a scroll container sized in percent of its own content height has nothing to resolve against.
- **Repeat off by default, or on keys only.** Rejected: a held arrow button repeating is the expected behaviour of a stepper, and it is limited to a pointer press.
- **A native overscroll bounce.** Rejected: it is platform-specific and `overscroll-behavior` on the track turns it off.

## Consequences
- The pull moves the slides' rectangles for a moment; the settle reads positions after the pull is cleared in practice, but a release at the largest pull could in principle land closer to a neighbour than to the slide dragged from (pull is limited to a spacing step).
- `effect` needs Chromium, Safari or a recent browser with scroll-linked animation; elsewhere it is a no-op, never an error.
- `autoHeight` costs an observer per slide.

## Related
`05-component-api-conventions.md` §3; `06-engineering-standards.md` §4 (animate `transform`/`opacity`, respect reduced motion); `component-reviews/Carousel.md`.
