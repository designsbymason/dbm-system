import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

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
}

export interface TimelineProps extends Omit<ComponentPropsWithoutRef<"ol">, "children" | "className" | "style" | "id"> {
  /**
   * The events, in the order to read them: one `Timeline.Item` each. Only `Timeline.Item` elements are drawn — a
   * fragment or plain text among them is ignored (with a warning in development). Timeline does not sort them.
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
   * @default 'neutral'
   */
  tone?: TimelineTone;
  /**
   * The line between events — see {@link TimelineConnector}. The line leaving a `pending` event is always dashed, since
   * what follows has not happened yet.
   * @default 'solid'
   */
  connector?: TimelineConnector;
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
