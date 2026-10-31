# Carousel — review findings

**Status:** built, not yet declared Finalized. The first build was verified against `06-engineering-standards.md` §9 with the checks listed below; the review pass itself and the sign-off are the maintainer's.

## What was built

A hand-rolled organism with no new dependency ([ADR-0147](../adr/0147-carousel-scrolls-natively-with-scroll-snap-and-hides-off-screen-slides-with-inert-and-owns-an-opt-in-auto-play-with-its-pause-control-over-a-transform-track-or-leaving-auto-play-to-the-app.md)): a native scroll-snap track, `inert` slides out of view, previous and next `IconButton`s, the `Indicators` atom for position, a live-region announcement, opt-in automatic rotation with a pause button that cannot be left out, `controllerRef`, and `Carousel.Previous`/`Next`/`Indicators`/`AutoPlayToggle` parts that replace the default of their kind. No new tokens: the buttons are neutral `IconButton`s and the spacing, focus and radius tokens already existed.

## Decisions taken while building (inside ADR-0147's scope)

- **Every element that is not one of the four parts is a slide**, not only `Carousel.Slide`, so a component of your own that renders a slide can be mapped over data. The stricter match used by `Stepper.Step` and `DataTable`'s parts would have ignored it.
- **Hover holds rotation only over the slides**, and keyboard focus (`:focus-visible`) only when it is not on the pause button, so pressing play with the mouse does not hold itself.
- **No tooltips on the buttons**; the names are `aria-label`s on `IconButton`s, which keeps the `Tooltip` out of the bundle.
- **`controls="auto"`** draws the buttons over the slides from the `sm` breakpoint up and leaves them out below it (swipe and indicators remain).

## Open findings

- **`Indicators` (Finalized) is below the 24 × 24 px target size** at every size step (its dots are 4–12 px with no extended hit area, and the gaps do not satisfy the spacing exception to WCAG 2.5.8). Found while writing the target-size check, which therefore measures the previous, next and pause buttons only. Fixing it needs an authorized change to `Indicators` and the three-question test (`06` §9, "Whether an authorized fix reopens finalized status"); nothing was changed there.
- **A vertical carousel needs a height from its container.** Documented on the Docs page; there is no development warning for it yet.

## Verified

Unit tests (`Carousel.test.tsx`, `carouselHelpers.test.ts`, `Carousel.ssr.test.tsx`: structure, ARIA, `{...props}` ordering, controlled and uncontrolled, loop, stops, controller, announcements, labels with an `undefined` entry, auto-play pauses, StrictMode, axe, server render and hydration); real-browser checks (`Carousel.checks.stories.tsx`: scroll alignment, a swipe reported once settled, peek geometry, right-to-left order and keys, vertical, focus ring, `inert`, reduced motion, button target sizes), broken on purpose once to confirm they fail.
