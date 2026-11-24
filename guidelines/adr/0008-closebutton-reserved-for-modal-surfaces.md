# 0008 — `CloseButton` is reserved for modal-style overlay surfaces; tone-varying components get their own local remove control

**Status:** Accepted · **Date:** 2026-08-27 (established via Tag/CloseButton) · **Amended 2026-11-24** — `CloseButton` now takes a `tone` (`neutral` by default, `brand`, `white`), so it is a fixed-token control, no longer fixed brand; the decision itself is unchanged

## Context
`Tag`'s removable variant originally reused `CloseButton` for its remove affordance. `Tag` needed its remove icon to track the tag's own local tone (red on a `danger` tag, etc.) — a requirement fundamentally incompatible with `CloseButton`'s fixed, brand-styled color (`icon.brand`, matching `IconButton`'s own `tertiary` variant exactly).

## Decision
`CloseButton` stays a fixed-token dismiss control — **reserved for surfaces where a modal-style overlay is involved** (Dialog, Drawer, lightbox, and similar cards/panels presenting over the rest of the page). These are genuinely standalone contexts with no local tone of their own to track, which is exactly what `CloseButton`'s fixed styling is designed for.

*(Amended 2026-11-24: this originally said "a fixed, brand-styled dismiss control", because `CloseButton` was always `icon.brand`. It now has a `tone` of `neutral` (the default), `brand` or `white`, chosen by the caller and never by an ancestor's colour, so the reason it cannot serve `Tag` is unchanged: its colour does not track a surrounding tone.)*

**Any component whose own tone/color varies per instance** (`Tag`; future `Toast`/`Alert`, and any future tone-driven molecule/organism) **implements its own local, self-contained remove/close button** instead, colored via that component's own existing tone-resolution logic. This applies even to components that are visually "standalone" in the sense of floating above other content (`Toast`/`Alert` notifications) — the deciding factor is whether the component has its own varying tone to track, not whether it visually floats.

**Default to the local, component-specific implementation unless `CloseButton` is explicitly requested** — don't reach for `CloseButton` automatically just because a component needs a dismiss affordance; treat it as an opt-in choice for the modal-surface case specifically, not the default building block every removable/dismissible component should reach for first.

## Alternatives considered
Extending `CloseButton` to accept a color/tone override so every removable component (including tone-varying ones like `Tag`) could keep reusing it — rejected. `Tag` was detached and given its own small, locally-implemented, tone-aware remove `<button>` instead (`Tag.module.css`'s `.removeButton`), rather than keep stretching one shared component to serve two fundamentally different coloring needs.

## Consequences
A clear, reusable test for every future dismissible component: does it have its own varying tone to track? If yes, build a local remove control (following `Tag`'s pattern). If no — a genuinely standalone modal-style surface — reach for `CloseButton`.

## Related
`05-component-api-conventions.md` §10. `Tag.tsx`'s non-interactive removable branch, `CloseButton.tsx`.
