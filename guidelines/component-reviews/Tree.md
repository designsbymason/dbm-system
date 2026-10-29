# Tree — review

**Status:** Built and documented; the §9 review pass and Finalization are the maintainer's to declare. Not verified: the items under "Not verified" (a real device, touch and a screen reader, and the look of the Docs page and stories across the four themes).

## What exists
`Tree`: an expandable hierarchy of rows given as a `nodes` array, a flat `role="tree"` of `role="treeitem"` rows with roving focus. Decision: [ADR-0143](../adr/0143-tree-is-a-flat-roving-focus-wai-aria-tree-over-a-nodes-array-with-leaf-based-checks-and-a-window-of-fixed-height-rows-over-composed-item-parts-aria-activedescendant-or-nested-groups.md).

Props worth knowing: `size` (five steps), `selectionMode` (`none`, `single`, `multiple`) with `value`/`defaultValue`/`onValueChange` (always a list of ids), `checkable` with `checkedIds` (the checked leaves; a parent is derived) and `onCheckedChange`, `expandedIds`/`defaultExpandedIds`/`defaultExpandAll`/`onExpandedChange`, `loadingIds` and a node's `hasChildren` for children the caller fetches, `onItemActivate`, `renderLabel`, `highlightQuery`, `windowed` (`"auto"` from 200 visible rows, with `maxHeight`), `maxHeight`, `empty`, `dir`, `labels`/`formatNumber`, and `controllerRef` (`expandAll`, `collapseAll`, `expand`, `collapse`, `scrollToNode`). A node is `{ id, label, icon, description, children, hasChildren, disabled, trailing }`.

## Verified while building
- JSDoc on the component and every prop and type (`Tree.types.ts`), with a usage example.
- 147 unit tests across five files: the pure tree model (rows, levels, leaves, check state, toggling, ancestors), the component (structure and ARIA, expansion controlled and not, lazy children and the announcement, the whole keyboard model including typeahead and right to left, single and multiple selection, Shift ranges, Ctrl+A, checking and its mixed parents, a disabled row, the controller, a windowed long tree), the Show-code snippets, the Docs page's token table against the stylesheet, and a server render and hydration of a plain, a right-to-left and a windowed tree. jest-axe passes for closed, open, selectable, checkable, empty and right-to-left trees.
- 27 real-browser tests (15 stories, 12 hidden checks): every row is exactly its token's height at every size, selected or not, with check boxes or not; the arrow and the check box are hit on a box at least 24px tall at every size; a 500-row tree draws a window, keeps the scrollbar's height true, and `End` and `Home` reach the last and first rows through the window; the focus ring is drawn inside the row and inside the scrolling box; right to left indents from the right edge, mirrors the arrow and swaps the arrow keys; a real pointer opens from the arrow, checks from the box, selects from the label and activates on a double click; the tree is one tab stop that follows the arrow keys; forced colours keep a selected row's bar (`Highlight` against `Canvas`) and a checked box; a long label is cut with an ellipsis without changing the row's height; a disabled row is dimmed, cannot be hit, and is still reached by the arrow keys; a row that failed to load and the Empty row are exactly the row height at every size, with the words in the danger and quiet colours, the Empty row is not filled by a real pointer over it, and the retry mark is hit on a box 24px tall and asks to try again from a click and from Enter.
- The Show-code snippets pass the shared snippet checker, and were typechecked against the real components through a scratch file (removed afterwards).
- Bundle: see the last round below; 5.77KB JS and 1.67KB CSS gzipped at first, against the 10KB default budget.
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
- The Docs page and the stories were typechecked and their canvases mounted by the story runner; the lazy story was looked at in dark emerald and the Docs page in light purple, but not every story in every theme.
- Windowing was exercised in Chromium with 500 rows and in jsdom with 1000; thousands of rows with check boxes, and very deep trees, were not.
- Reordering and reparenting are not built (ADR-0143); `useSortable` is untouched.

## Second round: the gaps found after the first build
- **Check-state cost.** Every drawn row used to walk all the leaves under it, so a folder of tens of thousands of leaves slowed every check. The states are now one pass over the nodes (`checkStates`), which a test holds equal to the per-node answer for every node and time on a hundred thousand leaves.
- **A failed fetch.** `errorIds` and `onRetry`, with a warning mark in place of the arrow, `labels.loadFailed` in the row (so it is in the name), an announcement when one is added, and a retry from the mark, Right or Enter when the row is open. A closed row opens the ordinary way. The spinner wins while it loads again.
- **A fetch that found nothing.** `hasChildren` with `children: []` gives one disabled "Empty" row (`labels.emptyFolder`) under the open row. It is in the arrow-key order, cannot be selected or checked, carries `aria-selected="false"` in a selectable tree (the `treeitem` role requires it there), and is not counted among the leaves.
- **`scrollToNode` on a controlled tree** that never opens the rows above the target now warns once in development, and stays pending so an owner that applies the ids later still gets the scroll.
- **Contrast, measured in all four themes** (computed from the live tokens): every text pairing is at least 4.5:1 and every icon, mark and fill pairing at least 3:1 (selected and hover fills included, and the danger words and mark), except one real finding: the unchecked box's outline, `border.neutral`, is 2.3:1 on the surface in the two light themes. It is now `border.neutral-strong` (4.5:1 or more on the surface, the selected fill and the hover fill, in all four). `Checkbox` draws the same outline with `border.neutral`; that is its own component's to decide and was not touched.
- Found while writing the checks: the test library's `hover` sets no real `:hover`, so a hover check needs the browser protocol with the iframe's offset and scale added.
- Still not verified: a screen reader and a real device (touch), unchanged.
