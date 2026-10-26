# 0139 — `Stepper` hands next, back and go-to to code outside it through a controller ref and no hook, over a hook or a context for its steps

**Status:** Accepted · **Date:** 2026-10-27

## Context
The caller owns Back and Next ([ADR-0137](./0137-stepper-draws-the-indicator-only-and-leaves-the-steps-content-and-the-flows-logic-to-the-caller-over-owning-panels-or-a-controller.md)), but working out "the next step that is not disabled" from a list of values is code every caller repeats. `05` §3 describes a `controllerRef` offered with a hook from inside the component.

## Decision
- `controllerRef` receives `{ value, next(), back(), goTo(value) }`: one object for the stepper's life, whose methods read the latest state. Each asks the way a click on a step does (through `onValueChange` when controlled, by moving itself when not) and returns whether there was a step to ask for; none throws.
- `next` and `back` skip a disabled step; `goTo` refuses a disabled step, the current step and a value that matches none.
- **No hook.** A hook is for a part of your own inside the component, and the only parts inside a stepper are its steps' titles and descriptions; the code that needs Next and Back is a button beside it. This is the one place this deviates from the pattern in `05` §3.

## Alternatives considered
- **A hook that returns the controller.** Rejected: nothing of the caller's can call it, since a `Stepper` draws only its steps.
- **A provider wrapping the stepper and the buttons.** Rejected: it is more API than a ref for the same reach.
- **Making `next`/`back` skip steps that are `error` or `skipped`.** Rejected: whether a step may be left is the caller's rule (ADR-0137).

## Consequences
- A form's submit handler can call `controller.current?.next()` after it validates.

## Related
`05-component-api-conventions.md` §3; [ADR-0076](./0076-form-rules-may-return-promises-and-the-form-is-reached-from-outside-by-a-controller-and-two-hooks-over-synchronous-rules-or-an-imperative-ref.md); `component-reviews/Stepper.md`.
