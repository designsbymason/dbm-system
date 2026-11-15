# 0217 — The docs site's illustrations are geometric SVG and CSS 3D compositions drawn in code from the tokens, over commissioned artwork, WebGL or raster images

**Status:** Accepted · **Date:** 2026-11-15

## Context
The docs site uses graphics and illustrations to make it feel premium and to explain ideas (the token layers, a component's anatomy, how an agent reads the manifest), and the home page wants depth: a 3D view of the system. They must follow light and dark mode, animate on scroll ([ADR-0212](./0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md)), stay accessible, look like this system rather than generic 3D art, and be maintained by one person.

## Decision
- **Style:** geometric and diagrammatic, built from the system's own shapes: the radius scale, the 4 px spacing grid, real component silhouettes, layer stacks, exploded anatomy, isometric views, swatches, dimension lines and flow lines. No characters, stock imagery or abstract floating shapes.
- **Two techniques, both in code:**
  - **Inline SVG** (Astro components) for illustrations and diagrams, including isometric pseudo-3D.
  - **CSS 3D compositions of live components** (`perspective`, `transform-style: preserve-3d`) for real depth, such as the home page's stack of tokens, components and an application, which flattens into the usable showcase as the reader scrolls. They are real DBM components, so they theme, read and work like the rest of the page.
- **Colour:** every colour is a semantic token through a CSS custom property, so one asset serves both modes. The range is the brand's tonal range (the `bg.brand`, `bg.brand-subtle`, `text.brand` and `border.brand` families) with the neutrals. If those give too few tones for convincing depth in both modes, new decorative tokens are proposed to the maintainer before the token layer changes.
- **Motion:** they draw, assemble, separate and flatten on scroll in CSS; they do not morph. With reduced motion they show their final frame, and the 3D compositions show flat.
- **Accessibility:** a decorative illustration is `aria-hidden`; an informative one has a `<title>` and `<desc>`, or its meaning is also in the text. A 3D composition of live components keeps them operable and in a sensible reading order once it settles, and is inert while it is in depth.
- **No WebGL** without a new ADR.

## Alternatives considered
- **Artwork made or commissioned in a design tool.** More painterly, but it needs a second pass to theme, and each change goes back to its author.
- **A mix: diagrams in code, a commissioned hero piece.** Kept open: a later piece can join if it themes the same way.
- **WebGL (for example Three.js).** Real 3D, but a heavy script, battery cost on phones, a new dependency, work to make accessible, and a pull towards the abstract 3D shapes that make a site look generated.
- **Pre-rendered 3D as images or video.** Two renders for the two modes, heavy, and not interactive.
- **Raster images or stock illustration.** No theming, heavier, and generic.

## Consequences
- Illustrations live in the docs app's source and are reviewed with the pages that use them.
- They depend on semantic tokens, so a token change re-colours them with the site.
- A CSS 3D composition is a layout of real components; a change to one of those components shows in it, so it is part of the site's visual check.
- The launch set and the later set are listed in `docs-site/02-structure.md` §6; the home page's pieces are in `03-landing-page-brief.md`.

## Related
`guidelines/docs-site/02-structure.md` §3 and §6, `03-landing-page-brief.md` §3 and §4. `03-token-system-spec.md`.
