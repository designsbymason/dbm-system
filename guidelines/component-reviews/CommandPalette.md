# CommandPalette — review

**Status:** built; the full `06-engineering-standards.md` §9 review pass has not been run, and the component has not been declared Finalized (only the maintainer declares that).

## What exists
A modal `Dialog` with a search field and an inline list of commands, opened by a hotkey (`mod+k`), a `trigger`, `open` or a controller; prop-driven over a `commands` array. Decisions: [ADR-0132](../adr/0132-commandpalette-is-a-prop-driven-dialog-over-a-commands-array-that-owns-its-hotkey-and-a-controller-over-a-compound-of-parts-a-registry-provider-or-a-combobox-in-a-popover.md) (shape, hotkey, controller, search field), [ADR-0133](../adr/0133-the-listbox-body-is-split-from-the-option-list-panel-so-commandpalette-draws-it-inline-over-copying-the-rows-or-anchoring-a-popover-in-a-dialog.md) (the listbox body split out of the option list panel), [ADR-0134](../adr/0134-commandpalette-ranks-by-word-start-keeps-group-order-drills-into-one-level-of-pages-and-runs-promise-commands-busy-over-fuzzy-matching-a-flat-list-or-closing-first.md) (ranking, pages, recent, commands that wait).

## Verified while building
- Unit tests (rendering, naming, the hotkey, searching and ranking, keys, running commands, lists of commands, the controller, `StrictMode`, `labels` merging, axe), a server render and hydration test for every variant, the ranking and hotkey helpers, and the Docs page's token table against both stylesheets it reads.
- Real-browser checks (`CommandPalette.checks.stories.tsx`): Ctrl+K through the DevTools Protocol from the page and from inside a text field, placement and width at `lg`, a thousand commands drawn a window at a time with the highlight kept in view, the search row's focus ring, 24px targets, a command chosen with a real mouse above an open `Dialog` that stays open, focus handed to a `ConfirmDialog` a command opened (the opener never takes it), text inserted in one event, forced colours, right to left, and the full-screen map on a phone width.
- The split of `OptionListBody` out of `OptionListPanel` changed no output: `Combobox` and `MultiSelect`'s unit tests pass unchanged. Their real-browser checks are to be re-run as part of this component's review, as ADR-0133 says.
- Looked at in Storybook in light purple and dark emerald.

## Known gaps, for the review pass
- A real touch (a page-dispatched tap) is not yet checked; `fullScreen` is off by default until it has been tried on a real device (ADR-0132).
- Light/dark and both brands are looked at only in part; the full four-theme pass, contrast checks of the highlighted row against `bg.brand-subtle` (shared with `Combobox`) and the Docs page visual pass are part of the review.
- The feature-completeness pass and the Properties-table checks of `06` §9 are still to do.
