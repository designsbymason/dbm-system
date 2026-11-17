# Open items: the design system, the published packages and their pipeline

What is unresolved right now in `@dbm-system/*` and the repository that builds it: decisions waiting on the maintainer, defects and standards
shortfalls found and not yet fixed, work built but not yet reviewed, and the tests and CI steps known to fail now and then. It is an index, not a record: each row is one line and points to the file that holds the detail. The docs website
keeps its own list in [docs-site/05-open-items.md](./docs-site/05-open-items.md); nothing about the website belongs here.

**How it is kept:**

- **A closed item is deleted**, not struck through. How and when it was closed is the commit message's job.
- **A real fork in the road becomes an ADR** ([adr/](./adr/README.md)) and leaves the table; the row's detail link then points to the ADR's own file in `adr/`.
- **Detail stays where it is.** A component's own gaps (a browser not tried, a feature not built) stay in its review file under
  [component-reviews/](./component-reviews/README.md); only an item that needs a decision or a fix is listed here.
- **A change to a Finalized component** needs the maintainer's go-ahead, and the component stays Finalized unless the maintainer says otherwise.
- **A fix ships in a published package**, so it needs a changeset and goes out with the next release (`RELEASING.md`).

**Kinds:** *Decision* (waits on the maintainer), *Defect* (wrong behaviour, found and not fixed), *Standard* (below a WCAG or project standard),
*Check* (suspected, to be confirmed in a real browser first), *Review* (built, its review pass not done), *Flake* (a test or step that fails now and then
and passes on a rerun), *Maintenance* (due on a date or after an event).

| Item | Kind | Affects | Detail | Waits on |
|---|---|---|---|---|
| A pinned `Table` header, and pinned columns, paint over a consumer's sticky bar: `Table`'s layers join the page's own stacking context | Defect | `Table`, `DataTable` | [Table.md](./component-reviews/Table.md) (open defect, with the proposed one-line fix) | The maintainer's go-ahead to fix |
| The same shape in `Tabs` and `Toolbar` (scroll buttons at the sticky step) and in the `AppShell` and `PageShell` layers | Check | `Tabs`, `Toolbar`, `AppShell`, `PageShell` | [Table.md](./component-reviews/Table.md) (the audit table) | A real-browser test of each under a sticky `Navbar` |
| `Checkbox`'s box outline is 2.3:1 on the surface in the two light themes, under the 3:1 a control's edge needs; `Tree` already uses `border.neutral-strong` | Standard | `Checkbox` | [03-token-system-spec.md](./03-token-system-spec.md) (Open questions) | The maintainer's decision |
| `Indicators` is below the 24 × 24 px target size at every size step, with no extended hit area (WCAG 2.5.8) | Standard | `Indicators`, so `Carousel` | [Carousel.md](./component-reviews/Carousel.md) (open findings) | The maintainer's decision |
| `Sidebar` draws its section labels in capitals, which the website's design direction names in its avoid list | Decision | `Sidebar` | [Sidebar.md](./component-reviews/Sidebar.md) | The maintainer's decision |
| The package has no `"use client"` markers, so in the Next.js App Router its modules must be imported from a file that has one | Decision | `@dbm-system/components` | The Frameworks page in Storybook says so; no review file yet | The maintainer's decision |
| `DataTable.Pagination` with `layout="centered"` is built and not reviewed | Review | `DataTable` | [DataTable.md](./component-reviews/DataTable.md) | A review pass |
| `TableToolbar`'s `Filters` group is built and not reviewed | Review | `TableToolbar` | [TableToolbar.md](./component-reviews/TableToolbar.md) | A review pass |

## The repository, CI, release and maintenance

Scheduled maintenance already has its home in [02-tech-stack-and-structure.md](./02-tech-stack-and-structure.md) §3 ("Scheduled maintenance"); the rows below point there instead of repeating it.

**How a flake is handled:** rerun the failed job first; nothing is changed for one failure. A fix is proposed to the maintainer on a third failure of the same check
(not before), and a check that has been hardened stays listed until it has run clean for a release. A flake that is not in the repository's
code (a runner, a registry) is listed only if it can block a release (`RELEASING.md`).

| Item | Kind | Affects | Detail | Waits on |
|---|---|---|---|---|
| The `browser-tests` job runs on a pinned Ubuntu image while GitHub moves `ubuntu-latest` to 26.04 (window ends 2026-11-19) | Maintenance | CI | [02](./02-tech-stack-and-structure.md) §3 (Scheduled maintenance) | 2026-11-19: drop the pin if the job stayed green |
| Dependencies are refreshed by hand and nothing prompts it | Maintenance | The whole repository | [02](./02-tech-stack-and-structure.md) §3.2 and [ADR-0022](./adr/0022-dependency-updates-are-a-manual-refresh-pass-not-dependabot-version-prs.md) | The next refresh pass |
| The accepted `deepmerge` advisory (dev-only, never shipped) stays accepted until a release past the fixed version reaches the registry; the override and its `ignoreGhsas` entry then change together | Maintenance | `packages/tokens` build | [02](./02-tech-stack-and-structure.md) §3.1 and §3 (Scheduled maintenance) | A `deepmerge` release at or past 4.3.2, checked at each refresh pass |
| The accepted `picomatch` advisory (high, build and test tooling only, no patched version exists) stays accepted until a release past 4.0.7 reaches the registry; the `ignoreGhsas` entry then goes | Maintenance | The whole repository's tooling | [02](./02-tech-stack-and-structure.md) §3.1 | A `picomatch` release past 4.0.7, checked at each refresh pass |
| The Radix packages are held on their current release train, because bumping one alone would split shared packages across versions | Maintenance | `@dbm-system/components` | [02](./02-tech-stack-and-structure.md) §3 (Scheduled maintenance) | A decision to move the whole family together, which would supersede the pins in several ADRs; not a security fix |
| The release's Test step fails with `window is not defined` after the tests pass (a slow runner) | Flake | Release workflow | `RELEASING.md` (troubleshooting) | A rerun of the failed job |
| Fails in CI only, passes on a rerun: the `TimePicker` arrow-key check, the `Toolbar` forced-colours check, `tokenize` ratio, the `EditableText` and `RatingInput` forced-colours and hover-preview checks, the `Menu` sheet-submenu check, the `Carousel` effects accessibility check, the `DataTableListPage` announcement unit test, and the `tsup` temporary-file race in lint | Flake | CI | This row is the record; a check's own review file where it keeps one | A third failure of the same check |
| Fails in a full local real-browser Storybook run only, passes alone: the field focus rings, `TimePicker` width, `ConfirmDialog` and `ContextMenu` scrim presses, `Calendar` week hover, `Form` busy state, `DataTableListPage` real-mouse removal, `MultiSelect` list width, `AppShell` print and `ImageViewer` pan-coast | Flake | Local runs | This row is the record | A third failure of the same check; `AppShell` print and `ImageViewer` pan-coast have already failed more than once, so the next failure of either is the trigger |
| Hardened and watched: the `ColorPicker` recent-row close wait (5 s) and the `TableOfContents` row and dropdown checks (a settle wait and 5 s closing waits) | Flake | CI and local runs | This row is the record | A failure after the hardening |
