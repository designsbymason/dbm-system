# Working with the Figma library, for agents

Two agents can meet at this library without meeting each other: one designs a screen in Figma from the library, and another reads that design and builds it in code. This guide is what both of them follow so that what the first draws is what the second builds. The facts are in three places, and each is the authority for one thing.

| Source | Authority for |
|---|---|
| [`component-map.json`](./component-map.json) | Which Figma property and value is which code prop and value, per drawn component. Machine-readable and checked against the manifest (`pnpm check-figma-map`) |
| The component's spec frame in Figma | The same table for a person reading the file, plus the anatomy, the tokens used and the accessibility notes |
| The component manifest and Storybook (`@dbm-system/mcp` serves the manifest) | The full props, types, defaults and usage of the code component; they win over the Figma file on anything the two disagree about |

## Designing in Figma

1. **Use an instance of the component set,** never a copy and never a detached frame. Put the component's properties on the instance; do not edit its layers.
2. **Set only the properties the set has.** They are the ones in the map. A look the set cannot make is not a reason to override a layer: say so, and let the code component or the library change.
3. **Bind everything to variables and styles.** No raw colour, spacing, radius or type value. A variable's name is its token (`bg/brand-hover` is `--dbm-bg-brand-hover`), and its code syntax says so.
4. **Pick the Semantic mode and the Viewport mode on the frame, not on the parts.** A theme is a mode, not a second set of colours.
5. **Leave the spec frames and the "Matrix labels" frames alone.** They document the library; they are not part of a design.
6. **A component that is not drawn** (listed on the Components page, or absent from the map) can be named in a design but not drawn from the library: use a labelled placeholder and note the code component by its Storybook name.

## Building from a design

1. **Find the component.** The instance's main component is a set named exactly as the code component (`Badge`, `Input`). Look it up in `components` in the map.
2. **Translate its properties with the map,** not by guessing. Each Figma property lists its values and, for each, the code props it means. A value with `"props": {}` is a CSS state with no prop (hover, focus). A value `"<provided>"` is something the code needs from the app: an icon, a handler, a value.
3. **Take what the Figma properties do not carry from the manifest and Storybook:** accessibility props (`aria-label` is required on a Badge dot), behaviour props (`maxLength`, `onChange`), and anything in `notModelled`.
4. **Use the library's component.** Do not rebuild its styles from the layers. Use tokens (`var(--dbm-…)`, from the variables' code syntax) only for the layout around components.
5. **Read the component's `deviations` in the map** before trusting a size or a shape: a Figma width is often a drawing choice, not a rule (an Input is 280 px wide in the set and `width: 100%` in code).
6. **If something is missing or disagrees, stop and say so.** Do not invent a prop or a value; the map or the file is wrong, and the maintainer decides which.

## Worked examples

- A Badge instance with `variant=dot, tone=danger, size=md` and `ring` on is `<Badge dot tone="danger" size="md" aria-label="New messages" />`, placed on an `anchor`. The dot is a value of `variant` in Figma and the `dot` prop in code.
- An Input instance with `size=md, state=error, filled=true`, `prefix` on and `clearable` on is `<Input size="md" hasError value={value} prefix={<Icon … />} onClear={clear} />`. `filled` has no prop of its own: a value present is `value`; the state `error` is `hasError`; hover and focus are CSS.
- A Button instance with `rounded=true` and `state=loading` is `<Button rounded isLoading>…</Button>`; `rounded` is a variant in Figma and a boolean prop in code.

## Related

[02-component-rules.md](./02-component-rules.md) (which props become which Figma properties), [04-naming-and-structure.md](./04-naming-and-structure.md), [05-deviations.md](./05-deviations.md), [components/](./components/README.md) (the decisions per component) and [ADR-0240](../adr/0240-a-machine-readable-map-from-each-drawn-figma-component-to-the-code-is-checked-against-the-manifest-over-the-spec-frame-alone-or-waiting-for-code-connect.md).
