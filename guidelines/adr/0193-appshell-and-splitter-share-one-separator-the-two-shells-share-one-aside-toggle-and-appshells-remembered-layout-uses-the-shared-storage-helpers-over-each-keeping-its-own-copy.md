# 0193 — `AppShell` and `Splitter` share one separator, the two shells share one aside toggle, and `AppShell`'s remembered layout uses the shared storage helpers, over each keeping its own copy

**Status:** Accepted · **Date:** 2026-11-08

## Context
A template composes existing components and builds no pattern of its own (`06` §9). A review of `AppShell` against that rule found three parts drawn by hand beside a component or helper that already did the same: the sidebar's resize handle (a window splitter, as `Splitter`'s handles are), the aside's toggle button (the same `IconButton` wrapper `PageShell` had written), and the stored layout (a third copy of "read and write a remembered value", with silent `catch` blocks and no fallback where storage is blocked).

## Decision
- **`src/internal/separator.tsx`** holds what a draggable, focusable separator needs wherever it is drawn: `SeparatorHandle`, the ARIA window splitter (a focusable `role="separator"` with its orientation and value attributes), and `startSeparatorDrag`, the lifecycle of a pointer drag (the pointer is captured, the window hears the moves, the end and a cancel, and a pointer that cannot be captured does not stop the drag). `Splitter`'s handles and `AppShell.Sidebar`'s handle use it. What each moves, by how much and with which keys stays its own: `Splitter`'s panes are a percentage model with snapping and collapsing, the sidebar is one column in pixels. Both are behaviour-preserving, and their checks pass unchanged.
- **`src/internal/AsideToggleButton.tsx`** is the aside's toggle, which `AppShell.AsideToggle` and `PageShell.AsideToggle` now wrap with their own stylesheet class.
- **`AppShell`'s remembered layout** reads and writes through the storage helpers `usePersistentDismiss` and `useRecentCommands` already use, which `@dbm-system/utils` now exports as `readPersistentValue`, `writePersistentValue` and `removePersistentValue`. Where the browser's storage is blocked the layout is kept in memory for the page's life, where it used to be forgotten.
- No new token and no new component.

## Alternatives considered
- **Leaving each copy.** Rejected: the rule, and the three places a fix would have to be made.
- **Building the sidebar on `Splitter`.** Rejected: `Splitter` is a multi-pane percentage model; one column of a grid in pixels is not a pane, and its collapsing, snapping and pair arithmetic have no use there. The shared part is the separator and the drag, which is what both really have in common.
- **A `usePersistentValue` hook.** Rejected for now: `AppShell` reads once and writes on the reader's own changes, which the plain helpers do; a subscribing hook would add re-renders it does not use.

## Consequences
- A change to the separator's drag or ARIA is one change. `AppShell`, `Splitter` and `PageShell` stay Finalized (no output changed).

## Related
ADR-0189 (the shared aside drawer); `05-component-api-conventions.md` §1; `component-reviews/AppShell.md`.
