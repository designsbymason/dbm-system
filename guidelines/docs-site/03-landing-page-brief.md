# Docs website — landing page brief

The brief for `https://dbm-system.com/`. It is built from this document and tightened in review rounds against the running page. Structure and dependencies are in [02-structure.md](./02-structure.md); the motion system is [ADR-0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md) and the illustrations [ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-drawn-in-code-from-the-tokens-over-commissioned-artwork-or-raster-images.md).

## 1. What the page is for

A first visit should answer in a few seconds: **what DBM System is, why it is different, and how to start.** It should feel premium, professional, calm and precise: the system's own craft on show, not a template. It is a front door to the docs, not the docs.

**Audience:** a front-end developer or a team choosing a component library, and a person directing an AI coding agent. Both should leave with a clear next step.

## 2. What is true, and must stay true

The page says only what the repository supports (`01-vision-and-goals.md`):

- **Agentic**: a React component library built for AI coding agents and developers alike, to build web and enterprise applications quickly, consistently and accessibly. The canonical tagline and one-sentence wording are in `01-vision-and-goals.md` §1.
- Built on design tokens: two brands (Purple and Emerald), each in light and dark.
- Very few dependencies: Radix UI primitives for interaction and Phosphor for icons.
- Built to be read by people and agents: full types, a snippet for each example, and a component manifest shipped in the package.
- WCAG 2.2 AA is the **target**; the known exceptions are on the accessibility statement and the page links to it.
- **Published to npm at `0.1.x`, pre-1.0.** Install steps, the manifest and `AGENTS.md` are available and shown as such; `llms.txt` and an MCP server are labelled "in active development" until they exist, never as available.

No invented metrics, testimonials, logos, download counts or comparisons. No other design system is named anywhere in the repository or its output.

## 3. Sections and the scroll story, in order

The page is one story told by scrolling. The hero's concept and the page's length are settled in the first review round.

| # | Section | What it does |
|---|---|---|
| 1 | **Hero** | The tagline, "The agentic component library for people and the AI agents that build with them.", and a sentence of support; the real install line with a copy button; calls to action to Get started, Components and Storybook. An illustration of the layer stack (tokens, components, an application) assembles itself as the page settles |
| 2 | **From token to interface** | A short pinned section. As the reader scrolls, one semantic token changes and a live composition (a form, a table, a toast) re-themes across Purple and Emerald, light and dark. The system's core idea, shown rather than told |
| 3 | **Live showcase** | Real components in a composed, designed arrangement (a form, a data table, a command palette, a toast) that drift into place, then are fully interactive and themed by the reader's mode |
| 4 | **Accessible by default** | A focus ring travels the showcase in keyboard order as the reader scrolls; contrast pairs appear with their ratios; the claim with its known exceptions, linked |
| 5 | **Built for agents** | A panel writes out an agent reading the manifest and composing a page; the manifest JSON and the rendered result draw in side by side. The manifest, `tokens.json` and `AGENTS.md` shown as available, `llms.txt` labelled in development, a link to AI agents |
| 6 | **Where to next** | A calm close: Docs, Components, Templates, Storybook, GitHub |
| 7 | **Footer** | The site footer ([02-structure.md](./02-structure.md) §1) |

## 4. Look and feel

- **Built with DBM components and tokens.** No hardcoded colour, spacing, type size, radius, shadow or duration. Where the system lacks something the page needs, the token or component is proposed to the maintainer, never replaced by a one-off value.
- **Creative, confident layouts**: generous space, a strong typographic hierarchy (Nunito for the interface, Lora for editorial moments, the `4xl` to `6xl` steps for display), considered asymmetry, surfaces from the shadow and radius scales. Premium comes from restraint and precision, not decoration.
- **Illustrations**: geometric, diagram-style SVG drawn from the tokens ([ADR-0217](../adr/0217-the-docs-sites-illustrations-are-geometric-svg-drawn-in-code-from-the-tokens-over-commissioned-artwork-or-raster-images.md)): the hero's layer stack and a piece for each section.
- **Parity in dark mode**: designed for light and dark together, not inverted afterwards.
- **Responsive** across the whole breakpoint scale: phone first. The phone experience is a real design, not a shrunk desktop.
- **Voice:** plain, confident, specific. Short sentences. No hype words.

## 5. Motion and micro-interactions

CSS first ([ADR-0212](../adr/0212-the-docs-site-animates-with-css-scroll-timelines-and-view-transitions-and-adds-motion-only-for-what-css-cannot-do-over-gsap-or-a-javascript-animation-library-by-default.md)): sticky sections with scrubbed scroll timelines, named view-timeline ranges, SVG stroke drawing, words split at build time, and registered custom properties driving the token values for section 2. Motion (MIT) is added only for an interaction a review round agrees CSS cannot do (for example a showcase that follows the pointer), and loads only on this page. The DBM motion tokens set every duration and easing.

What belongs here:

- A staged entrance for the hero that settles into the layout.
- Scroll-linked reveals and parallax on the showcase, where the movement explains the layout.
- The showcase's components responding to the pointer and the keyboard as they do in the library.
- A smooth mode change: the view transition from the mode switch.
- Considered hover, focus and press states on every interactive element.

**Rules:**

1. **Reduced motion gives a static, complete page.** With `prefers-reduced-motion: reduce` nothing animates, and every piece of content and every control is present and usable.
2. **Content is in the HTML before any script runs.** Animation enhances a page that already works; nothing is hidden until JavaScript reveals it.
3. **No scroll-jacking.** Scroll speed and direction stay the reader's; pinned sections are short and can be scrolled past at any speed.
4. **A browser without scroll timelines gets the static page.** Every scroll animation sits inside `@supports (animation-timeline: view())`.

No script or weight ceiling was adopted: the page's weight is reported in the build log and judged by hand each round.

## 6. Accessibility of the page itself

The landing page meets the same bar as the system: WCAG 2.2 AA contrast in both modes (including text over any animated or layered surface), a visible focus ring, a logical heading order and landmarks, keyboard operation of every control, a name for every icon-only button, and illustrations either hidden from assistive technology or described. The accessibility scan in CI covers it ([02-structure.md](./02-structure.md) §11).

## 7. How the page is built and reviewed

1. The page is built section by section from real DBM components, after the component pages exist ([01-plan.md](./01-plan.md), M3).
2. Each round is reviewed in the running page: desktop, tablet and phone widths; light and dark; reduced motion on; keyboard only; a throttled CPU for the motion; a browser without scroll timelines.
3. Changes are tightened round by round until the maintainer calls it done.
