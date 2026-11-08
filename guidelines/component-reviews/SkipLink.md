# SkipLink — review findings

**Tier:** Atom · **Category:** Utility · **Priority:** 🟡. **Finalized 2026-11-07**, at the maintainer's declaration, after the first review below, with the items under "Not verified" there accepted as open.

Planned 2026-11-07 with `/plan-component` as stage 2 of the `PageShell` restructure ([PageShell.md](PageShell.md)), approved by the maintainer with the recommendation on all six decisions. Extracted at the third consumer (`Navbar.SkipLink`, `AppShell.SkipLink` and `PageShell.SkipLink` each drew the same link; `05` §1).

## Decisions
- **What it is:** a link that is hidden until it takes keyboard focus, then drawn fixed in the top corner of the window above everything, that jumps past the header to the page's main content. A plain hash link: no script moves focus, and the target needs `tabIndex={-1}` (documented, as `Navbar.SkipLink`'s Docs already did).
- **Composition:** a native `<a>`, no Radix, no dependency. It does **not** build on `VisuallyHidden focusable`: that reveals the content in the page's flow (`position: static`, with `!important` overrides), which would shift the layout, and this link must overlay the page in a fixed corner with a ring and an edge. The atom's own small stylesheet draws the hidden and the revealed state; `VisuallyHidden`'s Docs point here for a skip link.
- **API:** `href` (`'#main'`), `children`, `labels` (`{ skipToContent }`, default "Skip to content", through `mergeDefined`), the standard part props and any native `<a>` attribute; a `forwardRef` to the anchor, stateless.
- **One position only:** fixed at the inline start of the top corner (mirrors in right to left), no `position` prop until an app needs another. Its top offset adds `env(safe-area-inset-top)` itself, so a shell passes nothing.
- **Revealed look:** `z-index.fixed`, `border.default` edge, the standard focus ring (`border-focus`, 2px, offset `space.1`), the elevation shadow (light and dark). Forced colours keep the border and ring in system colours; print hides it.
- **Tokens:** all existing, none new (`bg.surface`, `text.primary`, `border.default`, `border-focus`, `border-width.1`/`2`, `radius.md`, `font-size.sm`, `font-weight.medium`, `space.px`/`1`/`2`/`4`, `z-index.fixed`, the `shadow` pair).
- **Adopters** (Finalized components, each its own behaviour-preserving commit, confirmed): `Navbar.SkipLink` stays a thin wrapper with its props unchanged (it passes `children ?? labels.skipLink`); `AppShell.SkipLink` and `PageShell.SkipLink` keep their `labels` prop. `src/internal/skipLink.module.css` goes, the shells' docs tests stop reading it, and their token tables say "built from `SkipLink`".
- **Tests planned:** unit and axe (default and custom `href`, `children` over `labels`, a `labels` value passed as `undefined`, ref, passthrough); no SSR test (it creates no node or portal of its own, `05`); real browser (a real Tab reveals it in the corner above the page, hidden otherwise at 1px and still the first tab stop, Enter activates it, right to left, forced colours, print), each check broken once.
- **No ADR:** nothing here is a fork that changes how later components must be built; the one fork (no `VisuallyHidden`) is recorded above.

## First review (2026-11-07, at explicit direction)
Found by a real click in Storybook and by reading the stories; all fixed.
- **A real click on the link in a story left the page.** The Playground only prevented the default in Docs view, so the browser followed `#main` and the manager tab ended on the bare preview page. Every story now prevents the default and focuses its target by script, as a router's handler does; the Docs say so.
- **The Enter check asserted nothing.** It now asserts focus lands in the target (a `tabindex="-1"` element) and that the link is not left focused.
- **The demos drew `<main id="main">` three times on one Docs page.** Each demo's target is now a `div` with its own id (the Playground's follows its `href` control).
- **A long translated label ran off a phone's window.** `max-inline-size: calc(100% - 2 * space.4)` and wrapping; a phone check measures both edge gaps (broken once: it failed). A dark-theme check asserts the dark shadow (broken once: it failed).
- **Smaller:** the demo uses the `Kbd` atom; the Playground's code omits the default words; a test whose name promised a spread order now says what it checks; the Docs gained an example of native attributes in a client router's app, a router note, and `labels`' default in the Properties table.
- **Docs page looked at** (every section, no duplicate ids from the page, Properties and Show code as written, no horizontal overflow at 390px). **Not verified:** the Docs page and every theme in both brands by eye (the dark shadow is asserted by a check), a real screen reader, Safari and Firefox.
