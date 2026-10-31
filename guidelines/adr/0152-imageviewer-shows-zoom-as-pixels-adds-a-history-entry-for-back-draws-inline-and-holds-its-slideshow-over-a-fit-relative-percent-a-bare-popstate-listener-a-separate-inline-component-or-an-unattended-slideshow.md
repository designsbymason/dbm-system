# 0152 — `ImageViewer` shows zoom as a share of the image's own pixels, adds a history entry for Back, draws inline from the same component and holds its slideshow, over a fit-relative percent, a bare `popstate` listener, a separate inline component or an unattended slideshow

**Status:** Accepted · **Date:** 2026-10-31

## Context
The first version of `ImageViewer` ([ADR-0150](./0150-imageviewer-is-a-prop-driven-radix-dialog-over-an-images-array-with-its-own-single-stage-and-fixed-dark-controls-over-composing-dialog-embedding-carousel-or-reusing-iconbutton.md), [ADR-0151](./0151-imageviewer-zooms-with-hand-rolled-pointer-and-wheel-gestures-writing-one-transform-from-a-view-held-in-a-ref-over-native-scroll-zoom-a-pan-zoom-dependency-or-state-per-move.md)) left several things open that change what the component is, not only what it has: what the zoom number means, what the Back button does, whether the viewer can live in the page, and whether it may move by itself.

## Decision
- **The number on the zoom button is the share of the image's own pixels that are drawn**, so `100%` is one image pixel per screen pixel and a photo fitted to a small screen starts below it. The values that code reads stay relative to the fitted image (`controllerRef.zoom`, `onZoomChange`, `minZoom`, `maxZoom`: 1 is all of it in view), since those do not depend on the image. A `1:1` button and the `1` key go to actual size and back, and actual size is always reachable: the largest zoom is raised to it where `maxZoom` is smaller.
- **`closeOnHistoryBack` is opt-in and holds one history entry while the viewer is open.** Opening pushes an entry; Back (a `popstate` with the entry still held) closes with `reason: "history"`; a viewer closed any other way takes its own entry off with `history.back()` and ignores the `popstate` that causes. Held in refs, it adds one entry under `StrictMode`. An unmount while open leaves its entry, since a navigation away is why it happened.
- **`inline` draws the same component in the page**, not a second component: the content (toolbar, stage, caption, strip, keys, controller, slideshow) is one fragment, wrapped in Radix Dialog for the overlay and in a focusable `role="group"` for the inline form. No scrim, close button or focus trap; Escape and a swipe down do nothing; `trigger`, `open`, the scrim props, `container` and `closeOnHistoryBack` are ignored with a development warning.
- **`autoPlay` is a slideshow that is held, not left alone** (the rule `Carousel` follows, [ADR-0147](./0147-carousel-scrolls-natively-with-scroll-snap-and-hides-off-screen-slides-with-inert-and-owns-an-opt-in-auto-play-with-its-pause-control-over-a-transform-track-or-leaving-auto-play-to-the-app.md)): off unless asked for; a pause button always drawn while it is on, whatever `controls` says; it starts paused under `prefers-reduced-motion`; each image's interval starts when it has loaded; it holds while an image is zoomed or the page is hidden; it stops at the last image unless the viewer loops; and it is silent to a screen reader while it runs.
- **Smaller additions, same shape as the rest:** the thumbnail of an image stands in for it, blurred, while it loads; a failed image has a button to try again and `onImageLoad`/`onImageError`; `onZoomChange`/`onRotationChange`; rotate both ways and an opt-in flip; `tapToToggleControls` (a single tap, known after the wait for a second one, hides the controls out of the page and any key but Escape shows them); `getOrigin` eases the first image in from a rectangle on the page; a step eases the new image in from the side it came from (a `translate` and a fade, the fade only under reduced motion); a drag past an edge gives a little and settles back, and a quick release coasts; a long thumbnail strip draws a window of buttons with empty space for the rest, always keeping the current one.

## Alternatives considered
- **A zoom percent relative to the fitted image.** Rejected for the label: "100%" would mean "all of it in view", which is not what the number means anywhere else, and says nothing about detail. The relative number is kept in the API where it is unambiguous.
- **A `popstate` listener with no entry of its own.** Rejected: with no entry to consume, Back leaves the page and closes nothing.
- **A separate inline component.** Rejected: the keys, controller, preloading, announcements, slideshow and strip would be written twice, and the two would drift.
- **A slideshow that runs until the person stops it, or no slideshow.** Rejected: an unattended one moves what a person is looking at (WCAG 2.2.2) and holding it is the only form that belongs in the system; leaving it out sends every app to build its own on the controller, without the pause button.
- **Closing with a reverse animation to the origin.** Not done: it needs the panel kept mounted through the exit.

## Consequences
- The accessible name of the zoom button holds its visible text, which is now the pixel share; a `labels.resetZoom` replacement is given that text.
- `ImageViewer` has a JS budget of 13KB (`06-engineering-standards.md` §4).
- A viewer unmounted while it is open with `closeOnHistoryBack` leaves its entry in the history.
- The inline form is a tab stop that takes the viewer's keys, so Tab and Shift+Tab are how a keyboard user leaves it.

## Related
`05-component-api-conventions.md` §3; `04-component-inventory.md` (ImageViewer); `component-reviews/ImageViewer.md`.
