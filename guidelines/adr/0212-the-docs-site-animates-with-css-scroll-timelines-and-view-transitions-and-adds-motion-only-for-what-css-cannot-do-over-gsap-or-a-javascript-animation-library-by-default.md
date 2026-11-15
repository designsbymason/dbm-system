# 0212 — The docs site animates with CSS scroll timelines and View Transitions, and adds Motion only for what CSS cannot do, over GSAP or a JavaScript animation library by default

**Status:** Accepted · **Date:** 2026-11-15 · Supersedes the GSAP part of [ADR-0173](./0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md)

## Context
The docs website must feel premium and alive: motion, micro-interactions and, above all, scroll-driven choreography on the landing page and quiet scroll reveals elsewhere. [ADR-0173](./0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md) allowed GSAP with ScrollTrigger on the landing page as the project's one exception to free and open-source tooling, with Motion (MIT) and CSS as the fallback.

Reading GSAP's licence again (the GSAP Standard "No Charge" License, owned by Webflow, last updated 2025-05-30): use on any website is allowed, commercial use and every plugin included, but the licence is not open source, does not address redistribution, can be changed by Webflow at any time and can be ended for non-compliance. GSAP must never be shipped in the published packages ([ADR-0140](./0140-the-design-system-takes-no-animation-library-and-animates-with-css-and-the-motion-tokens-over-keeping-motion-as-an-optional-peer-dependency.md)).

Meanwhile CSS scroll-driven animations (`animation-timeline: scroll()` and `view()`) became supported in Chrome, Safari and, from Firefox 159, Firefox (Baseline newly available, October 2026), and cross-document View Transitions animate navigation without a client router.

## Decision
- **No GSAP**, on the docs site or anywhere in the repository.
- **CSS is the default for every animation on the site**, in three layers:
  - **Micro-interactions** (hover, press, focus, copy feedback, entrances): CSS transitions on the motion tokens (`duration.*`, `easing.*`, `scale.*`), most already in the DBM components.
  - **Page transitions**: cross-document View Transitions (`@view-transition { navigation: auto }`) between site pages and between the site and Storybook, and a view transition for the light and dark change. No client router.
  - **Scroll-driven**: CSS scroll timelines. Docs pages use quiet, once-only reveals and a reading-progress line; the landing page uses sticky sections with scrubbed timelines, named ranges, SVG stroke drawing, build-time split text, and custom properties registered with `@property` driving token values.
- **Motion (MIT) is added only for a named interaction CSS cannot express** (pointer-following or spring-driven motion, a sequence tied to application state), agreed in a landing-page review round. It is then listed in `docs-site/02-structure.md` §10 and loads only on the page that needs it, as an island.
- **Rules for all site motion:**
  1. With `prefers-reduced-motion: reduce` the page is static and complete.
  2. Content is in the HTML before any script runs.
  3. **No scroll-jacking**: scroll speed and direction stay the reader's; pinned sections are short and can be scrolled past at any speed.
  4. Time-based motion uses the motion tokens' durations and easings.
  5. On docs pages nothing animates while the reader reads: reveals run once, on entry, and never loop.
  6. Every scroll animation sits inside `@supports (animation-timeline: view())`; a browser without it gets the static page, not a JavaScript fallback.
- **No animation library in `packages/*`**, enforced by a lint rule that forbids importing `gsap`, `motion` and similar there.

## Alternatives considered
- **Keep GSAP for the landing page** (ADR-0173). The most mature scroll choreography, but the only non-open-source dependency, on terms its owner can change, for effects CSS now covers.
- **Motion for all scroll work.** Open source and capable, but it is script on every page for what the browser does natively and off the main thread.
- **CSS only, with no library ever.** Simplest, but it would rule out pointer- and spring-driven interaction in the showcase if a review round wants it.
- **A JavaScript fallback for browsers without scroll timelines.** More code for a shrinking set of browsers that already get a complete static page.

## Consequences
- The site has no non-open-source dependency; ADR-0173's exception is gone, and its rule that every docs dependency is listed and justified still stands.
- Scroll choreography is written by hand in CSS, and shape morphing is avoided by design (illustrations assemble and draw instead, [ADR-0217](./0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md)).
- Older browsers see the static page; the reduced-motion review covers what they see.
- Browser support for scroll timelines is confirmed against MDN's compatibility data when the site's foundation is built.

## Related
`guidelines/docs-site/01-plan.md`, `02-structure.md` §5 and §10, `03-landing-page-brief.md` §5. [ADR-0140](./0140-the-design-system-takes-no-animation-library-and-animates-with-css-and-the-motion-tokens-over-keeping-motion-as-an-optional-peer-dependency.md), [ADR-0173](./0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md), [ADR-0214](./0214-storybook-keeps-its-own-interface-and-is-bridged-to-the-docs-site-by-a-shared-mode-shared-fonts-view-transitions-and-links-both-ways-over-an-iframe-workshop-page-or-an-injected-header.md).
