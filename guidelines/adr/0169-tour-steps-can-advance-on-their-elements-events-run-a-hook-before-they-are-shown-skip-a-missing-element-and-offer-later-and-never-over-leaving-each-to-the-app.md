# 0169 — `Tour` steps can advance on their element's events, run a hook before they are shown, skip a missing element, and offer "later" and "never", over leaving each to the app

**Status:** Accepted · **Date:** 2026-11-01

## Context
[ADR-0165](./0165-tour-is-a-prop-driven-overlay-over-a-steps-array-with-a-step-id-as-its-value-and-no-trigger-over-a-compound-of-step-parts-or-a-built-in-start-button.md)
made the tour a thing the app drives through `value` and `controllerRef`. Four needs came up that an app can meet only with its own wiring around the tour, each time
the same wiring: a step that moves on when its element is used, a step that must open something before its element exists, a step whose element is not on this page, and a tour a person can put off or turn off.

## Decision
- **`advanceOn` on a step** is the name of an event (`click`, `input`, `change`, `focus`, `submit`) on its element; when it fires, the tour goes to the next step after the
  element's own handlers have run, once. It implies `interactive` (a hole in the shield, Tab round the card and the element). It needs a `target`; without one it warns in development.
- **`onEnter` on a step** runs each time the step is about to be shown, before its element is looked for, and the tour waits for a returned promise. A throw is
  reported (once, in development) and the step is shown anyway.
- **`missingTarget` (the tour, and per step) is `"center"` (the default) or `"skip"`.** Skipping goes the way the person was going, so Back does not land on the same missing step; a last (or first) step
  that is missing stays centred rather than ending the tour.
- **`dismissals={["later", "never"]}`** adds "Remind me later" and "Don't show again" beside Skip, on every step but the last, and reports the reasons `"later"` and `"never"`.
  What each remembers is the app's (the `usePersistentDismiss` recipe, `expiresAfter` for "later"). Their text is `labels.later` and `labels.never`.
- **A step may carry `media`, a `footer` and its own `actions`** (a node, or a function handed the controller, in place of Skip, Back and Next), and the progress may be a bar of
  segments (`progress="bar"`, with the step still named in text for a screen reader, or `"both"`).
- **`scrollOffset`** keeps room at the top and bottom of the screen when an element is scrolled into view, for a sticky header or footer, as the element's `scroll-margin` for that call.

## Alternatives considered
- **Leaving each to the app** through `onValueChange`, a controller and a wrapper. Rejected for the first four: each one needs the tour's own timing (after the element's handlers, before its lookup, once its lookup has failed), which only the tour has.
- **A single `dismiss` prop with one extra button.** Rejected: "later" and "never" are remembered differently, and the reasons are how the app tells them apart.
- **A progress bar as a second component.** Rejected: it is the tour's own state, and `Indicators` is a row of buttons.

## Consequences
- The step object grows to about a dozen fields, all optional; a plain tour is still `{ id, target, title, content }`.
- `onEnter` runs twice under `StrictMode` in development, like any mount-time effect.

## Related
[ADR-0165](./0165-tour-is-a-prop-driven-overlay-over-a-steps-array-with-a-step-id-as-its-value-and-no-trigger-over-a-compound-of-step-parts-or-a-built-in-start-button.md),
[ADR-0023](./0023-one-alert-with-banner-and-sticky-options-and-a-separate-persistence-hook.md); `component-reviews/Tour.md`.
