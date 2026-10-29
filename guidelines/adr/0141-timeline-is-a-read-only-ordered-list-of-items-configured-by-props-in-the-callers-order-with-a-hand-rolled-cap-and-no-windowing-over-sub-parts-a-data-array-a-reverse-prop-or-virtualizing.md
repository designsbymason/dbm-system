# 0141 — `Timeline` is a read-only ordered list of items configured by props, in the caller's order, with a hand-rolled cap and no windowing, over sub-parts, a data array, a `reverse` prop or virtualizing

**Status:** Accepted · **Date:** 2026-10-28 · **Amended 2026-10-28** — three details were overtaken by [ADR-0142](./0142-timeline-takes-a-feed-surface-of-headings-an-end-links-detail-paging-and-two-more-layouts-over-leaving-them-to-the-caller-or-separate-components.md) (the alternate layout, the size, announcing additions); the decision itself is unchanged

## Context
A timeline records events that happened. It looks like `Stepper` and shares its vocabulary (a marker, a line, a title), but it has no current position and nothing to enter. Three choices decide its API and its semantics: how an event is described, who owns the order, and what happens when the history is long.

## Decision
- **Items take props.** `Timeline` holds `Timeline.Item`s, each configured by `title`, `time`, `dateTime`, `description`, `icon`, `marker`, `tone`, `statusText`, `pending` and `children`. There are no `Marker`, `Title` or `Time` sub-parts: the shape of an event is fixed, `children` is the one slot for anything further, and `marker` is the escape hatch for a marker of the caller's own. This is `Stepper.Step`'s shape ([ADR-0137](./0137-stepper-draws-the-indicator-only-and-leaves-the-steps-content-and-the-flows-logic-to-the-caller-over-owning-panels-or-a-controller.md)).
- **The caller owns the order, and the markup is the reading order.** The root is an `<ol role="list">` of `<li role="listitem">` and is never a `<nav>` (it is content, not wayfinding); the caller names it with `aria-label` or `aria-labelledby`. Timeline does not sort and has no `reverse` prop. The time can sit above the title or in a column beside the marker (`timePlacement`), but only by placing the same elements differently, so the focus order and the visual order are one.
- **A long history is capped, not windowed.** `maxVisible` draws the first events and a native button for the rest, with `expanded`/`defaultExpanded`/`onExpandedChange` (controlled or not, like Radix) and the button's label held by `labels`. Events past the cap are not rendered. There is no windowing: events differ in height, and fixed row heights from tokens ([ADR-0080](./0080-long-option-lists-are-drawn-a-window-at-a-time-by-a-hand-rolled-hook-with-fixed-row-heights-from-tokens-over-a-virtualization-dependency-or-measured-rows.md)) cannot be assumed. A history of hundreds is paged by the caller, who adds the next page's items.
- The button is one element in the same place whether it says "show more" or "show fewer", so focus stays on it; a polite live region says how many events appeared, only when the value changes between two states that were both on screen.

## Alternatives considered
- **Compound sub-parts** (`Timeline.Marker`, `.Title`, `.Time`). Rejected: more ways for an agent to compose an event wrongly (a marker outside an item, two titles) for no extra capability, since `children` and `marker` already cover anything unusual.
- **A data-driven `items` array.** Rejected: an event's body is often rich content (a link, a quote, a button), which a data prop can only take as a node, and `Stepper` set the precedent for composing steps.
- **A `reverse` prop or visual reordering.** Rejected: it puts the visual order and the reading order apart, which is exactly what a list of events must not do. The caller passes the order it wants read.
- **Virtualizing the list, or measuring rows.** Rejected for v1: the cost (a measuring layer, scroll restoration, a hook) is not justified for the lengths a read-out holds, and a feed that grows without end is paged anyway.
- **An `alternate` left-and-right layout.** Deferred *(Amended 2026-10-28: built in [ADR-0142](./0142-timeline-takes-a-feed-surface-of-headings-an-end-links-detail-paging-and-two-more-layouts-over-leaving-them-to-the-caller-or-separate-components.md), switched by a media query so that below `md` every event is on one side)*: it puts the content of neighbouring events on opposite sides, which on a phone reflows into one column and cannot keep a single reading order; the side time column covers the common need.

## Consequences
- A timeline is small (about 3KB of JS) and has no dependency. *(Amended 2026-10-28: about 6KB with the later parts.)*
- Anything that grows without end is the caller's to page; the Docs page says so.
- Events added while the page is open are not announced *(Amended 2026-10-28: unless `announce` is set, [ADR-0142](./0142-timeline-takes-a-feed-surface-of-headings-an-end-links-detail-paging-and-two-more-layouts-over-leaving-them-to-the-caller-or-separate-components.md))*; a caller that needs it announces them in its own live region (`06-engineering-standards.md` §9 sets the first-appearance rule, and the guidelines do not yet cover a feed that receives events).

## Related
`05-component-api-conventions.md` §3, §6; `04-component-inventory.md` (Timeline); `component-reviews/Timeline.md`; [ADR-0136](./0136-stepper-is-a-nav-and-ordered-list-with-aria-current-step-and-real-buttons-only-where-a-step-can-be-entered-over-a-tablist-with-roving-focus.md).
