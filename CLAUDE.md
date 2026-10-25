# DBM System

## What this is
An agentic, standalone React component library — built for AI coding agents (and humans) to compose web and enterprise applications. To be published to npm under the `@dbm-system/*` scope (MIT licensed) — not yet published; see `guidelines/01-vision-and-goals.md` §13 (Phase 8) for the publish pipeline's own status. Also home to a documentation site and hosted Storybook (built after the core library stabilizes). A Figma component library is planned as a future, separate deliverable derived from the same tokens.

**Before making any structural or architectural change, check `guidelines/` — don't assume or re-derive decisions that are already made there.**

## Core principles
- **No/limited dependencies.** Every dependency must be justified. Currently approved: Radix UI Primitives (accessibility/interaction layer), Phosphor Icons (wrapped by `packages/icons`, the only runtime dependency outside Radix), and Motion (optional peer dependency, for richer micro-interactions only — approved but not yet installed, since no component has needed it).
- **Free/open-source tooling only** — no paid SaaS in build, test, or hosting pipelines. See `guidelines/02-tech-stack-and-structure.md` for the full approved stack.
- **Tokens are the single source of truth.** Never hardcode a color, spacing value, font size, radius, shadow, or duration in component code — reference a semantic token. If a needed token doesn't exist yet, add it to the token layer first, don't inline a value.
- **Semantic over primitive.** Components reference semantic tokens (`color.bg.brand`, `space.4`) never primitives (`color.purple.600`) directly. This is what makes multi-theme/multi-brand switching work without touching component code.
- **Accessibility is not optional.** WCAG AA minimum on every component (contrast, keyboard nav, focus states, ARIA). Run contrast checks on any new color pairing rather than assuming — see the methodology in `guidelines/03-token-system-spec.md`.
- **Atomic design tiering**: atoms → molecules → organisms → templates. Check `guidelines/04-component-inventory.md` for where a new component belongs before creating it.
- **Every component needs full TypeScript types + JSDoc** — this is what feeds the auto-generated agent-readable component manifest. Undocumented props are treated as incomplete work, not optional polish.
- **Never commit and push without explicit confirmation.** You may stage and commit locally as a checkpoint, but never run `git push` (including force-push) without showing me exactly what's being pushed and getting an explicit go-ahead first. This applies to every phase, not just initial setup.
- **Security is not optional.** See "Security practices" below — applies to every phase, not just repo setup.
- **Responsive is not optional**, same standing as accessibility — every component works across the full breakpoint scale, not desktop-first with mobile bolted on later.
- **Self-verify before reporting a task done.** Actually run lint/build/test and report real results — never report completion based on code "looking right."
- **Update `guidelines/*.md` directly as decisions are made — no need to ask first, but always surface what changed.** These are the source of truth I control, but chat scrolls away and `guidelines/*.md` persists, so record real decisions as they happen rather than gating every edit on a round trip. **These numbered files are a current-state reference, not a changelog.** A real architecture/API decision — a genuine fork in the road, or something that constrains how future components must be built — gets its own entry in `guidelines/adr/` — effectively immutable once published: a changed decision gets a new superseding ADR, and only a small correction to a detail may be amended in place, marked (see that folder's own README for the template and the rule) instead of being narrated inline; the numbered doc then just points to it (`See ADR-0012`). A component's own review findings (from a `06-engineering-standards.md` §9 pass) go in `guidelines/component-reviews/ComponentName.md` instead (see that folder's own README) — `07-storybook-and-documentation-standards.md` §6 then just links to it via a one-line status-table row. Routine iteration — a debugging dead-end, a step-by-step verification log, an intermediate wrong turn — doesn't get recorded in any of these; it belongs in the commit message. See `guidelines/06-engineering-standards.md` §8 for the full rule (when this applies, and the one carve-out — a rewrite of a standing process rule itself is worth flagging prominently even though it doesn't need pre-approval).
- **Full engineering discipline** (clean code, scalability, performance, error handling, browser/SSR targets, i18n stance) is in `guidelines/06-engineering-standards.md` — read it alongside this file, not as an optional extra.

## Security practices
- **Never commit secrets.** No API keys, tokens, `.env` files, or credentials in the repo, ever — including in commit history, code comments, test fixtures, or Storybook examples. Use `.env.example` with placeholder values to document what's needed.
- **`.gitignore` must cover:** `.env`, `.env.*` (except `.env.example`), `node_modules`, build outputs (`dist`, `.turbo`, `build`), OS/editor cruft (`.DS_Store`, `.vscode/*` except shared settings), and any local credential/config files.
- **Dependency security:** GitHub Dependabot alerts and security updates are enabled; version-update PRs are off (pull requests are disabled on this repo). Vulnerabilities are handled by hand (`guidelines/02-tech-stack-and-structure.md` §3.1), routine updates in a periodic manual refresh pass. `pnpm audit` runs in CI.
- **Secret scanning:** GitHub secret scanning + push protection (free for public repos) should be enabled at the repo level — flag this to me if it isn't, since it's a repo setting, not something committed in code.
- **Static analysis:** GitHub CodeQL (free for public repos) as a CI job once there's real code to scan — catches common vulnerability patterns (XSS, injection) before merge.
- **Component-level security:** no `dangerouslySetInnerHTML` without explicit sanitization (relevant for anything rendering user-provided content — `CodeBlock`, `Combobox`, rich text areas); no `eval` or dynamic `Function` construction; sanitize any component that accepts and renders external URLs or HTML.
- **Publish security:** when the npm publish pipeline is built (Phase 8), use npm provenance/trusted publishing (OIDC-based, no long-lived tokens stored as secrets) rather than a classic npm token, and require 2FA on the npm account doing the publishing.
- **`guidelines/` is public and permanent.** Never add secrets, credentials, personal identifying information, or client/business-sensitive details to any file in `guidelines/` — the repo is public and git history is effectively permanent, so anything committed there should be treated as visible forever. If a task would involve writing something sensitive into a guideline doc, stop and ask rather than proceeding.

## Repo structure
```
apps/
  docs/            Documentation website (Next.js/Astro — built later; currently a stub)
  storybook/        Public-hosted Storybook instance (Phase 9; currently a stub — the
                     Storybook actually used today lives in packages/components/.storybook/,
                     not here)
packages/
  tokens/           Source of truth for all design tokens (primitive + semantic + component layers)
  utils/             Small framework-agnostic utils (classname merging, ref merging,
                     the `mergeDefined` helper for `labels` props, responsive style
                     helpers, the `useAnnouncement` live-region hook, the
                     `useWindowedList` and `useSortable` hooks (internal),
                     the `usePersistentDismiss` and `useRecentCommands` hooks, token types) — components import
                     Radix UI Primitives directly, not through this package. What a
                     consumer is meant to call (`usePersistentDismiss`, `useRecentCommands`, the `Responsive`/
                     `SpaceValue`/`Breakpoint` types) is re-exported from the
                     components package, so one install covers it
  icons/             Phosphor Icons wrapper
  components/        The actual DBM component library (published npm package) — also
                     holds its own .storybook/ config and src/foundations/ (Storybook-only
                     token reference pages, not shipped in the package)
  manifest/          Build tool: generates the JSON component manifest from TS + JSDoc
  eslint-config/      Shared lint rules
  tsconfig/           Shared TypeScript configs
guidelines/          Internal reference docs — current-state specs, inventories, conventions.
  adr/                Individual, effectively immutable Architecture Decision Records (the "why"
                       behind a real fork-in-the-road decision) — numbered 01-07 files
                       point here rather than narrating decisions inline.
  component-reviews/  One living file per component holding its own review findings —
                       moved out of 07's own §6 so that file stays a compact status table
                       instead of growing unbounded as more components get reviewed.
```

## Stack quick reference
TypeScript (strict) · React 18+ · Turborepo · pnpm workspaces · Radix UI Primitives · CSS Modules + CSS Custom Properties · Style Dictionary (token build) · tsup · Vitest + React Testing Library · jest-axe · Storybook 10 · Changesets · GitHub Actions

Full rationale for each choice: `guidelines/02-tech-stack-and-structure.md`.

## Where to look before you build something
| Task | Check first |
|---|---|
| Adding/changing a design token | `guidelines/03-token-system-spec.md` |
| Building a new component | `guidelines/04-component-inventory.md` (tier + scope) |
| Unsure about a dependency or tool choice | `guidelines/02-tech-stack-and-structure.md` |
| Overall project goals/scope | `guidelines/01-vision-and-goals.md` |
| A component's props, file structure, or definition of done | `guidelines/05-component-api-conventions.md` |
| Reviewing or finalizing a component, or how to work across sessions | `guidelines/06-engineering-standards.md` (§8 process rules, §9 review checklist) |
| A Storybook story, Docs page, or a story's "Show code" snippet | `guidelines/07-storybook-and-documentation-standards.md` (§4 template, §4.2 snippets) |
| Understanding *why* a past architecture/API decision was made | `guidelines/adr/` |

To start a session, run `/start <task>` (`.claude/commands/start.md`): it reads only the guidelines that task needs, verifies against the repo with `pnpm check-guidelines`, and reports before any work.

Other project commands, in `.claude/commands/`: `/plan-component <Name>` (propose scope, API and tokens; writes nothing), `/review-component <Name>` (the §9 review as a prioritized list; no edits), `/refresh-deps` (the §3.2 dependency pass as a plan), and `/after-push` (classify the push, watch CI if it contained code, report per job).

## Component index (planned: auto-synced)
Once `packages/manifest` exists and generates the JSON component manifest (see `01-vision-and-goals.md`, Phase 10), its build step should also write an up-to-date component index into this file — name, category, tier, and a one-line summary per shipped component, regenerated on every release rather than maintained by hand, so agents discover what's actually available instead of guessing or hallucinating a component that doesn't exist.

Until that tooling exists, treat `guidelines/04-component-inventory.md` as the authoritative (manually maintained) list.

<!-- AUTO-GENERATED-COMPONENT-INDEX:START -->
<!-- This block will be replaced by the manifest build step once packages/manifest ships. Do not hand-edit between these markers. -->
<!-- AUTO-GENERATED-COMPONENT-INDEX:END -->

If a task requires a decision that isn't covered in `guidelines/`, flag it rather than guessing — these documents are meant to be the standing source of truth, and gaps should get filled in explicitly, not improvised silently.
