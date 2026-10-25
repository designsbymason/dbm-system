# 0134 — `CommandPalette` ranks by word start, keeps group order, drills into one level of pages and runs promise commands busy, over fuzzy matching, a flat list or closing first

**Status:** Accepted · **Date:** 2026-10-25

## Context
A palette's value is that the command you mean is first after a few letters, and that a command can lead to a smaller list ("Theme" then "Light", "Dark"). `Combobox`'s default filter only keeps or drops an option; it does not order them. A command also does work: it may save, navigate or call a server.

## Decision
- **Ranking.** Every word of the search must be found in the label, `textValue` or `keywords` (folded for case and accents, as `Combobox` does). A result scores higher for a label that starts with a word, then one with a word starting inside it, then a word found anywhere in the label, then one found only in `keywords`. Equal scores keep the order given. Groups stay in the order they first appear and results are ranked inside each group, so a heading never jumps. No typo tolerance and no subsequence matching: a result that reads nothing like what was typed is noise. `filter={false}` leaves ranking to the caller (a search done on a server); a `filter` function keeps or drops and leaves the order.
- **Pages.** A command with `items` opens them: the search clears, the header shows the page's name beside a Back button, and Backspace on an empty search goes back. One level is supported (a page's own `items` are not opened). Only the current level is searched. Escape closes the palette from any level.
- **Recent.** While the search is empty and the top level is shown, the commands named in `recent` are moved into a group of their own at the top; once something is typed they are in their usual place. A value appears once, so row ids and keys stay unique.
- **A command that returns a promise is busy.** The row shows a spinner, the palette is `busy` (Escape and the scrim do nothing), other commands are not run, and it closes when the promise resolves unless `closeOnSelect` is `false`. A rejection keeps it open, announces the failure and goes to `onSelectError`; with no handler it is left unhandled, as `Menu` and `ConfirmDialog` do. A command runs as soon as it is chosen (it cannot be known to return a promise otherwise), and the palette then closes. A command that opens another overlay needs nothing extra: a real-browser check records every element that takes focus and finds the opener is never one of them, and focus ends inside the new overlay.
- **The count is announced** when it changes between two states that were on screen, never on first appearance (`useAnnouncement`).

## Alternatives considered
- **Fuzzy (subsequence) matching.** Rejected: "gts" matching "Go to settings" also matches half the list, and the ranking that would make it useful is a library's worth of tuning.
- **Rank across groups.** Rejected: headings that reorder under the person's eyes are harder to scan than a slightly worse order.
- **A flat list only.** Rejected: nesting is what separates a palette from a combobox, and a theme or a workspace switcher is the common case.
- **Close first, then run (or run then close) for a promise.** Rejected: a command that fails after the window has gone leaves the person with no sign of it.
- **Persist recents inside the palette.** Rejected: what counts as recent (per user, per workspace, after a server round trip) is the app's to say; a list of values is all it has to hand over.

## Consequences
- `commandPalette.rank` is a pure function with its own tests, beside the palette, not in `internal/optionList` (nothing else ranks yet).
- A command registry or deeper pages can be added later without changing the data shape.

## Related
ADR-0066, ADR-0078, ADR-0132, ADR-0133; `component-reviews/CommandPalette.md`.
