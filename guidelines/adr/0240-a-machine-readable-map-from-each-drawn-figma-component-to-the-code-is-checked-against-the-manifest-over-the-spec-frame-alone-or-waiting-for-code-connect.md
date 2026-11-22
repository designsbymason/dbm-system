# 0240 — A machine-readable map from each drawn Figma component to the code is checked against the manifest, over the spec frame alone or waiting for Code Connect

**Status:** Accepted · **Date:** 2026-11-22

## Context
A Figma component's properties and values are not always the code's: `rounded` is a variant, `dot` is a value of `variant`, `filled` has no prop, a hover is a state with no prop, and a width is a drawing choice (`guidelines/figma/05-deviations.md`). One agent designs from the library and another builds the code from the design, so any difference that only a person can resolve becomes a place they drift apart. Each spec frame has a Properties table that maps the properties to code props, but it is text inside the Figma file, written by hand, and nothing checks it against the code. Figma's own Code Connect is the native way to link a component to code, but it is deferred (plan §8), and whether the plan the file is on supports it is not established.

## Decision
`guidelines/figma/component-map.json` maps each drawn component. For each Figma property it gives the kind (variant, boolean or text), the default, and for each value the code props it means (`"props": {}` for a CSS state with no prop, `"<provided>"` for something the app supplies). It lists the code props that are not modelled, the differences from the code and the component's state (`drawn`, `reviewed`, `approved`; only the maintainer sets `approved`). It holds no file key, address or node id, so it is safe in a public repository, and components are found by name.

`scripts/check-figma-map.mjs` (`pnpm check-figma-map`) checks it against the built manifest and the source, and CI runs it on every push: each mapped prop exists, each literal value is one the type allows, defaults agree, every manifest prop is mapped or named as not modelled, the Storybook id and the tier and category are the code's, and each component has a decisions file. It also generates the status table in `guidelines/figma/components/README.md`. `guidelines/figma/03-agent-guide.md` tells both agents to use the map; the spec frame stays as the human view.

## Alternatives considered
- **The spec frame alone.** Rejected: it is not machine-readable, is not checked, and an agent that cannot read the Figma file's text has nothing.
- **Code Connect now.** Rejected for now: it needs setup per component, and its plan requirement is unconfirmed. The map does not block it; it can be generated from the same data later.
- **Naming Figma properties exactly as the code's props and values.** Rejected: Figma cannot hold some of them (a boolean that changes the radius), and a clean design file needs others (`filled`).
- **Putting the map in the component manifest.** Rejected: the manifest is the code's own and ships in the published package; the Figma file is a separate deliverable.

## Consequences
- A change to a component's props can fail CI until the map is updated, which is the intent.
- A new drawn component adds an entry, a decisions file and a status row in the same change.
- The map is the source for any future Code Connect mappings and for an MCP tool that serves it.
- `approved` stays a human act.

## Related
`guidelines/figma/03-agent-guide.md`, `guidelines/figma/05-deviations.md`, `guidelines/figma/06-maintenance.md`, `guidelines/figma/components/README.md`, [ADR-0237](./0237-a-component-set-draws-the-full-matrix-of-valid-variants-and-states-over-splitting-by-dimension-or-drawing-states-for-one-size.md) and [ADR-0238](./0238-an-icon-set-has-a-tone-variant-over-a-contextual-colour-collection-an-overridden-fill-or-a-mask.md).
