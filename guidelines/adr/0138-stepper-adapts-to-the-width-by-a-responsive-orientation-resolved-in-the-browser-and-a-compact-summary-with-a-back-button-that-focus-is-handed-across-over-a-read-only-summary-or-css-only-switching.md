# 0138 — `Stepper` adapts to the width by a responsive orientation resolved in the browser and a compact summary with a back button that focus is handed across, over a read-only summary or CSS-only switching

**Status:** Accepted · **Date:** 2026-10-27

## Context
A stepper with many steps does not fit a phone. Two answers exist: keep every step and stack them (`orientation`), or replace them with a one-line summary (`compact`). The first version made the summary read-only and switched it with a media query alone, which left two gaps: an `interactive` stepper in compact form had no way to enter a step, and a person with keyboard focus on a step when the width crossed the breakpoint lost their place (the browser takes focus off a control it hides).

## Decision
- **`orientation` takes a mobile-first map by breakpoint** (`{ base: "vertical", md: "horizontal" }`), resolved with `useResolvedResponsiveValue` like `Popover`'s `side` ([ADR-0121](./0121-menus-sheet-is-the-same-radix-menu-pinned-to-the-bottom-edge-by-the-stylesheet-with-a-back-row-for-a-submenu-over-a-drawer-with-items-of-its-own.md)). It chooses what is drawn (a vertical step draws its line inside the step, a horizontal one beside it), so it cannot be a stylesheet's choice alone. A server render and the first client render draw `base`.
- **The compact summary keeps the steps reachable.** When `interactive` is set it gains an icon button that goes back to the nearest enterable step before the current one (`labels.previous`) and one that goes forward to the nearest enterable step after it (`labels.next`; with `"completed"` it is enabled only for a step ahead that was reached before going back; otherwise the caller's own button or the controller does it, [ADR-0139](./0139-stepper-hands-next-back-and-go-to-to-code-outside-it-through-a-controller-ref-and-no-hook-over-a-hook-or-a-context-for-its-steps.md)).
- **The summary is drawn only when `compact` is not `"never"`**, and the steps and summary are switched by the stylesheet (`compact="auto"` at the `sm` breakpoint), so there is no flash of the wrong form after hydration.
- **Focus is handed across the breakpoint.** The stepper keeps *where* focus is (steps or summary) from the focus events, because by the time the media query reports a change the browser has already dropped focus from the control it hid. A blur caused by a control being hidden leaves that record alone; any other blur clears it. On the change it moves focus to the summary's back button (or the summary itself) going compact, and to the first step that can be entered going full.

## Alternatives considered
- **A read-only summary.** Rejected: an `interactive` stepper on a phone could not go back at all.
- **Reading `document.activeElement` when the width changes.** Rejected: it is already `body`; a real-browser check failed that way.
- **Resolving `compact` in JavaScript too.** Rejected: the summary would show a wrong form after hydration, and CSS already decides it without a flash.
- **Keeping both forms' controls visible to a screen reader (visually hidden, not `display: none`).** Rejected: it adds a second, invisible tab stop for every step.

## Consequences
- A responsive `orientation` is a JavaScript decision; a stepper that only ever changes how many steps it shows should use `compact`.
- Both summary buttons are always drawn when the stepper is interactive, and one with nowhere to go is disabled, so the row does not move or change size; a pressed button that becomes disabled hands its focus on. Horizontally they sit side by side after the text. Vertically the summary is one column of an up arrow, the bars, a down arrow and the step's place as numbers ("3/4"). The bars are not controls: each is far under a usable target size.

## Related
[ADR-0136](./0136-stepper-is-a-nav-and-ordered-list-with-aria-current-step-and-real-buttons-only-where-a-step-can-be-entered-over-a-tablist-with-roving-focus.md); `06-engineering-standards.md` §9 (a collapse never removes the focused control); `component-reviews/Stepper.md`.
