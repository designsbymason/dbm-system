# 0135 — `CommandPalette` reports the highlight, asks for a value in the search field, switches lists by a typed prefix, caps groups and draws modifier keys for the platform, over a preview pane, a second dialog or a Tab key that completes

**Status:** Accepted · **Date:** 2026-10-25 · **Amended 2026-10-26** — which devices don't draw the key hints; the decision itself is unchanged · **Amended 2026-10-30** — `showHints` is off by default, and does not govern a mode's prefix hint; the decision itself is unchanged

## Context
[ADR-0134](./0134-commandpalette-ranks-by-word-start-keeps-group-order-drills-into-one-level-of-pages-and-runs-promise-commands-busy-over-fuzzy-matching-a-flat-list-or-closing-first.md) settled ranking, lists and waiting commands. Five things people expect of a launcher were left out: seeing what a command would do before running it, commands that need a value ("Rename file…"), several sets of commands reached by a prefix (`>`, `@`), a long empty list that is a wall, and shortcut hints that read right on every platform.

## Decision
- **The highlight is reported, not previewed.** `onHighlightChange(item | null)` is called when the highlighted command changes (by the keys or the pointer) and with `null` when none is highlighted or the palette closes, so an app can try a theme as it is passed over and put it back on `null`. The palette draws no preview of its own.
- **Enter is shown on the highlighted row, and the forward arrow opens a list.** The highlighted row ends with an Enter key (hidden from assistive technology, drawn only with `showHints` *(Amended 2026-10-30: this originally said it was on by default and "off with `showHints={false}`"; the default became off)*, and not drawn on a device with no mouse or trackpad, as the footer's hints and a row's shortcut keys are not). *(Amended 2026-10-26: this originally said "a touch screen", which also took the hints from a tablet with a keyboard; the condition is `any-pointer: coarse` and not `any-pointer: fine`.)* With the caret at the end of the text, the arrow that points on (Right, or Left in right-to-left) opens the highlighted command's list or asks for its value. **Tab is not used:** it moves focus as it does everywhere in the dialog, so no one is held in the field.
- **A command can ask for a value.** `argument: { placeholder, initialValue, validate }` turns the search field into the entry for it, under the Back button used for lists, with one row that says what Enter will do ("Run with “name”"), or why it will not (empty text, or the message `validate` returns). `onSelect` and the palette's `onSelect` get `{ query, argument }` as a second argument. A command with both `items` and an `argument` opens its `items`.
- **Lists of commands are reached by a prefix.** `modes` is an array of `{ prefix, label, commands, placeholder, emptyContent }`. While the text starts with a prefix, the list is that mode's commands and the search is what follows. The prefix stays in the text (so deleting it leaves the mode), the footer hints each prefix, and modes apply only at the top level. They are props, not a registry: the palette still has no store of commands.
- **A long empty list can be cut.** `maxPerGroup` keeps the first few of each group while the search is empty and adds a "Show N more" row, a real row the keys reach, that shows the rest of that group. `suggested` lists commands after `recent` under their own heading; a command shows once, in the first group that names it, and neither group is cut. Searching lists every match.
- **A shortcut is written for the platform.** The names `mod`, `cmd`, `ctrl`, `alt` and `shift` in a command's `shortcut` (an array, or a string joined by `+`) are drawn as ⌘ ⌃ ⌥ ⇧ on an Apple platform, with a plain-language name for the symbol, and as Ctrl, Alt and Shift elsewhere. Other text is drawn as written. The platform is read when the panel is drawn, which is only ever in the browser.

## Alternatives considered
- **A preview pane drawn by the palette.** Rejected: what a preview is (a theme, a page, a record) is the app's, and a slot for it would take a layout decision (beside or under the list, how wide on a phone) from every app; the report of the highlight serves all of them.
- **Tab completes the text, or opens a list.** Rejected: Tab is how a keyboard user leaves a field, and a dialog already holds focus; taking it for completion makes the palette a trap for exactly the people who rely on it. The arrow that points on does the same job.
- **An argument asked in a second dialog, or a field inside the list.** Rejected: the search field is already the one place a person is typing and focus never leaves it; a second window breaks that, and a field in a row would take focus into the list.
- **The prefix removed from the text and drawn as a chip.** Rejected: deleting it would need its own key handling, and a chip is one more thing to name; leaving the characters in the field makes leaving a mode the same as deleting text.
- **A registry of modes.** Still deferred, for the reason ADR-0132 gave.
- **Capping by a total count, or hiding groups behind a click.** Rejected: a heading with its first few and a way to the rest keeps the map of the whole list on screen, and a total count cuts whichever group is last.
- **Drawing `mod` in the first render as the platform's key.** Not done: the panel is never rendered on a server, so reading the platform once when it is drawn cannot differ from a server's output.

## Consequences
- `CommandItem.onSelect` takes `(item, details)`; handlers that take only the item are unaffected. The component is not published, so this changes nothing for anyone.
- The bundle grows (about a kilobyte): its budget is raised with the reason beside it.
- A palette with `modes` has more than one place commands come from, so `recent` and `suggested` name top-level commands only.

## Related
ADR-0066, ADR-0132, ADR-0133, ADR-0134, `05-component-api-conventions.md` §3 (a shortcut shown is only a label); `component-reviews/CommandPalette.md`.
