# 0234 — Figma is a design tool outside the build, test and hosting pipelines, and the file needs Professional or higher, over applying the free-tooling rule to it

**Status:** Accepted · **Date:** 2026-11-19

## Context
`CLAUDE.md` allows free and open-source tooling only in the build, test and hosting pipelines. Figma is proprietary, and four theme modes in one variable collection need a plan with at least four modes per collection (Professional has four, Starter one).

## Decision
- Figma is a design deliverable, not a part of any pipeline: nothing in the build, the tests, the release or the hosting depends on it, so the rule is not breached.
- The file lives on Figma Professional or higher. The plan is checked through the MCP before anything is written.

## Alternatives considered
- **Starter (free).** One mode per collection, so the four themes become separate collections or pages and switching is manual. Diverges from the 1:1 mirror. Rejected.
- **Hold Figma to the rule.** No free option offers the required modes. Rejected.

## Consequences
- Nothing in the repository requires a paid service: a contributor can build, test and release without Figma.
- The four-mode Semantic collection uses the plan's whole allowance; a third brand needs a higher plan or a second collection.

## Related
`guidelines/figma/01-plan.md` §2 and §8. `CLAUDE.md` (core principles).
