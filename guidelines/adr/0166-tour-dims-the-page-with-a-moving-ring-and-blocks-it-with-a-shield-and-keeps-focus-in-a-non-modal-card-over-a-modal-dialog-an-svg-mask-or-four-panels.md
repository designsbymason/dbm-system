# 0166 — `Tour` dims the page with a moving ring and blocks it with a shield, and keeps focus in a non-modal card, over a modal dialog, an SVG mask or four panels

**Status:** Accepted · **Date:** 2026-11-01 · **Amended 2026-11-01** — the dim and shield z-index step, how Escape is heard, the Tab loop on an interactive step and how often the box is read; the decision itself is unchanged. The last consequence (no support inside a modal dialog) is superseded by [ADR-0168](./0168-tour-runs-inside-a-modal-dialog-by-being-rendered-in-its-content-above-its-panel-and-keeping-escape-to-itself-over-a-layer-manager-or-leaving-dialogs-unsupported.md)

## Context
A tour needs a spotlight (everything dimmed except one element), a way to stop the dimmed page being pressed (or to let a press through
over the element), and a position for the keyboard. No guideline covered a scrim with a hole, or a non-modal overlay that holds focus
without hiding the page. `Dialog` and `Popover`'s `modal` both lock the page's scroll and hide everything else from assistive technology,
and a tour must leave the page scrollable and its element readable.

## Decision
- **The spotlight is a ring:** a fixed element sized to the element's box plus a step's `padding` (a space token), with a shadow spread past the screen in `bg.overlay` at
  `opacity.60` (`scrimOpacity` changes it). The hole's corners are the ring's `border-radius`, and moving the ring moves the hole.
  It moves between steps with a transition. In forced colours a shadow is not drawn, so the ring gets an outline in `Highlight` instead.
- **A transparent shield covers the viewport** on the `modal` z-index step and takes the presses *(Amended 2026-11-01: this first said the `overlay` step, which put the dim under a dialog's panel; see ADR-0168)*. For an `interactive` step its `clip-path`
  has a hole over the element (`polygon(evenodd, …)`, with the padding as `var(--tour-padding)`), and hit-testing follows `clip-path`, so a
  press inside the spotlight reaches the element and one outside does not. A wheel or touch drag over it still scrolls the page.
  A press on it closes the tour only with `closeOnOutsidePress`.
- **The card is `role="dialog"` and not `aria-modal`;** the page behind is not hidden. Focus moves to the card on open and Tab loops
  inside it (`FocusTrap`); on an `interactive` step the loop runs round the card and the element's own controls, in both directions *(Amended 2026-11-01: this first said Tab from the last button went into the element, with no way back)*. Focus returns to what opened the tour.
  Pressing Next or Back keeps focus on that control by name across the step, since the card is drawn afresh when its element is looked up.
- **Escape is heard on `window`, in the capture phase,** while the tour is open, and is not passed on *(Amended 2026-11-01: first `document`; see ADR-0168)*; the arrow keys are heard on the card only, and not on an `interactive` step or in a field.
- **The ring's box is read from the page every animation frame while it moves, then every quarter second, waking at once on a scroll, a resize or a change in the element's own size** *(Amended 2026-11-01: this first read it every frame for as long as the tour was open)*, while open, from the layer's own corner, so a scroll in any box, a resize, a
  layout shift or a container that is a containing block for fixed descendants all move it without listeners for each. The card's
  own `z-index` is the `popover` step, above a modal dialog's, and the layer itself is unpositioned so each part sits on its own step.
- ~~A tour does not support an element inside a modal `Dialog`~~ *(superseded by ADR-0168)*.

## Alternatives considered
- **Radix `Dialog` or a `modal` Popover.** Rejected: they lock scroll and hide the page.
- **An SVG mask, or `clip-path: path()` for the dim.** Rejected: a path needs pixel values for the corners, so the radius would not be a token and the
  hole could not ease with a CSS transition.
- **Four panels around the element.** Rejected: four elements to move, and seams at fractional pixels.
- **Listening for scroll and resize.** Rejected: a scroll in any ancestor, a layout shift and an easing target all move the box, and one rectangle read a
  frame is cheaper than listening for each cause.

## Consequences
- A real-browser check covers the box, the shield with real presses, the wheel, a scrolling ancestor, forced colours, reduced motion and the key loop.
- The frame loop runs only while a tour is open.

## Related
[ADR-0165](./0165-tour-is-a-prop-driven-overlay-over-a-steps-array-with-a-step-id-as-its-value-and-no-trigger-over-a-compound-of-step-parts-or-a-built-in-start-button.md),
[ADR-0054](./0054-portaled-floating-panels-sit-on-the-popover-z-index-step-not-dropdown.md); `component-reviews/Tour.md`.
