# 0177 — An optional direction provider sets the text direction for a subtree, over reading the page direction automatically

**Status:** Accepted · **Date:** 2026-11-04

## Context
Components that behave differently in right-to-left (`Tabs`, `Accordion`, `RadioGroup`, `Slider`, `Dialog`, `Menu`, `Calendar`, `Combobox`, `Tree`, `Toast` and more) take an explicit `dir` prop and default to left-to-right; none reads the page. A right-to-left app has to pass `dir` to each one.

## Decision
- Components keep the explicit `dir` prop and the left-to-right default.
- A new **opt-in direction provider** sets the direction for everything under it, and a component's own `dir` prop still wins. A right-to-left app wraps its root once.
- Components do not detect the document or element direction on their own.

## Alternatives considered
- **Explicit `dir` only.** No work, but repetitive for every right-to-left app. Rejected.
- **Read the page direction automatically.** Needs JavaScript, can flash left-to-right on a server-rendered page, and changes every component's default. Rejected.

## Consequences
- Adds one small component and a context to build, document and test, and a check that every direction-aware component honours it.
- No breaking change; the Responsive and right-to-left guide gains the provider.

## Related
`05-component-api-conventions.md` §3. The Responsive and right-to-left guide. `01-vision-and-goals.md` §12.
