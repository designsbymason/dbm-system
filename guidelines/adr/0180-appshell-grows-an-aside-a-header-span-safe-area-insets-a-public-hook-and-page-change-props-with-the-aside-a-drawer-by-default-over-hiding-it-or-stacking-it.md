# 0180 — AppShell grows an aside, a header span, safe-area insets, a public hook and page-change props, with the aside a drawer by default over hiding it or stacking it

**Status:** Accepted · **Date:** 2026-11-05

## Context
The first shell ([ADR-0179](./0179-templates-ship-as-composable-shells-in-the-components-package-with-story-only-example-pages-over-shipping-finished-pages-or-keeping-all-templates-storybook-only.md)) had a sidebar, a header, a main area and a footer. A review of what an application needs found seven gaps that decide its public API: nowhere for a detail pane or a table of contents at the end edge, no header that runs over the sidebar, no clearance for a notch or a home indicator, no skip link for a header that is not a `Navbar`, its state (the header's height) private, a header slot that was said to own the page's banner and does not, and nothing to tell a screen-reader or keyboard user that a single-page app changed page.

## Decision
- **`AppShell.Aside`** is a `complementary` `<aside>` at the end edge, beside the main area, as wide as its `width` or the new `app-shell.aside-width` token (20rem). Below `asideCollapseBelow` (default `lg`) it leaves the page and, by default, its children are drawn in a `Drawer` opened from **`AppShell.AsideToggle`**, the way the sidebar's phone panel works. `asideCollapseTo="hidden"` is the opt-in for content a phone can do without, and then there is no drawer and no toggle. The drawer's open state is controlled or uncontrolled (`asideOpen`, `defaultAsideOpen`, `onAsideOpenChange`) and the collapse step and behaviour are props of the shell, so a server render already has them.
- **`headerSpan`** (`content`, the default, or `full`) says whether the header stops at the sidebar or runs over it.
- **Safe-area insets**: the frame leaves a device's `env(safe-area-inset-*)` clear on every side, through four custom properties (`--app-shell-safe-*`) that a check can stand a value in for. In `scroll="page"` the top inset is the header's own padding, so it covers the strip under a notch.
- **`AppShell.SkipLink`**, a skip link of the shell's own with its own `labels`, for a header that is not a `Navbar`.
- **A public `useAppShell()`** (what scrolls, the header's height, the aside's drawer) and a documented `--app-shell-header-height` custom property, so a bar in the main area can stick below the header. It throws outside a shell.
- **`AppShell.Header` takes `as`** (`div`, the default, or `header`). The shell supplies `<main>`, `<footer>` and `<aside>`; the banner comes from the `Navbar`, or from `as="header"` for a header built without one. A plain `div` by default keeps a `Navbar` from being wrapped in a second banner.
- **`pageKey` and `pageTitle`** are opt-in props on the shell. When `pageKey` changes after the first render, focus moves to `AppShell.Main`, a scrolling main area goes back to its top and `pageTitle` is announced politely. Never on the first render, and nothing happens while `pageKey` is left out.

## Alternatives considered
- **The aside hidden by default, or stacked under the main area** below its step. Hidden loses content a phone needs; stacked pushes the page's own content down the screen. A drawer keeps it reachable and matches the sidebar, with `hidden` kept as an opt-in.
- **Always rendering `<header>` for the header slot.** Gives the shell real ownership, but changes how a `Navbar` behaves and nests two banners.
- **Docs only for the landmark wording.** Honest, but a header built without a `Navbar` would have no banner unless the developer added one.
- **A hook only, or a recipe, for page changes.** No props to learn, but every app has to wire it, and most would not.
- **The collapse step on the aside.** Local, but the toggle lives elsewhere and a server render could not know it, so it would flash on a phone.

## Consequences
- Each addition is public API of a shipped template and enters the manifest with the rest of it.
- One new token, `app-shell.aside-width`, in `03`'s component-token table.
- `Sidebar` and `Navbar` are untouched; the aside's drawer is a `Drawer`, used the way `Sidebar` uses it.
- The header's height observer watches the border box, not the content box, because the safe-area inset is padding that changes when a phone turns.

## Related
`04-component-inventory.md` (Templates), `07-storybook-and-documentation-standards.md`, `component-reviews/AppShell.md`; [ADR-0179](./0179-templates-ship-as-composable-shells-in-the-components-package-with-story-only-example-pages-over-shipping-finished-pages-or-keeping-all-templates-storybook-only.md), [ADR-0177](./0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md).
