# 0146 — `EditorTabs` gets its own tab menu, a close-many request, a previous-tab selection, opt-in shortcuts, a status, a tooltip through the `Tooltip` atom, a vertical strip and a CSS-eased reflow, over leaving each to the app

**Status:** Accepted · **Date:** 2026-10-30 · **Amended 2026-10-30** — the hotkey helper was extracted to `internal/hotkey/` instead of being imported from `CommandPalette`'s folder; the decision itself is unchanged

## Context
[ADR-0145](./0145-editortabs-is-a-data-driven-strip-built-on-tabs-with-a-tabs-item-part-that-asks-the-owner-for-closes-adds-and-moves-over-a-compound-strip-a-list-it-owns-or-a-touch-drag.md) left `EditorTabs` with a close button that assistive technology can't reach, a menu every app had to write itself, one close at a time, and a horizontal strip with no motion. Reviewing what comparable tab strips offer turned up nine gaps, which this record settles together because they touch the same few parts (the close path, the menu and the layout).

## Decision
**A tab menu of the strip's own (`tabMenu`).** The accessible and touch route to close or move a tab is now built in, not a recipe: Close, Close others, Close tabs after this one, Close all (each only with the callback that makes it possible) and the moves (with `onReorder`), drawn as `ContextMenu` items on each tab. `tabContextMenu` stays for actions of the app's own and follows the strip's items after a separator. Both are `ContextMenu` roots drawn only while open, so the cost is per open menu.

**Closing several is one request (`onCloseMany`, `controller.closeMany`).** The owner is handed the tabs together, already limited to those that can be closed (not pinned, not disabled), and removes them in one update. Selecting what comes next and handing focus on happen once, in the commit that removes them (as in ADR-0145), and the announcement says "3 tabs closed" rather than three closes. Without `onCloseMany` the menu offers only Close.

**Closing can go back to the tab used before (`closeSelects="previous"`).** The strip keeps a most-recently-used list of what was selected and, once the selected tab is gone, chooses the latest of those still there, else the neighbour. The choice is a pure function over the tab order, the remaining tabs, the enabled ones and that list, so closing one tab and closing many are one rule.

**Shortcuts are opt-in and the app's choice (`hotkeys`: `next`, `previous`, `close`, `add`).** None is bound by default, since a browser keeps Ctrl+Tab and Ctrl+W for itself and an app should name combinations it can receive. It follows `05` §3's `hotkey` convention (combinations of modifiers and a key joined by `+`, `mod` by platform, a document listener, a matching press kept from the browser, a repeat and a composition ignored) and uses the parser and matcher `CommandPalette` wrote (now in `internal/hotkey/`). Focus follows the selection only when it was already on a tab.

**A tab can say how it is doing (`status`: `busy`, `error`, `warning`, with `statusText`).** A spinner or an icon after the name, spoken after it too ("App.tsx (unsaved changes, save failed)"), so it is never carried by colour or shape alone. On the brand fill of the solid variant's selected tab it takes the on-brand colour, and the shape still tells error from warning.

**A tab's tooltip is the `Tooltip` atom (`tooltip`, `title`).** It opens on hover and focus, closes on Escape, and describes the tab without becoming part of its name. A tab with detail of its own shows it; a tab without shows its whole name only when the name is cut with an ellipsis. It is not hoverable content (`disableHoverableContent`), so it closes as soon as the pointer leaves. The atom's trigger sets its own `data-state` on the element it wraps, which would replace the tab's `active` or `inactive` (read by `Tabs`' styles and its scroll-into-view), so the tab states it explicitly, and a test holds it.

**A vertical strip (`orientation`, a breakpoint map like `Tabs`').** A column that scrolls when the root is given a height. `useSortable` gets an `orientation` option: a vertical list decides which side of a tab a drop lands on from the pointer's height against the tab's middle, and its marker is on the tab's top or bottom edge.

**Motion is a CSS `translate` transition, not an animation library or the Web Animations API.** When the list changes, each tab's place is measured in the list's own scrolling coordinates before and after; a tab that moved is put back where it was with an inline `translate` and released, and the stylesheet's `transition` on `translate` (a motion token, none under `prefers-reduced-motion`) eases it. A tab added to the list fades in. A tab dragged by the pointer, which the person has already moved by hand, is not eased a second time. A closing tab leaves at once, because the owner removes it; an exit animation would have to keep it in the list.

## Alternatives considered
- **Leave the menu to the app.** What ADR-0145 did. The accessible route was then only as good as each app's menu, and every app wrote the same items.
- **One `onClose` per tab for close-many.** Each close made its own selection and focus decision, and an owner that updates state per call could close the wrong neighbour.
- **Bind the browser's shortcuts by default.** Ctrl+Tab and Ctrl+W never reach the page in most browsers; a default that mostly does nothing is worse than none.
- **A native `title` for the tooltip.** Not the system's tooltip, not keyboard-reachable, not themed. The `Tooltip` atom is the system's.
- **The Web Animations API for the reflow.** It would read the motion tokens in script and need its own reduced-motion branch; the CSS transition uses the tokens as they are.
- **Keep a closing tab in the list while it exits.** Would make the list the strip's and the owner's at once.
- **A separate vertical component.** The sortable, the menu and the close path are the same; only the layout differs.

## Consequences
- The assistive-technology and touch story no longer depends on each app writing a menu; `tabContextMenu` is for what is specific to an app.
- `EditorTabs` uses the hotkey parser and matcher that `CommandPalette` wrote. *(Amended 2026-10-30: this originally said `EditorTabs` would import it from `CommandPalette`'s folder until a third consumer; it was extracted to `internal/hotkey/` straight away, so one organism does not depend on another's private file.)*
- `useSortable` gains `orientation` beside `autoScroll`; both are still internal.
- A tab that closes does not animate out. A test measures that no offset is left behind after a reorder.
- The bundle grows (the tooltip, the menu items, the spinner); its budget is raised with the reason beside it.

## Related
`04-component-inventory.md` (Navigation, reordering); `05-component-api-conventions.md` §3 (the `hotkey` convention; a gesture asks, it does not apply); `06-engineering-standards.md` §4 (the bundle budget). [ADR-0145](./0145-editortabs-is-a-data-driven-strip-built-on-tabs-with-a-tabs-item-part-that-asks-the-owner-for-closes-adds-and-moves-over-a-compound-strip-a-list-it-owns-or-a-touch-drag.md), [ADR-0132](./0132-commandpalette-is-a-prop-driven-dialog-over-a-commands-array-that-owns-its-hotkey-and-a-controller-over-a-compound-of-parts-a-registry-provider-or-a-combobox-in-a-popover.md), [ADR-0122](./0122-datatable-opens-a-rows-context-menu-through-a-render-prop-that-chooses-the-row-first-and-is-told-the-selection-over-a-menu-per-consumer-or-a-menu-that-ignores-the-selection.md). Components: `EditorTabs`, `Tabs`.
