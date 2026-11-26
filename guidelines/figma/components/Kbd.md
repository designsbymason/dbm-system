# Kbd in Figma

**What is drawn.** One component on the Typography page, with no set: a keycap with a surface fill, a thin edge, a 2 px bottom shadow and monospace text. A text property `key` holds the key.

## Decisions

- **One component, no set.** The code has no variant, size or state: a keycap is a fixed compact size that does not inherit the text around it, as a physical key does not change size. With no variant property there is nothing to combine, so the component stays plain.
- **A combination is composed, not a property.** `keys` draws one keycap per key for the platform: side by side with the gap `space/1` on an Apple platform, with a plus text between them elsewhere. The modifier text differs per platform (`⌘` and `Ctrl`) and a text property has one default, so chord variants would need a text property for each key and still not cover three keys. The spec frame draws both arrangements from instances of the keycap, and a recipe says how to build a longer one.
- **The bottom edge is a drop shadow,** 2 px down with no blur, whose colour is bound to `border/neutral`, as the code's `box-shadow` is. It is an effect, so it does not change the keycap's size.
- **The edge counts in the size,** as an inside stroke included in the layout, with padding `space/1` and `space/2` and `radius/xs`.
- **The text is Roboto Mono,** the stand-in for the monospace stack ([ADR-0249](../../adr/0249-the-figma-library-stands-in-roboto-mono-for-the-monospace-font-stack-and-leaves-the-family-unbound-over-binding-the-font-family-variable-or-installing-a-system-font.md)). The new `Components/Kbd/xs` style is regular weight at 12 px with the tight line height (115%), size and weight bound to variables and the family not.
- **Glyphs.** `⌘`, `⇧`, `⌥`, `⌃` and `↵` render in the file.

## Differences from the code

See `deviations` in the map: the single component, `keys` as a composition, the stand-in font, the shadow, and the weight.

## Not drawn

A combination as a property, a longer chord and the platform choice. Each has a recipe in the spec frame.

## Review

2026-11-26: reviewed, no findings. Checked on the component: the `bg/surface` fill, the 1 px `border/default` inside stroke counting in the layout, the padding and radius variables, the drop shadow (0, 2 px, no blur, no spread) with its colour bound to `border/neutral`, the `Components/Kbd/xs` style (Roboto Mono Regular, 115% line height, size and weight bound, family unbound), the `text/secondary` fill, the `key` property reference and the size against the text plus padding and edge (40 by 24 px for "Esc"); the one property and its default against the map, the description and documentation link, the section fill, the spec frame (the 5 instances of the component, both chords with the `space/1` gap and the plus in the Kbd style, the links, `6 of 7 props in code`, the token rows equal to the 10 variables the component and its style bind) and the Components row. Contrast was measured from the variables in the four themes. Not checked: a dark-theme render, and Code Connect, mapped by path and name (`packages/components/src/atoms/Kbd/Kbd.tsx`, `Kbd`) and read back on the component. Approved by the maintainer 2026-11-26.
