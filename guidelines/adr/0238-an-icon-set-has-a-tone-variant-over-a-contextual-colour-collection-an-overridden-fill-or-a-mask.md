# 0238 — An icon set has a tone variant, over a contextual-colour collection, an overridden fill or a mask

**Status:** Accepted · **Date:** 2026-11-22 · **Amended 2026-11-25** — `on-neutral` added as a seventeenth tone value, because the code's `IconTone` has it and `Tag` needed it; the decision itself is unchanged

## Context
An icon inside a button must be the button's text colour (white on a primary button, brand on a secondary one) and must stay right when a designer swaps the icon. The Icon sets were bound to one variable, `icon/default`. The Button pilot tested three ways to colour an icon in a component. An override of the icon's fill on the nested instance is lost once the icon is bound to a swap property. A colour rectangle under the icon used as a mask works for the default icon, but the mask is lost on a swap. A variable collection of contextual colours with one mode per case cannot work on a Professional plan: a collection has at most four modes, a button needs five or more cases, and an icon can be bound to one variable only.

## Decision
Every icon set has a **`tone` variant property** beside `weight`, with 17 values taken from the `icon/*` variables the components use: `default`, `secondary`, `disabled`, `brand`, `danger`, `warning`, `success`, `info`, `highlight`, `on-brand`, `on-danger`, `on-warning`, `on-success`, `on-info`, `on-highlight`, `on-neutral` and `white`. *(Amended 2026-11-25: this originally said 16 values and did not list `on-neutral`, which the code's `IconTone` already had.)* Each variant fills its shape with that variable. A component sets the tone on its icon instance as a variant property. The icon is shown or hidden by a boolean property and is swapped in place, on the nested instance, and a component has **no instance-swap property for the icon**: a swap property has one default for the whole component set, so every variant would share one tone (found when the Button's secondary icons came out white).

`on-neutral` has no value of its own: in all four themes it resolves to the same colour as `on-brand`, so a neutral primary button uses `on-brand`. This must be revisited if a theme makes them differ.

## Alternatives considered
- **A contextual-colour variable collection.** Rejected: the four-mode limit of the plan, and one variable per icon.
- **An override of the fill on the nested instance.** Rejected: lost on binding and on swap.
- **A mask over a colour rectangle.** Rejected: lost on swap.

## Consequences
- The Icon sets are large: 58 icons, three weights and 17 tones make 2,958 variants *(Amended 2026-11-25: originally 16 tones and 2,784 variants)*. They live in their own Section on the Icons page, and the page shows each icon's three default variants as instances.
- A component sets an icon's colour as a variant property, which is visible and editable on the instance.
- Swapping the nested icon in place should keep the tone in Figma's interface, as matching variant properties carry over. This could not be tested through the Plugin API, which swaps to a specific variant and so resets the tone to `default`; if a swap loses the tone, set `tone` on the nested icon by hand.
- The sync script's `08-icon-tones.js` payload adds the tones, so a new icon is built with `07` then `08`.

## Related
`guidelines/figma/02-component-rules.md` §2 and `guidelines/figma/01-plan.md` §6 and §8. [ADR-0236](./0236-the-figma-variables-are-four-collections-primitives-semantic-with-four-theme-modes-component-and-viewport-over-one-collection-or-a-collection-per-theme.md).
