# 0173 — The docs app's dependencies are each justified in a list, and the landing page may use GSAP, over holding it to the packages' budget or leaving it unrestricted

**Status:** Accepted · **Date:** 2026-11-03

## Context
The published packages carry a runtime-dependency budget (Radix UI Primitives and Phosphor Icons) and no animation library ([ADR-0140](./0140-the-design-system-takes-no-animation-library-and-animates-with-css-and-the-motion-tokens-over-keeping-motion-as-an-optional-peer-dependency.md)), and the project uses free and open-source tooling only. The docs website is an app, not a package, and it needs a framework, MDX, search and, for a premium landing page with scroll-driven choreography, a motion library. ADR-0140 already lets the docs site choose its own.

## Decision
- **`apps/docs` is outside the packages' runtime budget** because it is never published, but **every dependency is listed in `guidelines/docs-site/02-structure.md` with its reason and licence**, and one that is not listed needs a new ADR.
- **The approved set at the start:** Astro with `@astrojs/react` and `@astrojs/mdx`, React and ReactDOM, the workspace `@dbm-system/*` packages, Pagefind, and GSAP with its ScrollTrigger plugin, plus open-source link-check and accessibility-scan tooling for CI.
- **GSAP is an exception to "free and open-source only".** As I understand it, it is free of charge, including commercially, under its own licence, which is not an OSI-approved open-source licence. The terms must be re-read before the first release, and the landing page keeps working, without motion, if it is ever removed.
- **Motion rules for the landing page:** it respects `prefers-reduced-motion` by showing a static, complete page, and all content is in the HTML before any script runs. Other guardrails (a script and weight budget, a lighter phone experience, no scroll-jacking) are recommended in the brief but not adopted as requirements.
- The docs website's reader controls are light, dark and system mode on one brand, Purple.

## Alternatives considered
- **Hold the docs app to the packages' budget.** Rejected: it would rule out most of what a site needs.
- **No restrictions on the docs app.** Rejected: the list would grow unreviewed and the free and open-source rule would be applied nowhere.
- **Motion (MIT) with CSS scroll-driven animation.** Fully open source and lighter, a little less control over complex timelines. It is the fallback if GSAP's terms stop fitting.
- **CSS and the motion tokens only.** Zero dependencies, but too limited for scroll choreography.

## Consequences
- The dependency list is part of the docs-site reference and is reviewed with the manual refresh pass (`02` §3.2).
- The GSAP licence is the one recorded exception; the free-and-open-source rule in `CLAUDE.md` applies to everything else.
- Without a script and weight budget, nothing in CI stops the landing page becoming heavy; the brief asks for it to be reviewed by hand.

## Related
`guidelines/docs-site/02-structure.md` (dependency list) and `03-landing-page-brief.md`. [ADR-0170](./0170-the-docs-website-is-an-astro-app-with-react-islands-deployed-with-storybook-as-one-github-pages-site-on-the-apex-of-dbm-system-com.md). `CLAUDE.md` Core principles.
