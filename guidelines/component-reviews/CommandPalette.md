# CommandPalette — review

**Status:** Finalized 2026-10-26, after the full `06-engineering-standards.md` §9 review pass (below), declared by the maintainer.

## What exists
A modal `Dialog` with a search field and an inline list of commands, opened by a hotkey (`mod+k`), a `trigger`, `open` or a controller; prop-driven over a `commands` array. Decisions: [ADR-0132](../adr/0132-commandpalette-is-a-prop-driven-dialog-over-a-commands-array-that-owns-its-hotkey-and-a-controller-over-a-compound-of-parts-a-registry-provider-or-a-combobox-in-a-popover.md) (shape, hotkey, controller, search field), [ADR-0133](../adr/0133-the-listbox-body-is-split-from-the-option-list-panel-so-commandpalette-draws-it-inline-over-copying-the-rows-or-anchoring-a-popover-in-a-dialog.md) (the listbox body split out of the option list panel), [ADR-0134](../adr/0134-commandpalette-ranks-by-word-start-keeps-group-order-drills-into-one-level-of-pages-and-runs-promise-commands-busy-over-fuzzy-matching-a-flat-list-or-closing-first.md) (ranking, pages, recent, commands that wait).

## Verified while building
- Unit tests (rendering, naming, the hotkey, searching and ranking, keys, running commands, lists of commands, the controller, `StrictMode`, `labels` merging, axe), a server render and hydration test for every variant, the ranking and hotkey helpers, and the Docs page's token table against both stylesheets it reads.
- Real-browser checks (`CommandPalette.checks.stories.tsx`): Ctrl+K through the DevTools Protocol from the page and from inside a text field, placement and width at `lg`, a thousand commands drawn a window at a time with the highlight kept in view, the search row's focus ring, 24px targets, a command chosen with a real mouse above an open `Dialog` that stays open, focus handed to a `ConfirmDialog` a command opened (the opener never takes it), text inserted in one event, forced colours, right to left, and the full-screen map on a phone width.
- The split of `OptionListBody` out of `OptionListPanel` changed no output: `Combobox` and `MultiSelect`'s unit tests pass unchanged. Their real-browser checks are to be re-run as part of this component's review, as ADR-0133 says.
- Looked at in Storybook in light purple and dark emerald.

## Added after the first build
Searching the commands inside lists from the top level, the keyword a row matched through, and a list's own placeholder and empty note ([ADR-0134](../adr/0134-commandpalette-ranks-by-word-start-keeps-group-order-drills-into-one-level-of-pages-and-runs-promise-commands-busy-over-fuzzy-matching-a-flat-list-or-closing-first.md)), each with unit tests and, for nested search and taps on a phone width, real-browser checks.

## Added in the second round
The highlight report (`onHighlightChange`), values asked for in the search field (`argument`), modes reached by a prefix, capped and suggested groups, the Enter hint on the highlighted row with the forward arrow opening a list, and modifier keys drawn for the platform ([ADR-0135](../adr/0135-commandpalette-reports-the-highlight-asks-for-a-value-in-the-search-field-switches-lists-by-a-typed-prefix-caps-groups-and-draws-modifier-keys-for-the-platform-over-a-preview-pane-a-second-dialog-or-a-tab-key-that-completes.md)). Each has unit tests and, for arguments, modes, capped groups and platform keys, real-browser checks.

## Disabled commands
`onDisabledSelect(item, { reason })` is called when a disabled command is pressed (the keys skip such rows), so an app can say why; the palette stays open.

## Recent commands
`useRecentCommands` (in `utils`, re-exported from the package) keeps the list `recent` takes, newest first and capped, with the storage plumbing it shares with `usePersistentDismiss` (that hook was moved onto the shared helpers with no change in behaviour; its tests pass unchanged).

## Final review pass
Found and fixed:
- `onHighlightChange` is reported by the command's `value`, not by object identity (commands built on every render called it each render, and a callback that set state to an object looped); remembered across React's `StrictMode` remount.
- The keyword a row was found through is `text.secondary`, not `text.tertiary`: 4.48:1 on the highlighted row in Purple light, now 6.56:1 or more in all four themes (measured; a real-browser check guards it).
- A `filter` or an `argument.validate` that throws is treated as "no match" or a refusal (`labels.argumentInvalid`), with one development warning, instead of taking the page down.
- The Enter key's room is kept on every row that can run (drawn only on the highlighted one), so a label's width no longer changes by about 33px as the highlight moves (a real-browser check measures it).
- Development warnings for a value used twice in one list and for modes that can never be reached (an empty or spaced prefix, a repeat, or one an earlier prefix shadows).
- The two lengths in the stylesheet are tokens (`command-palette.match-hint-max-width`, `command-palette.page-tag-max-width`).
- The composed tab order (search field, close button, never a row; Back button first inside a list) has unit and real-browser tests.
- `CommandPalettePanel.tsx` is split: pure functions for entries, ranking-and-grouping and warnings (`commandPalette.entries.ts`, `.warnings.ts`) and hooks for running a command, reporting the highlight, announcing results and warning once. The panel went from 532 to about 415 lines, each part with tests.

Decided: the footer's key hints, the Enter key on the highlighted row and a row's own shortcut keys are not drawn on a device with no mouse or trackpad (`any-pointer: coarse` and not `any-pointer: fine`), so they are not read out either; a tablet with a keyboard and a trackpad keeps them. The test browser can't emulate pointer type, so a real-browser check asserts the rule in the loaded stylesheet and that everything is drawn with a fine pointer.

## Not verified at Finalization
- A real device: a tap is checked with touch pointer events dispatched from the page, and pointer type can't be emulated in the test browser, so what a phone, an on-screen keyboard and a real touch do is untried. `fullScreen` therefore stays off by default (ADR-0132).
- Firefox and Safari, and a screen reader. A resting pointer taking the highlight back from the arrow keys was not reproducible in Chromium (the check that guards it passes); an engine that sends a synthetic mouse move after a re-layout may differ.
- Windows high contrast is emulated only.
- Storybook's own ⌘K shortcut and the Playground's default `mod+k` on the Docs page were not compared.
- Contrast was measured in all four themes for the keyword hint, the footer text and the placeholder; the highlighted row's label and description pairing is shared with `Combobox` and covered by its review.
