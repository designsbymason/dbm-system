# Docs website — landing page brief

The brief for `https://dbm-system.com/`. It is built from this document and tightened in review rounds against the running page. Structure, the site-wide design direction and dependencies are in [02-structure.md](./02-structure.md); the motion system is [ADR-0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md) and the illustrations [ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md).

## 1. What the page is for

A first visit should answer in a few seconds: **what DBM System is, why it is different, and how to start.** It should look professional and of the highest quality, with a character of its own: the system's own craft on show, never a template or a page that looks generated. It is a front door to the docs, not the docs.

**Audience:** a front-end developer or a team choosing a component library, and a person directing an AI coding agent. Both should leave with a clear next step.

## 2. What is true, and must stay true

The page says only what the repository supports (`01-vision-and-goals.md`):

- **Agentic**: a React component library built for AI coding agents and developers alike, to build web and enterprise applications quickly, consistently and accessibly. The canonical tagline and one-sentence wording are in `01-vision-and-goals.md` §1.
- Built on design tokens: two brands (Purple and Emerald), each in light and dark.
- Very few dependencies: Radix UI primitives for interaction and Phosphor for icons.
- Built to be read by people and agents: full types, a snippet for each example, and a component manifest shipped in the package.
- WCAG 2.2 AA is the **target**; the known exceptions are on the accessibility statement and the page links to it.
- **Published to npm at `0.1.x`, pre-1.0.** Install steps, the manifest and `AGENTS.md` are available and shown as such; `llms.txt` and an MCP server are labelled "in active development" until they exist, never as available.
- **Every number on the page is generated at build** from the manifest, the tokens or the packages, never typed in.

No testimonials, company logos, download counts, comparisons with other libraries or pricing. No other design system is named anywhere in the repository or its output.

## 3. Sections, in order

The page is one story told by scrolling. Every section opens the same way: a numbered label in mono ("01 — Tokens"), a Lora headline and one sentence, and makes one idea.

| # | Section | Content | Visual and motion |
|---|---|---|---|
| — | **Release banner** | One line: the current version is on npm, with a link to the Changelog. Dismissible | `PageShell.Banner` |
| 1 | **Hero** | The tagline, "The agentic component library for people and the AI agents that build with them.", one supporting sentence, the install line with package-manager tabs and a copy button; the primary action Get started, the secondary Browse components, a text link to Storybook | A **CSS 3D stack of live components**: tokens, then components, then an application screen, slightly separated, with two or three dimension annotations (`space.6`, `radius.md`). It flattens as the reader scrolls into section 3 |
| 2 | **Facts** | True figures generated at build: the number of components and hooks, two brands in two modes, two runtime dependencies, the WCAG 2.2 AA target, MIT, the current version | Static: one hairline row. It does the work logos and testimonials usually do, without inventing anything |
| 3 | **From token to interface** | One semantic layer, four themes, no component changes: the system's core idea, shown rather than told | A short pinned section: as the reader scrolls, one token changes and a live form, table and toast re-theme across Purple and Emerald, light and dark (the token theme files re-scoped to a wrapper at build, since `ThemeProvider` themes the whole document), with the token's name and value annotated as they change |
| 4 | **Live showcase** | A realistic slice of an application: a data table with filters, a command palette, a form in a drawer, a toast. Fully usable | The pieces settle into place, then hold still; hovering a component shows its name and tokens, with a link to its page |
| 5 | **Accessible by default** | Keyboard, focus, contrast, names for assistive technology; the claim with its known exceptions, linked to the accessibility statement | As the reader scrolls, a focus ring steps through the showcase in tab order and contrast pairs appear with their real ratios |
| 6 | **Built for agents** | Why an agent-legible system matters; the manifest, `tokens.json` and `AGENTS.md` shown as available, `llms.txt` labelled in development; a link to AI agents | **The Human / Agent split**: a component rendered on one side and, on the other, the manifest JSON an agent reads for it, written out as the section comes into view. A switch flips between the two views on a phone |
| 7 | **Built properly** | Four short annotated points: small on purpose (Radix and Phosphor only), three token layers, responsive and right-to-left, safe for server rendering | A component flips to right-to-left with real Persian text; one component resizes across the breakpoints |
| 8 | **Start in three steps** | Install; import the stylesheet and a theme; render a `Button`. Real code, each with a copy button, and a link to Quick start | Calm and plain |
| 9 | **Where next** | Docs, Components, Templates, Storybook, GitHub | A small isometric illustration on each card |
| — | **Footer** | The site footer ([02-structure.md](./02-structure.md) §1) | |

**On a phone** the 3D stack is shallower and turns less, the pinned section becomes a short scroll-through, and the showcase shows one composition at a time: designed for the phone, not shrunk.

**Length:** nine sections is the starting point. If the first review round finds the page long, sections 7 and 8 fold in first (7 into the facts, 8 into the hero's install line).

## 4. Look and feel

The page follows the site's design direction, "an annotated instrument" ([02-structure.md](./02-structure.md) §3): purple as ink on neutral surfaces, Lora headlines with Nunito and mono notes, editorial asymmetry on a 12-column grid, sparing annotation, restrained motion, and its avoid list.

- **Professional first.** The page is quiet, aligned to the grid and highly finished. Its personality lives in three controlled places: the annotation motif (here in the hero, the token section and on hover in the showcase), the editorial type, and the Human / Agent split.
- **Built with DBM components and tokens.** No hardcoded colour, spacing, type size, radius, shadow or duration. Where the system lacks something the page needs, the token or component is proposed to the maintainer, never replaced by a one-off value.
- **Illustrations and 3D** ([ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-and-css-3d-compositions-drawn-in-code-from-the-tokens-over-commissioned-artwork-webgl-or-raster-images.md)): the hero's CSS 3D stack of live components and an isometric SVG piece per closing card, in the brand's tonal range with the neutrals. No WebGL, no abstract shapes.
- **Parity in dark mode**: designed for light and dark together, not inverted afterwards.
- **Responsive** across the whole breakpoint scale: phone first.
- **Voice:** plain, confident, specific, with a dry precision that suits an instrument. Short sentences. No hype words.

## 5. Motion and micro-interactions

**Restrained**, CSS first ([ADR-0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md)). The page has three signature scroll moments, and everything else is quiet:

1. The hero's 3D stack separating and flattening.
2. The token re-theme in section 3.
3. The focus ring stepping through the showcase in section 5.

Elsewhere: once-only reveals as sections arrive, the agent section's JSON writing out, crisp hover, focus and press states, and the mode change's view transition. The techniques: sticky sections with scrubbed scroll timelines, named view-timeline ranges, SVG stroke drawing, words split at build time, and registered custom properties driving the token values in section 3. Motion (MIT) is added only for an interaction a review round agrees CSS cannot do, and loads only on this page. The motion tokens set every duration and easing.

**Rules:**

1. **Reduced motion gives a static, complete page.** With `prefers-reduced-motion: reduce` nothing animates, the 3D stack shows flat, and every piece of content and every control is present and usable.
2. **Content is in the HTML before any script runs.** Animation enhances a page that already works; nothing is hidden until JavaScript reveals it.
3. **No scroll-jacking.** Scroll speed and direction stay the reader's; pinned sections are short and can be scrolled past at any speed.
4. **A browser without scroll timelines gets the static page.** Every scroll animation sits inside `@supports (animation-timeline: view())`.

No script or weight ceiling was adopted: the page's weight is reported in the build log and judged by hand each round.

## 6. Accessibility of the page itself

The landing page meets the same bar as the system: WCAG 2.2 AA contrast in both modes (including text over any animated or layered surface), a visible focus ring, a logical heading order and landmarks, keyboard operation of every control, a name for every icon-only button, illustrations either hidden from assistive technology or described, and live components in the 3D stack kept out of the tab order until it settles. The accessibility scan in CI covers it ([02-structure.md](./02-structure.md) §11).

## 7. How the page is built and reviewed

1. The design direction and a sample page are approved in M0; the page itself is built section by section after the component pages exist ([01-plan.md](./01-plan.md), M3).
2. Each round is reviewed in the running page: desktop, tablet and phone widths; light and dark; reduced motion on; keyboard only; a throttled CPU for the motion; a browser without scroll timelines; and the avoid list in [02-structure.md](./02-structure.md) §3.
3. Changes are tightened round by round until the maintainer calls it done.
