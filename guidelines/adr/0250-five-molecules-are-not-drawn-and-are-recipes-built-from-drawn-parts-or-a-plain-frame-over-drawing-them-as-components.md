# 0250 — Five molecules are not drawn and are recipes built from drawn parts or a plain frame, over drawing them as components

**Status:** Accepted · **Date:** 2026-11-26

## Context
After the atoms, the molecules were checked against the not-drawn rule ([02-component-rules.md](../figma/02-component-rules.md) §1): a component is drawn when it has something to see. Five have almost nothing of their own.
- `CheckboxGroup` and `RadioGroup` are a flex container around `Checkbox` and `Radio` instances (a column with a `space/2` gap, or a wrapping row with `space/2` and `space/4`), plus a 4 px `border/danger` accent bar for the error state, the same bar `Blockquote` draws in brand.
- `TimeRangePicker` is two `TimePicker`s side by side with a dash between them, which cannot be drawn before `TimePicker` is.
- `ScrollArea` is a scroll region with custom scrollbars, an overlay that appears on hover or scroll; its static look is a frame with an optional `border/default` edge and `radius/md`, and a Figma frame already scrolls.
- `Splitter` is panes divided by a 1 px `border/default` line, a handle whose grip and hover, focus and drag states are interaction feedback.

## Decision
These five are not drawn. Each joins the Components page's table of what is not drawn, as "Composition" (the first three) or "Behaviour" (the last two), with a recipe: an auto layout of `Checkbox` or `Radio` instances with the gaps above and the error bar; two `TimePicker` instances and a dash in `text/tertiary` with the gap `space/2`; a frame with clipping and scrolling, and for the bordered form a 1 px `border/default` edge and `radius/md`; panes in a frame divided by a 1 px `border/default` line.

## Alternatives considered
- **Draw each as a component.** Rejected: a `CheckboxGroup` or `RadioGroup` set would be four variants of an auto layout whose parts are instances of drawn atoms, a `TimeRangePicker` a row of two instances, and the other two a frame and a line, so each would repeat what its parts draw and need a change whenever they do.
- **Draw the `Splitter` handle alone.** Rejected: its states are interaction feedback, and a one-pixel line is a border.

## Consequences
- The drawable count is 91 of the 120 components (29 atoms, 35 molecules, 27 organisms), and the Components page's molecules table lists 35.
- There is no Code Connect mapping for these five; an agent building them uses the recipe and the mappings of their parts.
- `FormField`, `List`, `ButtonGroup`, `FieldGroup`, `Toolbar`, `AvatarGroup`, `PageHeader` and `TableToolbar` stay drawn: each has a surface, a corner treatment or markers of its own.

## Related
[02-component-rules.md](../figma/02-component-rules.md) §1, [01-plan.md](../figma/01-plan.md) §8, [ADR-0246](./0246-skiplink-is-not-drawn-and-backdrop-is-provided-as-figma-styles-over-drawing-either-as-a-component.md), [ADR-0247](./0247-backtotop-is-not-drawn-and-is-a-rounded-iconbutton-with-an-up-arrow-over-drawing-it-as-a-component.md), [ADR-0248](./0248-text-is-not-drawn-and-is-a-text-layer-with-a-text-style-and-a-colour-variable-over-drawing-it-as-a-component.md).
