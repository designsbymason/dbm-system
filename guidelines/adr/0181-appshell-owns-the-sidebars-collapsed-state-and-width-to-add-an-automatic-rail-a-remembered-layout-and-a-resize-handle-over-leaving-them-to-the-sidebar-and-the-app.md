# 0181 — AppShell owns the sidebar's collapsed state and width, to add an automatic rail, a remembered layout and a resize handle, over leaving them to the Sidebar and the app

**Status:** Accepted · **Date:** 2026-11-05

## Context
[ADR-0180](./0180-appshell-grows-an-aside-a-header-span-safe-area-insets-a-public-hook-and-page-change-props-with-the-aside-a-drawer-by-default-over-hiding-it-or-stacking-it.md) left seven layout and responsiveness gaps: a rail between a phone and a desktop, a banner above the header, a content wrapper, a sticky footer, a resizable sidebar, a remembered layout and a cue that the page scrolls. Four of them (the rail, the memory, the resize and part of the cue) need to change or read state that the `Sidebar` held on its own, through a provider the shell merely rendered.

## Decision
- **The shell owns the sidebar's collapsed state** (controlled by `collapsed`, or held by the shell) and hands it to the `Sidebar.Provider` as a controlled value, so every `Sidebar` prop and hook works as before and `onCollapsedChange` reports every change, whoever made it.
- **`railBelow`** collapses the sidebar to a rail below a breakpoint step, and expands it above, on load and each time the window crosses the step. The reader's own toggle holds until the next crossing. Between the drawer's step (`collapseBelow`) and the rail's the sidebar is on the page as a rail.
- **`persistKey`** stores the reader's collapsed state and the sidebar's width in `localStorage`, applied once on the page before paint so a server render and the first client render agree. Only the reader's own changes are stored, never the shell's automatic ones, and only the part left uncontrolled. What was stored wins over `railBelow` for the first frame. Unavailable or broken storage is ignored. The controlled props (`collapsed`, `sidebarWidth` and their handlers) remain for an app that stores the layout elsewhere.
- **`AppShell.Sidebar resizable`** draws a focusable `separator` on the column's inner edge: dragged with a pointer, or moved with the arrow keys (a rem each, four with Shift, Home and End for the bounds, a double press to reset). The width is the shell's (`sidebarWidth`), set on the column as `--sidebar-width`, so a `Sidebar` inside must not have a `width` of its own (a development warning says so). No handle while the sidebar is a rail or in its phone panel. The sidebar's own width transition is off while dragging and for the first frames, so it follows the pointer and a restored layout does not slide in.
- **`AppShell.Banner`** is a strip across the top, above the header and the sidebar. It scrolls away unless `sticky` (`scroll="page"`), and then the header, the sidebar and the aside stick below it. `AppShell.Footer sticky` keeps a bar of actions at the bottom of the window in the same mode. `AppShell.Content` is a `Container` with block padding, for a readable column.
- **A scrolled-edge cue** (`scrolledEdge`, on by default): a shadow under the header while the content is scrolled down from its top, a line over the footer while there is more below. `useAppShell()` reports `scrolled`, `moreBelow`, `collapsed`, `sidebarWidth` and the banner and footer heights.

## Alternatives considered
- **The rail forced below the step, with no toggle.** Predictable, but a reader on a tablet cannot get the labels.
- **No automatic rail, a recipe only.** No new state to own, but few apps would write it, and it flashes the wrong layout.
- **Controlled props only for memory.** No storage to explain, but every app reimplements it, including the flash of the default layout. A saved layout is a UI preference, not personal data.
- **A banner that is always sticky, or never.** Always takes screen height on a phone; never lets a critical notice scroll away.
- **A wider `Sidebar` API** (the sidebar resizing itself, remembering itself). Possible, but the shell already owns the layout around it, and the `Sidebar` would gain two kinds of state for one host.

## Consequences
- The shell's collapsed and width state are public through `useAppShell()` and the existing props; nothing about `Sidebar` changes.
- `localStorage` is touched only when `persistKey` is given. Its entries are `dbm-app-shell:{key}`.
- The sticky parts rely on measuring (`ResizeObserver`, border box), so on the server and for the first paint a banner, header or footer is an ordinary row and starts to stick after it is measured.

## Related
`04-component-inventory.md` (Templates), `component-reviews/AppShell.md`; [ADR-0179](./0179-templates-ship-as-composable-shells-in-the-components-package-with-story-only-example-pages-over-shipping-finished-pages-or-keeping-all-templates-storybook-only.md), [ADR-0180](./0180-appshell-grows-an-aside-a-header-span-safe-area-insets-a-public-hook-and-page-change-props-with-the-aside-a-drawer-by-default-over-hiding-it-or-stacking-it.md).
