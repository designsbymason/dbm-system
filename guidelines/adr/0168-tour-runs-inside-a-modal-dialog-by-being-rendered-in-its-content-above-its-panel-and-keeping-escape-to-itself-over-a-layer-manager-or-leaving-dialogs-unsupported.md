# 0168 — `Tour` runs inside a modal `Dialog` by being rendered in its content, above its panel, and keeps Escape to itself, over a layer manager or leaving dialogs unsupported

**Status:** Accepted · **Date:** 2026-11-01

## Context
[ADR-0166](./0166-tour-dims-the-page-with-a-moving-ring-and-blocks-it-with-a-shield-and-keeps-focus-in-a-non-modal-card-over-a-modal-dialog-an-svg-mask-or-four-panels.md)
left a tour of something inside a modal `Dialog` unsupported, and a form in a dialog is one of the commonest things to tour. A modal Radix
dialog does four things to a layer drawn outside it: it sets `pointer-events: none` on the page outside its panel, it closes on a press or on focus
outside its panel, it closes on Escape (when it is the topmost layer), and its panel is on a z-index step (`modal`, 1400) above the tour's
dim (`overlay`, 1300).

## Decision
- **Render the `Tour` inside `Dialog.Content`.** It still portals to `document.body`, but a React event in a portal reaches its React parent,
  which is how a `Popover` in a dialog works, so a press or focus on the tour is read as inside the dialog and does not close it.
  The Docs page says so; a tour beside the dialog (outside its React tree) still closes it on a press.
- **The dim and the shield are on the `modal` step**, drawn after the dialog's panel, so a later portal sits above it; the card stays on `popover`.
  The shield and the card say `pointer-events: auto`, since the dialog's layer switches it off for the rest of the page.
- **Escape is heard on `window` in the capture phase and stopped** (`stopPropagation`), before any dialog sees it, so the first Escape closes the
  tour and the second closes the dialog.
- The tour's focus scope (`FocusTrap`) pauses the dialog's while it is mounted, so focus can move to the card; the dialog's resumes when the tour closes.

## Alternatives considered
- **A layer manager** that every overlay registers with. Rejected: none is needed while each kind has its own step
  ([`03` "Stacking"](../03-token-system-spec.md)), and this needs only one step change and one stopped key.
- **Leaving dialogs unsupported.** Rejected: it fails a common case for a few lines of CSS and one listener.
- **Making the tour a `DismissableLayer` of its own.** Rejected: it adds a dependency on an internal layer and closes the same way for the same reason, with more code.

## Consequences
- A tour with no dialog is unchanged: its dim is now on a step that is still below the card, toasts and tooltips.
- A tour opened over a dialog that is *not* its React parent still dismisses it: it must be rendered inside.
- A real-browser check covers the dim over the dialog's panel, a real press on the card, and Escape closing the tour and not the dialog.

## Related
[ADR-0054](./0054-portaled-floating-panels-sit-on-the-popover-z-index-step-not-dropdown.md), [ADR-0052](./0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md);
`component-reviews/Tour.md`.
