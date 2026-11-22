# 0237 — A component set draws the full matrix of valid variants and states, over splitting by dimension or drawing states for one size

**Status:** Accepted · **Date:** 2026-11-22

## Context
A component such as Button has several visual props and several states: 5 variants, 2 tones, 5 sizes and 6 states, so 300 combinations. Figma draws each combination as a variant of one component set. Guidance for building Figma libraries suggests keeping a matrix under about 30 variants and splitting a larger one, so the choice was between splitting and drawing it all.

## Decision
A component set draws **every valid combination** of its variant properties and states in one set. A combination that cannot occur in the code is not drawn. The axes run in the same order in every set (`variant`, `tone`, `size`, `state`, then any others).

## Alternatives considered
- **Split by dimension.** One set for variant, tone and size, with states drawn for one reference size only. Smaller sets and less to maintain, but a state at another size is not drawn, so a designer cannot pick it. Recommended at the time; not chosen.
- **A set per size, each with variant, tone and state.** A middle path, but a component becomes several sets to find and keep in step, and a property such as size cannot be switched on one instance.

## Consequences
- A designer can set any real combination on an instance, and a component is not partly drawn.
- Sets are large (Button is 300 variants), so they are slower to open and to edit, and a change to the component's base is repeated across every variant. The pilot components measure this before more are built, and the rule is revisited through a new ADR if a set is not workable.
- The build and review of each component is heavier, and the property list agreed for a component decides its size, so it is kept to the properties that matter ([figma/02-component-rules.md](../figma/02-component-rules.md) §2).

## Related
`guidelines/figma/02-component-rules.md` §3 and `guidelines/figma/01-plan.md` §6. [ADR-0235](./0235-the-figma-library-is-one-file-with-a-page-per-category-and-one-lean-spec-frame-per-component-over-split-files-pages-per-tier-or-full-documentation-in-figma.md).
