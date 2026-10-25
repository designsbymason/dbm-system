# DBM System — Vision & Goals

**Project brief · Status: v1 in progress**

---

## 1. Executive summary

DBM System is a standalone, dependency-light React component library built from first principles for the age of AI-assisted development. It is designed to be equally usable by human engineers and AI coding agents (like Claude Code) to build web and enterprise applications quickly, consistently, and accessibly. It will ship as a versioned npm package, backed by a token-driven multi-brand theming system, a Storybook workshop, and — later — a documentation website and a companion Figma component library derived from the same design tokens.

The system is built and maintained using Claude Code, and its own component APIs, documentation, and metadata are being designed to be legible to AI agents from day one, not retrofitted for it later.

---

## 2. Problem statement

Most design systems were built for a world where a human developer reads documentation, copies a code example, and hand-wires props together. That workflow is changing: AI coding agents are increasingly the ones assembling UI, and they work best against APIs that are consistent, strongly typed, well-documented, and predictable — not against tribal knowledge, inconsistent prop naming, or documentation that assumes a human is scanning a rendered webpage.

At the same time, most existing design systems fall into one of two traps:
- **Heavy, opinionated, single-brand systems** that fight you the moment your product needs to look like *your* product, not the system's.
- **Unopinionated copy-paste collections** that give freedom but no shared upgrade path, no cross-project consistency, and leave accessibility and correctness as each team's individual problem.

DBM System exists to avoid both traps: a real, versioned, installable package — not copy-paste — but built dependency-light and token-driven enough that it can carry multiple brands and themes without becoming someone else's product.

---

## 3. Vision statement

**A modern, premium, fully accessible React design system — built on rigorous design tokens, agent-legible by design, and light enough on dependencies to be trusted as the foundation of any web or enterprise product.**

---

## 4. Goals & objectives

### Primary goals
1. **Agent-usable from day one.** Every component ships with complete TypeScript types and JSDoc sufficient to feed an auto-generated, machine-readable component manifest — giving AI agents a structured, authoritative contract instead of requiring them to infer behavior from scraped docs.
2. **Standalone and dependency-light.** Minimize what consumers are forced to install. Every dependency taken on (currently: Radix UI Primitives, Phosphor Icons through `packages/icons`, optionally Motion) is a deliberate, justified exception, not a default.
3. **Free/open-source tooling throughout.** No paid SaaS anywhere in the build, test, or hosting pipeline — the system should be buildable and maintainable by anyone without a procurement conversation.
4. **Token-driven, multi-brand, multi-mode.** A rigorous 3-layer token architecture (primitive → semantic → component) that supports multiple brand themes and light/dark modes without touching component code.
5. **Accessible by default, not by retrofit.** WCAG AA as the enforced floor on every component — contrast, keyboard navigation, focus handling, ARIA semantics — verified, not assumed.
6. **Comprehensive and scalable.** A component set complete enough to build real products without leaving gaps that force teams back to one-off custom components; an architecture that scales in component count without architectural rework.
7. **Premium, feature-rich, and unique.** Modern visual language, considered micro-interactions and motion, and API ergonomics that feel deliberate rather than default-generated. Components should be comprehensive enough to match or exceed mature design systems' feature sets for the same role, while staying visually and behaviorally identifiable as DBM's own rather than a generic primitive-library default. Operationalized as a formal review process — see `06-engineering-standards.md` §9.
8. **Cross-platform-ready foundation.** v1 targets web + enterprise on shared primitives; the token layer is structured so a future React Native package can consume the same source of truth without a redesign.

### Success criteria (what "done" looks like for v1)
- Component library installable via npm with no required runtime dependencies beyond React, Radix primitives and Phosphor Icons.
- Full token set (primitive + semantic) covering color, typography, spacing, radius, shadow, motion, breakpoints — with both v1 brand themes (Purple, Emerald) in light and dark mode, contrast-verified.
- A defined, documented component inventory covering atoms through organisms sufficient to build a real web/enterprise application end to end (forms, navigation, data display, feedback, overlays).
- Storybook instance covering every component, with accessibility and interaction tests passing in CI.
- Auto-generated component manifest accurately reflecting every published component's API.
- Published, versioned npm package with a working semver/changelog release pipeline.

---

## 5. Who this is for

- **AI coding agents** (Claude Code, and other agentic tooling) assembling UI on behalf of a developer — the primary novel audience this system is designed around.
- **Product/engineering teams** building web applications who want a real, installable, upgrade-path-having design system rather than a component pile.
- **Enterprise/internal-tooling teams** who need data-dense components (tables, forms, filters) alongside consumer-facing polish.
- **(Future) Designers**, once the companion Figma library exists, working from the same token source as engineering.

---

## 6. Scope

### In scope for v1
- React component library (web + enterprise, shared primitives)
- Full design token system: primitive + semantic layers, 2 brand themes × light/dark
- Phosphor Icons integration
- Storybook workshop (local; public hosting is a stretch goal for v1, not a hard requirement)
- Component-level accessibility and unit testing
- Auto-generated JSON component manifest (agent-readable API contract)
- npm publishing pipeline (Changesets-based)

### Explicitly deferred (not forgotten — sequenced later)
- **CLI scaffolder / MCP server** for agent tooling — deferred until the component API is stable; building agent tooling against a shifting API means rebuilding it repeatedly
- **React Native / mobile components** — token layer is built to support this later; actual mobile primitives are a separate future package
- **Documentation website** — built once the core library and Storybook are stable
- **Public-hosted Storybook** — same dependency
- **Figma component library** — built from the same token source once tokens are fully finalized, so Figma variables mirror the CSS custom properties 1:1
- **Component-layer tokens** — added incrementally as specific components need overrides, not pre-populated speculatively
- **3rd+ brand theme** — architecture supports it; not built until a concrete need exists

### Out of scope (not currently planned)
- Non-React framework support (Vue, Svelte, Angular components)
- A visual theme-builder tool (may be reconsidered post-v1)

---

## 7. Competitive landscape

The closest existing system to what DBM is attempting — released in Beta in June 2026 — is React-based, dependency-light by design, and AI-agent-oriented (ships a CLI, an MCP server, and a JSON manifest for structured agent access), with 90–150+ components drawn from years of large-scale internal use. (Deliberately unnamed here — this repo never names another design system; see `06-engineering-standards.md` §8.)

DBM's points of differentiation from it:
- **Styling approach:** that system is built on a compile-time CSS-in-JS solution that requires a bundler plugin; DBM uses CSS Custom Properties + CSS Modules for a true zero-build-step-requirement on the consumer side.
- **Multi-brand theming as a first-class goal from v1**, rather than a broader multi-theme internal-tooling flavor.
- **Explicit free/OSS-only tooling constraint** across the entire build/test/hosting pipeline.
- **Deliberately sequenced agent tooling** — DBM ships strong types/JSDoc/manifest first and defers CLI/MCP server until the API is proven stable, rather than shipping full agent tooling at initial launch.
- **Planned Figma library derived from the same token source**, tightening the design-to-code loop.

That system is worth continued reference (not imitation) as a live proof-of-concept that agent-oriented, dependency-conscious design systems are viable at scale.

---

## 8. Design principles

1. **Tokens are law.** No hardcoded values in component code — ever. If a value is needed and no token exists, the token gets created first.
2. **Semantic over primitive, always.** Components never reference raw color/spacing values directly — only semantic tokens. This is what makes theming free.
3. **Guidance over restriction.** Components should be composable and unopinionated about content — the system provides capability and strong defaults, not walls, so a consumer (human or agent) can reach for the right building block without fighting the API to get an unusual-but-valid layout.
4. **Accessible is not a variant.** There is no "accessible mode" — every component is accessible by default, verified, not assumed.
5. **Motion with restraint.** Micro-interactions should clarify state changes and feel premium, not decorate for their own sake. CSS transitions handle the simple cases; Motion is reserved for genuinely complex sequences.
6. **Documented as-built, not after-the-fact.** JSDoc and prop documentation are part of the definition of "done" for a component, not a follow-up task.
7. **Agent-legible is a design constraint, not a feature flag.** Prop names, types, and component composition patterns should be predictable and consistent enough that an agent can infer correct usage from the API shape alone.

---

## 9. Guiding constraints

- **Dependency budget:** every dependency must be justified against the "no/limited dependencies" goal. Current approved exceptions: Radix UI Primitives (accessibility/interaction logic), Phosphor Icons (wrapped by `packages/icons`), Motion (optional peer dependency, not yet installed).
- **Free/open-source only:** no paid SaaS anywhere in the build, test, or hosting pipeline.
- **Accessibility floor:** WCAG AA, verified via automated testing (axe) and manual contrast checks — not assumed from "looks fine."
- **Performance:** tree-shakeable exports, minimal bundle footprint per component, no unnecessary runtime CSS-in-JS cost.
- **Framework target:** React 18+, built with an eye toward React Server Component compatibility where a component doesn't require interactivity.

---

## 10. Key decisions log

A running record of foundational decisions, cross-referenced to the detailed docs that contain the full rationale.

| Decision | Chosen | Detail |
|---|---|---|
| Monorepo tooling | Turborepo + pnpm workspaces | `02-tech-stack-and-structure.md` |
| Styling architecture | CSS Custom Properties + CSS Modules (no CSS-in-JS runtime) | `02-tech-stack-and-structure.md` |
| Accessibility primitives | Radix UI Primitives | `02-tech-stack-and-structure.md` |
| Motion library | Motion (optional peer dependency) | `02-tech-stack-and-structure.md` |
| Icons | Phosphor Icons, wrapped by `packages/icons` | `02-tech-stack-and-structure.md` |
| Token architecture | 3-layer: primitive → semantic → component | `03-token-system-spec.md` |
| v1 brand themes | Purple (`#5548A4`) + Emerald (`#2E8A7D`), each × light/dark | `03-token-system-spec.md` |
| Typography | Nunito (primary/UI), Lora (secondary/editorial), fluid clamp()-based scaling | `03-token-system-spec.md` |
| Spacing base unit | 4px | `03-token-system-spec.md` |
| Corner radius style | Soft/rounded (6–24px range) | `03-token-system-spec.md` |
| Elevation style | Soft layered shadows, distinct light/dark values | `03-token-system-spec.md` |
| Neutral gray undertone | Cool, subtly purple-tinted | `03-token-system-spec.md` |
| v1 platform scope | Web + Enterprise, shared primitives | This document |
| Agent tooling scope for v1 | Types + JSDoc + manifest only; CLI/MCP deferred | This document |
| npm scope | `@dbm-system/*` (e.g. `@dbm-system/components`, `.../tokens`, `.../icons`, `.../primitives`) | [ADR-0113](adr/0113-the-npm-scope-is-dbm-system-matching-the-repository-over-keeping-dbm-design-system.md); verify the organization with `npm org ls` before first publish |
| License | MIT | This document |
| Repo visibility & governance | Public GitHub repo; MIT license; sole maintainer. **Pull requests are disabled on the repo**, so none is opened or merged; write access is controlled via the Collaborators list (empty), not by visibility | This document |
| Dependency updates | Dependabot alerts and security updates on; **version-update PRs off**; routine updates in a periodic manual refresh pass, vulnerabilities fixed by hand | [ADR-0022](adr/0022-dependency-updates-are-a-manual-refresh-pass-not-dependabot-version-prs.md), `02-tech-stack-and-structure.md` §3.2 |
| Color-scale generation tooling | `culori` (MIT), devDependency scoped to `packages/tokens` only — used solely by the one-off OKLCH scale generation script, never shipped in any published package. Distinct from the "dependency budget" above, which governs runtime dependencies of `@dbm-system/components` | `03-token-system-spec.md` |
| Yellow / highlight colour | `yellow` primitive scale anchored at `#949415` = `yellow.600` with its own light-end chroma; semantic family `highlight` (the general highlight and accent colour, not a status), shared across both brands | [ADR-0042](adr/0042-yellow-is-an-anchored-scale-with-its-own-light-end-chroma-and-the-highlight-semantic-family.md), `03-token-system-spec.md` |

---

## 11. Success metrics (post-launch)

- npm weekly downloads / installs (adoption signal)
- Number of AI-agent-driven builds successfully using the manifest without human API corrections
- Lighthouse/axe accessibility score across Storybook-documented components
- Bundle size per component (tracked in CI, regression-alerted)
- Time-to-first-component for a new consumer (developer or agent) integrating the package

---

## 12. Risks & open questions

- **AA vs. AAA compliance target:** AA is the enforced floor everywhere; AAA is a target, not a requirement, for error/critical-alert text only (`guidelines/adr/0002`). Still open: confirming error-text pairings *as the components actually use them* — `Alert` is built and its danger-tone text needs checking against 7:1 in both modes; `Form` is built, and draws its messages with `FieldError` and its summary with `Alert`, so it adds no pairing of its own to check.
- **Public Storybook/docs hosting timeline:** deferred, but worth revisiting once the component set stabilizes so momentum isn't lost.
- **Storybook's docgen vs. the planned manifest generator:** Storybook uses `react-docgen` (Babel-based prop extraction), while `packages/manifest` is planned around `react-docgen-typescript` (`02-tech-stack-and-structure.md`). `react-docgen` drops inherited native props from the Properties table, which components work around by hand (`05-component-api-conventions.md` §3). Whether the manifest consumes Storybook's docgen output or does its own extraction is undecided; decide before Phase 8 starts.
- **Storybook's Accessibility panel needs `@storybook/addon-vitest`**, not just `@storybook/addon-a11y`, so `pnpm test:storybook:watch` must run alongside `pnpm storybook` (`guidelines/adr/0003`).
- **Dependency refresh is manual, not prompted** ([ADR-0022](adr/0022-dependency-updates-are-a-manual-refresh-pass-not-dependabot-version-prs.md)): nothing reminds anyone to run the refresh pass in `02-tech-stack-and-structure.md` §3.2, which is due every few weeks and before a release.
- **How a consumer loads the CSS is undecided and undocumented (a Phase 8 item).** (1) The component styles compile to `packages/components/dist/index.css`, but the built `index.js` does not import that file and the package's `exports` map exposes only `"."`, so a bundler that honours `exports` may not be able to reach the stylesheet. (2) The `--dbm-*` custom properties the components read are plain CSS in `@dbm-system/tokens` (`css/primitives.css`, `css/component-tokens.css`, and one theme file such as `css/purple-light.css`); a consumer must install that package and load those files by hand, and no consumer doc says how. Not yet tested: installing the packed package into a fresh app. Needs a decision before the first publish: expose the stylesheet through `exports` (or import it from the JS), and give one documented way to load the tokens, choose a theme and load the `Nunito`/`Lora` fonts (which the token package names but does not ship; `03-token-system-spec.md` "Fonts"), likely in the consumer usage guide (§13.1).
- **Whether a Radix-wrapping component reads the page's text direction is undecided.** `Tabs`, `Accordion`, `RadioGroup`, `Slider` and `RangeSlider` take an explicit `dir?: "ltr" | "rtl"`, pass it to Radix, and default to left-to-right; none reads the page. Reading it (Radix's `DirectionProvider`, or the element's computed direction) needs JavaScript and can flash left-to-right on a server-rendered page, and it is one decision for every Radix component together (`05-component-api-conventions.md` §3). A right-to-left app passes `dir="rtl"` to each for now.

---

## 13. Roadmap phases (high-level)

The phase numbers below are the ones other docs cite. Vision, tech stack, token spec and component inventory (`01`–`04`) predate Phase 1 as planning input, not a phase of their own. Per-component status is in `07-storybook-and-documentation-standards.md` §6; what was found and fixed in each component's review is in `component-reviews/`.

- **Phase 1 — Repo scaffold & tooling (done):** monorepo, Turborepo/pnpm, shared configs, CI, security setup.
- **Phase 2 — Design token pipeline (done):** Style Dictionary build producing CSS custom properties and typed TS constants from the primitive/semantic token JSON.
- **Phase 3 — Foundational atom layer (done):** utility primitives, layout primitives, typography and core atoms; Storybook 10; Vitest/RTL/jest-axe test infrastructure.
- **Phase 4 — OKLCH color re-derivation (done):** the primitive color scales derived in OKLCH for perceptual evenness, with every contrast pairing in `03-token-system-spec.md` re-verified.
- **Phase 4.5 — Atom review & enhancement pass (done):** every atom taken through the two-track rubric in `06-engineering-standards.md` §9 (objective checklist plus design-quality pass) before molecules were built on top of it.
- **Phase 4.75 — Comprehensive atom completion (done):** every remaining atom-tier component in `04-component-inventory.md` built to the full definition of done. `Radio` joined the atom tier when it was split from `RadioGroup` ([ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md)).
- **Phase 4.9 — Storybook & documentation pass (done):** every atom given a hand-authored Docs page, an interactive Playground, `play`-function interaction tests and the sidebar taxonomy. The plan, template and status table are in `07-storybook-and-documentation-standards.md`.
- **Phase 4.9b — Storybook infrastructure & CI hardening (done):** `pnpm audit`, a real `build-storybook` and bundle-size tripwires in CI; `.storybook/**` type-checked; the version-upgrade checklist first exercised. Detail: `07-storybook-and-documentation-standards.md` §§9–10.
- **Phase 5 — Molecules (done):** all 40 planned molecules are built, reviewed and Finalized. Each molecule gets the full `06-engineering-standards.md` §9 pass, including the composition-specific checkpoints (compound sub-part completeness, atom reuse, consumed-atom defects, Radix prop audit, cross-part ARIA wiring, composed tab order). The molecule list and build order are in `04-component-inventory.md`.
- **Phase 6 — Organisms (in progress):** `Dialog`, `AlertDialog`, `ConfirmDialog`, `Drawer`, `Menu`, `Toast`, `Form`, `Combobox`, `DatePicker`, `DataTable`, `Navbar`, `Sidebar` and `FileUpload` are built, reviewed and Finalized, which completes the 🟢 v1 organisms; `ContextMenu`, the first 🟡 v1.5 organism, `MultiSelect` and `DateRangePicker` are also built, reviewed and Finalized; `CommandPalette` is built and awaits its review pass; the other 🟡 v1.5 organisms follow, in the build order in `04-component-inventory.md`
- **Phase 7 — Comprehensive pass:** remaining 🟡 v1.5 components + templates
- **Phase 8 — Manifest & publish:** full `packages/manifest` JSON component manifest generation; npm publishing pipeline (Changesets-based). See §13.1 for the full required/recommended agent-consumption deliverable list. **Open decision for this phase:** pull requests are disabled on the repo ([ADR-0022](adr/0022-dependency-updates-are-a-manual-refresh-pass-not-dependabot-version-prs.md)), and the standard Changesets release action works by opening a "Version Packages" pull request. Either pull requests get enabled for that (possibly with creation limited to collaborators), or the version and publish steps run some other way (a manually dispatched workflow, or locally). Not decided; the release workflow's Actions must also declare a supported Node runtime (`02` §3.2).
  - **Package metadata for the first publish:** the five public packages carry a `repository` field (with their `directory`), which npm provenance checks against the repository that built them, so it must keep matching the one trusted publishing is bound to (`designsbymason/dbm-system`; [ADR-0113](adr/0113-the-npm-scope-is-dbm-system-matching-the-repository-over-keeping-dbm-design-system.md)). `homepage` and `bugs` are not set yet: there is no docs site (Phase 9), and Issues are off on the repo, so a `bugs` link would lead nowhere. Decide both before publishing. The `dbm-system` npm organization needs 2FA on its owner account.
- **Phase 9 — Surface expansion:** documentation website, public Storybook hosting
- **Phase 10 — Agent tooling:** CLI scaffolder, MCP server, and an auto-synced component index written into `CLAUDE.md`/`AGENTS.md` on every release — a consuming agent gets an always-current inventory of what's actually shipped instead of guessing or hallucinating a component that doesn't exist. Deferred until the API is proven stable, so agent tooling isn't built against a shifting target. See §13.1 for the full required/recommended agent-consumption deliverable list.
- **Phase 11 — Platform expansion:** Figma component library; React Native package

### 13.1 Agent-consumption deliverables (required vs. recommended)

Reviewed 2026-08-31, following a best-practices/industry-standard pass. Distinct from
`guidelines/` and `CLAUDE.md` themselves, which are internal-only and never published
(confirmed: `packages/components/package.json`'s `"files"` field is `["dist"]` only) —
this list is what a *consuming* agent (one building an app with this package, not
contributing to it) needs, shipped as part of the published package or its docs site.

**Required — already this project's own stated mission (goal #1), not yet built:**

| Artifact | Why | Target phase |
|---|---|---|
| JSON component manifest | The single most load-bearing artifact for programmatic agent use — a structured, typed index of every component's props/variants/constraints, queryable directly instead of parsed from prose. Already primary goal #1 (§4). | Phase 8 (`packages/manifest`, currently empty scaffolding) |
| Per-package `CHANGELOG.md` | Lets an agent doing an upgrade know what broke without diffing source across versions. | Phase 8 (Changesets is configured but not yet wired into CI) |

Already in place, not a gap: comprehensive `.d.ts` declarations (shipped via `tsup`) and
complete JSDoc on every export (`05-component-api-conventions.md` §7) — both keep feeding
the manifest above as more components ship; no new artifact needed, just keep the
discipline going.

**Recommended — real external precedent, not currently planned:**

| Artifact | Precedent | What it adds |
|---|---|---|
| Consumer-facing agent usage guide, shipped in `"files"` (e.g. `AGENTS.md`/`USAGE.md` at the package root) | The `AGENTS.md` convention is spreading across coding-agent tooling as the standard place for agent-facing instructions, distinct from a human-oriented `README.md`. | A condensed, public rewrite of the consumption rules currently internal to `05`/`06` — import patterns, "reference semantic tokens, never hardcode," `as`/`asChild` composability — for someone building *with* the library, not the internal guidelines themselves. |
| `llms.txt` / `llms-full.txt` | Emerging convention (llmstxt.org) for a curated, LLM-optimized index of a docs site. | Most natural once the docs site/hosted Storybook (Phase 9) exists. |
| Structured example/registry format | Machine-readable, queryable example catalog (a pattern several component-distribution tools use). | Bigger lift; sits on top of the manifest, so defer until that ships. |
| MCP server | A structured query interface in front of the manifest, for an agent that wants to ask questions rather than fetch a static file. | Already named in Phase 10; the manifest is its prerequisite either way. |

**Sequencing note:** the manifest is the one item worth prioritizing — everything else
here is more valuable *with* a real manifest behind it than without one.

---

## 14. Related documents
- `02-tech-stack-and-structure.md` — full technical stack and monorepo layout
- `03-token-system-spec.md` — complete token architecture and values
- `04-component-inventory.md` — component list and atomic-design tiering
- `05-component-api-conventions.md` — how any component's props, files and definition of done must look
- `06-engineering-standards.md` — code quality, process rules and the per-component review checklist
- `07-storybook-and-documentation-standards.md` — Storybook infrastructure, the Docs-page template and per-component status
- `adr/` — Architecture Decision Records, the reasoning behind each fork-in-the-road decision
- `component-reviews/` — one file per component with its review findings
