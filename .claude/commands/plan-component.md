---
description: Propose a component's scope, API, tokens and test plan from the inventory and conventions before any code is written (writes nothing)
argument-hint: <ComponentName, e.g. Dialog>
---

Plan this DBM System component: $ARGUMENTS

If no component is given, ask for one. If it is a template (a shell or a page: the inventory's Templates section), use `/plan-template` instead and stop. This is a planning step: write no code, tokens, stories or guideline files, and wait for my approval of the plan.

1. Read the component's row and its build order in `guidelines/04-component-inventory.md`: tier, priority, category, and which components it depends on. If a dependency isn't built yet, say so and stop to ask.
2. Read `guidelines/05-component-api-conventions.md` in full, `guidelines/06-engineering-standards.md` §9 (so the plan anticipates the review checkpoints for its tier) and `guidelines/07-storybook-and-documentation-standards.md` §4. Read `guidelines/03-token-system-spec.md` for any token the plan needs.
3. Look in `guidelines/adr/` for decisions that constrain it, and read the closest existing sibling component in the code to reuse its patterns and atoms.
4. Reply with a proposal covering:
   - **Purpose and scope:** what it is, what it deliberately is not, and the feature-completeness gaps it should cover, in this system's own terms (never name another design system).
   - **Composition:** the existing atoms and molecules it reuses, the Radix primitive it wraps, and any new dependency with its justification (the project is dependency-light: say whether hand-rolling is realistic).
   - **API:** props with types and defaults, compound parts, controlled and uncontrolled behaviour, and what must be required.
   - **Behaviour:** the keyboard model and ARIA pattern, focus management, responsive and right-to-left behaviour, reduced motion.
   - **Tokens:** which existing semantic tokens it uses and any new component-layer tokens, with why none fits.
   - **Files and tests:** the file list from `05` §1, the unit tests, and the real-browser checks jsdom can't do.
   - **Decisions I need to make:** every open fork, each with your recommendation, and which of them would deserve an ADR.

Flag any gap the guidelines don't cover instead of improvising (`guidelines/06-engineering-standards.md` §8). Then wait for my instruction.

**Once I approve the plan (or change it), record it before building.** The first thing written is `guidelines/component-reviews/<Name>.md` with a `## Decisions` section holding what was approved: scope, API, tokens, each fork and its answer, and the checks planned; and an ADR in `guidelines/adr/` for any fork that deserves one. Say what you wrote. The later review checks the build against that section, so a finding already decided is not found again. When the build is done, run `/verify` before any push (`/verify quick` between edits); a review (`/review-component` or `/review-template`) comes before anything is declared Finalized.
