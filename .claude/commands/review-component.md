---
description: Run the full review pass on one component and report a prioritized list of what needs to change (reads and runs checks; makes no edits)
argument-hint: <ComponentName, e.g. Tabs>
---

Review this DBM System component against the project's review checklist: $ARGUMENTS

If no component is given, ask for one. If it is a template (a folder under `packages/components/src/templates`), use `/review-template` instead and stop. Confirm it exists under `packages/components/src/atoms`, `molecules` or `organisms`; if not, say so and stop. This is a read-and-verify step: make no code, test or guideline changes.

1. Read `guidelines/06-engineering-standards.md` §9 in full: the checklist, the "Reporting a review's findings" format, and the Finalized rules. Read `guidelines/05-component-api-conventions.md` §3, §6 and §8, and `guidelines/07-storybook-and-documentation-standards.md` §4 and §5.
2. Read the component's row in `guidelines/04-component-inventory.md` and its `guidelines/component-reviews/<Name>.md` (and the ADRs it links), so you don't re-report a finding that was already accepted or fixed. If it has a `## Decisions` section (the approved plan), check the build against it and report any departure from it as a finding.
3. Read the component's folder: implementation, types, stylesheet, stories, Docs page (`.mdx`), snippets and tests. For a compound component, check every sub-part, not only the root.
4. Run the checks the repo can run, one after another (never the real-browser Storybook suite alongside other heavy jobs: overlap causes the flakes in my memory notes), and report real results: `pnpm exec eslint` on the folder, `pnpm vitest run --project unit` and `--project storybook` for it, and `pnpm check-guidelines`. Where §9 asks for a live check (themes, breakpoints, Docs page, Controls), use the Storybook preview if you can; if you can't, list those checks as not done.
5. Apply the checkpoints that match its tier: the composition checks apply to molecules and organisms only.

Reply with one prioritized, ordered list of exactly what needs to change (added, updated or removed), as §9 specifies:
- skip everything that already passes;
- a missing Playground story is always first, a missing Docs page always last;
- each item gives the checklist item it fails, the file and line, and a proposed fix.

Then list the checks you could not run and why.

Rules: don't name or link another design system in anything you write (`guidelines/06-engineering-standards.md` §8). If the component is Finalized, your findings are proposals that need my explicit go-ahead before any file is touched, and only I declare a component Finalized. Once the fixes I approve have landed, suggest `/verify` (everything CI runs, one step after another; `/verify quick` for lint, `check-guidelines` and the unit tests between edits) before any push. Then wait for my instruction.
