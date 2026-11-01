# Menubar — review findings

**Status:** built 2026-11-01 with the `06-engineering-standards.md` §9 checklist applied as it was written; awaiting the maintainer's Finalized declaration and the final review pass.

## What was built

A desktop-style bar of menus (File, Edit, View) for the commands of an application window. Compound (`Menubar.Menu`/`Trigger`/`Content`, with `Menu`'s item parts as `Item`/`CheckboxItem`/`RadioGroup`/`RadioItem`/`Label`/`Group`/`Separator`/`Sub`/`SubTrigger`/`SubContent`) over Radix `menubar` pinned at 1.1.24 on the shared layer stack. `size` (the shared scale, which also sets the menus' row size), `surface` (`ghost`, `outlined`, `filled`), `tone` (`brand` by default, or `neutral`), `loop`, `dir`, `value`/`defaultValue`/`onValueChange` and `onOpenChangeComplete(value, open)`.

## Decisions
- Pin, compound shape, the root holding the open menu's name, non-modal menus, a scrolling bar and no sheet: [ADR-0162](../adr/0162-menubar-wraps-radix-menubar-pinned-at-1-1-24-as-a-compound-of-named-menus-that-holds-the-open-menus-name-leaves-the-page-usable-and-scrolls-past-its-room-over-a-data-driven-menus-array-a-modal-bar-or-an-overflow-menu.md).
- The item parts, context and stylesheet moved to `internal/menu` first, in their own commit with no change to what `Menu` or `ContextMenu` draw: [ADR-0163](../adr/0163-the-menu-item-parts-context-and-stylesheet-move-to-internal-menu-at-the-third-consumer-over-menubar-importing-them-from-menu.md).
- No new token. A trigger is its padding plus a line of text (a `Button`'s approach) over a `space.6` floor.
- `tone` (added the same day, at direction) colours the triggers' hover and open fills and the bar's own border and fill, all from subtle tokens, with the trigger label `text.primary` in both tones: brand is `bg.brand-subtle` (hover, and the filled bar), `bg.brand-subtle-hover` (open, and hover on a filled bar) and `border.brand-subtle`; neutral is the `neutral` pairs. It does not change the menus the bar opens.
- `ArrowUp` on a trigger opens its menu onto the last item, as `Menu`'s trigger does; Radix Menubar handles `ArrowDown`, `Enter` and `Space` only.
- No `labels` and no `presentation`: the one `labels` entry the shared parts read is a sheet's "Back" row.
- Bundle: 6.2KB of JS and 2.6KB of CSS (it holds the shared item parts), inside the default budgets, so no override.

## What was found while building it
- **A menu playing its exit closes the whole bar when another opens.** Radix Menubar closes by name, and the menu that is closing (the panel has an exit fade) hears the new menu's focus as focus outside it and calls `onOpenChange(false)`. A real pointer moving from File to Edit left both closed; jsdom has no animation and passed. The content ignores an outside interaction while its menu is not open. The real-browser check fails without the guard.
- **A trigger that is only partly in view is not scrolled to by the browser,** which acts on one that is wholly hidden, so the bar reveals the focused trigger itself, clear of its fade and its `scroll-padding`. The check arrows through every trigger of a bar a fifth the width it needs and fails without the reveal.
- **A press elsewhere must keep the focus it gave.** Radix returns focus to the trigger unless the close came from an outside press; the wrapper's pointer-close refocus (`focus({ focusVisible: false })`) skips that case too. The first version of the check clicked a field that sat under the open panel, which is a check bug, not a component one.
- **The deeper hover and open fills are not 3:1 against the focus ring in every theme** (neutral in Purple dark measured 2.43:1), so a trigger with keyboard focus rests on the bar's own fill and the ring is drawn on that. The check presses a real key, since `:focus-visible` never matches a synthetic one, and resolves its colour outside `waitFor` (a probe added on every poll hangs it).
- **A synthetic count of open menus races the exit animation.** Two panels exist for the length of the fade, so the check waits for one.
- **Radix's own props can replace the computed ones:** the bar's `role`, a trigger's `role`, `aria-haspopup` and `aria-expanded` and a panel's `role` and `aria-orientation` are restated after the spread; the probe fails without them.

## Checks run
- 28 unit tests (rendering, ref and standard props, one tab stop, open and close by key and press, ArrowUp onto the last item, every arrow, wrapping, right-to-left, controlled and uncontrolled `value`, `onOpenChangeComplete`, every shared item part, a promise from `onSelect`, bar and content size, the attribute-precedence probe, a `Dialog` host, `StrictMode`, axe closed and open), plus server render and hydration of eight variants and the Docs-token test.
- 38 real-browser tests (Chromium): 24 stories (the 10 visible ones and 14 hidden sub-part stories for the Properties tables, each with its axe run) and 14 checks: an item chosen with a real mouse in a menu opened from inside a `Dialog`; the 24px target and no overflow at every size; the panel under its trigger's start edge; a real pointer moving to the next trigger; one tab stop from the neighbour; right-to-left; the overflowing bar; pointer close without a ring; contrast; forced colours. The hover check and the overflow check were broken on purpose once and failed.
- **Contrast**, text and the focus ring on every fill the bar draws (surface, neutral subtle, brand subtle), Purple and Emerald, light and dark, for both tones: text 6.59:1 or more on every fill it can sit on (`text.primary` on the deeper neutral fill, Purple dark, is the lowest) and the ring 3.56:1 or more on the resting fills, against floors of 4.5 and 3.
- Looked at live: the Docs page (sidebar position, tables, defaults) and the default theme and Emerald dark with a menu open.

## Not verified
- A real touch device, VoiceOver and a screen reader's announcement of the bar and its menus, Safari and Firefox (`focus({ focusVisible: false })` falls back to a ringed focus where unsupported), and Windows high contrast on a real machine (forced colours was emulated).
- Purple dark and Emerald light by a look (covered by the contrast measurements and the tokens).
- Known gaps, named and not built: an overflow menu for triggers that do not fit, and a sheet presentation for touch.
