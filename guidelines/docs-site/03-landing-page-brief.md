# Docs website — landing page brief

The brief for `https://dbm-system.com/`. It is built from this document and tightened in review rounds against the running page. Structure and dependencies are in [02-structure.md](./02-structure.md); the motion library and its licence are in [ADR-0173](../adr/0173-the-docs-apps-dependencies-are-each-justified-in-a-list-and-the-landing-page-may-use-gsap-over-holding-it-to-the-packages-budget-or-leaving-it-unrestricted.md).

## 1. What the page is for

A first visit should answer in a few seconds: **what DBM System is, why it is different, and how to start.** It should feel premium, calm and precise: the system's own craft on show, not a template. It is a front door to the docs, not the docs.

**Audience:** a front-end developer or a team choosing a component library, and a person directing an AI coding agent. Both should leave with a clear next step.

## 2. What is true, and must stay true

The page says only what the repository supports (`01-vision-and-goals.md`):

- A React component library for accessible web and enterprise applications.
- Built on design tokens: two brands (Purple and Emerald), each in light and dark.
- Very few dependencies: Radix UI primitives for interaction and Phosphor for icons.
- Built to be read by people and agents: full types, a snippet for each example, a planned manifest.
- WCAG 2.2 AA is the **target**; the known exceptions are on the accessibility statement and the page links to it.
- **Not yet published to npm.** Install steps, the manifest, `llms.txt` and `AGENTS.md` are shown as "in active development, not yet published", never as available.

No invented metrics, testimonials, logos, download counts or comparisons. No other design system is named anywhere in the repository or its output.

## 3. Sections, in order

| # | Section | What it does |
|---|---|---|
| 1 | **Hero** | The pitch in one sentence and a sentence of support; an install snippet that says it is not published yet; calls to action to Get started, Components and Storybook. A quiet, high-quality visual built from real DBM components and tokens. |
| 2 | **Live component showcase** | Real components on the page, in a composed, designed arrangement (a form, a data table, a toast, a command palette), themed by the reader's mode. Interactive, not screenshots. |
| 3 | **Theming and accessibility** | The token story: one semantic layer, four themes, no component changes. The accessibility claim with the known exceptions, linked. A demonstration of the brands (see [05-open-items.md](./05-open-items.md)). |
| 4 | **Built for agents** | The manifest, `llms.txt` and `AGENTS.md`, each labelled in development. Why an agent-legible system matters. |
| 5 | **Where to next** | Docs, Components, Templates, Storybook, GitHub. A calm closing call to action. |
| 6 | **Footer** | Navigation, the licence (MIT), the repository, Issues, the accessibility statement. |

## 4. Look and feel

- **Built with DBM components and tokens.** No hardcoded colour, spacing, type size, radius, shadow or duration; use semantic tokens. Where the system lacks something the page needs, add the token or the component, not a one-off value.
- **Creative, confident layouts**: generous space, a strong typographic hierarchy (Nunito for the interface, Lora for editorial moments), considered asymmetry, and surfaces that use the shadow and radius scales. Premium comes from restraint and precision, not decoration.
- **Parity in dark mode**: designed for light and dark from the start, not inverted afterwards.
- **Responsive** across the whole breakpoint scale: phone first, then up. The phone experience is a real design, not a shrunk desktop.
- **Voice:** plain, confident, specific. Short sentences. No hype words.

## 5. Motion and micro-interactions

GSAP with ScrollTrigger for scroll-driven choreography, loaded only on this page and kept out of the shared code. The DBM motion tokens (durations and easing) drive everything that does not need GSAP. Examples of what belongs here:

- A staged entrance for the hero that settles into the layout.
- Scroll-linked reveals and parallax on the showcase, where the movement explains the layout.
- The showcase's components responding to the pointer and the keyboard as they do in the library.
- A smooth mode change: surfaces cross-fade when the reader switches light and dark.
- Considered hover, focus and press states on every interactive element.

**Rules (the ones that are non-negotiable):**

1. **Reduced motion gives a static, complete page.** With `prefers-reduced-motion: reduce` nothing animates, and every piece of content and every control is present and usable.
2. **Content is in the HTML before any script runs.** Animation enhances a page that already works; nothing is hidden until JavaScript reveals it.

**Recommended, not adopted as requirements** ([05-open-items.md](./05-open-items.md)): no scroll-jacking (the page scrolls natively), a script and weight budget, and lighter effects on phones. They are reviewed by hand each round, because nothing in CI enforces them.

## 6. Accessibility of the page itself

The landing page meets the same bar as the system: WCAG 2.2 AA contrast in both modes (including text over any animated or layered surface), a visible focus ring, a logical heading order and landmarks, keyboard operation of every control, and a name for every icon-only button. The accessibility scan in CI covers it (`02-structure.md` §9).

## 7. How the page is built and reviewed

1. This brief is agreed, then the page is built section by section from real DBM components.
2. Each round is reviewed in the running page: desktop, tablet and phone widths; light and dark; reduced motion on; keyboard only; and a throttled CPU for the motion.
3. Changes are tightened round by round until the maintainer calls it done.

## 8. Open design questions

The hero's visual concept, the page's length, and the demonstration of the brands are decided in the first review round, not here.
