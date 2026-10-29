# 0144 — `Tree` takes loading placeholders, a filter helper, a row-menu callback and inline rename, over a built-in menu, a search prop, `EditableText` in the row, or a loading flag per row

**Status:** Accepted · **Date:** 2026-10-29

## Context
[ADR-0143](./0143-tree-is-a-flat-roving-focus-wai-aria-tree-over-a-nodes-array-with-leaf-based-checks-and-a-window-of-fixed-height-rows-over-composed-item-parts-aria-activedescendant-or-nested-groups.md) left four things to the caller or to later: what a tree shows while its first rows load, how a search works, how a row gets a menu, and how a row is renamed. Each has an obvious built-in form that costs the tree more than it earns: a menu is 7KB of JavaScript that every consumer would pay for (the tree is 6KB, and the default budget 10KB), a search prop makes the tree own data it does not own, and a rename field in a row can add a second focus stop.

## Decision
- **`loading` and `loadingCount` draw placeholder rows**, as `Timeline` does for events: with no rows they stand in for the tree and its empty message (a busy group that says `labels.loading`), with rows they follow the last one (the last window of a long tree), and the tree is `aria-busy`. The placeholders are `aria-hidden` and are not treeitems. It is distinct from `loadingIds`, which is one row's children.
- **`filterTree(nodes, { query | match, keepDescendants })` is an exported pure function**, not a prop. It returns the rows that match and the rows above them, the ids that match, and the rows to open (`expandedIds`) so a match is not hidden under a closed folder. It never changes its input and shares any row whose children are all kept. The tree stays free of search state; `highlightQuery` shows why a row matched.
- **A row's menu is a callback, not a menu.** `onItemContextMenu({ id, element, point, via, event })` is called for a right-click, the context-menu key and Shift+F10 on the focused row (not for a disabled row or the Empty row). The caller wraps the tree in a `ContextMenu` (`Trigger asChild` round a `div`, so a right-click and a long press open it natively) and turns a key into a menu at the point with the controller's `openAt`. The tree holds nothing of the browser's menu back: a `ContextMenu` refuses to open an event another handler has already cancelled, so cancelling it in the tree broke the recipe; `event` is there for a menu that needs it. A `contextmenu` event that follows the tree's own key request within half a second is that same press, so one press makes one request.
- **Rename is a field in the row, started by F2 or `controllerRef.rename(id)`.** `renamable` (a boolean or a function of the node), `onRename(id, label)` and `validateRename(id, label)`. The field is a plain input with the text selected: Enter commits, Escape cancels, leaving commits unless the text is refused (then it is dropped, rather than holding a person in a field they have left), an empty or refused name stays with an alert and `aria-invalid`. The tree changes no label: the new text appears when the caller changes `nodes`. While the field is open its keys and clicks are its own, and a row that stops being a row (a closed ancestor) takes its field with it; one only scrolled out of a window keeps it.

## Alternatives considered
- **A built-in `ContextMenu` (a `renderMenu` prop).** Rejected: +7KB for everyone, over the default budget, for a menu most trees would not use; the callback is eleven lines in the caller and leaves the items entirely theirs.
- **A `filter` or `query` prop that hides rows.** Rejected: the tree would own the data's shape, and a caller who wants "match the path" or "match a tag" would have to fight it. A function that returns `nodes` composes with everything else.
- **`EditableText` in the row, or the `Input` atom.** Rejected: `EditableText` draws a button that swaps for a field, which is a second focus stop inside a tree item, and brings its own controls and 6KB; `Input` is taller than a row at every size (30, 39, 42, 55 and 60px against 24, 32, 36, 44 and 52px), so a row would grow when it was renamed. The field is a plain input drawn from the same tokens (the neutral-strong edge, the surface fill, the focus ring inside it).
- **Rename on a slow second click or a double click.** Rejected: a double click is activation and a click is selection; F2 is the pattern's key, and a "Rename" menu item reaches the controller.
- **A `loading` flag on every node for the first load.** Rejected: the first load has no nodes to hold a flag; placeholders are the tree's, not a row's.
- **Preventing the browser's menu in the tree.** Rejected, as above: it silently disabled a `ContextMenu` wrapped round the tree.

## Consequences
- The tree stays under 9KB of JavaScript; a search, a menu and a rename cost the caller what they use.
- A rename the caller does not apply simply leaves the old label, which is the controlled-component rule, and the Docs page says so.
- Drag to reorder and reparent is still not built; it is its own decision when an app needs it.

## Related
`04-component-inventory.md` (Tree); `component-reviews/Tree.md`; [ADR-0120](./0120-contextmenu-is-opened-from-code-by-sending-radixs-trigger-a-contextmenu-event-through-a-controller-and-an-openonkeys-prop-over-rebuilding-the-trigger.md); [ADR-0142](./0142-timeline-takes-a-feed-surface-of-headings-an-end-links-detail-paging-and-two-more-layouts-over-leaving-them-to-the-caller-or-separate-components.md).
