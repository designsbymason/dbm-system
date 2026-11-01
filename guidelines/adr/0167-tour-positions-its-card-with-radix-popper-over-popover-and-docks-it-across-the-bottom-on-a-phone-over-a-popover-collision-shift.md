# 0167 — `Tour` positions its card with Radix Popper over `Popover`, and docks it across the bottom on a phone, over a collision shift

**Status:** Accepted · **Date:** 2026-11-01

## Context
The card sits beside a highlighted element, so it needs the placement `Popover` has: sides, alignment, flipping and a width cap. The plan was
the Radix Popover with an anchor and no trigger, as `Combobox` and `DatePicker` do ([ADR-0083](./0083-datepicker-anchors-its-panel-to-the-whole-field-with-a-trigger-less-radix-anchor-and-offers-side-align-and-a-full-width-presentation-over-the-popover-molecule-and-its-button.md)).
Radix Popover's content, however, sets its own `role="dialog"` and a looping focus scope that cannot be turned off, and an `interactive`
step needs Tab to leave the card. On a phone there is also no room beside a full-width element.

## Decision
- **`@radix-ui/react-popper` is used directly,** pinned at 1.3.7, the version `@radix-ui/react-popover@1.1.23` already uses, so there is one copy
  ([`02` §3](../02-tech-stack-and-structure.md), the Radix family moves together). The card is `Popper.Content` with `asChild`, anchored to the ring
  element through `Popper.Anchor`'s `virtualRef`, and the focus loop is `FocusTrap`, which a step can turn off.
  `updatePositionStrategy="always"` follows the ring as it eases.
- **`side` is logical** (`top`, `bottom`, `start`, `end`), mapped to Radix's physical side by the tour's `dir`, like `Drawer`'s.
- **`presentation` is `"anchored"` (default) or `"docked"`, or a breakpoint map,** resolved in JavaScript since it chooses what is drawn
  ([`05` §3](../05-component-api-conventions.md)). Docked pins the card across the bottom of the screen and scrolls the element into the room above it.
  A step with no element is a centred card, drawn without Popper.

## Alternatives considered
- **Radix Popover with an anchor.** Rejected for the two reasons above.
- **Hand-rolled positioning.** Rejected: flipping, shifting and following an anchor are what Popper already does, and it is the engine under every other floating panel here.
- **Only the collision shift on a phone.** Rejected: a full-width element leaves no side to shift to, so the card would cover it.

## Consequences
- One more direct dependency, from a family already approved, on the version already installed; no new code is downloaded.
- A bundle of 7.2KB of JS and 2.3KB of CSS, within the default budget.

## Related
[ADR-0017](./0017-popover-omits-anchor-sub-part-pending-upstream-fix.md), [ADR-0004](./0004-radix-ui-primitives-for-accessibility-logic.md),
[ADR-0165](./0165-tour-is-a-prop-driven-overlay-over-a-steps-array-with-a-step-id-as-its-value-and-no-trigger-over-a-compound-of-step-parts-or-a-built-in-start-button.md),
[ADR-0166](./0166-tour-dims-the-page-with-a-moving-ring-and-blocks-it-with-a-shield-and-keeps-focus-in-a-non-modal-card-over-a-modal-dialog-an-svg-mask-or-four-panels.md); `component-reviews/Tour.md`.
