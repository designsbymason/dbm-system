# 0238 — An icon set has a tone variant, over a contextual-colour collection, an overridden fill or a mask

**Status:** Accepted · **Date:** 2026-11-22

## Context
An icon inside a button must be the button's text colour (white on a primary button, brand on a secondary one) and must stay right when a designer swaps the icon. The Icon sets were bound to one variable, `icon/default`. The Button pilot tested three ways to colour an icon in a component. An override of the icon's fill on the nested instance is lost once the icon is bound to a swap property. A colour rectangle under the icon used as a mask works for the default icon, but the mask is lost on a swap. A variable collection of contextual colours with one mode per case cannot work on a Professional plan: a collection has at most four modes, a button needs five or more cases, and an icon can be bound to one variable only.

## Decision
Every icon set has a **`tone` variant property** beside `weight`, with 16 values taken from the `icon/*` variables the components use: `default`, `secondary`, `disabled`, `brand`, `danger`, `warning`, `success`, `info`, `highlight`, `on-brand`, `on-danger`, `on-warning`, `on-success`, `on-info`, `on-highlight` and `white`. Each variant fills its shape with that variable. A component sets the tone on its icon instance as a variant property, so the colour is part of the instance's choice of component and a swap to another icon set carries the tone as a matching variant property.

`on-neutral` has no value of its own: in all four themes it resolves to the same colour as `on-brand`, so a neutral primary button uses `on-brand`. This must be revisited if a theme makes them differ.

## Alternatives considered
- **A contextual-colour variable collection.** Rejected: the four-mode limit of the plan, and one variable per icon.
- **An override of the fill on the nested instance.** Rejected: lost on binding and on swap.
- **A mask over a colour rectangle.** Rejected: lost on swap.

## Consequences
- The Icon sets are large: 58 icons, three weights and 16 tones make 2,784 variants. They live in their own Section on the Icons page, and the page shows each icon's three default variants as instances.
- A component sets an icon's colour as a variant property, which is visible and editable on the instance.
- Swapping an icon through the swap menu keeps the tone in Figma's interface, as matching variant properties carry over; this was not testable through the Plugin API, which swaps to a specific variant, so a swapped icon may need its `tone` set by hand.
- The sync script's `08-icon-tones.js` payload adds the tones, so a new icon is built with `07` then `08`.

## Related
`guidelines/figma/02-component-rules.md` §2 and `guidelines/figma/01-plan.md` §6 and §8. [ADR-0236](./0236-the-figma-variables-are-four-collections-primitives-semantic-with-four-theme-modes-component-and-viewport-over-one-collection-or-a-collection-per-theme.md).
