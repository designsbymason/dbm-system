# NavigationMenu — review findings

**Status:** Built 2026-10-31; not declared Finalized. Open: see "Not verified" below.

## What was built

The site-header navigation with panels: triggers that open panels of grouped links (icons, descriptions, columns) beside plain links. Compound (`NavigationMenu.List`/`Item`/`Trigger`/`Content`/`Link`/`Group`) over Radix `navigation-menu` pinned at 1.2.22 on the shared layer stack, as a disclosure navigation and not `role="menu"` ([ADR-0159](../adr/0159-navigationmenu-wraps-radix-navigation-menu-pinned-at-1-2-22-on-the-shared-layer-stack-as-a-disclosure-navigation-with-one-shared-panel-area-over-a-hand-rolled-menu-role-menu-or-a-panel-under-each-item-only.md)). Drawn `mega` or `stacked`, and inside `Navbar.Links` it follows the bar and is stacked in the menu panel ([ADR-0160](../adr/0160-navigationmenu-is-drawn-stacked-in-the-navbars-menu-panel-and-follows-the-bar-through-a-small-internal-context-over-writing-two-lists-its-own-drawer-or-reading-navbars-private-context.md)).

## Decisions
- Compound parts over a data-driven `items` prop: panels hold arbitrary content, as `Navbar.Group` does.
- One shared, resized panel area by default; `viewport={false}` for a panel under its own item. Two tokens, `navigation-menu.panel-min-width` and `.panel-max-width`; everything else is an existing token. No new colour pairing: the current-page looks are `Navbar`'s and the panel is `Menu`'s surface, border and shadow.
- `NavigationMenu.Link` draws its own `<a>` (and `Slot` for `asChild`) rather than composing `Link` or sharing `Navbar.Link`'s, as `Navbar` and `Sidebar` do. Three components now draw one with the same disabled and external handling; extract a shared guard to `internal/` if a fourth needs it.
- No `controllerRef`: a controlled `value` opens and closes it from outside.
- No indicator arrow in v1 (additive later; it needs a right-to-left offset check).
- Bundle: 4.1KB of JS and 2.8KB of CSS, inside the default budgets, so no override. `Navbar` went from 20.0KB to 20.05KB of JS against its 22KB.

## What was found while building it
- **The primitive's focus stop fails an accessibility run while a panel is open.** It keeps an `aria-hidden`, `tabindex="0"` span beside an open trigger to hand `Tab` into the panel, and axe reports `aria-hidden-focus` (the real-browser run caught it on a story that started open; jsdom did not). It is the primitive's own and goes when the panel closes, so no story starts open, every check closes its panel and waits for it to be gone, and the Docs page says so. A consumer who runs an accessibility check with a panel open will see it.
- **A synthetic click re-opens a panel closed within 200ms.** `userEvent.click` moves the pointer over the trigger first, which starts the primitive's hover timer; closing sooner than `delayDuration` is undone by it when it fires. A person can't hover and press `Escape` that fast, so the checks wait 300ms after a press.
- **The slide side is physical.** `data-motion="from-start"` is the left in both directions (a later trigger in right-to-left text, which is on the left, gives `from-start`), so the first version's mirroring custom property double-flipped it. The keyframes now move by a fixed side, checked in a real browser in right-to-left.
- **`Tab` after `Escape` can land in a panel still easing out.** The panel stays in the page for its exit animation (about 150ms), so the checks wait for it to be gone before tabbing on.
- **A key and a click switch panels differently under a synthetic pointer.** The check that moves between panels uses a key; the same step by click opened the second panel and then a hover timer raced it.
- **The viewport's size is applied from a `ResizeObserver`,** which a hidden or throttled page delays; the checks wait for it rather than for a fixed time. In use it resizes within a frame.
- **`onSelect` is the primitive's own event, not a React one,** so `NavigationMenuLinkProps` omits the native `onSelect` and types it as `(event: Event) => void`.

## Checks
- 25 unit tests (roles, the landmark's name, opening by press and by key, arrow keys between triggers, description and external cue in the name, controlled and uncontrolled `value`, a disabled link and trigger, `onSelect` keeping a panel open, same-named props not overriding the computed `aria-expanded` and `aria-current`, refs, ids and test ids on every part, current looks, `viewport={false}`, StrictMode, the stacked form's disclosure and tab order, inside a `Navbar` (one landmark, the bar's look, stacked in the panel, closing it or not), jest-axe closed, open, stacked and right-to-left), 13 server-render and hydration tests, a docs token and Properties-table guard.
- 11 real-browser checks: a real pointer hovering open and crossing the gap, a link the top element at its centre, the shared area resizing to the second panel within the two token measures, `Tab` into a panel and `Escape` back, 24px targets at all five sizes, right-to-left alignment and slide side, own panels centred under their items, a panel under a sticky bar, a width map drawing stacked on a phone, forced colours (current mark, panel edge kept, shadow dropped), reduced motion (a fade), and nothing of a closed panel left in the page.

## Not verified
- Safari, Firefox, a real touch screen (a tap opens by click, which the unit test and the primitive's pointer-type handling cover, but not a real finger), a screen reader, a phone with an on-screen keyboard.
- The Docs page in all four themes (the panel was looked at in Purple light and Emerald dark; the Docs page in Purple light), and the panel's contrast in each theme beyond the pairings it reuses.
- `Shift+Tab` from the first link of a panel back to its trigger was done with real keys in the preview and not in a check: the primitive hands focus through its hidden stop, which a synthetic key doesn't reproduce.
- A panel wider than the room to the screen's edge is capped at the screen's width and not moved to fit; an item far to the end of a bar with a wide panel can overflow its edge.
