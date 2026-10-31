# Carousel — review findings

**Status:** Finalized 2026-10-31, declared by the maintainer after the final review round below. Open at finalization: the `Indicators` target size (a Finalized atom, no change made) and the checks not run in a real browser (Safari and Firefox, a real touch swipe, a full dark-mode and Emerald-brand pass).

## Second round (ADR-0148)

Added after the first build: a seamless `loop` through copies of the end slides, a mouse drag, a pressable peeking slide (with focus bringing it into view), `align="center"`, a fractional `slidesPerView`, `lazy` with a slide `placeholder`, rotation held by playing media and `controller.hold()`, a deterministic put-back when a controlled owner refuses a settled swipe, and a development warning for a vertical carousel with no height. New real-browser checks cover the drag (a real mouse through the DevTools Protocol), the click that still presses, the seamless loop, the centred slide, the fractional view, the peeking press and the refused swipe; two of them were broken on purpose once and failed.

## Final review round

Eight findings from the pre-Finalization review, all fixed: the track now has room (padding with an equal negative margin, `space-2` across and the gap, up to `space-2`, along) so a slide's own focus ring is not clipped; `Carousel.Slide`'s `placeholder` has its Properties row; the four parts accept the native button or div attributes the Docs promised (minus those they own), with a probe test per part; a `Carousel` inside a `Carousel` is tested, which found and fixed a real bug (the focus hand-off after a press disabled the last button looked up the other button across the whole subtree and could land on a nested carousel's, whose slide then pulled the outer one back); a "Holding rotation from code" story replaces the dead snippet; the Docs wording about text selection was corrected; an `autoPlay.interval` below 1000 ms warns in development; and the root's side concerns were extracted into hooks (`useRotationHold`, `useLazySlides`, `useButtonFocusHandoff`, `useCarouselWarnings`, `useTrackKeyDown`, `splitChildren`). Every Docs-page "Show code" was opened on the live page (19 of 20; the right-to-left one by test), and every story snippet and the Docs "Code examples" were typechecked against the real components.

## Third round (ADR-0149)

Added: press-and-hold repeat on the previous and next buttons (`repeatOnHold`), scroll-linked `effect` (`fade`, `scale`, `fade-scale`), `autoHeight` for a vertical carousel, and `edgeResistance` on a mouse drag. Real-browser checks cover each (a real mouse held down, computed opacity near the edge and under reduced motion, the measured track height, and the pull and ease-back); all four were broken on purpose once and failed.

## What was built

A hand-rolled organism with no new dependency ([ADR-0147](../adr/0147-carousel-scrolls-natively-with-scroll-snap-and-hides-off-screen-slides-with-inert-and-owns-an-opt-in-auto-play-with-its-pause-control-over-a-transform-track-or-leaving-auto-play-to-the-app.md)): a native scroll-snap track, `inert` slides out of view, previous and next `IconButton`s, the `Indicators` atom for position, a live-region announcement, opt-in automatic rotation with a pause button that cannot be left out, `controllerRef`, and `Carousel.Previous`/`Next`/`Indicators`/`AutoPlayToggle` parts that replace the default of their kind. No new tokens: the buttons are neutral `IconButton`s and the spacing, focus and radius tokens already existed.

## Decisions taken while building (inside ADR-0147's scope)

- **Every element that is not one of the four parts is a slide**, not only `Carousel.Slide`, so a component of your own that renders a slide can be mapped over data. The stricter match used by `Stepper.Step` and `DataTable`'s parts would have ignored it.
- **Hover holds rotation only over the slides**, and keyboard focus (`:focus-visible`) only when it is not on the pause button, so pressing play with the mouse does not hold itself.
- **No tooltips on the buttons**; the names are `aria-label`s on `IconButton`s, which keeps the `Tooltip` out of the bundle.
- **`controls="auto"`** draws the buttons over the slides from the `sm` breakpoint up and leaves them out below it (swipe and indicators remain).

## Open findings

- **`Indicators` (Finalized) is below the 24 × 24 px target size** at every size step (its dots are 4–12 px with no extended hit area, and the gaps do not satisfy the spacing exception to WCAG 2.5.8). Found while writing the target-size check, which therefore measures the previous, next and pause buttons only. Fixing it needs an authorized change to `Indicators` and the three-question test (`06` §9, "Whether an authorized fix reopens finalized status"); nothing was changed there.
- **Focus-ring room along the track is the gap, up to 8px:** with a gap under 8px a ring on a control at the very start or end of a slide is partly clipped (a neighbour would show in more room). Documented.
- **Not covered by a real-browser check:** the media hold (unit-tested only), `lazy` (unit-tested only) and the vertical-height warning (unit-tested with measured sizes).
- **A drag starting on a card's text selects nothing and starts a drag**; `data-carousel-no-drag` opts an element out. Documented.

## Verified

Unit tests (`Carousel.test.tsx`, `carouselHelpers.test.ts`, `Carousel.ssr.test.tsx`: structure, ARIA, `{...props}` ordering, controlled and uncontrolled, loop, stops, controller, announcements, labels with an `undefined` entry, auto-play pauses, StrictMode, axe, server render and hydration); real-browser checks (`Carousel.checks.stories.tsx`: scroll alignment, a swipe reported once settled, peek geometry, right-to-left order and keys, vertical, focus ring, `inert`, reduced motion, button target sizes), broken on purpose once to confirm they fail.
