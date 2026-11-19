# 0236 — The Figma variables are four collections, Primitives, Semantic with four theme modes, Component and Viewport, over one collection or a collection per theme

**Status:** Accepted · **Date:** 2026-11-19

## Context
The tokens have three layers (`03`): primitives, one semantic file per theme (brand by mode) and component tokens. Figma variables have collections and modes, and cannot hold `clamp()`, `calc()` or shorthand shadows.

## Decision
- **Primitives:** one mode. **Semantic:** purple-light, purple-dark, emerald-light and emerald-dark, each variable aliasing a primitive, with the theme files' names. **Component:** one mode, the 35 component token files. **Viewport:** mobile, tablet and desktop, holding the fluid type and spacing steps as fixed values.
- Variables are named by their token path with slashes (`color/bg/brand`), carry the token's description, and have scopes set so a colour cannot be applied to a spacing field.
- Shadows are effect styles, bound to colour variables where Figma allows. Motion has no Figma home as a value and is documented on a Foundations page.

## Alternatives considered
- **One collection with every token.** Loses the layering that lets a theme change without touching components. Rejected.
- **A collection per theme.** Needs four copies of every semantic name and cannot switch a frame's theme by mode. Rejected.
- **Brand and mode as two collections.** A semantic alias cannot depend on two modes together, so it would not mirror the theme files. Rejected.

## Consequences
- A frame can switch theme with one mode setting, and the structure matches the repository's.
- The fluid type is approximated by steps, not computed.
- Adding a theme adds a mode, within the plan's limit.

## Related
`guidelines/figma/01-plan.md` §5. `03-token-system-spec.md`.
