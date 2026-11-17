# DBM System

## What this is
An agentic, standalone React component library built for both AI coding agents and human developers to compose web and enterprise applications quickly, consistently, and accessibly — token-driven, with a strong TypeScript + JSDoc contract so agents can work against a structured, predictable API (canonical wording: `guidelines/01-vision-and-goals.md` §1). Published to npm under the `@dbm-system/*` scope (MIT licensed), the four public packages at one version, through the release workflow in `RELEASING.md`; the API is pre-1.0 (`guidelines/01-vision-and-goals.md` §13, Phase 8). Also home to a documentation site and hosted Storybook (built after the core library stabilizes). A Figma component library is planned as a future, separate deliverable derived from the same tokens.

**Before making any structural or architectural change, check `guidelines/` — don't assume or re-derive decisions that are already made there.**

## Core principles
- **No/limited dependencies.** Every dependency must be justified. Currently approved: Radix UI Primitives (accessibility/interaction layer) and Phosphor Icons (wrapped by `packages/icons`, the only runtime dependency outside Radix). Animation is CSS transitions and keyframes driven by the motion tokens; no animation library is approved for the published packages; an app such as the docs site decides its own ([ADR-0140](guidelines/adr/0140-the-design-system-takes-no-animation-library-and-animates-with-css-and-the-motion-tokens-over-keeping-motion-as-an-optional-peer-dependency.md)).
- **Free/open-source tooling only** — no paid SaaS in build, test, or hosting pipelines. See `guidelines/02-tech-stack-and-structure.md` for the full approved stack.
- **Tokens are the single source of truth.** Never hardcode a color, spacing value, font size, radius, shadow, or duration in component code — reference a semantic token. If a needed token doesn't exist yet, add it to the token layer first, don't inline a value.
- **Semantic over primitive.** Components reference semantic tokens (`color.bg.brand`, `space.4`) never primitives (`color.purple.600`) directly. This is what makes multi-theme/multi-brand switching work without touching component code.
- **Accessibility is not optional.** WCAG AA minimum on every component (contrast, keyboard nav, focus states, ARIA). Run contrast checks on any new color pairing rather than assuming — see the methodology in `guidelines/03-token-system-spec.md`.
- **Atomic design tiering**: atoms → molecules → organisms → templates. Check `guidelines/04-component-inventory.md` for where a new component belongs before creating it.
- **Every component needs full TypeScript types + JSDoc** — this is what feeds the auto-generated agent-readable component manifest. Undocumented props are incomplete work, and the build enforces it: the components build and `pnpm check-manifest` fail on an undocumented prop, component, part, hook or function.
- **Never commit and push without explicit confirmation.** You may stage and commit locally as a checkpoint, but never run `git push` (including force-push) without showing me exactly what's being pushed and getting an explicit go-ahead first. This applies to every phase, not just initial setup.
- **Security is not optional.** See "Security practices" below — applies to every phase, not just repo setup.
- **Responsive is not optional**, same standing as accessibility — every component works across the full breakpoint scale, not desktop-first with mobile bolted on later.
- **Self-verify before reporting a task done.** Actually run lint/build/test and report real results — never report completion based on code "looking right."
- **Update `guidelines/*.md` directly as decisions are made — no need to ask first, but always surface what changed.** These are the source of truth I control, but chat scrolls away and `guidelines/*.md` persists, so record real decisions as they happen rather than gating every edit on a round trip. **These numbered files are a current-state reference, not a changelog.** A real architecture/API decision — a genuine fork in the road, or something that constrains how future components must be built — gets its own entry in `guidelines/adr/` — effectively immutable once published: a changed decision gets a new superseding ADR, and only a small correction to a detail may be amended in place, marked (see that folder's own README for the template and the rule) instead of being narrated inline; the numbered doc then just points to it (`See ADR-0012`). A component's own review findings (from a `06-engineering-standards.md` §9 pass) go in `guidelines/component-reviews/ComponentName.md` instead (see that folder's own README) — `07-storybook-and-documentation-standards.md` §6 then just links to it via a one-line status-table row. Routine iteration — a debugging dead-end, a step-by-step verification log, an intermediate wrong turn — doesn't get recorded in any of these; it belongs in the commit message. See `guidelines/06-engineering-standards.md` §8 for the full rule (when this applies, and the one carve-out — a rewrite of a standing process rule itself is worth flagging prominently even though it doesn't need pre-approval).
- **Full engineering discipline** (clean code, scalability, performance, error handling, browser/SSR targets, i18n stance) is in `guidelines/06-engineering-standards.md` — read it alongside this file, not as an optional extra.

## Security practices
- **Never commit secrets.** No API keys, tokens, `.env` files, or credentials in the repo, ever — including in commit history, code comments, test fixtures, or Storybook examples. Use `.env.example` with placeholder values to document what's needed.
- **`.gitignore` must cover:** `.env`, `.env.*` (except `.env.example`), `node_modules`, build outputs (`dist`, `.turbo`, `build`), OS/editor cruft (`.DS_Store`, `.vscode/*` except shared settings), and any local credential/config files.
- **Dependency security:** GitHub Dependabot alerts and security updates are enabled; version-update PRs are off (pull requests are enabled for collaborators only, [ADR-0172](guidelines/adr/0172-pull-requests-are-enabled-for-collaborators-only-and-issues-are-on-over-keeping-both-off-or-opening-contributions-to-everyone.md)). Vulnerabilities are handled by hand (`guidelines/02-tech-stack-and-structure.md` §3.1), routine updates in a periodic manual refresh pass. `pnpm audit` runs in CI.
- **Secret scanning:** GitHub secret scanning + push protection (free for public repos) should be enabled at the repo level — flag this to me if it isn't, since it's a repo setting, not something committed in code.
- **Static analysis:** GitHub CodeQL (free for public repos) as a CI job once there's real code to scan — catches common vulnerability patterns (XSS, injection) before merge.
- **Component-level security:** no `dangerouslySetInnerHTML` without explicit sanitization (relevant for anything rendering user-provided content — `CodeBlock`, `Combobox`, rich text areas); no `eval` or dynamic `Function` construction; sanitize any component that accepts and renders external URLs or HTML.
- **Publish security:** releases use npm provenance and trusted publishing (OIDC, no long-lived token stored as a secret, [ADR-0211](guidelines/adr/0211-the-release-job-runs-its-own-checks-and-the-first-publish-is-by-hand-before-trusted-publishing-takes-over-over-relying-on-ci-for-the-version-pull-request-or-a-stored-npm-token.md), `RELEASING.md`), never a classic npm token; 2FA is required on the npm account and the organization. Never store an npm token as a repository secret, even temporarily.
- **A pre-commit guard blocks private and credential material** (`.githooks/pre-commit`: `.local/`, `.env`, key files, credential-shaped text, the strings in the gitignored `.local/blocked-strings.txt`, and a commit email that is not the GitHub no-reply address). Turn it on once per clone with `git config core.hooksPath .githooks`; details in `guidelines/docs-site/06-gitignore-and-private-notes.md`.
- **`guidelines/` is public and permanent.** Never add secrets, credentials, personal identifying information, or client/business-sensitive details to any file in `guidelines/` — the repo is public and git history is effectively permanent, so anything committed there should be treated as visible forever. If a task would involve writing something sensitive into a guideline doc, stop and ask rather than proceeding.

## Repo structure
```
apps/
  docs/            The website's home page (Astro with React islands; Storybook is the documentation,
                     ADR-0220). Built and checked on every push, while dbm-system.com shows the placeholder
                     from .github/pages/ until the home page (S3) is done
  storybook/        Wrapper for the public Storybook build (currently a stub; the build is already
                     published at dbm-system.com/storybook/ by .github/workflows/pages.yml — the
                     Storybook actually used today lives in packages/components/.storybook/,
                     not here)
scripts/            Repo-level checks CI runs from the root: `check-publish` (publint and attw on each
                     packed public package, its packed package.json and the consumer guide's imports and install line) `check-radix-single-copy` (one version of each shared
                     Radix package in the lockfile) `check-manifest` (the component manifest builds,
                     nothing is undocumented, what the build shipped matches the source, and
                     the generated lists in packages/components/AGENTS.md and below in this file are
                     current and what AGENTS.md's text names exists; `sync-agents` rewrites them) and
                     `check-fresh-app` (the packed packages install into an empty app and style a
                     component, bundled with esbuild and webpack; needs Chromium and the network)
packages/
  tokens/           Source of truth for all design tokens (primitive + semantic + component layers)
  utils/             Small framework-agnostic utils (classname merging, ref merging,
                     the `mergeDefined` helper for `labels` props, responsive style
                     helpers, `formatRelativeTime`, the `useAnnouncement` live-region hook, the
                     `useWindowedList`, `useSortable`, `useIsScrollable`, `useScrollEdges` and
                     `useResolvedResponsiveValue` hooks (internal), the persistent-storage
                     helpers `usePersistentDismiss` and `useRecentCommands` share (internal),
                     the `usePersistentDismiss` and `useRecentCommands` hooks, token types) — components import
                     Radix UI Primitives directly, not through this package. What a
                     consumer is meant to call (`usePersistentDismiss`, `useRecentCommands`, `formatRelativeTime`, the `Responsive`/
                     `SpaceValue`/`Breakpoint` types) is re-exported from the
                     components package, so one install covers it
  icons/             Phosphor Icons wrapper
  components/        The actual DBM component library (published npm package; each component's tier and category are in src/componentCatalog.json) — atoms,
                     molecules and organisms, plus src/templates/ (shells that ship,
                     AppShell and PageShell; page-level templates are story-only
                     examples, ADR-0179). Shared internals live in src/internal/. Also holds its own .storybook/ config, src/foundations/
                     (Storybook-only token reference pages) and src/guides/ (the Getting
                     started page and guide pages); neither is shipped in the package)
  manifest/          Private build tool (not published): generates the JSON component manifest
                     from TS + JSDoc; the components build runs it
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
| Building a new component | `guidelines/04-component-inventory.md` (tier + scope); then its entry in `packages/components/src/componentCatalog.json` and a `Components/{Name}` story title (`guidelines/07-storybook-and-documentation-standards.md` §3, ADR-0225) |
| Building a template (a shell that ships, or a story-only page) and in what order | `guidelines/04-component-inventory.md` (Templates, with its build order) and ADR-0179 |
| Unsure about a dependency or tool choice | `guidelines/02-tech-stack-and-structure.md` |
| Overall project goals/scope | `guidelines/01-vision-and-goals.md` |
| A component's props, file structure, or definition of done | `guidelines/05-component-api-conventions.md` |
| Reviewing or finalizing a component, or how to work across sessions | `guidelines/06-engineering-standards.md` (§8 process rules, §9 review checklist) |
| A Storybook story, Docs page, or a story's "Show code" snippet | `guidelines/07-storybook-and-documentation-standards.md` (§4 template, §4.2 snippets) |
| The docs website (plan, structure, landing page, Storybook's role) | `guidelines/docs-site/` |
| Making a release, or anything about npm publishing, trusted publishing or the release workflow | `RELEASING.md` (and ADR-0176, ADR-0211) |
| Understanding *why* a past architecture/API decision was made | `guidelines/adr/` |

To start a session, run `/start [task]` (`.claude/commands/start.md`): with no task it gives a general picture of where the project stands (phase, what is in flight, what is next, flakes and open decisions); with a task it reads only the guidelines that task needs. Either way it verifies against the repo with `pnpm check-guidelines` and reports before any work.

Other project commands, in `.claude/commands/`: `/plan-component <Name>` (propose scope, API and tokens; writes nothing), `/review-component <Name>` (the §9 review as a prioritized list; no edits), `/plan-template <Name>` and `/review-template <Name>` (the same two for a template, a shell or a page), `/refresh-deps` (the §3.2 dependency pass as a plan), `/verify` (the steps CI runs, one after another, on the working tree; `quick` for lint, guidelines and unit tests; read-only), and `/after-push` (classify the push, watch CI if it contained code, report per job).

## Component index (auto-synced)
The list below is generated from the component manifest: every public component by tier and category, then the helpers (components that support another and have no page of their own), the hooks and the functions, names only. `pnpm sync-agents` rewrites it (the same list is in `packages/components/AGENTS.md`) and `pnpm check-manifest` fails in CI when it is stale, so never hand-edit between the markers. Read it before building anything, to see what exists instead of guessing or hallucinating a component; `guidelines/04-component-inventory.md` has each one's tier and scope, and after a build `packages/components/dist/manifest/index.json` has a sentence on each.

<!-- AUTO-GENERATED-COMPONENT-INDEX:START -->

**Atoms**

- Data Display: Avatar, Badge, Skeleton, Tag
- Feedback: ProgressBar, ProgressCircle, Spinner
- Inputs: Button, Checkbox, CloseButton, FieldError, FieldHelperText, FieldLabel, IconButton, Input, Radio, Switch, Textarea
- Layout: Affix, AspectRatio, Bleed, Box, Center, Container, Divider, GridItem, Spacer, Stack
- Media: Icon, Image, Indicators
- Navigation: BackToTop
- Overlay: Backdrop, Collapse, Tooltip
- Typography: Blockquote, Code, Heading, Highlight, Kbd, Link, ListItem, Text
- Utility: ClientOnly, DirectionProvider, FocusTrap, Portal, SkipLink, ThemeProvider, VisuallyHidden

**Molecules**

- Data Display: AvatarGroup, Card, DescriptionList, EmptyState, Pagination, Stat, Table, TableToolbar
- Feedback: Alert
- Inputs: ButtonGroup, Calendar, CheckboxGroup, EditableText, FieldGroup, FormField, NumberInput, PasswordInput, PinInput, RadioGroup, RangeSlider, RatingInput, SearchInput, Select, Slider, TagsInput, TimePicker, TimeRangePicker, ToggleGroup, Toolbar
- Layout: Grid, PageHeader, ScrollArea, Splitter
- Navigation: Breadcrumb, TableOfContents, Tabs
- Overlay: Accordion, HoverCard, Popover
- Typography: CodeBlock, List

**Organisms**

- Data Display: DataTable, Timeline, Tree
- Feedback: Toast
- Inputs: ColorPicker, Combobox, DatePicker, DateRangePicker, FileUpload, Form, MultiSelect
- Media: Carousel, ImageViewer
- Navigation: CommandPalette, EditorTabs, Menu, Menubar, Navbar, NavigationMenu, Sidebar, Stepper
- Overlay: AlertDialog, ConfirmDialog, ContextMenu, Dialog, Drawer, Tour

**Templates**

- Shells: AppShell, PageShell

**Helpers:** HoverCardProvider, ImageViewerButton, TooltipProvider

**Hooks:** useAppShell, useCommandPaletteController, useContextMenuController, useDataTable, useDirection, useFormController, useFormState, useImageViewerController, useMenubarController, usePersistentDismiss, useRecentCommands, useSidebar, useTheme, useToast

**Functions:** createToaster, filterTree, formatRelativeTime, registerCodeLanguage

<!-- AUTO-GENERATED-COMPONENT-INDEX:END -->

If a task requires a decision that isn't covered in `guidelines/`, flag it rather than guessing — these documents are meant to be the standing source of truth, and gaps should get filled in explicitly, not improvised silently.
