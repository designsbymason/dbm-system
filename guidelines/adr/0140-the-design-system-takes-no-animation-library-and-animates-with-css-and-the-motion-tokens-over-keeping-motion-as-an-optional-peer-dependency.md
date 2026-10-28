# 0140 — The design system takes no animation library and animates with CSS and the motion tokens, over keeping Motion as an optional peer dependency

**Status:** Accepted · **Date:** 2026-10-27

## Context
`02-tech-stack-and-structure.md` listed Motion as an optional peer dependency, "approved, not yet installed": a library to add the first time a component needed an animation CSS could not express. Since then more than a hundred components have been built, and none has needed it. Every animation (an entrance and exit, a fill, a fan of toasts, a collapse, a line scaling in) is a CSS transition or keyframe on the motion tokens, with `prefers-reduced-motion` handled in the stylesheet, and `motion` is in no `package.json` and no lockfile.

## Decision
The published packages (`@dbm-system/*`) take no animation library, as a dependency or an optional peer. Animation is CSS transitions and keyframes driven by the motion tokens (`03-token-system-spec.md`), animating `transform`, `scale` and `opacity` where it can (`06-engineering-standards.md` §4). The standing list of approved dependencies is Radix UI Primitives and Phosphor Icons.

**Scope.** This is about what a consumer installs. `apps/docs` and `apps/storybook` are separate apps that are never published, so their dependencies do not reach a consumer and each decides its own, with the guardrails under Consequences.

## Alternatives considered
- **Keep Motion as an approved, uninstalled optional peer.** Rejected: an approval nothing uses is a promise to consumers and agents that a dependency may appear, and an open door for one component to take it on without a decision.
- **Approve a different animation library.** Rejected for the same reason: there is no component that needs one.

## Consequences
- A component that finds CSS cannot express what it needs raises it, and takes a library only through a new ADR that supersedes this one.
- `CLAUDE.md`, `01-vision-and-goals.md` and `02-tech-stack-and-structure.md` no longer list Motion.
- The Foundations "Motion" page and the `motion.*` tokens are unchanged: they are the CSS duration and easing scale, not the library.
- A documentation site may take an animation library for its own pages, if it is open source (the free-tooling rule still applies), is recorded in a short ADR when chosen, stays confined to the app (no `packages/*` `package.json` lists it and the library never imports from an app), and is not what a live component demo depends on, so a reader who copies the example gets the same behaviour.

## Related
[ADR-0004](./0004-radix-ui-primitives-for-accessibility-logic.md) (which named Motion as the other approved dependency); `03-token-system-spec.md`.
