# Docs website — home page brief

The brief for `https://dbm-system.com/`, the website's one page ([ADR-0220](../adr/0220-the-docs-website-is-the-home-page-only-and-storybook-is-the-documentation-with-a-header-that-links-into-it-and-search-over-its-index-over-docs-pages-on-the-website.md)). It is built from this document and tightened in review rounds against the running page. The header, the design direction and dependencies are in [02-structure.md](./02-structure.md); the motion is [ADR-0222](../adr/0222-the-home-pages-motion-is-expressive-with-motion-allowed-for-pointer-and-spring-interaction-over-the-restrained-motion-of-the-first-direction.md) and the illustrations [ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md).

## 1. What the page is for

A first visit should answer in a few seconds: **what DBM System is, why it is different, and how to start.** It should look professional and of the highest quality, with a character of its own: the system's own craft on show, never a template or a page that looks generated. It is the front door to the documentation in Storybook, not the documentation.

**Audience:** a front-end developer or a team choosing a component library, and a person directing an AI coding agent. Both should leave with a clear next step.

## 2. What is true, and must stay true

The page says only what the repository supports (`01-vision-and-goals.md`):

- **Agentic**: a React component library built for AI coding agents and developers alike, to build web and enterprise applications quickly, consistently and accessibly. The canonical tagline and one-sentence wording are in `01-vision-and-goals.md` §1.
- Built on design tokens: two brands (Purple and Emerald), each in light and dark.
- Very few dependencies: Radix UI primitives for interaction and Phosphor for icons.
- Built to be read by people and agents: full types, a snippet for each example, and a component manifest shipped in the package.
- WCAG 2.2 AA is the **target**; the known exceptions are in the Accessibility guide and the page links to it.
- **Published to npm at `0.1.x`, pre-1.0.** Install steps, the manifest and `AGENTS.md` are available and shown as such; `llms.txt` and an MCP server are labelled "in active development" until they exist, never as available.
- **Every number and list on the page is generated at build** from the manifest, the tokens or the packages, never typed in.

No testimonials, company logos, download counts, comparisons with other libraries or pricing. No other design system is named anywhere in the repository or its output.

## 3. Sections, in order

One story: what it is and why it is different (1–2), the facts (3), the breadth (4), proof that it works (5–6), the way in (7). Every section opens with a Lora headline and one sentence, and every claim is something the reader can try or check.

| # | Section | Content | Interaction and motion |
|---|---|---|---|
| 1 | **Hero** | The tagline, one supporting sentence, the install line (package-manager tabs, copy); the primary action Get started, the secondary All components | A **page of the manual**, drawn in CSS 3D from the tokens: on load it glides down like a feather, in wide swings and slightly bent, showing a specimen of the primitive tokens, and lands with a small bounce and a shadow; the specimen then breaks up and the JSON an agent reads resolves in its place (a real entry from the token index), and a light passes over the sheet. It floats a little at rest, tilts, skews and lifts as the reader scrolls and returns when they scroll back, and on desktop it leans toward the pointer with a highlight that follows it |
| 2 | **Built for agents** | Why an agent works from facts, not guesses: the manifest, `AGENTS.md`, the token index; `llms.txt` labelled in development until S4; a link to the AI agents page | Informational, with nothing typed in that can go out of date (no sizes or counts: the files are named and described) |
| 3 | **Specification** | No visible title. Three cards in a row (stacked on a phone): **What it is** (components, application shells and hooks, counted as the All components section counts them; the themes; the version number alone), **What it needs** (React, the runtime dependencies, MIT) and **How it is built** (that WCAG 2.2 AA is the goal and is checked on every change, worded as a goal and not a guarantee for every element; what ships for agents). Every value is read from the packages at build | Informational: each card has a drawing at its top in shades of the brand colour (an isometric stack of layers, a hub with what it leans on, a key, a focus-ringed button and braces), from the tokens. Each drawing is choreographed and plays each time it scrolls into view, from either direction (the layers land and the parts draw in; the hub's rings grow and its dashes flow; the key is pressed, the focus ring draws itself and the braces write in); reduced motion shows it finished. No links and no interaction |
| 4 | **All components** | Every component and shipped shell from the manifest (the example pages are in Storybook's Templates Index): name, tier, category, one sentence, each linking to its Docs page in Storybook. The same one-line descriptions as Storybook's Components Index, so the two can't drift | A DBM `DataTable` with a search box and tier and category filters; a compact first view with "Show all" |
| 5 | **Change the theme, not the components** | One semantic layer, four themes, not one component changed | Brand and mode controls inside the theme card switch the live composition on the spot (the token theme files re-scoped to the card at build, since `ThemeProvider` themes the whole document), with the token values beside it; on wide screens scrolling also steps through the themes |
| 6 | **Start in three steps** | Install; import the stylesheet and a theme; render a component. Real code, each with a copy button | A package-manager switch; ends on Getting started and All components |
| — | **Footer** | The site footer ([02-structure.md](./02-structure.md) §1) | |

**On a phone** the page does not fall or tilt: the specimen breaks into the JSON once the page scrolls into view, with room above it, the theme card's scroll steps become its controls alone, and each composition is designed for the width, not shrunk.

## 4. Look and feel

The page follows the design direction, "an annotated instrument" ([02-structure.md](./02-structure.md) §3).

- **Professional first.** Aligned to the grid and highly finished; its personality is in the annotation motif, the editorial type and the interactive sections.
- **Built with DBM components and tokens.** No hardcoded colour, spacing, type size, radius, shadow or duration. Where the system lacks something the page needs, the token or component is proposed to the maintainer, never replaced by a one-off value.
- **Illustrations and 3D** ([ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md)): the hero's page of the manual and the section pieces, in the brand's tonal range with the neutrals. No WebGL, no abstract shapes.
- **Parity in dark mode**: designed for light and dark together; a first visit is light ([ADR-0223](../adr/0223-the-sites-mode-is-a-light-and-dark-toggle-that-starts-light-over-light-dark-and-system.md)).
- **Responsive** across the whole breakpoint scale: phone first.
- **Voice:** plain, confident, specific, with a dry precision that suits an instrument. Short sentences. No hype words.

## 5. Motion and micro-interactions

**Expressive** ([ADR-0222](../adr/0222-the-home-pages-motion-is-expressive-with-motion-allowed-for-pointer-and-spring-interaction-over-the-restrained-motion-of-the-first-direction.md)): entrances that assemble each section's composition, pointer response, scroll-driven steps, and micro-interactions on most interactive elements. CSS scroll timelines and View Transitions first; Motion (MIT) for pointer and spring physics, loaded on this page only. The motion tokens set every time-based duration and easing.

**Rules:**

1. **Reduced motion gives a static, complete page.** With `prefers-reduced-motion: reduce` nothing animates, the hero page shows its finished specimen, and every piece of content and every control is present and usable.
2. **Content is in the HTML before any script runs.** Animation enhances a page that already works; nothing is hidden until JavaScript reveals it.
3. **No scroll-jacking.** Scroll speed and direction stay the reader's; pinned sections are short and can be scrolled past at any speed.
4. **A browser without scroll timelines gets the static page.** Every scroll animation sits inside `@supports (animation-timeline: view())`.

No script or weight ceiling was adopted: the page's weight is reported in the build log and judged by hand each round.

## 6. Accessibility of the page itself

The page meets the same bar as the system: WCAG 2.2 AA contrast in both modes (including text over any animated or layered surface), a visible focus ring, a logical heading order and landmarks, keyboard operation of every control (the pointer-driven effects have keyboard or static equivalents), a name for every icon-only button, illustrations either hidden from assistive technology or described, and the hero's picture (a sheet drawn from the tokens, not live components) hidden from assistive technology and inert. The accessibility scan in CI covers it ([02-structure.md](./02-structure.md) §11).

## 7. How the page is built and reviewed

1. Built section by section in S3, after the header and Storybook's pages exist ([01-plan.md](./01-plan.md) §3).
2. Each round is reviewed in the running page: desktop, tablet and phone widths; light and dark; reduced motion on; keyboard only; a throttled CPU for the motion; a browser without scroll timelines; and the avoid list in [02-structure.md](./02-structure.md) §3.
3. Changes are tightened round by round until the maintainer calls it done.
