# Tree — review

**Status:** Built and documented; the §9 review pass and Finalization are the maintainer's to declare. Not verified: the items under "Not verified" (a real device, touch and a screen reader, and the look of the Docs page and stories across the four themes).

## What exists
`Tree`: an expandable hierarchy of rows given as a `nodes` array, a flat `role="tree"` of `role="treeitem"` rows with roving focus. Decision: [ADR-0143](../adr/0143-tree-is-a-flat-roving-focus-wai-aria-tree-over-a-nodes-array-with-leaf-based-checks-and-a-window-of-fixed-height-rows-over-composed-item-parts-aria-activedescendant-or-nested-groups.md).

Props worth knowing: `size` (five steps), `selectionMode` (`none`, `single`, `multiple`) with `value`/`defaultValue`/`onValueChange` (always a list of ids), `checkable` with `checkedIds` (the checked leaves; a parent is derived) and `onCheckedChange`, `expandedIds`/`defaultExpandedIds`/`defaultExpandAll`/`onExpandedChange`, `loadingIds` and a node's `hasChildren` for children the caller fetches, `onItemActivate`, `renderLabel`, `highlightQuery`, `windowed` (`"auto"` from 200 visible rows, with `maxHeight`), `maxHeight`, `empty`, `dir`, `labels`/`formatNumber`, and `controllerRef` (`expandAll`, `collapseAll`, `expand`, `collapse`, `scrollToNode`). A node is `{ id, label, icon, description, children, hasChildren, disabled, trailing }`.

## Verified while building
- JSDoc on the component and every prop and type (`Tree.types.ts`), with a usage example.
- 123 unit tests across five files: the pure tree model (rows, levels, leaves, check state, toggling, ancestors), the component (structure and ARIA, expansion controlled and not, lazy children and the announcement, the whole keyboard model including typeahead and right to left, single and multiple selection, Shift ranges, Ctrl+A, checking and its mixed parents, a disabled row, the controller, a windowed long tree), the Show-code snippets, the Docs page's token table against the stylesheet, and a server render and hydration of a plain, a right-to-left and a windowed tree. jest-axe passes for closed, open, selectable, checkable, empty and right-to-left trees.
- 25 real-browser tests (15 stories, 10 hidden checks): every row is exactly its token's height at every size, selected or not, with check boxes or not; the arrow and the check box are hit on a box at least 24px tall at every size; a 500-row tree draws a window, keeps the scrollbar's height true, and `End` and `Home` reach the last and first rows through the window; the focus ring is drawn inside the row and inside the scrolling box; right to left indents from the right edge, mirrors the arrow and swaps the arrow keys; a real pointer opens from the arrow, checks from the box, selects from the label and activates on a double click; the tree is one tab stop that follows the arrow keys; forced colours keep a selected row's bar (`Highlight` against `Canvas`) and a checked box; a long label is cut with an ellipsis without changing the row's height; a disabled row is dimmed, cannot be hit, and is still reached by the arrow keys.
- The Show-code snippets pass the shared snippet checker, and were typechecked against the real components through a scratch file (removed afterwards).
- Bundle: 5.77KB JS and 1.67KB CSS gzipped, against the 10KB default budget.
- `pnpm lint` (ESLint and both typechecks) is clean, and so is `pnpm check-guidelines`.

## Decisions made while building
- **`value` is always a list of ids**, also in `single` (at most one). A type that changes with a prop does not work with a Playground, a manifest or a caller switching modes; the plan had `string | null` for `single`.
- **Flat markup, not nested groups.** Every row states `aria-level`, `aria-posinset` and `aria-setsize`, so a window can draw any slice of the visible rows and still announce each truthfully.
- **A parent's check state ignores disabled leaves** (unless all are disabled). Counting them left a parent with one disabled, unchecked leaf permanently "indeterminate", so it could never be shown as fully checked and a toggle could not tell which way to go. Found by the real-browser pointer story.
- **The check box is drawn, not a `Checkbox`.** A button inside a treeitem would be a second focus stop.
- **Hit areas** of the arrow and the check box are extended vertically to 24px and sideways halfway to their neighbour, so two never overlap (at `xs` they did when extended to a full square, and the check box swallowed the arrow's edge).
- **Typeahead restarts on any non-letter key**, so `Home` followed by a letter does not extend the word typed before it.
- **The tree element is `tabindex="-1"` while the row that holds the stop is drawn, and `0` while it is outside the window**; it hands focus to that row. (`-1` also satisfies the lint rule that a `tree` role be focusable.)
- **No dev-warning ref in render.** The missing-name warning runs in an effect.
- **The `readLengthToken` helper is a copy of `DataTable`'s** (`Tree.length.ts`), the second consumer; `05` §1 says to extract a shared module at the third.
- The Input.insertText real-browser check from the plan does not apply: the tree has no text field, and typeahead reads keys.

## Not verified
- A real device, touch and a screen reader: the roles, states, levels and the live region are checked by markup, axe and real-browser tests, not by listening, and a long press or a swipe was not tried.
- The Docs page and the stories were typechecked and their canvases mounted by the story runner, but their look in all four themes was not reviewed by eye.
- Contrast: the selected row (`bg.brand-subtle` with `text.primary`), the hover fill (`bg.neutral-subtle`), the unchecked box outline (`border.neutral` on `bg.surface`) and the checked box (`icon.on-brand` on `bg.brand`) reuse pairings other components already use; none was measured again for this component.
- Windowing was exercised in Chromium with 500 rows and in jsdom with 1000; thousands of rows with check boxes, and very deep trees, were not.
- Reordering and reparenting are not built (ADR-0143); `useSortable` is untouched.
