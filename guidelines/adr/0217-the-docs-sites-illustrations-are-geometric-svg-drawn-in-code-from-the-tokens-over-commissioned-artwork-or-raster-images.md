# 0217 — The docs site's illustrations are geometric SVG drawn in code from the tokens, over commissioned artwork or raster images

**Status:** Accepted · **Date:** 2026-11-15

## Context
The docs site uses SVG graphics and illustrations to make it feel premium and to explain ideas (the token layers, a component's anatomy, how an agent reads the manifest). They must follow light and dark mode, animate on scroll ([ADR-0212](./0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md)), stay accessible, and be maintained by one person.

## Decision
- **Style:** geometric and diagrammatic, built from the system's own shapes: the radius scale, the 4 px spacing grid, real component silhouettes, layer stacks, exploded anatomy, swatches and flow lines. No characters or stock imagery.
- **Built in code** as inline SVG (Astro components), with every colour a semantic token through a CSS custom property, so one asset serves both modes.
- **Motion:** they draw, assemble and drift on scroll in CSS; they do not morph. With reduced motion they show their final frame.
- **Accessibility:** a decorative illustration is `aria-hidden`; an informative one has a `<title>` and `<desc>`, or its meaning is also in the text.
- **If the semantic tokens give too few tones** for a rich illustration in both modes, new decorative tokens are proposed to the maintainer before the token layer changes.

## Alternatives considered
- **Artwork made or commissioned in a design tool.** More painterly, but it needs a second pass to theme, and each change goes back to its author.
- **A mix: diagrams in code, a commissioned hero piece.** Kept open: a later piece can join if it themes the same way.
- **Raster images or stock illustration.** No theming, heavier, and generic.

## Consequences
- Illustrations live in the docs app's source and are reviewed with the pages that use them.
- They depend on semantic tokens, so a token change re-colours them with the site.
- The launch set and later set are listed in `docs-site/03-landing-page-brief.md` and `02-structure.md`.

## Related
`guidelines/docs-site/02-structure.md` §6, `03-landing-page-brief.md` §4. `03-token-system-spec.md`.
