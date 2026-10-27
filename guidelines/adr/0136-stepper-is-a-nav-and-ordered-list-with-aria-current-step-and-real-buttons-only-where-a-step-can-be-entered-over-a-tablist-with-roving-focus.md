# 0136 — `Stepper` is a `nav` and ordered list with `aria-current="step"` and real buttons only where a step can be entered, over a `tablist` with roving focus

**Status:** Accepted · **Date:** 2026-10-26 · **Amended 2026-10-27** — the statuses a stepper derives and a step may set, and where `aria-current` sits; the decision itself is unchanged

## Context
A stepper shows where a person is in an ordered flow. Most of the time it is a read-out of progress and nothing in it can be pressed. Some flows let a person go back to a finished step, and a few let them go anywhere. The role has to be honest in all three cases, and the keyboard model small enough to hold in one's head.

## Decision
- The root is a `<nav>` (named by `labels.navigation`) around an `<ol role="list">` of `<li role="listitem">` steps (Safari drops list semantics under `list-style: none`, `05` §6). The current step has `aria-current="step"`.
- `interactive` is `"none"` (the default), `"completed"` or `"all"`. A step that can be entered is a real `<button>` (or the caller's link through `asChild`) in the normal tab order; every other step is plain text with no focus stop. With `"none"` the component has no keyboard model at all.
- Each step's accessible name holds its visible title as whole words, followed by a visually hidden "step N of M, status" ([ADR-0112](./0112-an-interactive-controls-accessible-name-holds-its-visible-text-as-whole-words-in-order-over-a-name-that-only-means-the-same.md)); the number or check mark is hidden.
- Statuses are worked out from `value` (steps before it are complete, after it upcoming; with `interactive="completed"`, steps reached ahead of it stay complete and the furthest of them, if not completed, is started) and a step may override its own with `status` (`"error"`, `"warning"`, `"complete"`, `"started"`, `"skipped"`). `aria-current="step"` is on the current step's list item, since the current step is never one that can be entered.
  *(Amended 2026-10-27: this originally said statuses were worked out from `value` alone, with overrides `"error"`, `"complete"` and `"skipped"`, and did not say where `aria-current` sits; warning, started and the list-item placement came later.)*

## Alternatives considered
- **A `tablist` with roving focus (Radix `Tabs`).** Rejected: it announces unordered peers with panels, promises arrow-key movement that an ordered, mostly read-only list does not need, and would make a non-interactive stepper a focus stop.
- **A `progressbar`.** Rejected: it says how far, not which step, and has no place for a title, a description or an error.
- **Always draw buttons.** Rejected: a stop that does nothing is noise for a keyboard user.

## Consequences
- The tab order is the steps that can be entered, left to right (top to bottom when vertical), nothing roving.
- A stepper that must also show a step's content composes `Tabs` or its own panels; see [ADR-0137](./0137-stepper-draws-the-indicator-only-and-leaves-the-steps-content-and-the-flows-logic-to-the-caller-over-owning-panels-or-a-controller.md).

## Related
`05-component-api-conventions.md` §3, §6; `component-reviews/Stepper.md`.
