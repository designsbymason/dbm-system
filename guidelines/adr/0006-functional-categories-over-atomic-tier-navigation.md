# 0006 — Organize the component inventory (docs site, Storybook sidebar, manifest grouping) by functional category, not atomic-design tier

**Status:** Accepted, partly superseded by [0225](./0225-storybooks-sidebar-lists-every-component-alphabetically-in-one-group-and-a-catalog-holds-tier-and-category-over-tier-and-category-groups-in-the-story-title.md) (Storybook's sidebar is one alphabetical group; the categories stand as metadata, in the manifest and the Index table) · **Date:** 2026-07-18

## Context
This system uses atomic design (atoms → molecules → organisms → templates) as its internal composition hierarchy — how components are built from each other (`CLAUDE.md`'s own core principle). That's a separate question from how ~104 planned components should be *navigated* by a consumer — a human developer or, per this project's own "agent-legible is a design constraint, not a feature flag" principle (`01-vision-and-goals.md` §8), an AI coding agent — browsing the docs site, the Storybook sidebar, or the future JSON component manifest.

## Decision
Organize the component inventory into **9 functional categories** — Layout, Typography, Inputs & Forms, Data Display, Navigation, Feedback, Overlay & Disclosure, Media, Utility — as the primary navigation/documentation axis. Atomic-design tier is still tracked, but as **metadata per component**, not a navigation axis.

## Alternatives considered
Navigating by atomic tier directly (a top-level "Atoms" section holding every atom regardless of purpose, then "Molecules," then "Organisms") — rejected. A consumer reasoning from a task ("I need to build a login form") thinks in terms of *purpose*, not *construction complexity* — nobody searches for "an atom." This is empirically what several comparable production component libraries' own docs sites already converge on independently, despite using similar atomic-style composition internally — real, convergent industry evidence, not an idiosyncratic choice. The case is if anything stronger here than for those: an agent reasoning from a natural-language task maps far more directly onto a functional category (`Inputs & Forms`) than onto a construction-hierarchy label a task description never mentions.

## Consequences
- Tier isn't lost — it's exactly what `04-component-inventory.md`'s own "Sequencing recommendation" section uses to decide build order (atoms before the molecules/organisms that consume them). That's the one place tier genuinely matters, and it still has it — this is a real hybrid, not a trade-off where something was given up.
- Some components don't cleanly belong to one category (`Pagination` is both data-bound and a wayfinding control) — handled by deliberate cross-listing in both relevant category tables, rather than forcing an arbitrary single home or leaving the ambiguity unaddressed.
- Categories are uneven in size (`Inputs & Forms` has 30+ components, `Media` has 5) — an accepted, expected consequence of real domain complexity, not a categorization flaw.

## Related
`04-component-inventory.md` — the 9 category tables and the "Sequencing recommendation" section this decision produced. `01-vision-and-goals.md` §8 — the agent-legibility principle this decision serves.
