# ImageViewer — review findings

**Status:** Built and put through the `06-engineering-standards.md` §9 review (the findings are below, all fixed). Not yet declared Finalized: only the maintainer does that.

## What was built

A full-screen viewer for one image or a set ([ADR-0150](../adr/0150-imageviewer-is-a-prop-driven-radix-dialog-over-an-images-array-with-its-own-single-stage-and-fixed-dark-controls-over-composing-dialog-embedding-carousel-or-reusing-iconbutton.md), [ADR-0151](../adr/0151-imageviewer-zooms-with-hand-rolled-pointer-and-wheel-gestures-writing-one-transform-from-a-view-held-in-a-ref-over-native-scroll-zoom-a-pan-zoom-dependency-or-state-per-move.md)). Radix Dialog directly with `Backdrop` as the scrim, one image at a time on its own stage, no new dependency, 8.89KB JS and 2.09KB CSS gzipped against the 10KB and 5KB defaults.

Scope: fit, wheel, pinch and double-tap zoom about a point, drag to pan, rotate, full screen, a counter, captions, a thumbnail strip (one tab stop), previous and next by button, key and swipe, swipe down to dismiss, preloading of the neighbours, loading and failed states, `loop`, `controls="hidden"`, an `actions` slot with `useImageViewerController()`, `controllerRef`, `labels` and `formatNumber`, and `dir`. Every gesture has a button and a key.

## Final review round

Fifteen findings, fourteen fixed and one withdrawn:

- **Withdrawn: tap-to-hide dropping focus.** It looked like focus fell to the page when the controls were hidden under a focused button. That was seen with synthetic pointer events; a real click moves focus to the viewer (the nearest focusable ancestor), which a real-browser check now holds.
- **A thumbnail's focus ring was inside the picture**, white over whatever it showed. It is now outside, with a band of the stage's dark between the two, and a check measures the ring against the band.
- **A key pressed in something portaled out of the viewer** (a menu in `actions`) reached its key handler through React; the handler now acts only on keys from inside it.
- **An inline viewer took the page's wheel and touch scrolling.** A plain wheel and a touch now scroll the page until the image is zoomed, and the control key (a trackpad pinch) zooms; the stage is marked `data-zoomed` and a stylesheet rule switches `touch-action` with it.
- **An inline slideshow hydrated differently for a person who prefers reduced motion.** The preference is now a store with a server answer, and the server render and hydration tests cover `inline`, `autoPlay` and reduced motion.
- **A consumer's `aria-describedby` was dropped**; it is merged with the caption's.
- **The neighbours were requested again whenever an inline list was made again**; the preload is keyed by what it loads, and the empty-list warning is once only.
- **A hard-coded `scale: 1.04`** is gone (the blurred placeholder is drawn a blur's width larger and the stage crops it).
- **A test id (`image-viewer-counter`) shipped in the markup**; it is gone and the tests find the counter by its text.
- **`ImageViewerButton` had no Properties table**; it has a hidden docs-only stories file and a table (ADR-0013), and `onKeyDown` and `aria-describedby` are redeclared and documented.
- **Test gaps:** the controller's `actualSize`, `flip`, `rotate`, `play` and `pause` and the `isPlaying` snapshot are covered, the origin test can now fail, and origin under reduced motion is covered.
- **Snippets:** `photos` is defined in a comment, an unused snippet is removed, the load-failure and caption stories have snippets that match them, and all 19 were typechecked against the real components (with a planted bad prop to prove the check bites) and read in a settled "Show code" panel on the Docs page.
- **An unmount while open** now takes the history entry off when it is still the current one, and leaves it after a navigation; a viewer closed first has already taken it off.
- **A controlled viewer that kept itself open after Back** gets a new history entry for the next Back.
- **The 500-picture story data** is made on first use.

Mutation checks (no focus ring offset, no key containment, no wheel modifier, no origin start, no describedby merge, the preload keyed by the array, the hydration answer) each failed the checks written for them.

## Second round (ADR-0152)

Added after the first build: the zoom shown as the share of the image's own pixels with a `1:1` actual-size button and key; a retry for a failed image and `onImageLoad`, `onImageError`, `onZoomChange`, `onRotationChange`; `aria-keyshortcuts` on the buttons; the thumbnail standing in, blurred, while an image loads; `tapToToggleControls`; a drag with give past an edge and a short coast; rotate both ways and an opt-in flip; the image easing in from the side the person came from; `getOrigin`; `closeOnHistoryBack`; a held `autoPlay` slideshow; a windowed thumbnail strip; and `inline`. A check at phone width found the strip widening the grid column (the panel's single column is now `minmax(0, 1fr)`), and a windowing check found that keeping the current thumbnail meant drawing every one between it and the scroll position (the current one is now drawn on its own with empty space either side). Mutation checks (no give, no coast, no windowing, no history clean-up) each failed the checks written for them.

## Decisions taken while building (inside ADR-0150 and ADR-0151)

- **Esc always closes**; zoom is reset with `0` or the zoom button. A first Escape that only reset the zoom would be an invisible mode.
- **The stage image is the `Image` atom**, which gives it the loading and error handling; the failed state is the viewer's own message, since `Image`'s fallback fills a box the viewer has not sized. The image's real size is read from the `load` event.
- **Tapping the stage beside the image closes the viewer** (`closeOnOutsideClick`): the panel covers the viewport, so Radix never sees a press "outside", and the stage reports it. Radix's own outside-press is switched off so a layer portaled out of `actions` cannot close it.
- **Double tap is detected from two pointer-ups** for every pointer type, not from `dblclick`, which a touch screen does not reliably raise.
- **Unavailable is `aria-disabled`**, so a press that turns a button off (the last zoom step) keeps focus where it is; a real-browser check holds it.
- **`useImageViewerController()` returns a snapshot** (the methods plus `isOpen`, `value`, `count`, `zoom` as of the last render), so a part in `actions` re-renders when the image changes; `controllerRef` hands out the one object that never changes.
- **A controller method that changes an uncontrolled value updates the latest state at once**, so two calls in one event see each other.
- **The stage's button is exported as `ImageViewerButton`** for the `actions` slot. The first `actions` example used a theme `Button` and failed contrast on the dark stage; a real-browser check now measures an `actions` button's contrast too.
- **The slideshow's pause button and the retry button are the viewer's own `ImageViewerButton`**, so they share the contrast and focus ring checked for the rest.
- **No tooltips, no `Indicators`**: both would put theme-coloured parts on a stage that is dark in every theme, and the counter and the strip say where the person is. Names are `aria-label`s.

## Verified

- **Unit (jsdom):** the geometry, opening and closing reasons, controlled and uncontrolled value and open (including wired to state), the controller, keys and arrows, `loop`, right-to-left keys, thumbnails, captions, zoom and rotate with the load simulated, labels (an `undefined` entry keeps its default) and the zoom label inside the button's name, props spread order (a same-named `role` and `aria-modal` cannot win), `StrictMode`, focus return, and `jest-axe` open, loaded and failed. A server render and a hydration of seven variants.
- **Real browser:** fit and centring and the locked page, a turned image refitted, a real wheel zooming about the pointer and stopping at the limit, a real drag panning and stopping at the edges, a double click in and out, a press beside the image closing and one on it not, a pinch, a swipe sideways and down, every control at least 24px and on top at its own point, the tab order and focus return, contrast of a button, the counter and the caption over white, the zoom label keeping its width from 100% to 400%, right-to-left placement and mirroring, forced colours, reduced motion, a failed image, and focus kept on a button that turns off. Mutation check: reversing the zoom-about-point maths and the tap target each failed the checks written for them.

## Open findings

- **`text.white` and `border.white` were added** (semantic, `neutral.white` in all four themes, like `icon.white`) for the stage's text and focus ring, in place of `icon.white`. They are only for a surface that is dark in every theme.
- **No Docs-page review yet in a running Storybook** beyond the stories: the Docs page, every "Show code" and the four themes need the §9 pass.
- **Not checked:** Safari and Firefox, a real touch screen, and a real full screen (the button is covered by a mocked `requestFullscreen` in jsdom only). The touch gestures are driven by the pointer events a touch screen raises, not by a real finger. `closeOnHistoryBack` is checked in Chromium's history only; an unmount caused by a navigation leaves its entry, which is one extra Back to the same page.
- **The counter reads "6 / 1" in a right-to-left stage** (the first image's "1 / 6" in logical order, drawn from the right). That is the order a right-to-left paragraph gives two numbers and a slash, and it matches the thumbnail strip and the toolbar mirroring; it is listed for the review to confirm rather than isolate the numbers.
