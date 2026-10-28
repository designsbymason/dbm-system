# 0142 — `Timeline` takes a feed surface of headings, an end, links, detail, paging and two more layouts, over leaving them to the caller or to separate components

**Status:** Accepted · **Date:** 2026-10-28

## Context
[ADR-0141](./0141-timeline-is-a-read-only-ordered-list-of-items-configured-by-props-in-the-callers-order-with-a-hand-rolled-cap-and-no-windowing-over-sub-parts-a-data-array-a-reverse-prop-or-virtualizing.md) kept `Timeline` a small read-out. Real feeds need more around it: headings for days, an end, an event that opens something, detail kept out of the way, a history paged from a server, and a layout other than one column down the left. The question was how much of that belongs in the component and what shape it takes.

## Decision
- **Headings and the end are list entries beside the events**, not containers: `Timeline.Group` (a heading before a run) and `Timeline.End` (a bar or icon and a word) are direct children, so the cap, the order and the alternation work over one flat list. A heading is drawn only while an event after it is; the end only once every event is. A fragment is still not drawn: a caller flattens its days into one list.
- **An event becomes a link or a button through its title**: `href` (the `Link` atom) or `onPress` (a native button), stretched over the whole event with a pseudo-element, with anything in the body or `detail` lifted above it. There is one focus stop and one accessible name, and one ring drawn round the event with `:has(:focus-visible)`. There is no `asChild` for the whole event.
- **`detail` is a disclosure on the item**: a `Button` with a fixed name (`labels.details`), `aria-expanded` and `aria-controls`, over a region hidden with `hidden`; `open`/`defaultOpen`/`onOpenChange` are the usual pair.
- **Paging is the caller's, and the timeline draws its states**: `onLoadMore` and `hasMore` draw one button after the last event, `loading` draws placeholders (the whole list when there are no events yet) and busies the button, `empty` (or `labels.empty`) says what none looks like. The timeline fetches nothing, and gives the button its focus back after loading if the browser dropped it.
- **Announcing additions is `announce`, off by default**, saying "N new events" only when events are added to a timeline that is already showing, never on its first render or when data first arrives (the first-appearance rule, `06` §9), never for events "show more" reveals.
- **Two more layouts.** `align="alternate"` is switched by a stylesheet media query from `md` (768px) and below it every event is on one side; the markup and the focus order never change, and the sides are the inline start and end so right to left mirrors. `orientation="horizontal"` (a breakpoint map is accepted, resolved in the browser like `Stepper`'s) runs the events in a row of columns at least `timeline.item-min-width` wide; the row scrolls and is a tab stop while it does, with its ring inside; it ignores `align` and `timePlacement`.
- **`colorfulConnector`** draws each line in its event's tone (the tone's subtle border), off by default; an item's `connector` overrides the line leaving it.
- **A relative time is a helper, not a prop.** `formatRelativeTime(value, { now, locale, numeric, style })` in `utils`, re-exported from the components package, writes it once through `Intl.RelativeTimeFormat` in the language it is given (never the browser's, so a server and a browser agree), and does not tick.

## Alternatives considered
- **Leave these to the caller.** Rejected for headings, paging states and the end: each is easy to get wrong (a heading over nothing, a lost focus, a line that runs past the end) and every feed needs them.
- **Nest events inside a group part.** Rejected: it makes the cap, the alternation and a heading that must vanish with its events harder, and a flat list reads the same to assistive technology.
- **`asChild` on the item, or the whole `<li>` as a link.** Rejected: a link around a body that holds its own links and buttons is invalid and unusable; a stretched title keeps one control and lets the body's own controls work.
- **A relative-time prop on the timeline, or a ticking component.** Rejected: `Timeline` formats nothing ([ADR-0141](./0141-timeline-is-a-read-only-ordered-list-of-items-configured-by-props-in-the-callers-order-with-a-hand-rolled-cap-and-no-windowing-over-sub-parts-a-data-array-a-reverse-prop-or-virtualizing.md)), a tick is an app's decision, and a locale read from the browser breaks server rendering ([ADR-0021](./0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md)).
- **Switching `alternate` in JavaScript, or a `Responsive` map for it.** Rejected: nothing about it chooses what is drawn, so a media query is enough and has no server/client difference.
- **A separate `HorizontalTimeline`.** Rejected: the markup, parts and states are the same; the orientation is a prop, as `Stepper`'s is.
- **Windowing the list.** Still rejected ([ADR-0141](./0141-timeline-is-a-read-only-ordered-list-of-items-configured-by-props-in-the-callers-order-with-a-hand-rolled-cap-and-no-windowing-over-sub-parts-a-data-array-a-reverse-prop-or-virtualizing.md)): events differ in height.

## Consequences
- A feed is one component and one flat list of parts, and the bundle stays small (about 5KB of JS).
- The title is the only control an event has by default; a caller who wants the whole event to be something else builds it in `children`.
- Nothing announces additions unless asked, and a caller who leaves `announce` off hears nothing.
- A horizontal row of many events scrolls rather than wrapping; a vertical list reads better beyond a handful.

## Related
`05-component-api-conventions.md` §3, §6; `06-engineering-standards.md` §9; `02-tech-stack-and-structure.md` (`formatRelativeTime`); `component-reviews/Timeline.md`; [ADR-0141](./0141-timeline-is-a-read-only-ordered-list-of-items-configured-by-props-in-the-callers-order-with-a-hand-rolled-cap-and-no-windowing-over-sub-parts-a-data-array-a-reverse-prop-or-virtualizing.md).
