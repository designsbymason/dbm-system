---
description: Propose a template's (shell or page) scope, state, phone pattern, checks and registrations from the inventory and ADRs before any code is written (writes nothing)
argument-hint: <Template Name, e.g. Auth Flow Page>
---

Plan this DBM System template: $ARGUMENTS

If no template is given, ask for one. For a component (an atom, molecule or organism) use `/plan-component` instead and stop. This is a planning step: write no code, tokens, stories or guideline files, and wait for my approval of the plan.

1. Read the template's row and its place in the build order in `guidelines/04-component-inventory.md` (Templates, with its naming rule). Name it in Title Case, and not equal to a component's name: a page ends in "Page", while a shell keeps its component name (`AppShell`, `PageShell`) and takes no suffix. Read ADR-0179 and ADR-0184 in full: a shell ships and is a compound component; a page is a story-only example. If a component it composes isn't built, say so and stop to ask.
2. Read `guidelines/06-engineering-standards.md` §9 (the template items) and `guidelines/07-storybook-and-documentation-standards.md` §3–§5 and §11, so the plan anticipates the review. Read the finished templates' review files in `guidelines/component-reviews/` (`AppShell.md`, `DataTableListPage.md`) so a finding already made is not found twice. Read `05` §1 and §8 for the files and the template definition of done (a shell: all of `05`, since it ships as a component).
3. Read the closest finished template in the code (`packages/components/src/templates/`) and the components the new one composes, and reuse their patterns, story kit and demo shell. Say which helpers a second template would now share with an earlier one: those move to `src/templates/_shared/` (`05` §1).
4. Reply with a proposal covering:
   - **Purpose and scope:** what it is, what it deliberately is not, and the real-app needs it should prove, in this system's own terms (never name another design system).
   - **Kind and location:** shell (ships, with an API) or page (story-only: folder, story kit, no export, `example-page` tag), and its group.
   - **API and tokens (a shell only, since it ships as a component):** the compound parts, props with types and defaults, controlled and uncontrolled behaviour, `forwardRef` and the native props it passes through, JSDoc for the manifest, the tokens it uses and any new ones with why none fits (everything `/plan-component` asks under API, Behaviour and Tokens, against `05` in full). A page has none of this: it is not exported.
   - **Composition:** the components it reuses, and any change it would need in a Finalized one (flag it: stop and ask, a defect fix needs its own regression check in that component's checks). **Name the component behind every part** (a table of part, component it is built from, and what it adds): a template builds no pattern of its own (`06` §9). A part with no component behind it is flagged and proposed either as a new component (`/plan-component`) or as an extension of an existing one, never as a copy inside the template.
   - **State and flow:** what state the page holds, what the demo's controls drive, and the primary task a person does, step by step.
   - **States matrix:** loading, empty (first run), no results, error, selection, a destructive confirm, and any other state it can be in, each with what it says and offers.
   - **Responsive:** the layout at phone, tablet and desktop widths, decided now (a stack, a sheet, an icon group), where it uses a container query, and what must never overflow or shift.
   - **Behaviour:** the keyboard path of the primary task, where focus goes after each action, and what is announced.
   - **Copy and landmarks:** the words (all in one place) and the landmark and heading tree.
   - **Files and checks:** the file set (ADR-0184 or `05` §1; a template, shell or page, also has a `{Name}.snippetScope.txt` for `pnpm check-snippets`), the unit tests, the hydration and `StrictMode` tests, and the real-browser checks (widths, no page overflow, forced colours, print, real mouse and real keys), and which checks you will break once to prove they fail.
   - **Registrations:** the `07` §6 row, the review file, the `04` status and build-order row, the `componentDescriptions.ts` line, the `example-page` tag, and the ADR if one is warranted.
   - **Decisions I need to make:** every open fork, each with your recommendation, and which would deserve an ADR.

Flag any gap the guidelines don't cover instead of improvising (`guidelines/06-engineering-standards.md` §8). Then wait for my instruction.

**Once I approve the plan (or change it), record it before building.** The first thing written is `guidelines/component-reviews/<Name>.md` (the template's name, in the folder's spelling) with a `## Decisions` section holding what was approved: kind, composition, state and the states matrix, the layout at each width, the checks planned and each fork with its answer; and an ADR in `guidelines/adr/` for any fork that deserves one. Say what you wrote. The later review checks the build against that section, so a finding already decided is not found again. When the build is done, run `/verify` before any push (`/verify quick` between edits); a review (`/review-component` or `/review-template`) comes before anything is declared Finalized.
