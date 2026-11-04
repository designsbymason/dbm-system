# 0002 — WCAG AA is the enforced contrast floor everywhere; AAA is a target, not a requirement, for error/critical-alert text only

**Status:** Accepted · **Date:** 2026-07-18 (pairings verified 2026-08-16) · **Amended 2026-11-04** — the measured figures below are out of date; see [0178](./0178-light-mode-error-text-stays-at-aa-on-red-600-over-splitting-the-text-token-to-reach-the-aaa-target.md); the decision itself is unchanged

## Context
`CLAUDE.md` sets WCAG AA as the accessibility floor for every component. Whether to hold any content to the stricter AAA standard (7:1 text contrast, vs. AA's 4.5:1) needed a decision — particularly for error/validation text, the highest-stakes case where a user acting on misread text has the worst consequences.

## Decision
AA (4.5:1 for text) stays the enforced floor across the entire system — no component or token pairing may fall below it. AAA (7:1) is a *target*, not a hard requirement, specifically for error/critical-alert text (form validation errors, destructive-action confirmations).

## Alternatives considered
Requiring AAA as a blanket policy across all text — rejected. WCAG's own conformance guidance explicitly recommends against this ("not possible to satisfy all Level AAA Success Criteria for some content"). Treating AA as sufficient everywhere with no elevated target for error text — rejected in favor of the higher bar for this one case, matching common practice in accessibility-mature government and enterprise design systems, since misread error/destructive-action text carries outsized real-world consequences relative to ordinary body text.

## Consequences
No token change resulted from this decision — AAA was never a hard requirement, only a target — but the actual measured numbers *(Amended 2026-11-04: these were measured before the danger tokens moved to `red.600` on 2026-08-20; the current figures are 5.10:1 light and 7.94:1 dark for `text.danger` on `bg.surface`, in 0178)* (verified 2026-08-16, replacing a previously-unverified "several... already land at or above 7:1" claim) are:

- `text.danger` on `bg.surface` (standalone error text): **7.39:1** light (both brands, `danger` is brand-shared) — clears AAA. **5.67:1** dark — clears AA, short of AAA.
- `text.on-danger` on `bg.danger` (solid destructive fills): **5.10:1** light, **5.22:1** dark — AA-only in both modes, short of AAA in every theme.

Still genuinely open, not closeable yet: verifying these pairings *as `Alert`/`Form` will actually use them* — neither component exists yet (organism/molecule tier, not built). Re-check once they ship.

## Related
`03-token-system-spec.md` — the contrast-verification methodology and running log this decision's numbers feed into. `FieldError`, and the `destructive` variants of `Tag`/`Badge`/`Button`.
