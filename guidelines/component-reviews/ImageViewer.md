# ImageViewer — review findings

**Status:** Built, not yet reviewed or declared Finalized. This file holds what was decided and verified while building; the full `06-engineering-standards.md` §9 pass is still to run, and only the maintainer declares it Finalized.

## What was built

A full-screen viewer for one image or a set ([ADR-0150](../adr/0150-imageviewer-is-a-prop-driven-radix-dialog-over-an-images-array-with-its-own-single-stage-and-fixed-dark-controls-over-composing-dialog-embedding-carousel-or-reusing-iconbutton.md), [ADR-0151](../adr/0151-imageviewer-zooms-with-hand-rolled-pointer-and-wheel-gestures-writing-one-transform-from-a-view-held-in-a-ref-over-native-scroll-zoom-a-pan-zoom-dependency-or-state-per-move.md)). Radix Dialog directly with `Backdrop` as the scrim, one image at a time on its own stage, no new dependency, 8.89KB JS and 2.09KB CSS gzipped against the 10KB and 5KB defaults.

Scope: fit, wheel, pinch and double-tap zoom about a point, drag to pan, rotate, full screen, a counter, captions, a thumbnail strip (one tab stop), previous and next by button, key and swipe, swipe down to dismiss, preloading of the neighbours, loading and failed states, `loop`, `controls="hidden"`, an `actions` slot with `useImageViewerController()`, `controllerRef`, `labels` and `formatNumber`, and `dir`. Every gesture has a button and a key.

## Decisions taken while building (inside ADR-0150 and ADR-0151)

- **Esc always closes**; zoom is reset with `0` or the zoom button. A first Escape that only reset the zoom would be an invisible mode.
- **The stage image is the `Image` atom**, which gives it the loading and error handling; the failed state is the viewer's own message, since `Image`'s fallback fills a box the viewer has not sized. The image's real size is read from the `load` event.
- **Tapping the stage beside the image closes the viewer** (`closeOnOutsideClick`): the panel covers the viewport, so Radix never sees a press "outside", and the stage reports it. Radix's own outside-press is switched off so a layer portaled out of `actions` cannot close it.
- **Double tap is detected from two pointer-ups** for every pointer type, not from `dblclick`, which a touch screen does not reliably raise.
- **Unavailable is `aria-disabled`**, so a press that turns a button off (the last zoom step) keeps focus where it is; a real-browser check holds it.
- **`useImageViewerController()` returns a snapshot** (the methods plus `isOpen`, `value`, `count`, `zoom` as of the last render), so a part in `actions` re-renders when the image changes; `controllerRef` hands out the one object that never changes.
- **A controller method that changes an uncontrolled value updates the latest state at once**, so two calls in one event see each other.
- **No tooltips, no `Indicators`**: both would put theme-coloured parts on a stage that is dark in every theme, and the counter and the strip say where the person is. Names are `aria-label`s.

## Verified

- **Unit (jsdom):** the geometry, opening and closing reasons, controlled and uncontrolled value and open (including wired to state), the controller, keys and arrows, `loop`, right-to-left keys, thumbnails, captions, zoom and rotate with the load simulated, labels (an `undefined` entry keeps its default) and the zoom label inside the button's name, props spread order (a same-named `role` and `aria-modal` cannot win), `StrictMode`, focus return, and `jest-axe` open, loaded and failed. A server render and a hydration of seven variants.
- **Real browser:** fit and centring and the locked page, a turned image refitted, a real wheel zooming about the pointer and stopping at the limit, a real drag panning and stopping at the edges, a double click in and out, a press beside the image closing and one on it not, a pinch, a swipe sideways and down, every control at least 24px and on top at its own point, the tab order and focus return, contrast of a button, the counter and the caption over white, the zoom label keeping its width from 100% to 400%, right-to-left placement and mirroring, forced colours, reduced motion, a failed image, and focus kept on a button that turns off. Mutation check: reversing the zoom-about-point maths and the tap target each failed the checks written for them.

## Open findings

- **The stage's text uses `icon.white`**, since there is no `text.white` token. It is the same value and does not flip, but the token family is wrong by `05` §6. A `text.white` is a change to all four themes; it is the follow-up if a second component needs fixed-white text.
- **No Docs-page review yet in a running Storybook** beyond the stories: the Docs page, every "Show code" and the four themes need the §9 pass.
- **Not checked:** Safari and Firefox, a real touch screen, and a real full screen (the button is covered by a mocked `requestFullscreen` in jsdom only). The offset is clamped with no edge resistance, and a flick does not coast.
- **The counter reads "6 / 1" in a right-to-left stage** (the first image's "1 / 6" in logical order, drawn from the right). That is the order a right-to-left paragraph gives two numbers and a slash, and it matches the thumbnail strip and the toolbar mirroring; it is listed for the review to confirm rather than isolate the numbers.
- **`Indicators`' JSDoc and the inventory row name `ImageViewer` as a consumer of it;** it is not one. Left as they are, since `Indicators` is Finalized.
