# 0147 — `Carousel` scrolls natively with scroll-snap and hides off-screen slides with `inert`, and owns an opt-in auto-play with its pause control, over a transform track or leaving auto-play to the app

**Status:** Accepted · **Date:** 2026-10-31

## Context
`Carousel` shows one slide, or a few, from a row of slides. Radix has no carousel primitive, so the inventory's "wraps Radix" line cannot hold, and the dependency rule ([ADR-0140](./0140-the-design-system-takes-no-animation-library-and-animates-with-css-and-the-motion-tokens-over-keeping-motion-as-an-optional-peer-dependency.md), `CLAUDE.md`) rules out a carousel library. Two things decide its shape: how a slide moves, and who owns automatic rotation. `Indicators` already hands the WCAG 2.2.2 pause, stop and hide duty for auto-advance to this component.

## Decision
- **The track is a native scroll container with CSS `scroll-snap`.** Touch, trackpad, wheel, momentum and keyboard scrolling are the browser's. Code moves it with `scrollTo` (smooth, or instant under `prefers-reduced-motion`), and reads where it settled (`scrollend`, with a debounced `scroll` as the fallback) to report the slide that is first in view.
- **A slide outside the view is `inert`**, so a link or button in it is neither tabbable nor read out, and a slide's `role="group"` name says its place ("3 of 8"). `inert` is set from an effect, not the JSX prop, since the peer range starts at React 18, which drops the attribute.
- **Auto-play is part of the component, off by default.** When on, it pauses on hover, on focus inside, while the page is hidden and from a pause button that is always drawn, starts paused under `prefers-reduced-motion`, and stays paused once the person pauses it. The live region is silent while it runs, so the rotation does not read out over the person.
- **Parts are placed by kind.** `Carousel.Previous`, `Next`, `Indicators` and `AutoPlayToggle`, when given as direct children, replace the default control of the same kind; with none, the defaults are drawn. Every other element child is a slide, so a component of your own that renders a `Carousel.Slide` can be mapped over data (a stricter match on the `Carousel.Slide` type would ignore it).
- **`value` is the index of the first slide in view**, one `value`/`defaultValue`/`onValueChange` trio. A press asks through `onValueChange` and the track moves when the value does; a scroll or swipe, which the browser has already done, is reported once it settles.
- **`loop` wraps the controls and indicators from the last position to the first and back, with no cloned slides.** The rewind is a visible scroll back, not a seamless ring.

## Alternatives considered
- **A transform-driven track with hand-written drag.** Rejected: it re-implements momentum, trackpad and touch handling the browser does for free, and breaks sticky and `IntersectionObserver` work inside it (`Affix`'s horizontal axis).
- **A carousel library.** Rejected: a new runtime dependency for behaviour about 300 lines of code cover.
- **Leaving auto-play to the app through the controller.** Rejected: the 2.2.2 duty would fall on every consumer, and a missing pause button is the common failure.
- **Cloned slides for a seamless loop.** Rejected: clones duplicate content for assistive technology and for `id`s, and break `inert` and focus order.

## Consequences
- A slide that is only partly in view (the `peek` edge) is `inert`, so it cannot be pressed until it is the current slide.
- A vertical carousel needs a height from its container; the track fills it.
- `Carousel` is the second consumer, after `Stepper`, of the "ask, don't change" controlled-value rule, and the first with a value that the browser can change first (a swipe), which is reported after it settles.
- `ImageViewer` can reuse the controller and `value` shape.

## Related
`05-component-api-conventions.md` §3; `04-component-inventory.md` (Carousel); `component-reviews/Indicators.md`; `component-reviews/Carousel.md`.
