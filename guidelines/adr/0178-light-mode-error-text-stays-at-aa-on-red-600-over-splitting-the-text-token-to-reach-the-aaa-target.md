# 0178 — Light-mode error text stays at AA on red.600, over splitting the text token to reach the AAA target

**Status:** Accepted · **Date:** 2026-11-04

## Context
[ADR-0002](./0002-aa-contrast-floor-aaa-target-for-error-text.md) makes AAA (7:1) a target for error and critical-alert text and recorded 7.39:1 for light-mode `text.danger` on `bg.surface`. On 2026-08-20 the danger tokens were consolidated onto `red.600`, so that figure became 5.10:1. A measurement of every danger pairing in all four themes (the brands share danger colours) before Phase 8 found that light mode does not meet the target while dark does:

| Pairing | Light | Dark |
|---|---|---|
| `text.danger` on `bg.surface` | 5.10:1 | 7.94:1 |
| `text.danger` on `bg.danger-subtle` | 4.86:1 | 10.32:1 |
| `text.danger` on `bg.danger-subtle-hover` | 4.44:1 | 8.22:1 |
| `text.on-danger` on `bg.danger` | 5.10:1 | 8.22:1 |
| `text.secondary` on `bg.danger-subtle` (Alert body) | 6.56:1 | 13.61:1 |

The 4.44:1 pairing is under the AA floor; components already avoid it (`IconButton`'s labelled destructive toggle keeps its pressed fill under the pointer).

## Decision
Light-mode danger stays on `red.600`. Error text there meets AA, not the AAA target, and that is recorded as a known gap. The AAA target in ADR-0002 is unchanged, and dark mode meets it.

## Alternatives considered
- **Split `text.danger` to `red.700`** (7.39:1), keeping fills and borders on `red.600`. Reaches AAA for text but reverses part of the consolidation and reintroduces a token the system had retired.
- **Move all light danger to `red.700`.** Reaches AAA for text and solid fills, but every danger button and alert gets visibly darker.

## Consequences
- The Accessibility guide's known exceptions list the light-mode error-text figures, and `03-token-system-spec.md` carries the corrected numbers.
- ADR-0002's measured figures are out of date (it carries a marked amendment pointing here).
- It can be reversed by a new ADR that moves the token.

## Related
[ADR-0002](./0002-aa-contrast-floor-aaa-target-for-error-text.md). `03-token-system-spec.md` (danger rows). The Accessibility guide.
