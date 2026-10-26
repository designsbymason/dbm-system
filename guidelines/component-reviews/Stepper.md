# Stepper — review

**Status:** Built 2026-10-26; the §9 review pass below is complete except the items under "Not verified". Not yet declared Finalized.

## What exists
`Stepper` and `Stepper.Step`: an indicator for an ordered flow, in an ordered list inside a named `nav`. Decisions: [ADR-0136](../adr/0136-stepper-is-a-nav-and-ordered-list-with-aria-current-step-and-real-buttons-only-where-a-step-can-be-entered-over-a-tablist-with-roving-focus.md) (semantics and keyboard), [ADR-0137](../adr/0137-stepper-draws-the-indicator-only-and-leaves-the-steps-content-and-the-flows-logic-to-the-caller-over-owning-panels-or-a-controller.md) (indicator only; no panels, no controller).

Props worth knowing: `value`/`defaultValue`/`onValueChange`, `orientation`, `size`, `variant` (`filled`, `outlined`), `tone` (`brand`, `info`, `success`, `highlight`), `labelPlacement`, `compact`, `interactive`, `announce`, `formatNumber`, `labels`, `dir`; a step takes `value`, `title`, `description`, `icon`, `status`, `optional`, `disabled`, `textValue`, `asChild`, `onClick`.

## Verified while building
- 40 unit tests (structure, status derivation, controlled and uncontrolled, wired to state, keyboard, tab order, `asChild`, announcements and `StrictMode`, `labels` merging, spread order, axe in several states), the Docs page's token table against the stylesheet, and the snippet guard.
- Real-browser checks (`Stepper.checks.stories.tsx`): 24px targets at every size, the line level with the indicator's middle (text beside and under, every size), the vertical line down the indicator's middle, right to left, no step moving or resizing when the current step changes, one tab stop per enterable step, the focused step scrolled fully into view in a narrow strip, a scrolling strip with nothing to focus being a tab stop itself, the compact form on a phone width and at a wide one, forced colours, and reduced motion. Every story also passes the axe run, including 2.5.3.
- Contrast measured for every new pairing in all four themes. All pass 4.5:1 for text and 3:1 for icons and rings except: `border.highlight` on `bg.canvas` (2.84:1; the highlight tone is for a surface, as the Docs page and the Tones story say), and the line between steps and the compact segments (`border.default`, 1.35:1 to 1.40:1), which are decorative since each step's state is also said by its mark, its title weight and its hidden status text. An error step's title is `text.primary`, not `text.danger`, which falls under 4.5:1 on `bg.canvas`.
- Bundle: 3.06KB JS and 1.94KB CSS gzipped, against the 10KB default budget. The Show-code snippets were typechecked against the real components (a planted bad prop failed it).
- Looked at in Storybook in light purple and dark emerald, and the Docs page checked for its sections, tables and token rows.

## Decisions made while building
- `variant` has two values, `filled` and `outlined`, not the three first proposed: a third, `ghost`, had no distinct treatment to draw.
- A step's title that is plain text reserves the width of its bold form (a `data-text` copy drawn invisibly and zero tall), so the step does not resize when it becomes current. A title that is not plain text is not given that room.
- Only a `preventDefault()` made by a step's own `onClick` stops it asking for the change: a router's link prevents the browser's navigation itself, before the stepper hears the click, and must still change the step.
- The compact form is a read-only summary. It hides the steps with `display: none`, so a stepper that is `interactive` and compact has no way to enter a step.

## Not verified
- A real device. Touch was not tried.
- A focused step hidden when the viewport crosses the `compact="auto"` breakpoint drops focus to the document: the one case where `06` §9's "a collapse never removes the focused control" is not met. It needs a resize with a focused step, which a person rarely does; the fix would be to keep the steps reachable in the compact form, which was left out as it changes what compact is.
- No server render and hydration test was written: the component draws no portal or node of its own.
