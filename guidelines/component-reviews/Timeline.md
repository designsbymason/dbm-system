# Timeline — review

**Status:** Built, with the checks below run. Not yet declared Finalized by the maintainer; the full `06-engineering-standards.md` §9 review pass over it (feature-completeness, design-quality and theming judgment items in particular) is still to do.

## What exists
`Timeline` and `Timeline.Item`: a read-only record of events in an `<ol>`, each with a marker, a title, a time, an optional description and a body, joined by a line. Decision: [ADR-0141](../adr/0141-timeline-is-a-read-only-ordered-list-of-items-configured-by-props-in-the-callers-order-with-a-hand-rolled-cap-and-no-windowing-over-sub-parts-a-data-array-a-reverse-prop-or-virtualizing.md) (props on the item, the caller's order, a cap and no windowing).

Props worth knowing: `size`, `variant` (`filled`, `outlined`), `tone` (seven, per event too), `connector` (`solid`, `dashed`, `none`), `timePlacement` (`top`, `side`, a breakpoint map), `maxVisible` with `expanded`/`defaultExpanded`/`onExpandedChange`, `formatNumber`, `labels`; an item takes `title`, `time`, `dateTime`, `description`, `icon`, `marker`, `tone`, `statusText`, `pending`, `children`. New tokens: `timeline.marker-size.*` and `timeline.time-width` (`03-token-system-spec.md`).

## Verified while building
- JSDoc on both components with a usage example, and on every prop (`Timeline.types.ts`).
- 36 unit tests (structure and roles, the spread order, the cap and the button, controlled and uncontrolled and wired to state, the announcement, `StrictMode`, `labels` with an `undefined` entry, `formatNumber`, nesting, axe in several states), a server render and hydration test, the Docs page's token table against the stylesheet, and the snippet guard.
- Real-browser checks (`Timeline.checks.stories.tsx`): the marker level with the first line of text at every size with the time above and beside, the line through the middle of the markers and on to the next event at every size, the side column's order and alignment, the fall-back to the time above the title at a phone width, right to left, long content inside a narrow box at `xl`, the show-more button reached and pressed with the keyboard, keeping its focus, a 24px target and the events above not moving, and forced colours. Two of the checks were broken on purpose (the marker offset, the line's end margin) and failed, then restored. Every story also passes the axe run, including 2.5.3.
- Contrast measured for every marker pairing in all four themes. Fill, ring and icon colour against `bg.surface` all pass 3:1 and the icon on the fill 4.5:1. Against `bg.canvas`: the `highlight` tone's ring and icon are 2.84:1 in light (the tone is for a surface, as `Stepper`'s Docs page says), and the neutral ring in dark is 2.96:1, under 3:1 by 0.04. A marker never carries meaning alone (the title, `statusText` and the pending words say it), so these are accepted, not fixed. The line (`border.default`) is 1.19 to 1.46:1, decorative as `Stepper`'s is. `text.secondary` for the time and description is 5.10:1 or better.
- Bundle: 3.32KB JS and 2.22KB CSS gzipped, against the 10KB default budget. The Show-code snippets were typechecked against the real components (a planted bad prop failed it).
- Looked at in Storybook in light purple (markers, variants, the side column) and dark emerald (tones), and the Docs page checked for its sections and canvases. Full results: lint and both typechecks clean, 10,999 unit tests and 2,339 real-browser tests passing.

## Decisions made while building
- The marker is centred on the first line of text, whichever is taller, by an offset worked out from the marker size and the line height; the time is that first line in both placements.
- The show-more row is a list item of its own holding a native `Button`, in the text column, so it stays one element across "show more" and "show fewer" and keeps focus.
- The live region sits after the `<ol>` as a sibling (a fragment root), so the ref, `className` and the `aria-*` props all stay on the list.

## Not verified
- A real device, touch, and a screen reader: the roles, the hidden marker and line, the status text and the live region are checked by markup, axe and real-browser tests, not by listening.
- The full §9 review pass and the maintainer's declaration of Finalized.
- No guideline covers a feed that receives events while open; the Docs page says they are not announced.
