# 0245 — A tag's hover label takes three semantic hover text tokens, over darkening the status text tokens or changing the hover treatment

**Status:** Accepted · **Date:** 2026-11-25

## Context
`Tag`'s `subtle` and `outlined` looks fill with `bg.{tone}-subtle-hover` under the pointer and keep the label in `text.{tone}`. In the two light themes three of those pairs are under the 4.5:1 floor for text (WCAG 1.4.3): `text.info` on `bg.info-subtle-hover` is 4.15:1, `text.warning` 4.20:1 and `text.danger` 4.44:1. The dark themes pass (8.2:1). The resting pairs pass, `info` only just (4.51:1). [ADR-0178](./0178-light-mode-error-text-stays-at-aa-on-red-600-over-splitting-the-text-token-to-reach-the-aaa-target.md) already recorded the danger pair and decided that light-mode `text.danger` stays on `red.600`, with components keeping it off that fill. A tag's hover fill cannot be lightened: the step above `*-100` is the resting `*-50`, so hover would then show no change.

## Decision
Add three semantic tokens, `text.info-hover`, `text.warning-hover` and `text.danger-hover`, and have `Tag`'s `subtle` and `outlined` hover rules use them for those three tones. In the light themes they alias `blue.700`, `amber.700` and `red.700` (6.10:1, 6.11:1 and 6.43:1 on the hover fill); in the dark themes they alias the same step as `text.info`, `text.warning` and `text.danger`, which already pass. They are semantic tokens, not component tokens, because the component layer holds only theme-independent sizes and numbers and this colour differs by theme. The status text tokens and every other component are unchanged.

## Alternatives considered
- **Darken `text.info`, `text.warning` and `text.danger` to step 700 in the light themes.** Clears the shortfall at the source, but about fifteen components share those tokens and every one would change colour, and it reverses the decision in ADR-0178.
- **Change the hover from a fill to a border.** Keeps the label's resting contrast, but a selected `subtle` tag already marks itself with a border change, so hover and selected would look alike.
- **Accept the shortfall.** Hover is transient, but WCAG 1.4.3 has no exemption for it, the system's floor is AA, and the fix is small.

## Consequences
- Three new semantic tokens in all four theme files, listed in the `text.*` table of `03-token-system-spec.md`, which also corrects the contrast figures of the `info`, `warning` and `success` subtle rows it had wrong.
- `Tag` changes only in the hover colour of six combinations; a real-browser check holds each to 4.5:1.
- `Tag` read the new tokens first; `Avatar`'s hovered colorful initials use them too *(amended 2026-11-25: the Avatar's `danger`, `warning` and `info` families had the same three shortfalls, found when the Avatar was drawn in the Figma library)*. Another component that puts a status text colour on a `-subtle-hover` fill should use them too, and `IconButton`'s labelled destructive toggle may now do so instead of keeping its pressed fill under the pointer.
- The Figma library gains the three variables and redraws the 18 affected hover variants.

## Related
`guidelines/03-token-system-spec.md` (`text.*`, `bg.*`), [ADR-0002](./0002-aa-contrast-floor-aaa-target-for-error-text.md), [ADR-0178](./0178-light-mode-error-text-stays-at-aa-on-red-600-over-splitting-the-text-token-to-reach-the-aaa-target.md), [Tag](../component-reviews/Tag.md).
