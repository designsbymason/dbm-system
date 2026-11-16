# 0222 — The home page's motion is expressive, with Motion allowed for pointer and spring interaction, over the restrained motion of the first direction

**Status:** Accepted · **Date:** 2026-11-16 · Supersedes in part [ADR-0212](./0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md) (when Motion may be added)

## Context
The approved design direction asked for restrained motion: a few signature moments and otherwise motion that answers the reader. [ADR-0212](./0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md) made CSS the default and allowed Motion (MIT) only for a named interaction a landing review round agreed CSS could not do. With the website now the home page alone ([ADR-0220](./0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md)), it carries the whole first impression, and the maintainer wants more animation and micro-interaction, with most sections interactive.

## Decision
- **The home page's motion is expressive:** entrances that assemble its compositions, pointer response (the hero's stack tilts, layers lift on hover), scroll-driven steps, and micro-interactions on most interactive elements.
- **Motion (MIT) may be used on the home page** for pointer- and spring-driven interaction CSS cannot express, loaded only there; CSS scroll timelines and View Transitions stay the default for everything else.
- **Unchanged rules:** reduced motion gives a static, complete page; content is in the HTML before any script; no scroll-jacking; time-based motion uses the motion tokens.
- **Storybook stays calm:** no added motion in its docs pages.

## Alternatives considered
- **Keep the restrained direction.** Calmer, but under-uses the one page the site now has.
- **Expressive, CSS only.** No dependency, but no spring or pointer physics.

## Consequences
- Motion becomes a listed dependency of `apps/docs` (`docs-site/02-structure.md` §10) when first used.
- The home page's weight is still reviewed by hand each round; reduced motion and keyboard reviews matter more.

## Related
`guidelines/docs-site/02-structure.md` §5, `03-landing-page-brief.md`.
