import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, MouseEvent, ReactNode } from "react";

/**
 * The size of the markers, text and gaps, on the standard 5-step scale
 * (`05-component-api-conventions.md` §2).
 */
export type TimelineSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * The look of the markers.
 *
 * - `"filled"` (the default) — a solid dot or disc in the tone's colour, with the icon in the colour made for it.
 * - `"outlined"` — a ring on the page surface; the icon is in the tone's colour.
 */
export type TimelineVariant = "filled" | "outlined";

/**
 * The colour of a marker. `"brand"` is the system's identity colour, `"highlight"` its general accent, `"neutral"` is
 * grey, and the others are the status colours. A tone says something only to the eye: say it in words too with an
 * item's `statusText`.
 */
export type TimelineTone = "brand" | "info" | "success" | "warning" | "danger" | "highlight" | "neutral";

/** The line between events: `"solid"` (the default), `"dashed"`, or `"none"` to draw no line at all. */
export type TimelineConnector = "solid" | "dashed" | "none";

/**
 * Where an event's time goes: `"top"` (the default) above its title, or `"side"` in a column beside the marker, from the
 * `sm` breakpoint up (on a narrower screen `"side"` is drawn as `"top"`).
 */
export type TimelineTimePlacement = "top" | "side";

/** Which way the events run: `"vertical"` (the default), one under another, or `"horizontal"`, side by side. */
export type TimelineOrientation = "vertical" | "horizontal";

/**
 * Where a vertical timeline puts its events' content, relative to the line.
 *
 * - `"start"` (the default) — all on the same side, after the line.
 * - `"alternate"` — one event after the line and the next before it, from the `md` breakpoint up (a wide screen only: on a
 *   narrower one every event is on one side, so what is read stays in one column).
 *
 * A horizontal timeline ignores it.
 */
export type TimelineAlign = "start" | "alternate";

/**
 * The text `Timeline` supplies itself, translatable through the `labels` prop (`ADR-0021`). A label that needs
 * numbers is a function of the plain numbers.
 */
export interface TimelineLabels {
  /**
   * The button that shows the events past `maxVisible`, given how many are hidden.
   * @default (hidden) => `Show ${hidden} more events` (the number through `formatNumber`; `Show 1 more event` for one)
   */
  showMore: (hidden: number) => string;
  /** The same button once they are shown, which hides them again. @default 'Show fewer events' */
  showLess: string;
  /**
   * What a screen reader hears when the hidden events are shown, given how many appeared.
   * @default (count) => `${count} more events shown` (the number through `formatNumber`; `1 more event shown` for one)
   */
  revealed: (count: number) => string;
  /** Said after the title of an event that is `pending`, unless it sets its own `statusText`. @default 'In progress' */
  pending: string;
  /** The text of the button that opens an event's `detail`. @default 'Details' */
  details: string;
  /** The button that asks the page for more events (`onLoadMore`). @default 'Load more' */
  loadMore: string;
  /** What the "load more" button says while `loading`. @default 'Loading…' */
  loadingMore: string;
  /** What a timeline with no events says, unless `empty` replaces it. @default 'No events yet' */
  empty: string;
  /**
   * What a screen reader hears when events are added to a timeline that is showing (`announce`), given how many.
   * @default (count) => `${count} new events` (the number through `formatNumber`; `1 new event` for one)
   */
  added: (count: number) => string;
}

export interface TimelineProps extends Omit<ComponentPropsWithoutRef<"ol">, "children" | "className" | "style" | "id"> {
  /**
   * The events, in the order to read them: one `Timeline.Item` each, with an optional `Timeline.Group` before a run of them
   * and a `Timeline.End` after the last. Only those parts are drawn — a fragment or plain text among them is ignored (with a
   * warning in development). Timeline does not sort them.
   */
  children: ReactNode;
  /**
   * The size of the markers, text and gaps.
   * @default 'md'
   */
  size?: TimelineSize;
  /**
   * The look of the markers — see {@link TimelineVariant}.
   * @default 'filled'
   */
  variant?: TimelineVariant;
  /**
   * The colour of the markers, for every event that does not set its own `tone`.
   * @default 'brand'
   */
  tone?: TimelineTone;
  /**
   * The line between events — see {@link TimelineConnector}. The line leaving a `pending` event is always dashed, since
   * what follows has not happened yet.
   * @default 'solid'
   */
  connector?: TimelineConnector;
  /**
   * Draws the line leaving each event in its tone's soft colour (the tone's subtle border), instead of the neutral grey
   * every line has by default. A `pending` event's line stays dashed either way.
   * @default false
   */
  colorfulConnector?: boolean;
  /**
   * Which way the events run — see {@link TimelineOrientation}. Takes a mobile-first map by breakpoint (`{ base:
   * "vertical", md: "horizontal" }`); it is worked out in the browser, so a server render and the first client render
   * draw the `base` value. A horizontal timeline scrolls sideways when its events do not fit, with each event at least
   * as wide as the `timeline.item-min-width` token; it ignores `align` and `timePlacement` (the time sits above the title).
   * @default 'vertical'
   */
  orientation?: Responsive<TimelineOrientation>;
  /**
   * Where a vertical timeline puts its content — see {@link TimelineAlign}.
   * @default 'start'
   */
  align?: TimelineAlign;
  /**
   * Where each event's time goes — see {@link TimelineTimePlacement}. Takes a mobile-first map by breakpoint; it is worked
   * out in the browser, so a server render and the first client render draw the `base` value.
   * @default 'top'
   */
  timePlacement?: Responsive<TimelineTimePlacement>;
  /**
   * Shows only this many events, then a button that shows the rest. Leave it out to show them all. Hidden events are not
   * rendered. There is no windowing: events have different heights, so a very long history is better paged by the caller.
   */
  maxVisible?: number;
  /**
   * Whether the events past `maxVisible` are shown. Makes it controlled: the button asks through `onExpandedChange` and
   * the events appear when this changes.
   */
  expanded?: boolean;
  /**
   * Whether the events past `maxVisible` are shown at first, when `expanded` is not set.
   * @default false
   */
  defaultExpanded?: boolean;
  /** Called with the value the person asked for when they press the button that shows or hides the events past `maxVisible`. */
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * Shows that events are being fetched: placeholder events at the end (`loadingCount` of them), `aria-busy` on the list
   * and a busy "load more" button. With no events yet, the placeholders stand in for the list.
   * @default false
   */
  loading?: boolean;
  /**
   * How many placeholder events `loading` draws.
   * @default 3
   */
  loadingCount?: number;
  /**
   * Called when the person presses the "load more" button, which is drawn after the last event whenever this is set and
   * `hasMore` is not `false`. Add the next page's events yourself; the timeline fetches nothing.
   */
  onLoadMore?: () => void;
  /**
   * Whether there are more events to load. Hides the "load more" button when `false`.
   * @default true
   */
  hasMore?: boolean;
  /**
   * What to draw when there are no events and it is not `loading`, in place of `labels.empty`: any content (an
   * `EmptyState`). `false` draws nothing.
   */
  empty?: ReactNode;
  /**
   * Says "N new events" in a polite live region when events are added to a timeline that is already showing, never on its
   * first render and never for events a "show more" reveals. Off by default, since most pages should not interrupt a reader.
   * @default false
   */
  announce?: boolean;
  /** Writes a digit for a number the component shows or says. Callbacks keep plain numbers. @default String */
  formatNumber?: (value: number) => string;
  /** Text the component writes itself, such as the "show more" button. Any entry left out keeps its English default. */
  labels?: Partial<TimelineLabels>;
  /** Accessible name for the list, for a page with more than one. */
  "aria-label"?: string;
  /** Id of an element that names the list (a heading above it). */
  "aria-labelledby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`). Rendered as the DOM `data-testid`
   * attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TimelineItemProps extends Omit<ComponentPropsWithoutRef<"li">, "title" | "className" | "style" | "id"> {
  /** What happened: the event's headline. */
  title?: ReactNode;
  /** The event's time as it should be read ("2 hours ago", "14 Mar, 09:30"). Timeline formats nothing. */
  time?: ReactNode;
  /** The machine-readable form of `time` (`"2026-03-14T09:30"`), which makes it a `<time>` element. */
  dateTime?: string;
  /** A line or two under the title. */
  description?: ReactNode;
  /** An icon to draw in the marker in place of the plain dot — a component reference, not a string name. */
  icon?: PhosphorIcon;
  /**
   * Anything to draw in the marker in place of the dot and the icon (an `Avatar`). It is hidden from assistive technology,
   * so the title must say what it shows.
   */
  marker?: ReactNode;
  /** The marker's colour, in place of the timeline's `tone`. */
  tone?: TimelineTone;
  /**
   * Words for what the marker's tone means ("Failed"), read after the title by a screen reader, since a colour alone says
   * nothing to one. Not shown.
   */
  statusText?: string;
  /**
   * Marks the event as under way: a spinner in the marker, `labels.pending` read after the title (unless `statusText`
   * says it), and a dashed line leaving it.
   * @default false
   */
  pending?: boolean;
  /**
   * The line leaving this event, in place of the timeline's `connector`: `"solid"`, `"dashed"` or `"none"` (a gap in time,
   * or the end of a thread). A `pending` event's line is dashed unless this says otherwise.
   */
  connector?: TimelineConnector;
  /**
   * Makes the event a link: its title becomes an anchor to this address, stretched over the whole event so any press on it
   * follows the link (links and buttons inside the body still work). Use `onPress` instead for a button.
   */
  href?: string;
  /**
   * Makes the event a button: its title becomes a `<button>` stretched over the whole event, and this is called when it is
   * pressed. Ignored when `href` is set.
   */
  onPress?: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * More about the event, kept behind a button (`labels.details`) that opens and closes it, for a body too long to show
   * every time. The button is a disclosure: `aria-expanded`, pointing at the content.
   */
  detail?: ReactNode;
  /** Whether the `detail` is open. Makes it controlled: the button asks through `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the `detail` is open at first, when `open` is not set.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called with the value the person asked for when they press the button that opens or closes the `detail`. */
  onOpenChange?: (open: boolean) => void;
  /** Anything further the event needs, drawn under the description (a link, a code block, a button). */
  children?: ReactNode;
  /** Standard DOM id, on the list item. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`). Rendered as the DOM `data-testid`
   * attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TimelineGroupProps extends Omit<ComponentPropsWithoutRef<"li">, "children" | "className" | "style" | "id"> {
  /** The name of the run of events that follows it ("Today", "12 March"). */
  children: ReactNode;
  /**
   * The heading level it announces, from 2 to 6, so it fits the page's own outline.
   * @default 3
   */
  level?: 2 | 3 | 4 | 5 | 6;
  /** Standard DOM id, on the list entry. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`). Rendered as the DOM `data-testid`
   * attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TimelineEndProps extends Omit<ComponentPropsWithoutRef<"li">, "children" | "className" | "style" | "id"> {
  /** What the end says ("Order closed"). Optional: a bar across the line alone also marks the end. */
  children?: ReactNode;
  /** An icon to draw in a disc in place of the bar — a component reference, not a string name. */
  icon?: PhosphorIcon;
  /** The colour of the end's marker, in place of the timeline's `tone`. */
  tone?: TimelineTone;
  /** Standard DOM id, on the list entry. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`). Rendered as the DOM `data-testid`
   * attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
