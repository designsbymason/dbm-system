---
description: Load context for a session (general with no argument; reads only what the task needs when one is given; verifies against the repo, then waits)
argument-hint: <optional task, e.g. "build the Dialog organism", "review Tabs", "fix the docs site build">
---

This is the DBM System project (@dbm-system npm scope, monorepo at this path). Before any work, get up to speed. This is a context-loading step only: make no code or guideline changes.

Task (may be empty): $ARGUMENTS

CLAUDE.md and my memory are already loaded; don't re-read them. Pick the mode:

- **No task given: general mode.** Get a picture of where the project stands, so whatever I ask next starts informed. Do not ask me for a task first.
- **A task given: task mode.** Read only what that task needs.

## General mode (no task)

1. Read `guidelines/01-vision-and-goals.md` §13 (the roadmap and each phase's status) and the status sentences at the top of `guidelines/04-component-inventory.md` (what is built, what is next, the templates' build order).
2. Verify against the repo, not the docs: run `pnpm check-guidelines`, `git status` and `git log --oneline -15`, and look at what changed recently (the files and folders the last commits touched).
3. Reply with a short summary:
   - which phase the project is in and what is in flight (unpushed or uncommitted work, anything built but not Finalized);
   - what the inventory and the roadmap say comes next;
   - known flakes, accepted advisories and open decisions that could affect the next task (from my memory index and the guidelines);
   - anything `check-guidelines` or the git state flagged;
   - the commands that fit the likely next steps: `/plan-component`, `/review-component`, `/plan-template`, `/review-template`, `/refresh-deps`, `/verify`, `/after-push`.

## Task mode (a task given)

1. Work out what kind of task it is, and say so: a **component** (atom, molecule, organism), a **template** (a shell or a page), a **Storybook or Docs change**, a **token change**, a **dependency or tooling change**, a **docs site change**, a **guideline change**, or something else.
2. Read the guidelines this task needs. Choose them with CLAUDE.md's "Where to look before you build something" table and `guidelines/01-vision-and-goals.md` §13 (the roadmap). State which ones you chose and why, read those in full, and skip the rest. Typical sets:
   - **a component:** `04-component-inventory.md`, `05-component-api-conventions.md`, `06-engineering-standards.md` (§8 process rules, §9 review checklist) and `07-storybook-and-documentation-standards.md` §4–§6;
   - **a template:** `04` (Templates, its build order and naming rule), ADR-0179 and ADR-0184, `05` §1 and §8, `06` §9 (the template items) and `07` §3–§6 and §11, and the finished templates' review files;
   - **a token:** `03-token-system-spec.md`; **a dependency or tool:** `02-tech-stack-and-structure.md`; **the docs site:** `guidelines/docs-site/`.
3. Verify against the repo, not the docs: run `pnpm check-guidelines`, `git status` and `git log --oneline -15`, and open the packages or folders the task touches.
4. Reply with a short summary:
   - the task as you understand it, and its kind;
   - what already exists for it, and what the relevant guidelines require;
   - open decisions, known flakes or accepted advisories that could affect it;
   - anything `check-guidelines` or the git state flagged;
   - the command that fits next, if one does: `/plan-component` or `/plan-template` before building something new, `/review-component` or `/review-template` for a finished one, `/verify` before a commit or a push.

Then wait for my instruction.
