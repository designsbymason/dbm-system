# PageHeader — review findings

**Tier:** Molecule · **Category:** Layout · **Priority:** 🟡.

Planned 2026-11-07 with `/plan-component` as stage 5 of the `PageShell` restructure ([PageShell.md](PageShell.md)), approved by the maintainer with the recommendation on all eight decisions. Extracted from three hand-built copies of the same row: `PageShell.PageHeader`, `AppShell`'s demo page and the Data Table List Page's heading row.

## Decisions
- **What it is:** the head of a page: an optional trail of breadcrumbs, the title as the page's heading, a description, a row of metadata and the page's actions. Not navigation (`Navbar`, `Tabs`), not a landmark, not a card header (`Card.Header`).
- **Composition:** the `Heading` and `Text` atoms; a `Breadcrumb`, `Badge`/`Tag` and buttons are passed in. No new dependency, no Radix. Its layout is its own small stylesheet over existing tokens (`Stack` cannot wrap a text block and an actions block as one unit).
- **A compound component:** `PageHeader` (root, a `<div>`, or `<header>` with `as`), `.Breadcrumbs`, `.Title` (a `Heading`, `level` 1, a `forwardRef` with native props so the list page can focus it), `.Description` (`Text`, secondary), `.Meta` (a wrapping row under the description) and `.Actions` (a wrapping row). The root puts every part but `Actions` in one text column and `Actions` beside it, by reading its direct children; `Actions` must be a direct child.
- **Root props:** `size` (`sm`, `md` default, `lg`: a subset of the shared scale, set on the title and description steps and the gaps, passed to the parts through a context) and `bordered` (a line under the header, default `false`), `as`, and the standard props.
- **Layout:** one row, the actions wrapping under the text where they do not fit (`flex-wrap`, no query), aligned to the top of the row as the list page draws it. Right to left mirrors by itself.
- **No landmark and no new tab stop.** One `h1` per page is documented.
- **Tokens:** all existing, none new (`space.1`/`2`/`4`/`32`, `border.default`, `border-width.1`).
- **No leading `Media` part** until an app needs one.
- **Adoption (each its own behaviour-preserving commit, confirmed):** `PageShell.PageHeader` is removed and the shell's demo uses the molecule; the Data Table List Page's heading row (its title keeps taking focus after a removal, its checks unchanged); `AppShell`'s story kit (docs-only; `AppShell` is Finalized).
- **Tests planned:** unit and axe (defaults, `level`, `size`, `as`, the title's ref and `tabIndex`, passthrough, nesting, no title); no SSR test (it creates no node or portal of its own, `05`); real browser (the actions beside the text on a desktop and under it on a phone, a very long title without page overflow, right to left, forced colours for the border), each broken once.
- **No ADR:** nothing here is a fork that changes how later components must be built.

## Built (2026-11-07)
All parts as planned; no new token.
- **Unit (16, with axe):** the title as the h1 with the description under it; the text column and the actions beside it (a fragment looked through, order kept, no column for actions alone); the title and description steps of `sm`, `md` and `lg` (a part outside a header gets `md`, a nested header's size does not leak out); `as`; the title's level, `ref` and `tabIndex` (focus can be moved to it); a ref on every part; `className`, `style`, `id` and `data-testid` on every part; native passthrough; an empty header without a warning; axe for a full header and for a section's. A jsdom test that a `<header>` inside `main` is no banner was dropped: jsdom's role map calls every `header` a banner, so it cannot know.
- **Real browser (6):** the actions beside the text, level with its top and at the end edge; under it in a narrow box, at the start edge; a title that cannot break; right to left; the line under a bordered header; the line in forced colours. **The long-title check found a real defect** in the first build (an unbroken word widened the header to 623px in a 321px box); `.text` now has `overflow-wrap: anywhere`. Broken once each (the wrap, the wrapping rule, the border), five failed; the right-to-left check relies on flex mirroring and was not broken.
- **Docs:** the page follows the `07` §4 sections; the code examples show native attributes in use (a `ref` and `tabIndex` on the title, an `aria-label` on the header); the token table is held to the stylesheet by a test.
- **Adopted (behaviour-preserving):** `PageShell.PageHeader` is removed (its types, CSS, stories, Docs section, snippet and test) and the shell's demo uses the molecule; the Data Table List Page's heading row is the molecule (its title keeps taking focus after a removal, and its 18 real-browser and 38 unit checks pass unchanged), with its "Show code" updated; `AppShell`'s demo pages use it (docs-only).
- **Review pass complete, awaiting a `/review-component` and the maintainer's Finalized declaration.** **Not verified:** Safari and Firefox, a screen reader, both brands in light and dark by eye, tablet widths by eye.
