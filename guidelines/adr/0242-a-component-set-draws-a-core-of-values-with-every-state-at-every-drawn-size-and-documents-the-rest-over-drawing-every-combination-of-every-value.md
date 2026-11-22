# 0242 — A component set draws a core of values with every state at every drawn size and documents the rest, over drawing every combination of every value

**Status:** Accepted · **Date:** 2026-11-22 · **Amended 2026-11-22** — the undrawn values are their own section of the spec frame; the decision itself is unchanged · Supersedes [ADR-0237](./0237-a-component-set-draws-the-full-matrix-of-valid-variants-and-states-over-splitting-by-dimension-or-drawing-states-for-one-size.md)

## Context
ADR-0237 chose to draw the full matrix: every value of every variant property with every other, and every state at every size, so that any real combination could be set on an instance. The pilot measured the cost. Button was 450 variants, Input 60, Badge 105 and Card 696 (a set 56,000 px tall with about 9,700 layers), and each variant is something to keep in step with the code. A designer almost never needs an extra-small, extra-large or status-toned card, and the code and Storybook have every value anyway. Drawing a sparse set instead is worse: when a property is changed on an instance, Figma switches to the closest drawn variant, which can quietly change another property.

## Decision
A set draws a **core** of each property's values, never a sparse subset of combinations, and documents every other value the code has.

1. **Default coverage,** which a component's plan may depart from with a recorded reason:
   - **Look variants** (`variant`): all of them.
   - **Tone:** `neutral` and `brand`; every status tone only where the tone means a status (Badge, Alert, Toast and similar).
   - **Size:** `sm`, `md` and `lg`, with `md` the default; `xs` and `xl` are not drawn.
   - **Structure** (Card's `layout`): all of them, because they change the structure and not the style.
   - **States:** every interaction state, **at every drawn size.** A structure variant is drawn at the default state, and the states at the default structure, because structure does not change what a state does.
   - **Booleans, slots and text:** always, since they multiply nothing.
2. **A budget of about 250 variants per set.** A set over it needs a recorded reason.
3. **Exceptions are decided when the component is planned** and recorded in the map (`coverage`) and the component's file. They can widen coverage (Badge keeps all seven tones, Button keeps `xl`) or narrow it (Card draws two sizes).
4. **Nothing is silently missing.** Every value the code allows and the file does not draw is listed in the map under the property's `undrawn`, each with a short recipe for getting it, and in the spec frame's own "In code, not drawn" section, a table of property, value not drawn and how to get it. *(Amended 2026-11-22: this originally said a block in the Properties slot; it is its own section, a seventh slot on the Spec frame master, so it is easy to scan.)* `pnpm check-figma-map` fails when the drawn and undrawn values of an enumerated property do not add up to every value the code's type allows, and when a set over the budget has no recorded exception.
5. **How an undrawn value is obtained:** override a drawn instance by the recipe, name the instance `Name (prop=value)` so a person or an agent reading the design sees what was meant, add the variant in your own copy of the file, or ask for it to be drawn.
6. **Kept from ADR-0237 and its amendments:** a combination that cannot occur is not drawn; a boolean prop that changes the shape is a variant property; a presentation that ignores another axis can be a value of it.

## Alternatives considered
- **The full matrix (ADR-0237).** Superseded: too large to maintain, and the pilot showed the cost.
- **A sparse set** (extra sizes drawn only for the default look). Rejected: Figma switches to the closest drawn variant on a change, so a property can change silently.
- **A rule of fixed numbers** (always three sizes, always two tones). Rejected: some components need more (Badge's tones are statuses, Button's `xl` is a real size) and some less.
- **Drawing states once at one size.** Rejected for size: the maintainer wants every state at every drawn size. It is kept only across structure variants.

## Consequences
- Sets are smaller and cheaper to keep in step: Button 360, Input 36, Badge 63, Card 144.
- A designer who needs an undrawn value uses the recipe, which is deterministic, but their instance still carries the drawn property value, so the naming convention matters.
- A property's values are known to be complete: drawn plus undrawn is the code's list.
- A component can exceed the budget with a reason (Button, which draws every state at all four sizes and with `rounded` off and on).

## Related
`guidelines/figma/02-component-rules.md` §3, `guidelines/figma/03-agent-guide.md`, `guidelines/figma/component-map.json`, [ADR-0237](./0237-a-component-set-draws-the-full-matrix-of-valid-variants-and-states-over-splitting-by-dimension-or-drawing-states-for-one-size.md) (superseded) and [ADR-0240](./0240-a-machine-readable-map-from-each-drawn-figma-component-to-the-code-is-checked-against-the-manifest-over-the-spec-frame-alone-or-waiting-for-code-connect.md).
