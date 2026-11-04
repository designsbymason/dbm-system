# Guidelines

Internal reference documents for the DBM System, an agentic React component library built for AI coding agents and human developers alike. This is where architecture decisions, specs, and standing context live — for Claude Code, other contributors, and future-you.

`CLAUDE.md` at the repo root is the short auto-read entry point; these documents are the detail behind it.

## Contents

| File | Covers |
|---|---|
| `01-vision-and-goals.md` | Project goals, target use cases (web/enterprise agentic UI generation), what "agentic" and "premium" mean for this system, scope, key decisions, open questions, and the roadmap phases |
| `02-tech-stack-and-structure.md` | Monorepo layout, the tech stack with rationale per tool, the free/OSS constraint, CI, and dependency-vulnerability handling |
| `03-token-system-spec.md` | The three-layer token architecture (primitive → semantic → component), the color/typography/spacing/radius/shadow/motion/breakpoint scales, multi-brand and light/dark theming, and the contrast-verification methodology and results |
| `04-component-inventory.md` | The full component list, atomic-design tiering (atoms/molecules/organisms/templates), priorities, and the build orders; the one place component counts live |
| `05-component-api-conventions.md` | Prop naming patterns, file structure, compound components, CSS/token conventions, and the per-component definition of done |
| `06-engineering-standards.md` | Clean code, scalability, stability and error handling, performance, responsiveness, browser/SSR targets, i18n stance, agent process rules, and the component review checklist |
| `07-storybook-and-documentation-standards.md` | Storybook infrastructure, sidebar taxonomy, the Docs-page template and building blocks, the rules for the code under each story's "Show code" button, the per-component checklist, and the status table of every built component |
| `adr/` | Individual, immutable Architecture Decision Records: the *why* behind a real fork-in-the-road decision. The numbered docs point here (`See ADR-0012`) instead of narrating a decision's reasoning inline. `adr/README.md` has the template, naming convention and the bar for what qualifies |
| `docs-site/` | The plan, structure and supporting references for the docs website at `dbm-system.com` and how Storybook sits beside it at `/storybook/`: the landing page brief, the content inventory, the open items, and what is gitignored and what belongs in the private notes folder instead. A living reference like the numbered docs; its decisions are ADRs 0170–0173 |
| `component-reviews/` | One file per component with a completed `06-engineering-standards.md` §9 review pass: what was checked, found and fixed, and its Finalized status and date. A living document per component, not immutable like `adr/`. `component-reviews/README.md` has the conventions |

## Reading order for new context (human or agent)

1. `01-vision-and-goals.md` — what we're building and why
2. `02-tech-stack-and-structure.md` — what it's built with and how the repo is organized
3. `03-token-system-spec.md` — the design token foundation everything else builds on
4. `04-component-inventory.md` — what components exist/are planned, and where each fits
5. `05-component-api-conventions.md` — how any given component must be written
6. `06-engineering-standards.md` — the code-quality and process discipline behind all of the above
7. `07-storybook-and-documentation-standards.md` — how a component's Storybook docs/showcase must meet the same bar as its code

`adr/` and `component-reviews/` aren't part of this linear reading order — both are lookup folders (the "why" behind a decision, and a specific component's own findings), consulted on demand rather than read start to finish.

## Conventions for this folder
- Numbered prefixes control reading order, not chronology — renumber if a doc's role changes.
- Each doc should be able to stand alone (a reader — human or agent — shouldn't need to hold the whole conversation history that produced it).
- **The numbered docs (`01`–`07`) are a current-state reference, not a changelog (`06-engineering-standards.md` §8).** `pnpm check-guidelines` (warn-only, also a CI step) flags the ways they drift: dated update notes, overlong lines, counts stated outside `04`, and links, section citations and index entries that no longer resolve. When a decision they document changes, update the doc in place rather than leaving stale guidance. Two exceptions, different from each other: **`adr/`** — an ADR is not rewritten in place: a changed decision gets a *new* ADR that supersedes the old one, and the one narrow exception is a small, dated, marked amendment to a *detail* when the decision itself hasn't changed (see `adr/README.md`). **`component-reviews/`** — a living document per component (see that folder's own README) that's expected to keep growing as a component's review continues; it's exempt from "current-state only" because per-component history is exactly what it's *for*, scoped tightly enough to stay bounded.
- Source-of-truth *data* (actual token JSON, component manifests) lives in `packages/`, not here — this folder is for decisions and rationale, not build artifacts.
- **This folder is public and permanent.** The repo is public, and git history doesn't forget — once something is committed and pushed here, treat it as visible forever, even if later removed. Never add secrets, credentials, personal identifying information, client/business-sensitive details, or anything not meant for permanent public visibility. If in doubt, leave it out or ask first rather than committing it.
