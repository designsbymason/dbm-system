# DBM System — Monorepo Structure & Tech Stack

## 1. Accessibility primitives

Radix UI Primitives (`@radix-ui/react-*`) is the foundational, unstyled dependency for interaction/accessibility logic — see `guidelines/adr/0004` for why (over hand-rolling it) and what that decision constrains going forward.

---

## 2. Monorepo layout

```
dbm-system/
├── apps/
│   ├── docs/                    # Documentation website (Next.js, built later) — currently an empty stub
│   └── storybook/               # Hosted *public* Storybook instance (Phase 9) — currently an empty stub;
│                                 # not where Storybook actually lives today, see note below
│
├── packages/
│   ├── tokens/                  # Design tokens — single source of truth
│   │   ├── src/
│   │   │   ├── primitive/       # Raw values, no meaning — color.json, typography.json, spacing.json,
│   │   │   │                    # radius.json, shadow.json, breakpoint.json, motion.json, other.json
│   │   │   ├── semantic/        # One file per theme (brand × mode) — purple-light.json, purple-dark.json,
│   │   │   │                    # emerald-light.json, emerald-dark.json
│   │   │   └── component/       # One file per component that needs one — avatar.json, badge.json,
│   │   │                        # icon-button.json, ...
│   │   ├── style-dictionary.config.js
│   │   └── build/                # generated: css vars, JS/TS exports, (later) RN objects
│   │
│   ├── utils/                    # Small framework-agnostic utils, not a Radix wrapper (see note below)
│   │   └── src/
│   │       ├── hooks/            # useResolvedResponsiveValue, useAnnouncement, usePersistentDismiss, useIsScrollable, useScrollEdges
│   │       ├── utils/            # cx (classname merging), mergeDefined (per-key defaults for a `labels` prop), mergeRefs, responsiveStyle
│   │       └── types/            # shared token types
│   │
│   ├── icons/                    # Phosphor wrapper — curated re-export + typed icon prop
│   │   └── src/
│   │
│   ├── components/                # The actual DBM component library (this is the npm package)
│   │   ├── src/
│   │   │   ├── atoms/            # Built atoms — the list and each one's status: `04-component-inventory.md` and `07-storybook-and-documentation-standards.md` §6
│   │   │   ├── molecules/        # Built molecules — same two places
│   │   │   ├── organisms/        # `Dialog` so far; the rest in the build order in `04-component-inventory.md`
│   │   │   ├── templates/        # Not started yet — page-level layout scaffolds (optional, later)
│   │   │   ├── internal/         # Pieces shared by two or more components that are not part of the public API and are not exported: `OverlayArrow` (the arrow on `Popover` and `HoverCard`), `useViewportRoom` (the room around a field on the part of the page that is visible, for `Combobox` and `DatePicker`), `overlay/` (the sections a modal panel is made of — header, title, description, scrolling body, footer, corner close button, the `divided` lines, and the `keepMounted` host — shared by `Dialog`, `AlertDialog` and `Drawer`, plus `useReturnFocus` and `menuInvokers`, which give focus back to what opened an overlay, including a context menu's area), `fieldGroupContext` (the `disabled` and `size` a `FieldGroup` hands to the `FormField`s inside it), `time/` (the pure time model — parsing, drafts, stepping, digit entry — shared by `TimePicker` and `TimeRangePicker`) and `date/` (the pure date model — parsing, month grids, day and month arithmetic, key moves — behind `Calendar`, and, with `dateEntry` (the typed-entry rules for a date's day, month and year segments), behind `DatePicker`; `DateRangePicker` will share it)
│   │   │   ├── foundations/      # Storybook-only Foundations pages (*.mdx) — not shipped in the package
│   │   │   ├── styles/           # global.css, resets, css var consumption
│   │   │   ├── snippetHelpers.ts # helpers for the "Show code" snippet builders — docs-only, not shipped
│   │   │   └── storySnippets.test.ts  # guard test for every *.snippets.ts (ADR-0020)
│   │   └── .storybook/           # The real, active Storybook config/build lives HERE, not in
│   │                              # apps/storybook/ above — see note below
│   │
│   ├── manifest/                  # Build tool: generates JSON component manifest from TS + JSDoc
│   │   └── src/
│   │
│   ├── eslint-config/              # Shared lint rules
│   └── tsconfig/                   # Shared TS configs
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

**Why this split:** `tokens`, `utils`, `icons`, and `components` are separately versioned/publishable packages. This lets consumers (or you, later, for React Native) depend on `tokens` and `utils` independently without pulling in the full styled component set — and keeps the manifest generator decoupled from the components themselves.

**Where Storybook actually lives:** `apps/storybook/` was the originally-planned home for a *public-hosted* Storybook instance (Phase 9, not built — the directory is a stub `README.md`). The Storybook that is built and run today (`pnpm --filter @dbm-system/components run storybook`, the Docs pages, the `.storybook/blocks/*` MDX building blocks, everything in `07-storybook-and-documentation-standards.md`) lives entirely under `packages/components/.storybook/`, shipping alongside the component source it documents rather than as a separate app. `apps/storybook/` may later host a deployed build of that same instance; it is not a second Storybook setup.

**What `utils` holds.** A small set of framework-agnostic utilities and hooks shared across components. It is not a Radix wrapper: every component that needs Radix imports `@radix-ui/react-*` directly as a dependency of `packages/components`, and `utils` has no Radix dependency of its own. `FocusTrap` and similar components implement their Radix-wrapping logic in `packages/components`.

- **Utils:** `cx` (classname merging), `mergeRefs`, `responsiveStyle`, `mergeDefined` (per-key defaults for a `labels` prop), and the shared token types.
- **Hooks**, each extracted once a second component needed it:

| Hook | What it does | Used by |
|---|---|---|
| `useResolvedResponsiveValue` | Resolves a breakpoint map in JS (`matchMedia`), for a responsive value CSS can't drive | `Divider`, `Popover`, `Tabs`, `Toolbar`, `ToggleGroup` and others |
| `useAnnouncement` | The timing half of a screen-reader announcement: put text into an already-present live region a moment later, then clear it | `Pagination`, `EmptyState`, `Calendar`, `Stat`, `CodeBlock`, `TableToolbar` |
| `usePersistentDismiss` | Remembers a dismissal across visits ([ADR-0023](adr/0023-one-alert-with-banner-and-sticky-options-and-a-separate-persistence-hook.md)) | `Alert`; also meant for consumers to call |
| `useIsScrollable` | Whether a scroll container overflows along an axis, so it is a keyboard-reachable region only while it scrolls (ADR-0019, ADR-0028) | `ScrollArea`, `Table`, `Splitter.Pane` |
| `useScrollEdges` | Which end of a scrolling container has more, for edge fades and scroll buttons; takes an optional `itemSelector` and `enabled` | `Tabs`, `Toolbar` |

**What `packages/components` re-exports from it:** only what a consumer is meant to call or name — `usePersistentDismiss` with its types, and the helper types `Breakpoint`, `Responsive` and `SpaceValue` that many components' public props use (type-only, no bundle cost; `src/test/publicExports.test.ts` asserts they are the very types `utils` defines). Never the internals (`cx`, `mergeRefs`, `useAnnouncement`, `useResolvedResponsiveValue`). **Icons are deliberately not re-exported:** `@dbm-system/icons` is the whole Phosphor set, whose `Icon` type would collide with this package's own `Icon` component, so a consumer imports icons from that package (a documented second import, not a second copy of everything).

---

## 3. Tech stack

| Layer | Tool | Why |
|---|---|---|
| Language | TypeScript (strict mode) | Types double as the source for the agent manifest; non-negotiable for a serious component API |
| Monorepo orchestration | Turborepo | Fast incremental builds/caching across packages; simpler than Nx for a library-focused monorepo |
| Package manager | pnpm | Efficient workspace linking, strict dependency isolation (avoids phantom deps — important for a "limited deps" goal) |
| Framework target | React 18+ | Your stated target; keep an eye on RSC/Server Component compatibility for components that don't need interactivity |
| Accessibility/interaction primitives | Radix UI Primitives | See section 1 — foundational, unstyled, industry-standard |
| Styling | CSS Modules + CSS Custom Properties | Scoped classnames at build time, zero runtime cost, tokens flow in as CSS vars |
| Token pipeline | Style Dictionary | Single JSON source → CSS vars (web), TS constants (typed token access), future RN output |
| Icons | Phosphor Icons (`@phosphor-icons/react`), wrapped | Wrap in a typed `Icon` component so swapping/theming icon weight & size is centralized |
| Motion | CSS transitions/keyframes by default; Motion (Framer Motion successor) as an **optional peer dependency** for complex sequences | Keeps the core dependency-light; consumers who don't need rich motion don't pay for it. **Approved, not yet installed:** no component has needed a Motion-driven sequence, so `motion` is in no `package.json`. It stays an *optional* peer, added the first time a component genuinely needs it, not pre-installed speculatively. |
| Build (component packages) | tsup (esbuild-based) | Fast, simple ESM+CJS+d.ts output, minimal config |
| Testing (unit/behavior) | Vitest + React Testing Library | Fast, ESM-native, pairs well with Vite/tsup toolchain |
| Accessibility testing | jest-axe | Automated a11y regression checks per component. Chosen over vitest-axe, which has had a single early release and no follow-up; jest-axe works under Vitest because Vitest's `expect` is Jest-API-compatible |
| Visual regression | Playwright's built-in screenshot/snapshot testing, self-hosted | Fully open-source and free, no SaaS account needed — trade-off is you host/diff the snapshot artifacts yourself (e.g. as CI artifacts) rather than getting Chromatic's hosted review UI. **Screenshot baselines are per-platform** (Playwright suffixes each with the OS): `e2e/visual.spec.ts-snapshots/*-darwin.png` for local macOS runs and `*-linux.png` for CI's Ubuntu runner, both committed. A Linux baseline can't be generated on a Mac — after an intentional visual change, regenerate `-darwin` locally with `pnpm test:visual:update`, then for `-linux` push, let the `browser-tests` job write its actual image, and copy it out of that run's `playwright-report` artifact (`gh run download <id> -n playwright-report`; the one `.png` under `data/`) into the snapshots folder. Playwright's webServer command starts Storybook with `pnpm storybook --ci --quiet` — no `--` before the flags (pnpm 11 forwards it literally and Storybook exits), a failure that only appears in CI because locally the running dev server is reused. |
| Component workshop | Storybook 10 | OSS; also doubles as living documentation and the base for the future public-hosted instance |
| Component/story testing | `@storybook/addon-vitest` (Vitest browser mode, `@vitest/browser-playwright` provider, reuses the already-approved Playwright install) | Runs every story and its `play` function as a real Vitest test in Chromium, so a broken interaction fails CI. It is also what the Accessibility addon's automatic scan is gated behind in this Storybook version (`guidelines/adr/0003`). Dev-only, never shipped, so not subject to the runtime dependency budget in `CLAUDE.md`. `pnpm test:storybook` is one-shot (what CI runs; no dev server needed) and `pnpm test:storybook:watch` must run alongside `pnpm storybook` for the live sidebar indicators and Accessibility panel. Its browser-mode Vitest project (`vitest.config.ts`'s `test.projects`) sits beside the jsdom `unit` project and deliberately does *not* inherit `src/test/setup.ts`, which stubs browser APIs jsdom lacks: right for jsdom, wrong in a real browser. |
| Docs-page Markdown extensions | `remark-gfm` | This Storybook install's MDX compiler (`@storybook/addon-docs`) has no GFM support out of the box, so a plain `\| Key \| Behavior \|` table in a `ComponentName.mdx` Docs page would render as raw pipes and dashes. Wired in through `.storybook/main.ts`'s `addons` array, registering `@storybook/addon-docs` in its object form with `options.mdxPluginOptions.mdxCompileOptions.remarkPlugins: [remarkGfm]` (the addon's own extension point; `StorybookConfig` has no generic `options` field to hang it on). Dev-only Storybook tooling, never shipped — not subject to the runtime dependency budget in `CLAUDE.md`. |
| Docs site (later) | Next.js or Astro (both OSS frameworks) | Pairs naturally with MDX for component docs + the manifest data |
| Static hosting (docs site + Storybook) | GitHub Pages, or Cloudflare Pages free tier | Both free for public/OSS projects with no usage-based billing risk; GitHub Pages is the simplest since the repo is already on GitHub |
| Versioning/release | Changesets | OSS; per-package semver, changelog generation, monorepo-aware. **Configured, not yet wired into CI:** `.changeset/config.json` exists and `pnpm changeset` works locally, but no workflow runs `changeset version`/`changeset publish` — there is no `changesets/action` step or release workflow in `.github/workflows/`. Building that pipeline is Phase 8 scope (`01-vision-and-goals.md` §13); don't describe it as a current CI step. |
| Linting/formatting | ESLint + Prettier (shared config package) | OSS; consistency enforced at the workspace level |
| CI | GitHub Actions | Free for public repos. Two jobs. `ci`: lint (including the `.storybook` typecheck), build, the per-component bundle-size and Foundations token-coverage checks, `pnpm audit`, `build-storybook` plus its bundle-size tripwire, `check-guidelines` (warn-only; `06-engineering-standards.md` §8) and `test` (`06` §4 and `07-storybook-and-documentation-standards.md` §10 say what each checks). `browser-tests`: visual regression plus `test:storybook`, together because both need the same workspace build and Playwright setup. **`browser-tests` is pinned to `ubuntu-26.04`, not `ubuntu-latest`:** it installs Chromium's OS packages and compares screenshots against a baseline, and `ubuntu-latest` moves to 26.04 gradually between 2026-10-19 and 2026-11-19, which could flip a run between images. It moved from 24.04 on 2026-10-22, and the 24.04 leg was dropped the same day. `ci` and CodeQL stay on `ubuntu-latest`. **Every Action is pinned to a major on a supported Node runtime**; the workflow files in `.github/workflows/` are the source of truth for versions. The changeset release pipeline is not a CI step yet (see the Versioning/release row). |
| Security: dependency scanning | GitHub Dependabot (alerts and security updates), plus `pnpm audit` in CI | Free, native to GitHub. **Version updates are off** (`open-pull-requests-limit: 0` in `.github/dependabot.yml`): pull requests are disabled on this repo (sole maintainer, no external PRs), so Dependabot could only push branches nobody sees or CI-tests. Vulnerabilities are handled by hand per §3.1 below; routine updates, including the GitHub Actions pins in `.github/workflows/`, are taken in a periodic manual refresh pass (`pnpm update`, full CI, check the Actions versions). Turning version updates back on means enabling pull requests and raising those limits. |
| Security: secret scanning | GitHub secret scanning + push protection | Free for public repos; a repo setting, not a dependency — must be enabled at the GitHub repo level. **Last verified enabled 2026-09-20** (secret scanning and push protection both on, via the repo API), along with Dependabot security updates. |
| Security: static analysis | GitHub CodeQL | Free for public repos; catches common vulnerability patterns (XSS, injection) in CI |
| Security: publish auth | npm provenance / trusted publishing (OIDC) | No long-lived npm tokens stored as CI secrets; used when the Phase 8 publish pipeline is built |
| Manifest generation | react-docgen-typescript (custom build step in `packages/manifest`) | OSS; extracts props/types/JSDoc into the machine-readable JSON contract for agents. **Planned tool choice, not yet built:** `packages/manifest` is scaffolding — `src/index.ts` is an empty `export {}` and `package.json` is at `0.0.0` with no `react-docgen-typescript` dependency yet. Phase 8 (`01-vision-and-goals.md` §13) is when it gets built; don't read this row as describing something already running. |

---

## 3.1 Dependency vulnerability remediation pattern

When `pnpm audit` or a GitHub Dependabot alert flags a vulnerable package, first check whether it is a **direct** dependency (bump it normally in the relevant `package.json`) or a **transitive** one pulled in by a tool we don't control the version of. This project's dependencies are almost entirely dev/build tooling (ESLint, Storybook, Vite, Vitest, Changesets), so it is usually the latter. For a transitive vulnerability, force the resolution through `pnpm-workspace.yaml`'s top-level `overrides` field instead of waiting for the upstream consumer to bump it. Each override carries a comment there with its advisory and reason. Rules learned the hard way:

- **Cap the upper bound; don't only set a floor.** `undici: ">=7.29.0"` (the advisory's patched floor) let pnpm resolve `undici@8.x`, which broke every test run because `jsdom` deep-`require()`s a path that exists only in the 7.x line it declares support for. Check what major the real consumer declares (`pnpm view <consumer>@<version> dependencies`) and cap to match unless the next major is verified compatible. This applies to **every** override, including old ones: a floor-only override floats onto the next major when one ships (it moved `nanoid` onto an unsupported 6.x and `js-yaml` onto a vulnerable 5.x). Audit any floor-only override at each refresh pass.
- **A bump can break a consumer that relies on internals or a changed export shape.** `brace-expansion` >=2 exports `{ expand }` where 1.x exported a callable default, so `minimatch@3.1.5` (hard-coded to the old shape) needs the override paired with a `patchedDependencies` entry (`patches/minimatch@3.1.5.patch`, a two-line shim accepting either shape). If a plain override breaks something, check for a compatibility-shape mismatch before assuming the override is wrong.
- **A plain `pnpm update` can leave a transitive package below the patched floor** (the lockfile kept `vite@8.1.5` while `8.1.6` and later existed): force the floor with a capped override (`vite: ">=8.1.6 <9.0.0"`), then check `pnpm why` resolves the new version.
- **One package can exist at several majors at once**, each wanted by a different consumer (`js-yaml` was 3.x via `read-yaml-file` and 4.x via `@changesets/parse`). A single blanket key can't patch both; use a parent-scoped override, which pins one consumer's copy (`"@changesets/parse>js-yaml": ">=4.3.1 <5.0.0"`).

**Always verify after any override change**, not just that `pnpm install` succeeds: `pnpm audit` (zero known vulnerabilities), then the full pipeline — `tsc --noEmit`, `eslint`, the full Vitest suite and a real `pnpm -r build` across the workspace. A broken transitive resolution surfaces as a runtime failure in tooling, not as a type or lint error.

### Advisories with no patched version

An override can't pin to a fix that doesn't exist. Don't trust an audit tool's own "patched in X" line: confirm against the npm registry and GitHub's advisory data (`first_patched_version`). **First look for a way to take the package out of the tree** (`pnpm why <package>`): a newer major of the one consumer that pulls it in may not depend on it at all (`read-yaml-file` 2 moved Changesets off `js-yaml` 3 and with it `sprintf-js`, which had no fix; the override sits in `pnpm-workspace.yaml`). Check the consumer's API is unchanged, then run the whole pipeline. Only if it can't be removed, assess whether the vulnerable code is reachable with this repo's real inputs, record the decision, and wait for upstream rather than hand-patching a security-critical algorithm.

**Don't dismiss the Dependabot alert** — that is a call for whoever owns the repo's security settings. `pnpm audit` exits non-zero on any open advisory, including assessed ones, so an accepted advisory goes into `pnpm-workspace.yaml`'s `auditConfig.ignoreGhsas` with a comment (CI's audit step reads the same file, so local and CI runs agree). Ignore by specific advisory ID, never with the blanket `--ignore-unfixable`, which would silently swallow every future unfixable advisory. **Remove the entry the same day a real fix ships and is pinned by an override** — leaving it would mask the fix.

Currently accepted:

| Advisory | Package | Reached through | Why accepted | Exit condition |
|---|---|---|---|---|
| GHSA-vfj7-8cjw-p6xm (CVE-2026-93687), stack-overflow DoS in recursive AST walkers | `braces` | `micromatch`, dev-only, through `@changesets/cli`'s `@manypkg/get-packages` → `globby` → `fast-glob`; used at release time to find this repo's own workspace packages | Never shipped in a published package. The only glob patterns it receives come from this repo's own `pnpm-workspace.yaml`, which is trusted configuration; exploiting it needs write access to that file already | A `braces` release past `3.0.3` (watch micromatch/braces#72) |


## 3.2 Manual dependency-refresh pass

Dependabot version updates are off ([ADR-0022](adr/0022-dependency-updates-are-a-manual-refresh-pass-not-dependabot-version-prs.md)), so nothing prompts a routine update: it is a deliberate pass, not a reaction. Vulnerabilities are separate — §3.1, handled whenever `pnpm audit` or an alert flags one.

**Cadence:** every few weeks, and before a release. There is no automated reminder.

**The pass:**
1. Review `pnpm outdated -r`, then update.
2. Run locally what CI runs — `pnpm audit`, `pnpm lint`, `pnpm build`, `pnpm test`, and `pnpm --filter @dbm-system/components test:storybook` for the real-browser project — then push and read the CI result.
3. **GitHub Actions pins** in `.github/workflows/`: for each `uses:`, check for a newer major and read the `runs.using` runtime in that version's `action.yml`. Every pin should declare a runtime GitHub still supports (`node24` as of 2026-09; a Node 20 removal was what forced the bump on 2026-09-20). Read its release notes against the inputs the workflows actually pass it, not against everything it accepts.
4. **The Radix packages move together.** Each `@radix-ui/react-*` package pins its own copies of `dismissable-layer`, `focus-scope`, `portal`, `presence` and `primitive`, and two copies of one mean two layer stacks: a popover opened from a dialog stopped being clickable with no error. After any Radix bump, check the lockfile resolves a single version of each (`grep "react-dismissable-layer@" pnpm-lock.yaml`), and move `@radix-ui/react-dialog` and `@radix-ui/react-alert-dialog` (which depends on one exact version of it), both pinned exactly for this reason ([ADR-0052](adr/0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md)), and `@radix-ui/react-dropdown-menu` and `@radix-ui/react-context-menu`, pinned exactly the same way on the `react-menu` they share (2.1.24 and 2.3.7; the next release of each moves `react-menu` and splits the stack, [ADR-0064](adr/0064-menu-wraps-radix-dropdown-menu-on-the-pinned-release-train-holds-its-own-open-state-is-modal-by-default-and-opens-on-arrowup.md), [ADR-0118](adr/0118-contextmenu-wraps-radix-contextmenu-pinned-at-2-3-7-on-the-menu-release-train-holds-its-own-open-state-and-is-modal-with-a-long-press-over-the-newest-release-or-a-hand-rolled-trigger.md)), and `@radix-ui/react-toast`, pinned exactly the same way (1.2.23 shares the installed copies; 1.3.0 needs `dismissable-layer` 1.2.0 and would split the stack, [ADR-0069](adr/0069-toast-wraps-radix-toast-pinned-at-1-2-23-on-the-shared-layer-stack-over-a-hand-rolled-toast-or-the-newest-release.md)), with `popover` and the rest.
5. After a Storybook bump, re-verify per `07-storybook-and-documentation-standards.md` §9, and read the real-browser result before the push: a bump can bring a newer `axe-core` whose new rules fail stories at once (10.6 brought 4.14 and its Label in Name rule). Fix the components ([ADR-0112](adr/0112-an-interactive-controls-accessible-name-holds-its-visible-text-as-whole-words-in-order-over-a-name-that-only-means-the-same.md)); do not pin axe back. After a Playwright bump, confirm it supports the Ubuntu image `browser-tests` runs on (support arrives per Playwright version; Ubuntu 26.04 needed 1.61 or later) and that the visual baseline still matches.

**Adding a dependency while Storybook is running.** The dev server's pre-bundle cache can end up serving two copies of React to the new package (an "Invalid hook call … reading 'useMemo'" from the new component), while the real-browser Vitest run passes. A plain restart did not clear it; deleting `packages/components/node_modules/.cache/storybook` and restarting did.

**Testing a workflow change.** CI triggers only on pushes to `main` and on pull requests, and pull requests are disabled, so there is no branch a workflow can be tried on: the only real test is a push to `main`.
- Keep such changes small, one concern per commit, and validate the YAML locally first.
- For anything uncertain, add an informational leg (`continue-on-error: true`) instead of changing the required one.
- A `continue-on-error` job shows green even when a step failed, so read its per-step results.
- `actions/upload-artifact` v4 and later rejects two uploads of the same artifact name in one run, so matrix legs need distinct names.

**Scheduled maintenance:**
- After GitHub finishes moving `ubuntu-latest` to Ubuntu 26.04 (its stated window is 2026-10-19 to 2026-11-19): return `browser-tests` to `ubuntu-latest` (drop the `ubuntu-26.04` pin), provided it has stayed green. Keep the pin instead if it has flaked, and check whether GitHub has announced when the 24.04 image goes away — the announcement gave no date. Then update the CI row above.
- The accepted advisory in §3.1 (`braces`): at every refresh pass, check the registry for a release past the version in the table's exit condition. When one ships, add and cap the override the normal way **and remove the matching entry from `pnpm-workspace.yaml`'s `auditConfig.ignoreGhsas`**.
- Phase 8: the release flow versus disabled pull requests — `01-vision-and-goals.md` §13.

---

## 4. What's deferred

See `01-vision-and-goals.md` §6 ("Explicitly deferred") — the authoritative, complete list. Not duplicated here to avoid the two copies drifting out of sync with each other.
