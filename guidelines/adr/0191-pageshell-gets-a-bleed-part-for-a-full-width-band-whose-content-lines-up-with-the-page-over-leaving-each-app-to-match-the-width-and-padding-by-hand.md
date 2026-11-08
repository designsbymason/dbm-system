# 0191 — `PageShell` gets a `Bleed` part for a full-width band whose content lines up with the page, over leaving each app to match the width and padding by hand

**Status:** Accepted · **Date:** 2026-11-08

## Context
`PageShell.Main` is as wide as the window and `PageShell.Content` is a width-limited box inside it, so a section written beside `Content` runs edge to edge. It does not line up with the page unless its author matches `Content`'s width and padding by hand, and a background colour is a hardcoded value in every app. A band (a hero, a call to action, a strip of figures) is common enough that the repetition is real.

## Decision
- **`PageShell.Bleed`** is a `<section>` as wide as `Main`, holding its children in a box with `Content`'s `width`, `size` and `paddingInline` (a `Container`), so the text lines up with the rest of the page. `paddingBlock` is on the spacing scale (default `8`). `tone` is `default` (no fill) or `canvas` (`bg.canvas`, the page's own alternate surface; `text.primary` and `text.secondary` pass AA on it, `text.tertiary` does not, which the Docs say). A `section` is a `region` landmark only when named, so `aria-label` and `aria-labelledby` are redeclared and the Docs say to name one that matters.
- **A band whose content must also run edge to edge** is still a plain element beside `Content`: `Bleed` is for the aligned case.
- **No new token and no new component:** `Container`, `bg.canvas` and the spacing scale. Further tones need their own contrast check and are not offered.

## Alternatives considered
- **Only a Docs recipe.** Rejected: the alignment and the colour are what every app gets slightly wrong.
- **A `bleed` prop on `Content`.** Rejected: `Content` is the width-limited box; a box that is not width-limited is a different part.
- **The `100vw` negative-margin trick inside `Content`.** Rejected: `100vw` includes the scrollbar and makes the page scroll sideways.
- **More tones now.** Rejected: each needs a contrast check against the text tokens.

## Consequences
- Additive: an app that does not use it sees no change; `PageShell` stays Finalized, with its own scoped checks.

## Related
ADR-0190; `component-reviews/PageShell.md`.
