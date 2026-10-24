# 0121 — A menu's sheet is the same Radix menu pinned to the bottom edge by the stylesheet, with a Back row for a submenu, over a `Drawer` with items of its own

**Status:** Accepted · **Date:** 2026-10-24

## Context
A floating menu is built for a pointer: small rows, a panel beside what opened it, submenus that open on hover. On a phone that is a poor fit, and `Menu` and `ContextMenu` both named a bottom-sheet presentation as a gap ([ADR-0064](./0064-menu-wraps-radix-dropdown-menu-on-the-pinned-release-train-holds-its-own-open-state-is-modal-by-default-and-opens-on-arrowup.md), [ADR-0118](./0118-contextmenu-wraps-radix-contextmenu-pinned-at-2-3-7-on-the-menu-release-train-holds-its-own-open-state-and-is-modal-with-a-long-press-over-the-newest-release-or-a-hand-rolled-trigger.md)). The obvious build is to draw the content in a `Drawer` (`side="bottom"`). It was weighed against the real constraints: Radix's menu items only work inside a Radix menu root, so a `Drawer` needs a second set of items with their own arrow-key, selection, check and radio handling and a submenu model; and `Drawer`, `Dialog` and Radix Dialog are about 10KB that every `Menu` and every bundle that holds one (`DataTable`, `Navbar`, `Sidebar`, `Toolbar`) would carry whether or not it ever drew a sheet.

## Decision
- **A sheet is the same menu, drawn differently.** `presentation` (`"menu"` by default, or `"sheet"`, or a mobile-first map like `{ base: "sheet", md: "menu" }`, resolved in JavaScript as `Popover`'s `side` is) on `Menu` and `ContextMenu` marks the panel (`data-presentation="sheet"`) and the stylesheet pins it across the bottom edge, with taller rows (48px), larger top corners, an upward-clear bottom padding for a device's home indicator and a slide in from the edge. Everything else (the keys, typeahead, roving focus, the inert page, scroll lock, dismissal, focus return, every part) is Radix's, as it is for the floating menu.
- **Radix writes the panel's position as inline styles on a wrapper it adds,** so the wrapper (found by its own `data-radix-popper-content-wrapper` attribute and by holding a sheet, with `:has`) is overridden with `!important`, the only thing that outranks an inline style. The panel's own `max-block-size` is the viewport less a row, so the page behind still shows above it.
- **The page behind is dimmed by `Backdrop`,** drawn from the panel; a press on it is a press outside the panel, which closes the menu.
- **A submenu covers the menu it came from.** It is the same sheet, drawn over the first, and the menu under it is made transparent while one of its submenu triggers is open (not removed, so focus is not lost with it). Its first row is **Back**, which steps out of the submenu and leaves the menu open (it prevents the item's own close-the-menu default). The text is `labels.back` ("Back"), as the other components' words are.
- **`side`, `align`, `sideOffset`, `alignOffset` and the collision props don't apply to a sheet.**

## Alternatives considered
- **Draw the content in a `Drawer`.** Rejected: it needs its own items and submenu model to duplicate and keep in step, and it puts the dialog stack into every menu's bundle.
- **A submenu flattened under a heading, or not supported in a sheet.** Rejected: a deep menu becomes a long list, or a real limit on a phone; drilling in with a way back is the usual pattern.
- **Switch on `(pointer: coarse)` with no prop.** Rejected: a touch laptop gets a sheet, it is harder to test and to opt out of, and a width map matches `Drawer`'s `side`.
- **Fork the popper to take a fixed position.** Rejected: it would replace what Radix's pinned family provides, for what four overrides on one element do.

## Consequences
- The override depends on Radix's wrapper attribute and on writing its position inline, both stable and both checked by real-browser tests (the sheet's rectangle against the viewport, with a real touch and a real mouse); a Radix refresh re-runs them.
- A sheet has no swipe to dismiss and no drag handle: it closes on a press on the scrim, Escape, or choosing an item. Typeahead and arrow keys work as in the floating menu.
- While a submenu is open, the menu under it is still in the accessibility tree.
- `Menu`'s stylesheet grew by about 0.4KB, which every bundle that holds it carries (`Sidebar`'s CSS budget and `Toolbar`'s JS budget were raised for it).
- `Menu` is Finalized: the change is additive (a new optional prop and a new label), and the floating menu is unchanged.

## Related
`04-component-inventory.md` (Menu and ContextMenu rows), ADR-0064, ADR-0118, [ADR-0021](./0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md); `component-reviews/Menu.md`, `component-reviews/ContextMenu.md`.
