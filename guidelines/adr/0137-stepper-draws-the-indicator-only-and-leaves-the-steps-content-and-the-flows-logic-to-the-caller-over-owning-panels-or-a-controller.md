# 0137 — `Stepper` draws the indicator only and leaves the steps' content and the flow's logic to the caller, over owning panels or a controller

**Status:** Accepted · **Date:** 2026-10-26

## Context
A multi-step flow is a stepper, the current step's content, and back/next buttons that validate. Which of those belongs to the component decides its size, its API and how it fits `Form`.

## Decision
- `Stepper` is the indicator: `Stepper` and `Stepper.Step`, no `Stepper.Panel`. The caller draws the current step's content (usually a `Form`) and owns next, back and validation.
- `value`/`defaultValue`/`onValueChange` hold the current step. A click on an enterable step asks through `onValueChange` and leaves the value alone until the prop changes (`05` §3).
- A step's `status="error"` is set by the caller from its own validation; `Stepper` does not read `Form`.
- No `controllerRef` yet; it is additive and can follow without breaking anything.

## Alternatives considered
- **Panels owned by the stepper, like `Tabs`.** Rejected: step content is almost always a form with its own state and validation, and panels would make `Stepper` a second place that mounts and unmounts it.
- **A controller with `next()`/`back()`.** Deferred: the caller's validation decides whether a step may be left, so a controller would mostly return `false`.
- **Reading `Form`'s validity for the error status.** Rejected: a step may span several forms, or none.

## Consequences
- The bundle stays small and the component works with any content or router.
- `Form.mdx`'s "a multi-step flow is a `Stepper` over forms" holds as written.

## Related
[ADR-0136](./0136-stepper-is-a-nav-and-ordered-list-with-aria-current-step-and-real-buttons-only-where-a-step-can-be-entered-over-a-tablist-with-roving-focus.md); `component-reviews/Stepper.md`.
