# 0192 — `PageShell.Content` gets a `bleed` prop and an `as` prop and `PageShell.Bleed` is removed, over a separate part or a single `type` prop

**Status:** Accepted · **Date:** 2026-11-08 · **Supersedes:** [0191](./0191-pageshell-gets-a-bleed-part-for-a-full-width-band-whose-content-lines-up-with-the-page-over-leaving-each-app-to-match-the-width-and-padding-by-hand.md)

## Context
ADR-0191 added `PageShell.Bleed`, a full-width band whose content lines up with the page. Beside `PageShell.Content` and a plain element that runs edge to edge, that made three ways to write a section of a page. The three are two independent choices: how wide the content is (`Content`'s `width` and `size`, where `width="full"` is already a section with no width limit) and whether the band behind it runs edge to edge (the only thing `Bleed` added). A fill is the app's own, set with a token in `style`.

## Decision
- **`PageShell.Content` gets `bleed`** (boolean, default `false`): the element is a band as wide as `PageShell.Main`, holding its children in a `Container` with `Content`'s `width`, `size` and `paddingInline`, so they line up with the rest of the page; `paddingBlock` is the band's. Without it nothing `Content` draws changes.
- **`as`** (`div` by default, or `section`), with `aria-label` and `aria-labelledby` redeclared: a `section` is a `region` landmark only when it is named.
- **In bleed mode `className`, `style`, `id`, the native props and the `ref` are on the band,** so an app tints it with a token (`style={{ background: "var(--dbm-bg-canvas)" }}`). There is no fill prop (a behaviour prop is not a colour, and a token in `style` follows the theme); the Docs say `text.tertiary` does not pass AA on that fill.
- **`PageShell.Bleed` is removed** (it was never published).
- **No new token and no new component.**

## Alternatives considered
- **A separate `Bleed` part** (ADR-0191). Rejected: a second part for what is one prop of `Content`.
- **A single `type` (`contained`, `fluid`, `bleed`).** Rejected: it overlaps `width="full"` and cannot say a band with full-width content.
- **A `background` or `tone` prop.** Rejected: not a behaviour, and `tone` means a colour family here.

## Consequences
- Additive for `Content`; `PageShell` stays Finalized.

## Related
ADR-0190, ADR-0191; `component-reviews/PageShell.md`.
