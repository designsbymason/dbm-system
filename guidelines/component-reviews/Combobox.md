# Combobox — review findings

Eighth organism, built 2026-10-16 with the `06-engineering-standards.md` §9 checklist applied as it was written.
**Finalized 2026-10-16** by the user, after the final review pass (`/review-component Combobox`) and its fixes, with the
items under "Open at Finalization" accepted as open. What follows is what was decided and found while building it, and
what the final review fixed.

## Decisions
- The list floats from a Radix Popover with an anchor and no trigger, and works inside a `Dialog` and a `Popover`: [ADR-0077](../adr/0077-combobox-floats-its-list-with-a-radix-popover-anchor-and-no-trigger-over-popover-popper-and-a-dismissable-layer-or-a-bare-portal.md).
- Options are an `options` array, not child parts: [ADR-0078](../adr/0078-combobox-takes-its-options-as-data-over-option-parts-mounted-as-children.md).
- Must-pick by default; the chosen value and the typed text are kept apart; a hidden validated input submits for forms: [ADR-0079](../adr/0079-combobox-must-pick-by-default-keeps-the-chosen-value-apart-from-the-typed-text-and-submits-through-a-hidden-validated-input.md).
- Long lists are windowed by a hand-rolled hook in `primitives` with fixed row heights from tokens: [ADR-0080](../adr/0080-long-option-lists-are-drawn-a-window-at-a-time-by-a-hand-rolled-hook-with-fixed-row-heights-from-tokens-over-a-virtualization-dependency-or-measured-rows.md).
- The field is `Input`, so size, border, focus ring and error state are its own. The caret and clear buttons are drawn here (not `Input`'s `onClear`) so their names are translatable through `labels` and they stay out of the tab order. New component tokens: `combobox.list-max-height`, `combobox.option-height.*`, `combobox.option-height-described.*`.
- No new dependency: `@radix-ui/react-popover` was already installed. Bundle size 6.36KB JS and 2.19KB CSS, under the 10KB budget.

## What was found while building it
- **A trigger-less `Popover.Anchor` works.** ADR-0017's bug is the trigger's implicit anchor racing a real one; with no trigger the panel sat at the anchor's left edge, 4px under it and as wide as it, and a real mouse chose an option inside an open `Dialog` without closing it. Both are real-browser checks now.
- **A box can't shrink below its padding.** The first windowed list put its spacers on the scrolling box, so the box was as tall as the whole list (71,496px) and nothing scrolled, while every check that didn't scroll passed. The spacers are on an inner box. The same failure made unrelated checks hang once a stuck list was left in the page.
- **`aria-controls` has to point at the list for as long as it is in the page.** The combobox-popup exemption for a scrolling list reads it, and the list stays mounted while it fades out, so an `aria-controls` removed on close failed the scrollable-region rule for a moment after every choice.
- **Radix marks Escape as handled before the field's own key handler runs**, so restoring the last choice's text from `onKeyDown` never ran. It is done from the layer's `onEscapeKeyDown`.
- **The floating layer measures the room on the screen after the list first renders**, so scrolling a long list to the chosen option on open found a box as tall as its content and did nothing. The box is also capped by its own max height, and the scroll runs again when the measured height settles.
- **A read-only input is barred from constraint validation**, which is the whole point of the hidden input, so it is not `readOnly`. A text input also blocks implicit submission: a form with a lone combobox and no submit button doesn't submit on Enter.
- **`Highlight`'s side padding reads as a gap inside a word** ("Un ited States"). The matched stretch overrides it to none.
- **A disabled option's description stayed in the secondary text colour**, so it read as available beside a dimmed label. It follows the disabled colour.
- **Cheap to get wrong in jsdom:** Enter during an input method's composition, a controlled value that the owner refuses, a late-arriving option for a controlled value (the label appears by itself, since the field shows the label of whatever the value names unless text has been typed).

## Final review pass (2026-10-16)
Findings from the review, all fixed:
- **Forced colours:** the chosen row set `forced-color-adjust: none` with `CanvasText`, so a highlighted chosen row kept its light fill under the page's light text colour (measured white text on `rgb(249,249,255)`, about 1.05:1, with a dark scheme). The rule is gone; a check measures the row under forced colours with a dark scheme, and fails if the old rule returns.
- **`required` with `allowCustomValue`:** the visible field never got the native `required`, so a form accepted it empty. It does now; unit and `Form` tests cover both modes.
- **Contrast:** the description used `text.tertiary` on the highlighted row's `bg.brand-subtle` (4.48:1 in Purple light, under the floor). It uses `text.secondary` (6.56:1 and above in every theme); the pairing is recorded in `03-token-system-spec.md`, and a check measures label and description on the highlighted row in all four themes (it fails at 4.48 with the old colour).
- **Development warnings:** a field with no accessible name, two options with one value, and `align` with `presentation="full-width"`.
- **"1 results available"** now reads "1 result available".
- **`container`:** the list can be drawn inside an element of the caller's. The other layer props (`collisionBoundary`, `hideWhenDetached`, `sticky`) are deliberately not exposed: the field already sets the collision padding and full-width placement itself, and none has a use that `container` and `side` don't cover.
- **Performance:** the "Create …" check no longer folds every label on every render, and an omitted `options` no longer makes a new array each render; the viewport measurement is one a frame.
- **Structure and tests:** the text-matching and row helpers are in `Combobox.match.ts` and `Combobox.rows.ts` with their own tests; server render and hydration cover the newer props and a long open list; `Form` plus `FormField` regression tests (message, focus, `aria-invalid`, `aria-describedby`, submitted value).

## Added after the first build
- **Group names in a windowed list:** each option is read with its group's name (an amendment to ADR-0080).
- **Word matching:** the default filter keeps an option that holds every word of the typed text in any order, and every matching stretch of a label is marked (touching marks are joined).
- **Icon space:** when any option has an icon, the rows without one hold a blank place for it, so labels line up.
- **`onCreate`:** a "Create …" row at the end of the list while the text names no option; the owner returns the new option (or a promise of it) to have it chosen. The row is highlighted only when nothing else matches.
- Type-ahead by first letter was not added: typing already opens the list and narrows it.

- **The "ResizeObserver loop" warning inside a `Dialog` or `Popover`:** the list's width followed Radix's `--radix-popover-trigger-width`, which is rewritten during layout; a `Dialog`'s entrance scales the field, so the width fed back into the layer's size observer (about 30 warnings per run, against 5 for a `Select`). The field's layout width is now read by the component's own observer and given to the list. No warnings in any Combobox run since.
- **Match marking:** the matched text in a label is bold by default (`font-weight.bold`, a `<b>`); the optional `highlightTone` prop adds `Highlight`'s colours as well (a `<mark>`). Medium and semibold weights were tried first and were too close to the regular weight to see.
- **`keywords`:** an option can carry extra words the default filter matches ("UK" for "United Kingdom"); they are never shown or marked.
- **Two empty messages:** a list with no options and nothing typed shows `labels.typeToSearch`; text that matches nothing shows `noResults` or `emptyContent`.
- **`presentation="full-width"`:** the list spans the visible screen a gap in from each edge and opens above or below the field, whichever has room once an on-screen keyboard is counted (the visual viewport). Opt-in; [ADR-0081](../adr/0081-combobox-offers-a-full-width-presentation-measured-against-the-visual-viewport-over-a-docked-bottom-sheet.md).

## Verified
- Unit tests (jsdom): structure and naming, pointer and keyboard choosing, filtering, announcements, controlled and uncontrolled value, text and open state, states, forms and validity, axe, StrictMode, server render and hydration in eight variants, and the windowing hook.
- Real-browser checks (Chromium): placement and width, a real mouse choosing inside a `Dialog` and a `Popover`, Escape closing the list before the dialog, text inserted all at once, the keyboard end to end with one tab stop, a list of 2,000 options (rows drawn, scroll height, wrap to the last option in view, the chosen option far down in view), a phone width, field height against `Input` at every size, 24px buttons, right to left, forced colours, form refusal and focus, page scroll, controlled open state.
- Light and dark in the Purple brand, and dark in the Emerald brand, looked at directly; Emerald light was not.

## Open at Finalization
- The full-width presentation's keyboard handling is covered by a mocked visual viewport and by real-browser checks of width, edges and side; it has not been tried with a real on-screen keyboard. Making it the default below `sm` waits for that.
- Matching is by words (every word of the typed text, in any order), and `filter` replaces it whole.
- `onCreate` needs the owner to add the new option to `options`; until they do the created option is kept only as the value's label. There is no built-in way to mark a created option as unsaved.
- Escape with the list closed passes through, so there is no "press again to clear"; the clear button does that.
- No type-ahead by first letter and no multi-select: `MultiSelect` builds on this later.
- Contrast: the one new pairing (the description on the highlighted row) was measured and fixed; the other pairings are the ones `Select` already uses, and were not re-measured here. A check measures the label and description on the highlighted row in all four themes.

## Icons at the input's own step, 2026-10-19 (visual change; stays Finalized)

At explicit direction, following `Input`'s own change (see [Input](Input.md)): the icons this component draws in the field (the leading and trailing icons, the clear and loading ones) are the same step as the field's `size` (`xs` 12px … `xl` 32px) instead of one step below it. The compensating margin and, at `lg` and `xl`, the smaller padding of its button are recomputed as `Input`'s clear button's are. A real-browser check in `Input.checks.stories.tsx` measures the icons and the field's height at every size.

## List moved to `internal/optionList`, 2026-10-25 (refactor, no visible change; stays Finalized)

At the user's direction, while building `MultiSelect` ([ADR-0123](../adr/0123-the-floating-option-list-is-shared-by-combobox-and-multiselect-through-internal-and-multiselect-draws-tagsinputs-box-and-chip-over-copying-them-or-adding-a-multiple-prop-to-combobox.md)): the panel, rows and notes, the matching and row helpers (with their tests), the windowing and layout hooks, the list's stylesheet and the in-field caret and clear buttons moved to `internal/optionList/`, and `Combobox` draws with them. Nothing it renders or does changed: its unit tests, its server-render and hydration tests and its real-browser checks pass as written (the helper tests moved with the helpers, and the docs-token test reads the shared stylesheets), so by `06` §9's three questions it stays Finalized. Re-verified: functional verification, Docs. The two custom properties the list reads (`--combobox-width`, `--combobox-room`) and the `combobox.*` tokens keep their names.
