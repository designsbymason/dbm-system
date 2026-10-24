# 0120 — `ContextMenu` is opened from code by sending Radix's trigger a `contextmenu` event, through a controller and an `openOnKeys` prop, over rebuilding the trigger

**Status:** Accepted · **Date:** 2026-10-24

## Context
[ADR-0118](./0118-contextmenu-wraps-radix-contextmenu-pinned-at-2-3-7-on-the-menu-release-train-holds-its-own-open-state-and-is-modal-with-a-long-press-over-the-newest-release-or-a-hand-rolled-trigger.md) left two gaps: nothing could open the menu at a place chosen by code (an "Actions" button, a canvas hit-test), and the only keyboard path was the platform's context-menu key and Shift+F10, which Windows and Linux have and macOS does not. Radix ContextMenu opens only from a press on its trigger, at the press's coordinates: its handler reads `clientX` and `clientY` from a React `onContextMenu` event, and a controlled `open` with no press draws the panel at the page's top-left corner.

## Decision
- **Opening at a point is sending the trigger a `contextmenu` event** with those coordinates (`bubbles`, `cancelable`), which Radix handles as a right-click. The trigger node is kept by the root, so the controller reaches it without a ref from the caller.
- **A controller** `{ openAt({ x, y }), openFrom(element), close(), open }`, handed out by `controllerRef` and returned inside the menu by `useContextMenuController()`, the shape `Form` uses ([ADR-0076](./0076-form-rules-may-return-promises-and-the-form-is-reached-from-outside-by-a-controller-and-two-hooks-over-synchronous-rules-or-an-imperative-ref.md)). Its identity never changes and its methods read the latest state. `openAt` and `openFrom` return `false` when there is nothing to open from (not mounted, or `disabled`). `openFrom` opens at the element's bottom corner on the reading-start side, so the panel hangs under it.
- **`ContextMenu.Trigger` takes `openOnKeys`**, key combinations written as modifiers and a key (`"Alt+ArrowDown"`), matched exactly (the modifiers named and no others). The menu opens under the element that has focus, which may be a cell or a button inside the area. There is no default key: the platform's own keys keep working, and an app names one where it has none.
- **The event bubbles to the page,** as a real one does, because React listens at the root; a page-level `contextmenu` listener sees it. A caller who does not want that does not send it.
- A menu still has to be reachable by a visible control too: the Docs page says so, and the controller is how that control opens it.

## Alternatives considered
- **Rebuild the trigger on `@radix-ui/react-menu`'s anchor with a virtual point.** It would own the point outright, make the long-press time configurable and let `defaultOpen` mean something. Rejected: it adds a direct dependency and replaces Radix ContextMenu's pointer, touch and dismissal handling to gain what a dispatched event already gives, and it would supersede ADR-0118.
- **Choose a default key for macOS.** Rejected: no key is standard there, and a key claimed by default would collide with an app's own.
- **`open` plus a stored point.** Rejected: Radix keeps the point inside its trigger, so a controlled `open` cannot supply one.
- **Return the controller from a hook only.** Rejected: the common caller is a button outside the menu's tree, which needs the ref.

## Consequences
- The method depends on Radix opening from a `contextmenu` event on its trigger, which its documentation states, and it is checked by a unit test and two real-browser checks (a point, and a key from a focused button).
- A trigger that is `disabled` cannot be opened by code either, which is what a caller who disabled it would expect.
- A caller's own `onContextMenu` handler on the trigger runs for a controller-opened menu too.

## Related
`04-component-inventory.md` (ContextMenu row), ADR-0076, ADR-0118; `component-reviews/ContextMenu.md`.
