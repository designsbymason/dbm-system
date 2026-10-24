# Menu — review findings

Fifth organism, built 2026-10-11 with the `06-engineering-standards.md` §9 checklist applied as it was written, then a full review pass. **Finalized 2026-10-12**, with the items under "Open at Finalization" accepted as open: none changes the component.

## Decisions
- Wraps Radix DropdownMenu pinned on the Radix release train, holds its own open state, is modal by default and opens on ArrowUp: [ADR-0064](../adr/0064-menu-wraps-radix-dropdown-menu-on-the-pinned-release-train-holds-its-own-open-state-is-modal-by-default-and-opens-on-arrowup.md).
- Item styles live in `Menu`'s own stylesheet for `ContextMenu` and `Menubar` to import; indicators align with `:has()`; the shortcut hint is a `<kbd>` drawn as quiet text, not the `Kbd` atom: [ADR-0065](../adr/0065-menu-draws-its-item-parts-in-its-own-stylesheet-for-contextmenu-and-menubar-to-import-and-aligns-indicators-with-has.md).

## What was found while building it
- **Radix's `Sub` closes itself on focus outside**, so `defaultOpen` on a submenu can't work; `Menu.Sub` has `open` and `onOpenChange` only.
- **Radix lets a consumer's `role`, `aria-checked`, `aria-expanded` and `aria-haspopup` replace its own**; each part states them again after the spread, which is why the root holds the open state.
- **Radix handles only ArrowDown, Enter and Space on a trigger**; ArrowUp-to-last is the wrapper's.
- **Disabled items are skipped by the arrow keys** (not focusable), and Tab does nothing inside an open menu.
- **The highlight fill is a quiet tint** (about 1.04:1 against the panel in light mode, as a `Select` option's is), so keyboard focus also gets a 2px inside ring in `border.focus` (3.99:1 or more in every theme and mode). Radix focuses an item as the pointer passes over it, which showed the ring on hover; the panel now records its last input (`data-input`) and the ring is held back while it is `pointer`.
- **Contrast** measured for every new pairing (text, icon and focus ring on the panel and on each highlight, Purple and Emerald, light and dark): all clear their floors.

## Checks run
- 124 unit tests: opening and closing, every key, items, checkbox and radio state, groups and labels, submenus (including right-to-left), the attribute-precedence probe on every part, nesting inside a `Dialog`, `StrictMode`, axe, server render and hydration, and the Docs-token test.
- 58 real-browser tests (Chromium): 14 hidden sub-part stories for the Properties tables and 44 checks. The checks cover an item chosen with a real mouse in a menu opened from inside a `Dialog` (the top element at its point, the dialog left open), the 24px target and no overflow at every size, a 28-item list capped to the viewport and scrolling with the focused item kept in view, a flip above a trigger at the bottom edge, the panel's width between its caps with a long label wrapping, one left edge for every label beside indicators, the highlight and danger-highlight fills and the keyboard ring, the separator, ArrowUp opening on the last enabled item and Escape returning focus, a right-to-left submenu opening to the left with its caret mirrored, forced colours drawing an outline, and an `IconButton` with a tooltip and a `Toolbar` item both working as triggers.
- Full unit suite (141 files, 7517 tests), `pnpm lint` (eslint and both typechecks), the build, the component bundle-size check (Menu JS 2.84KB, CSS 1.31KB, within budget) and `check-guidelines`.

## Found by the checks
- **Axe reports `aria-hidden-focus` for any story that holds a modal menu open**, because the page behind it, trigger included, is hidden while the trigger stays focusable (focus is trapped in the panel and Tab does nothing, so it is unreachable). The checks file carries `a11y: { test: "todo" }` with that reason, and the docs-only sub-part stories use `modal={false}`. The same markup is axe-checked open, with every kind of part, in the unit tests.
- **The first failing story left the rest timing out**, so a single annotation cleared 27 failures; nothing in the component changed.

## Storybook controls
- Every visible story's controls drive its canvas; a control that a story fixes is `control: false` (`Sizes`: `size` and `defaultOpen`; `Responsive side`: `side`; `Opened from inside a Dialog`: all). `RowActions` takes `align: "end"` as its own arg instead of fixing it, and `RightToLeft` follows `dir`.
- The Playground and Properties tables follow content → visual → behavioural → advanced; a part's `asChild` goes last. Props a story can't drive show "–": handlers, `collisionBoundary`, `container`, and `asChild` on the trigger and item (a single element child is what it needs). `icon` is a select over a few real icons, on each item story's own `argTypes`, not the meta-level ones.

- **Closing with the mouse showed a focus ring on the trigger.** Radix gives focus back with a plain `focus()`, which Chromium drew a ring for after a pointer. The root now records the last input (trigger, panel and an outside press) and, after a pointer, returns focus with `focus({ focusVisible: false })`; after the keyboard it leaves Radix's own focus and its ring. Checked with a real mouse and a real keyboard, and the check fails without the fix.

## Feature pass: five gaps (2026-10-11)
Decisions and alternatives are in [ADR-0066](../adr/0066-menu-items-take-a-promise-a-close-on-select-setting-a-reason-for-being-disabled-and-a-description-and-a-menu-reports-when-it-has-closed.md).
- **An item that opens a confirmation** is a recipe: the dialog beside the menu, opened from state. Run with a real mouse and with the keyboard. It exposed two things in the dialogs, both fixed there ([ADR-0067](../adr/0067-overlays-return-focus-to-the-element-that-opened-them-when-they-have-no-trigger-and-a-closing-scrim-lets-presses-through.md)): a dialog with no trigger returned focus to `body`, and a press just after one closed landed on its fading scrim.
- **`closeOnSelect`**, false by default for checkbox and radio items.
- **A promise from `onSelect`:** busy item, spinner, no layout shift (checked by measuring the row), the menu closes when it resolves; `onSelectError`.
- **`disabledReason`:** focusable, `aria-disabled`, tooltip above the menu, announced as a description.
- **`description` and `trailing`**, and **`onOpenChangeComplete`**.
- Built and removed: `onSelectAfterClose`, which the real-browser flow showed was not needed.
- Checks added: 17 unit tests and 5 real-browser checks.

## Scroll affordance (2026-10-11)
A menu taller than the room there is scrolled with no sign of more (the scrollbar is overlay-only on some platforms). The panel keeps its border, surface and corners still and the items scroll in an inner viewport, with a fade in the panel's surface colour at each end that has more behind it (`useScrollEdges`, as `Tabs` and `Toolbar` do), dropped in forced colours. The fades take no pointer events. Real-browser checks: top and bottom fades swap as the list is scrolled to its end, nothing shows on a short list, the focused item ends fully in view, and the fades are not drawn in forced colours.

## Used by `Toolbar` (2026-10-12)
`Toolbar`'s `overflow="menu"` draws what doesn't fit as a `Menu` ([ADR-0068](../adr/0068-toolbar-moves-what-doesnt-fit-into-a-menu-reading-its-parts-as-they-register-over-a-data-driven-item-list.md)): checkbox, radio and plain items and labelled groups, opened from a button that is itself an item in the bar's arrow-key order. Nothing in `Menu` changed for it.

## Final review pass (2026-10-12)
The §9 checklist run against the finished component, with its findings fixed:
- **`Menu.Separator`'s role and orientation could be replaced by a same-named prop** (Radix spreads what it is given after its own); restated after the spread, and the probe now covers the separator and the submenu panel.
- **An `asChild` item with a `disabledReason` pointed `aria-describedby` at an element it never drew;** the reference is dropped there, and development warns that the reason is shown but not announced.
- **A pending item widened the panel** when it was the one that set its width and had nothing for the spinner to replace (284 to 315px measured). The spinner now takes the icon's own box when there is an icon, and sits over the end of the row, outside the layout, when there is none, with the trailing content and shortcut hidden but still taking their room. The check measures the panel, the row and the label, and fails without the change.
- **The Docs page said `Menu.Content` took `dir` as a native attribute,** which its type omits; the direction is set on `Menu`.
- **Radix props were not redeclared on `Menu.SubContent`** (`sideOffset`, `avoidCollisions`, `collisionBoundary`, `hideWhenDetached`, `sticky` and the four dismissal callbacks) **and `Menu.Content` lacked `sticky`;** declared, documented and ordered.
- **`aria-keyshortcuts` and `aria-describedby` are redeclared on items,** as the docs already told the reader to pass them.
- **`disabledReason` without `disabled` now warns in development** instead of doing nothing silently.
- **A real-pointer check with a `Popover` as the host** (the checklist names it beside `Dialog`) and **the server-render tree covers a description, trailing content, a reason and an async item.**
- **`Menu.Separator` does not compose the `Divider` atom, deliberately.** `Divider` draws its line as a background, which forced colours replaces with the page's colour (measured: `rgb(222, 221, 229)` becomes `rgb(255, 255, 255)`, invisible on a white page); the menu's separator is a border, which forced colours keeps (`05` §6). Recorded as a finding on `Divider`, not fixed here.
- **Arrowing through every item of a 28-item menu in a 420px-tall viewport** kept each focused item clear of the fades (the viewport's `scroll-padding`), and a menu inside a `Popover` and one on a 375px phone stay inside the viewport.

## Open at Finalization
- **Themes looked at live:** the default (Purple, light) and Emerald dark, by computed values; Purple dark and Emerald light are covered by the contrast measurements (every pairing clears its floor in all four) and by the tokens, not by a look.
- **Not verified:** a real touch device (submenu hover-intent has no equivalent there), a screen reader's announcement of the menu, its groups, the checked state and a busy item, Safari and Firefox (`focus({ focusVisible: false })` falls back to the ringed focus where unsupported), and Windows high contrast on a real machine (forced colours was emulated).
- **Known gaps, named and not built:** a phone presentation as a bottom sheet, and the submenu's `defaultOpen`, which Radix's submenu closes on focus outside (ADR-0064).

## Post-Finalization follow-up (2026-10-19, at explicit direction): its content is out of reach of a button group's settings
A `Button` or `IconButton` in this component's content took the settings of a `ButtonGroup`, a `Toolbar` or `Navbar.Actions` the overlay was opened from, because a React context crosses a portal (found in `Navbar`'s review: an `xs` bar's popover held `xs` buttons). The consumer's content is now wrapped in `ButtonGroupReset`, so it reads no group ([ADR-0102](../adr/0102-overlays-put-their-content-out-of-reach-of-a-button-groups-settings-over-letting-them-cross-the-portal.md)). A defect fix with no change to the output outside a group, so `Menu` stays Finalized. `Navbar.overlays.test.tsx` holds it: the case for `Menu` fails when the wrapper is removed (checked for `Popover`).

## Post-Finalization addition (2026-10-24, at explicit direction): `presentation` and `labels`
A sheet presentation for touch: `presentation` (`"menu"` or `"sheet"`, or a width map) draws the same Radix menu across the bottom edge with 48px rows and a scrim, and a submenu covers it under a Back row whose text is `labels.back` ([ADR-0121](../adr/0121-menus-sheet-is-the-same-radix-menu-pinned-to-the-bottom-edge-by-the-stylesheet-with-a-back-row-for-a-submenu-over-a-drawer-with-items-of-its-own.md)). Purely additive: with the default `"menu"` nothing is drawn differently (the three-question test of `06` §9 step 1, "no"), so `Menu` stays Finalized, and the new surface got its own pass: JSDoc, hidden Root story entries, two stories and snippets, ten unit tests and four real-browser checks (a sheet's rectangle against the viewport and its 48px rows, a real press on the scrim, a submenu and Back with focus kept, a phone-width responsive map and a desktop-width one), the Docs-token rows for the five tokens it adds, and a look at it at 375px.

A change to the item parts and the stylesheet made for `ContextMenu` ([ADR-0119](../adr/0119-menus-item-parts-draw-with-the-radix-parts-a-context-supplies-so-contextmenu-shares-them-over-copying-them-or-extracting-them-early.md)) needed no change to output. The sheet's `max-block-size`, its override of Radix's position wrapper and its upward-clear bottom padding (`env(safe-area-inset-bottom)`) are the only values not read from a token.
Found: choosing Back first closed the whole menu, because an item's default on select closes it; the row now prevents that. The unit test of it does not fail without the fix in jsdom, and the real-browser check does.
Not verified: a real touch device, and VoiceOver and TalkBack on a sheet.
Follow-up (2026-10-24): the menu under a sheet's submenu was left in the accessibility tree, so a screen reader could swipe past the submenu into it. It is now `inert` while the submenu is open, with focus moved into the submenu first (a press leaves it on the trigger, which is about to be inert) and returned to the trigger when the submenu closes. A defect in the sheet's own output, so `Menu` stays Finalized; two unit tests and the real-browser check (inert, focus inside the submenu, then back on the trigger) hold it.
