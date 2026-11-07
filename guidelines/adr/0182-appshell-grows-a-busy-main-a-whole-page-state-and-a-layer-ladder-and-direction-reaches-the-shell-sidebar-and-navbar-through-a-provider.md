# 0182 — AppShell grows a busy main, a whole-page state and a layer ladder, and direction reaches the shell, sidebar and navbar through a provider

**Status:** Accepted · **Date:** 2026-11-06

## Context
After [ADR-0181](./0181-appshell-owns-the-sidebars-collapsed-state-and-width-to-add-an-automatic-rail-a-remembered-layout-and-a-resize-handle-over-leaving-them-to-the-sidebar-and-the-app.md) the shell had layout but no way to say "this page is loading", "there is nothing here" or "this failed". It also still passed `dir` by hand to the `Sidebar` and `Navbar` inside it, although [ADR-0177](./0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md) had decided on a provider, and its sticky parts shared the `sticky` z-index step with a consumer's `Affix`, so in page mode an `Affix` later in the DOM painted over the shell's header.

## Decision
- **`DirectionProvider` and `useDirection(own?)`** are built now, as an atom (context only, no element). `useDirection` returns the component's own `dir`, else the provider's, else `"ltr"`. `AppShell`, `Sidebar` and `Navbar` use it, and `AppShell` wraps its children in a provider carrying its own resolved `dir`, so a part inside needs none. The layout direction still comes from the DOM `dir` attribute, which the shell sets. The other direction-aware components (about twenty) follow in later passes, each a small additive change.
- **`busy` on `AppShell.Main`**, with `labels.loading`: `aria-busy`, a zero-height sticky strip holding a thin indeterminate `ProgressBar` along the top edge (below the banner and header in page mode), and a polite status region that says "Loading" and empties when `busy` turns off. Left out (`undefined`), none of it is rendered. The page is not hidden or disabled.
- **`AppShell.State`**, built on `EmptyState`: `kind` (`empty` | `error`), `title` (the page's `h1` by default, `level`), `description`, `icon`, `actions`. `error` uses the danger tone and a live region. It centres in the main area.
- **A layer ladder** as custom properties: page content (the `sticky` step) < sidebar, aside and footer (+1) < header (+2) < banner (+3); the skip link stays on `fixed`. Floating panels remain above.

## Alternatives considered
- **A `dir` prop on every part, by hand** (status quo): works but repeats itself and cannot be set once.
- **Detect the document direction automatically:** rejected in ADR-0177.
- **A full-page overlay for busy:** hides the page and traps nothing useful; a bar and an announcement keep what is already shown.
- **`State` as a loose `EmptyState` the app places itself:** loses the centring and the heading level the shell can guarantee.
- **A larger z-index for the whole shell:** would put the shell over menus and dialogs.

## Consequences
- `DirectionProvider` is a new public atom (inventory 116, v1 70).
- Sidebar and Navbar change additively (their `dir` default now comes from the provider); both stay Finalized.
- A demo or app that passed `dir` to the parts still works: an own `dir` wins.
- The shell's CSS gains `--app-shell-layer-*` and its docs gain the `space.6` token row.

## Related
[ADR-0177](./0177-an-optional-direction-provider-sets-the-text-direction-for-a-subtree-over-reading-the-page-direction-automatically.md), [ADR-0179](./0179-templates-ship-as-composable-shells-in-the-components-package-with-story-only-example-pages-over-shipping-finished-pages-or-keeping-all-templates-storybook-only.md), [ADR-0181](./0181-appshell-owns-the-sidebars-collapsed-state-and-width-to-add-an-automatic-rail-a-remembered-layout-and-a-resize-handle-over-leaving-them-to-the-sidebar-and-the-app.md); `04-component-inventory.md`; `component-reviews/AppShell.md`.
