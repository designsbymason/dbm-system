# Stepper — review

**Status:** Built 2026-10-26, with a second round the next day (below); the §9 review pass is complete except the items under "Not verified". Not yet declared Finalized.

## What exists
`Stepper` and `Stepper.Step`: an indicator for an ordered flow, in an ordered list inside a named `nav`. Decisions: [ADR-0138](../adr/0138-stepper-adapts-to-the-width-by-a-responsive-orientation-resolved-in-the-browser-and-a-compact-summary-with-a-back-button-that-focus-is-handed-across-over-a-read-only-summary-or-css-only-switching.md) (width: responsive orientation, the compact form's back button, focus across the breakpoint) and [ADR-0139](../adr/0139-stepper-hands-next-back-and-go-to-to-code-outside-it-through-a-controller-ref-and-no-hook-over-a-hook-or-a-context-for-its-steps.md) (the controller). Earlier: [ADR-0136](../adr/0136-stepper-is-a-nav-and-ordered-list-with-aria-current-step-and-real-buttons-only-where-a-step-can-be-entered-over-a-tablist-with-roving-focus.md) (semantics and keyboard), [ADR-0137](../adr/0137-stepper-draws-the-indicator-only-and-leaves-the-steps-content-and-the-flows-logic-to-the-caller-over-owning-panels-or-a-controller.md) (indicator only; no panels, no controller).

Props worth knowing: `value`/`defaultValue`/`onValueChange`, `orientation`, `size`, `variant` (`filled`, `outlined`), `tone` (`brand`, `info`, `success`, `highlight`), `labelPlacement`, `compact`, `interactive`, `announce`, `formatNumber`, `labels`, `dir`; a step takes `value`, `title`, `description`, `icon`, `status`, `optional`, `disabled`, `textValue`, `asChild`, `onClick`.

## Verified while building
- JSDoc on both components with a usage example, and on every prop (`Stepper.types.ts`).
- 40 unit tests (structure, status derivation, controlled and uncontrolled, wired to state, keyboard, tab order, `asChild`, announcements and `StrictMode`, `labels` merging, spread order, axe in several states), the Docs page's token table against the stylesheet, and the snippet guard.
- Real-browser checks (`Stepper.checks.stories.tsx`): 24px targets at every size, the line level with the indicator's middle (text beside and under, every size), the vertical line down the indicator's middle, right to left, no step moving or resizing when the current step changes, one tab stop per enterable step, the focused step scrolled fully into view in a narrow strip, a scrolling strip with nothing to focus being a tab stop itself, the compact form on a phone width and at a wide one, forced colours, and reduced motion. Every story also passes the axe run, including 2.5.3.
- Contrast measured for every new pairing in all four themes. All pass 4.5:1 for text and 3:1 for icons and rings except: `border.highlight` on `bg.canvas` (2.84:1; the highlight tone is for a surface, as the Docs page and the Tones story say), and the line between steps and the compact segments (`border.default`, 1.35:1 to 1.40:1), which are decorative since each step's state is also said by its mark, its title weight and its hidden status text. An error step's title is `text.primary`, not `text.danger`, which falls under 4.5:1 on `bg.canvas`.
- Bundle: 3.06KB JS and 1.94KB CSS gzipped, against the 10KB default budget. The Show-code snippets were typechecked against the real components (a planted bad prop failed it).
- Looked at in Storybook in light purple and dark emerald, and the Docs page checked for its sections, tables and token rows.

## Decisions made while building
- `variant` has two values, `filled` and `outlined`, not the three first proposed: a third, `ghost`, had no distinct treatment to draw.
- A step's title that is plain text reserves the width of its bold form (a `data-text` copy drawn invisibly and zero tall), so the step does not resize when it becomes current. A title that is not plain text is not given that room.
- Only a `preventDefault()` made by a step's own `onClick` stops it asking for the change: a router's link prevents the browser's navigation itself, before the stepper hears the click, and must still change the step.

## Not verified
- A real device. Touch was not tried.
- No server render and hydration test was written: the component draws no portal or node of its own.

## Second round
Found and fixed, then the gaps in the first round's list:
- **Defect:** with `interactive="completed"` a step before the current one that showed `error`, `warning` or `skipped` could not be entered, so "go back to the step with the error" did not work. Every step before the current one is now enterable (and any step marked complete); a unit test covers each status.
- **Known gaps:** the compact form is no longer read-only and focus is no longer lost when the width crosses `compact="auto"` (ADR-0138); `controllerRef` with `next`, `back` and `goTo` (ADR-0139).
- **Feature gaps:** a `busy` step (a spinner in the indicator, `aria-busy`, "in progress" in the status text); a `warning` status, with the error mark changed from a triangle to a cross so the two differ by shape as well as colour; a responsive `orientation`; the current step scrolled into view when it changes or first draws; a `connector` of `solid`, `dashed` or `none` (the line leaving a skipped step is always dashed) and the filled line scaled in over its track rather than swapped; `rounded` (on by default; off gives squares with rounded corners, the `rounded` name `Button` uses, with the opposite default); and a cap on how wide a step's text may grow (`stepper.label-max-width`).

Verified: 131 unit tests; real-browser checks for the scaled-in line, the busy indicator's size at every size, square corners, dashed lines level with the indicators (across and down), long titles wrapping at the cap beside and under the indicator, the current step brought into view on mount and on change, the responsive orientation at a phone width and a wide one, and focus following the breakpoint in both directions (the frame's width is changed in the check). The first version of the focus handoff read `document.activeElement` when the media query reported a change and failed that check, since focus was already on `body`.

Contrast: the warning pairings (`icon.on-warning` on `bg.warning`, `bg.warning`, `border.warning` and `icon.warning` against the surface) all pass 3:1 in all four themes.

Decided: `controllerRef` has no hook beside it because nothing of the caller's sits inside a stepper.

## Soft indicators and the neutral tone
At explicit direction: a step not yet reached has the tone's `bg.*-subtle` fill and `border.*-subtle` ring when filled, and the subtle ring on the page when outlined (it was `border.strong` on nothing); and `tone` gained `"neutral"` (grey: `bg.neutral`, `icon.on-neutral`, `border.neutral-strong` for the ring since `border.neutral` is 2.32:1 in light mode, `text.primary`, `icon.default`).
- Contrast, all four themes: the number in an unreached indicator (`text.secondary` on each `bg.*-subtle`) is 6.56:1 or more; the neutral tone's finished disc, ring and mark all pass 3:1. **Recorded exception:** the subtle ring against the surface is 1.00:1 to 1.40:1, below the 3:1 non-text floor. The step is told by its number, its title and its hidden status text, none of which depends on the ring, so it is a decorative edge, as the line between steps is.
- A real-browser check asserts the unreached indicator's fill and ring against the tokens in every tone and both variants.

## Compact form, third round
- **No shift:** the compact row keeps its height (`icon-button.size.xs`) whatever buttons show, so going back to the first step or forward to the last does not change it. Horizontally the text then slides into the room of a missing button (at the maintainer's direction, rather than holding its place); vertically each keeps a space of its own height in the column and nothing moves. A real-browser check clicks from the first step to the last and back, measuring the nav's and the summary's height and the text's position every time.
- **Forward:** an interactive compact stepper has a Next button as well as Back, to the nearest enterable step ahead. With `interactive="completed"` nothing ahead can normally be entered, so there is none (use the caller's own button or `controllerRef.next()`). The bars stay a picture of progress and are not controls: each is a few pixels tall, far under a usable target, and Back and Next already give keyboard, screen reader and pointer a way.
- **Focus:** a summary button that is pressed and then leaves (Back at the first step, Next at the last) hands its focus to the other button, or the summary, instead of dropping it; checked in a real browser and in a unit test. This supersedes the earlier line that the compact form goes back but never forward.
- **Vertical:** with `orientation="vertical"` the compact summary is one column — an up arrow, the bars, a down arrow, then only the step's place ("Step 3 of 4") as text, the title kept for a screen reader — centred on one axis, at the maintainer's direction (earlier layouts put the buttons either side of the text, then above and below it, and left them far from the bars). Each arrow keeps a space of its own height where it is not shown, so nothing moves.

## Compact form, fourth round
At the maintainer's direction:
- **Both buttons, always.** An interactive compact stepper shows Back and Next at every step; one with nowhere to go is disabled, not hidden or replaced by a space. This replaces the placeholders and the text sliding into a missing button, so nothing in the row moves or changes size by construction. A pressed button that becomes disabled hands its focus to the other (a browser may leave focus on a just-disabled button, or drop it to the page, so the check covers both).
- **Back beside Next** horizontally, side by side after the text.
- **The vertical place is just numbers** ("3/4", `labels.place`), drawn for the eye and hidden from assistive technology; a screen reader gets "Step 3 of 4" and the title.
- The default `stepOf` and `place` now write their numbers through `formatNumber` (the earlier `stepOf` used plain numbers beside digits that used it).

## Returning to a reached step
`interactive="completed"` now means the steps the person has reached (the furthest step they have been on, and all before it) rather than only those before the current one, so after going back they can go forward again and the compact Next button is enabled for it. The furthest step is kept inside the stepper from the current step (controlled or not) and never goes down; a flow that must close the steps ahead again remounts the stepper with a new `key`. A step ahead that was reached still shows as not started (the statuses are drawn from the current step, as before); set `status="complete"` on it to show it finished.

## Final review pass
Findings of the final §9 pass, all fixed:
- **A disabled step is a native disabled button** (it was a role-less `div` with `aria-disabled`, which assistive technology ignores): announced as unavailable, out of the tab order, `cursor: not-allowed`.
- **`aria-current="step"` is on the current step's `<li>`.** The current step is never one that can be entered, so it was always on a role-less `div`.
- **The compact horizontal summary is one line**, cut with an ellipsis (the full text is the tooltip and is read in full), so a long title does not change the row's height from step to step; a real-browser check with a long title in a narrow box asserts it (and fails with the rule removed).
- **`Stepper.tsx` is split** from 728 lines, the root one function of about 380, into `StepperStep.tsx`, `StepperSummary.tsx`, `StepperContext.ts`, `stepperHelpers.ts` (`canEnter`, `derivedStatus`, `revealInline`, `titleText`, the English labels) and the hooks `useStepperState` (value, furthest step, announcement), `useStepperController` and `useStepperFocus` (the strip, focus kept across the breakpoint and when a summary button becomes disabled). No behaviour changed; the helpers have their own tests.
- **A server-render and hydration test** (`Stepper.ssr.test.tsx`), with a responsive orientation, `compact="auto"` and `interactive="completed"`.
- **Docs table:** `Stepper.Step`'s `busy` row was missing; `formatNumber`'s description now states its default.
- **The stylesheet's duplicate `.summaryText` blocks are merged.**
- **Checks added:** the summary buttons are at least 24 by 24 at both orientations; the compact form in right-to-left (text at the right, Back right of Next, arrows flipped); a disabled step is a disabled button.
- **Text it writes is all in `labels`:** `summary`, `announcement` and `statusText` are whole-sentence labels (a translation chooses its own punctuation and order), built by default on the `stepOf` in use, so translating `stepOf` alone reaches all of them. The compact summary's title is the plain `textValue`/string title, since a label is a string.
- **Story names** match their Docs headings.

## Compact vertical fills its container
At the maintainer's direction: in a container with a set height, the compact vertical form fills it (the nav, its scroller and the summary are `100%` tall, and the bars share the room between Up and Down, so Down and the place sit at the bottom). With no set height the percentages are `auto` and the stepper keeps its natural height. Two real-browser checks assert both cases (equal bar heights, the place on the container's bottom edge; and an auto-height container unchanged).

## Centred compact label
At the maintainer's direction: `labelAlignment` (`"start"` by default, or `"center"`) for the compact horizontal summary. Centred, Back is at the start of the row, the text in the middle and Next at the end (mirrored right to left); read-only, the text is centred across the row. It has no effect on the vertical form or without `compact`, with a development warning when set to `"center"` there; the Playground hides the control until `compact` is on. Unit tests cover the structure and the warning; a real-browser check measures the text's centre against the row's, and the buttons at the two ends, left to right and right to left.

## Optional labels
Until now the text was not optional: `title` is required and always drawn. At the maintainer's direction, `showLabels` (a boolean, on by default; first called `label`, renamed to stay clear of the `labels` object) draws indicators alone: the steps' title, description and "Optional" mark, and the compact summary's text, are hidden from the eye but still in the page (they name each step and the status), and a step's plain-text title is shown in the DBM `Tooltip` on hover or focus (a native `title` is not used anywhere: the summary's cut-short text uses the same `Tooltip`, opened only when the text was actually cut). A disabled step has no tooltip, since a disabled button receives no pointer events. A real-browser check closes every tooltip it opens before it ends. `title` stays required for that reason. Hidden steps still meet the 24px target (the indicator plus the step's padding) and keep the line level, checked in a real browser at every size and vertically; the compact form keeps its buttons, with Back and Next at the two ends when `labelAlignment="center"`.

## Started steps, colourful, and no success tone
At the maintainer's direction:
- **A started step.** With `interactive="completed"`, after going back from a step that was not completed, that step (the furthest reached) is `started`: a dashed ring in the tone's colour with the number in it, and the steps passed on the way stay finished. This replaces the earlier choice to draw reached steps ahead of the current one as not started (a change of status derivation for `"completed"` only: `"all"` and `"none"` are unchanged). The compact form keeps its bars (a started step's bar is the not-yet colour unless `colorful`, then warning). A step's own `status="complete"` wins, which is how a caller says the furthest step was completed. The status word is `labels.started` ("started, not completed"), so the dash is never the only cue; forced colours draw it dashed in `Highlight`.
- **`success` is no longer a tone** (the tones are brand, info, highlight and neutral): success now means a finished step, through `colorful`.
- **`colorful`** (off by default): a finished step, and the line after it, are success; the current step, a started step and the not-started steps keep the tone (a started step was first drawn warning, then changed to the tone at the maintainer's direction). Contrast measured in all four themes: the started number in the tone's text colour is 4.51:1 or more on its tint, and the started ring is 3.23:1 or more against the surface in every tone.
- Real-browser check: the ring is dashed on the started step only, in the tone's ring colour (filled and outlined), and `colorful` gives success for a finished step and the line, and the tone for the current and started steps, against the tokens.

## Compact without labels
At the maintainer's direction: horizontally, with `compact`, `interactive` and `showLabels={false}`, Back and Next go at the two ends of the bars in one row (there is no text to put them beside, and above the bars they read as a separate row). Both are still always drawn, so nothing moves; a real-browser check asserts the order, the shared centre line and the mirroring right to left, and that the row does not change from the first step to the last. With labels, vertically, or without `interactive`, the summary is as before.

## Code review refinements
A read-through of the finished code found, and fixed:
- **A vertically overflowing strip was not a tab stop.** The check for a scrolling strip looked at the horizontal axis only; it now looks at both, so a read-only compact vertical stepper in a container too short for it can be reached by keyboard (a real-browser check, in a 3rem container).
- **Stale text:** the root JSDoc (which the manifest reads), the Docs intro, the inventory row and ADR-0136 (amended in place, marked, since it had been pushed) now describe the reached/started statuses, `colorful`, `showLabels`, `labelAlignment` and where `aria-current` sits.
- **One `TooltipProvider`** around the list instead of one per step, so moving from one step to the next shares the hover delay. A step's tooltip is always drawn when the text is hidden and kept closed (its open state is the step's own) when there is nothing to say, so a step's element does not remount as its title changes between plain text and a node.
- **Step positions are worked out once** per render and used by the list, the summary and the buttons; the nav's ref is merged with `mergeRefs`; the slotted child of `asChild` is decided once.
- **A warning in development when the stepper changes between controlled and uncontrolled.**
- **`StepperStoryKit.tsx`** holds the demo the stories and the checks share (they had two copies); **the 1,071-line test file is three files** (`Stepper.test.tsx`, `Stepper.compact.test.tsx`, `Stepper.text.test.tsx`) around a small `stepperTestKit.tsx`, with the same 194 tests.

## `status="started"`
A step can now be set as started by the caller, not only derived after going back: for a step known to be begun and not finished, such as a saved draft when a person returns to a flow, in any `interactive` mode. It is drawn dashed, announced as "started, not completed", and with `interactive="completed"` it can be entered, as a step marked complete can. The derived behaviour is unchanged and is the default. The `Stepper.Step` Properties table lists the new value (it had also left out `warning`, now added).
