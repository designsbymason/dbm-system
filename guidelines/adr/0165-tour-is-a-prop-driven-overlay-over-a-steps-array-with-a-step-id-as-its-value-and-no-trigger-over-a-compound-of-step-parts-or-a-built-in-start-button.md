# 0165 — `Tour` is a prop-driven overlay over a `steps` array, with a step id as its value and no trigger, over a compound of step parts or a built-in start button

**Status:** Accepted · **Date:** 2026-11-01

## Context
A product tour is a sequence of steps, each pointing at an element somewhere else on the page. Two shapes were possible: compound parts
(`Tour.Step` around each target, the way `Tabs.Trigger` sits beside its content), or one component given the steps as data.
`CommandPalette` ([ADR-0132](./0132-commandpalette-is-a-prop-driven-dialog-over-a-commands-array-that-owns-its-hotkey-and-a-controller-over-a-compound-of-parts-a-registry-provider-or-a-combobox-in-a-popover.md))
and `EditorTabs` ([ADR-0145](./0145-editortabs-is-a-data-driven-strip-built-on-tabs-with-a-tabs-item-part-that-asks-the-owner-for-closes-adds-and-moves-over-a-compound-strip-a-list-it-owns-or-a-touch-drag.md))
already chose data where the component must know what an entry is.

## Decision
`Tour` takes `steps`: `{ id, target?, title, content?, textValue?, side?, align?, padding?, interactive?, labels? }`. The tour must
know every step to count them, announce "Step 2 of 5" and move between them, which parts scattered over a page could not tell it.

- **The step showing is `value`, an id** (`defaultValue`, `onValueChange`, controlled or not), not an index, so reordering or inserting a
  step does not change which one a stored value means.
- **It has no trigger and no start button.** A tour opens from code: `open`/`defaultOpen`/`onOpenChange`, or `controllerRef`
  (`open(stepId?)`, `close()`, `next()`, `back()`, `goTo()`, `isOpen`, `value`), a ref and no hook ([`05` §3](../05-component-api-conventions.md)):
  nothing of the caller's runs inside it. What the person did is `onOpenChange(open, { reason, stepId })` with a reason of `finish`,
  `skip`, `escape`, `outside` or `controller`.
- **"Seen once" is a recipe, not a prop:** `usePersistentDismiss` with `open={ready && !dismissed}`, the split `Alert` made
  ([ADR-0023](./0023-one-alert-with-banner-and-sticky-options-and-a-separate-persistence-hook.md)).
- **A `target` is a selector, an element, a ref or a function**, looked up when the step is shown and waited for up to `targetTimeout`.
  A step with no target, or whose element never appears (`onTargetMissing`, a development warning), is a card in the middle of the screen.
- **Closing an uncontrolled tour puts it back at its first step.**
- It takes `labels` and `formatNumber`, `dir`, and a `container` (the element it is drawn into, so a Docs page can hold it in a box).

## Alternatives considered
- **Compound `Tour.Step` parts wrapped around targets.** Rejected: it needs the targets to be components the app can wrap, and the tour
  cannot count, order or announce steps it has not been given.
- **A `Tour.Trigger` or a built-in "Start" button.** Rejected: a tour is started by a first visit, a help menu or a route, none of which
  is a button the tour owns; the controller covers all of them.
- **An index as the value.** Rejected, as above.
- **A `persist` prop that remembers it was seen.** Rejected: what to store, where and for how long is the app's, and the hook already does it.

## Consequences
- An agent writes a tour as one object literal. A step whose element is built by something else is reached by a function.
- The controller has no hook, so a caller's own parts inside the tour cannot read it (there are none).

## Related
[ADR-0166](./0166-tour-dims-the-page-with-a-moving-ring-and-blocks-it-with-a-shield-and-keeps-focus-in-a-non-modal-card-over-a-modal-dialog-an-svg-mask-or-four-panels.md),
[ADR-0167](./0167-tour-positions-its-card-with-radix-popper-over-popover-and-docks-it-across-the-bottom-on-a-phone-over-a-popover-collision-shift.md);
`04-component-inventory.md`; `component-reviews/Tour.md`.
