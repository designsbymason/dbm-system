# 0218 — An `asChild` component draws its own icons, spinner and caption inside the slotted element with Radix `Slottable`, over dropping them or asking the consumer to put them in the child

**Status:** Accepted · **Date:** 2026-11-15

## Context
`Button` and `IconButton` take `asChild` (Radix `Slot`) so a link can look like a button. With it, both rendered only the slotted element: `Button`'s `leadingIcon`, `trailingIcon` and loading spinner, and `IconButton`'s `icon`, spinner and `label` caption, were dropped, and each warned in development. `IconButton` requires `icon`, so every `asChild` use warned even when written as documented, with the icon put inside the link by hand. A link that looks like a button with an icon ("Read the docs" with an arrow, a GitHub icon link) is common; the docs website needed both on its first page.

[ADR-0007](./0007-as-vs-aschild-by-content-source.md) chose `asChild` for components whose content is `children`, noting that `Slot` cannot keep content of the component's own beside a slotted child. Radix's `Slottable` (part of `@radix-ui/react-slot`, already a dependency) can: in its render form it clones the slotted element with content the component supplies, so the component's own pieces land inside the element that is rendered.

## Decision
- **`Button` with `asChild`** draws its `leadingIcon`, `trailingIcon` and loading spinner inside the slotted element, around that element's own content, which stays the label (no `loadingText` swap in this mode).
- **`IconButton` with `asChild`** draws its `icon`, spinner and `label` caption inside the slotted element when that element is empty (`<a href="…" aria-label="…" />`; the same name as `IconButton`'s goes on the link, because a lint rule that checks a link for content, such as jsx-a11y's `anchor-has-content`, reads the element as written). When the element has content of its own, that content is used as it is and nothing is drawn, so code that put the icon in the link by hand (the only way before) still shows one icon, not two.
- The development warnings that said these props have no effect with `asChild` are removed; `IconButton` warns only when a `label` is given to an element that has content of its own.
- **The pattern for future components:** a component that draws small pieces of its own around its `children` (an icon, a spinner, a caption, an indicator) and supports `asChild` draws them inside the slotted element with `Slottable`, rather than dropping them in that mode.

## Alternatives considered
- **Keep dropping them and document it.** No change, but the documented use warns, and every consumer writes the icon into the link by hand with its own size and colour.
- **Make `icon` optional with `asChild`** (a discriminated type). Silences the warning, but still leaves the consumer to draw the icon, unsized and uncoloured by the button.
- **Always draw `IconButton`'s icon, even when the element has content.** Simpler, but existing code that followed the old advice would show two icons.
- **Wrap the slotted element** (render a `<span>` around it). Breaks `asChild`'s promise that the given element is the one rendered, and its styling.

## Consequences
- The change is additive: props that did nothing with `asChild` now do what they say. It ships as a patch release.
- `Tabs`, `Accordion`, `ToggleGroup`, `Select` and the menu items also drop pieces of their own with `asChild`; each adopts this pattern when it is next changed or reviewed, not as part of this change.
- `05-component-api-conventions.md` §3 records the pattern beside the `as` versus `asChild` rule.

## Related
[ADR-0007](./0007-as-vs-aschild-by-content-source.md). `05-component-api-conventions.md` §3. `component-reviews/Button.md`, `component-reviews/IconButton.md`.
