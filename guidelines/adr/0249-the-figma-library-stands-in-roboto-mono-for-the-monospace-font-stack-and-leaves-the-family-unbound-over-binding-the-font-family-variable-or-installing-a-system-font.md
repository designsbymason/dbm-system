# 0249 — The Figma library stands in Roboto Mono for the monospace font stack and leaves the family unbound, over binding the font-family variable or installing a system font

**Status:** Accepted · **Date:** 2026-11-26

## Context
The `font-family-mono` token is a system font stack, `ui-monospace`, `SFMono-Regular`, `Menlo`, `Consolas`, `Liberation Mono`, then `monospace`, so that `Code`, `Kbd` and `CodeBlock` load no extra font ([03-token-system-spec.md](../03-token-system-spec.md)). None of those fonts is available to the Figma file, and a text style's family can be bound only to a variable that holds a font Figma has. The `font-family/mono` variable holds `ui-monospace`, so it cannot be bound, and the mono text styles need some real font.

## Decision
The mono text styles (`Components/Code/*` now, `Kbd` and `CodeBlock` later) use **Roboto Mono**, which is open source (SIL Open Font License 1.1), is available in the file, has the Regular, Medium, SemiBold and Bold weights and the same 0.6 em character width as the system fonts. Their size and weight stay bound to the Viewport and Primitives variables; their **family is not bound**, and `scripts/figma-sync.mjs` marks the mono family as unbound (the `mono` entry of `FAMILY_NAME`). The spec frames and the map's `deviations` say the font is a stand-in. The code is unchanged: it keeps the system stack, and no font is shipped.

## Alternatives considered
- **Bind the family variable.** Rejected: its value is not a font Figma has, so the binding would fail or point at a missing font.
- **Change `font-family/mono` to a real font name.** Rejected: the variable is the token's own value, and the code's stack is the source of truth ([ADR-0233](./0233-the-figma-library-is-written-from-the-built-tokens-by-a-one-way-script-over-the-tokens-studio-plugin-or-typing-the-variables-by-hand.md)).
- **JetBrains Mono or Source Code Pro** (also open source). Not chosen: Roboto Mono's width matches the system fonts, and any of them is replaced the same way.

## Consequences
- The file has 62 text styles, four of them `Components/Code/*`.
- A user who wants another monospace font changes the family in those styles, which the spec frame says.
- The measured height of a mono chip differs by a pixel or two from the browser's, because the stand-in's metrics are not the system font's.

## Related
[ADR-0233](./0233-the-figma-library-is-written-from-the-built-tokens-by-a-one-way-script-over-the-tokens-studio-plugin-or-typing-the-variables-by-hand.md), [01-plan.md](../figma/01-plan.md) §5, [Code.md](../figma/components/Code.md).
