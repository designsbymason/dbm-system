# 0237 — A component set draws the full matrix of valid variants and states, over splitting by dimension or drawing states for one size

**Status:** Accepted · **Date:** 2026-11-22 · **Amended 2026-11-22** — a boolean prop that changes the shape is a variant property, and Button is 450 variants; the decision itself is unchanged · **Amended 2026-11-22** — a state is drawn once, at the default size and layout, when size and layout do not change what it does (Card); the decision itself is unchanged

## Context
A component such as Button has several visual props and several states: 5 variants, 2 tones, 5 sizes and 6 states, so 300 combinations. Figma draws each combination as a variant of one component set. Guidance for building Figma libraries suggests keeping a matrix under about 30 variants and splitting a larger one, so the choice was between splitting and drawing it all.

## Decision
A component set draws **every valid combination** of its variant properties and states in one set. A combination that cannot occur in the code is not drawn. The axes run in the same order in every set (`variant`, `tone`, `size`, `state`, then any others).

## Alternatives considered
- **Split by dimension.** One set for variant, tone and size, with states drawn for one reference size only. Smaller sets and less to maintain, but a state at another size is not drawn, so a designer cannot pick it. Recommended at the time; not chosen.
- **A set per size, each with variant, tone and state.** A middle path, but a component becomes several sets to find and keep in step, and a property such as size cannot be switched on one instance.

## Consequences
- A designer can set any real combination on an instance, and a component is not partly drawn.
- Sets are large (Button is 450 variants) *(Amended 2026-11-22: this originally said 300, counting six states and a tone for `destructive`; the built set has five states, `destructive` ignores the tone, and `rounded` is a variant property, because a boolean property can only show or hide a layer and cannot change a corner radius.)*, so they are slower to open and to edit, and a change to the component's base is repeated across every variant. The pilot components measure this before more are built, and the rule is revisited through a new ADR if a set is not workable.
- The build and review of each component is heavier, and the property list agreed for a component decides its size, so it is kept to the properties that matter ([figma/02-component-rules.md](../figma/02-component-rules.md) §2).

*(Amended 2026-11-22: the decision said every combination at every size, including every state. Card, with five states, five layouts, five sizes, four variants and six tones, would be 3,000 variants, so a state that size and layout do not change is drawn once, at the default size and layout, for every variant and tone. Card is 696 variants. This applies only where size and layout change nothing about the state; Button and Input, where they do, still draw every state at every size.)*

## Related
`guidelines/figma/02-component-rules.md` §3 and `guidelines/figma/01-plan.md` §6. [ADR-0235](./0235-the-figma-library-is-one-file-with-a-page-per-category-and-one-lean-spec-frame-per-component-over-split-files-pages-per-tier-or-full-documentation-in-figma.md).
