import { cx, mergeDefined, mergeRefs, useAnnouncement, useIsScrollable, useResolvedResponsiveValue } from "@dbm-system/utils";
import { Children, forwardRef, isValidElement, useEffect, useRef } from "react";
import type { ReactElement, ReactNode } from "react";
import { Button } from "../../atoms/Button";
import { Skeleton } from "../../atoms/Skeleton";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { toneClass } from "./timelineClasses";
import { TimelineContext, TimelinePositionContext } from "./TimelineContext";
import type { TimelineContextValue } from "./TimelineContext";
import { TimelineEnd } from "./TimelineEnd";
import { TimelineGroup } from "./TimelineGroup";
import { TimelineItem } from "./TimelineItem";
import { buttonSizeForSize, defaultLabelsFor, normalizeMaxVisible, selectEntries, visibleCount } from "./timelineHelpers";
import type { TimelineEntry } from "./timelineHelpers";
import { useTimelineAdditions } from "./useTimelineAdditions";
import { useTimelineExpanded } from "./useTimelineExpanded";
import styles from "./Timeline.module.css";
import type {
  TimelineOrientation,
  TimelineProps,
  TimelineSize,
  TimelineTimePlacement,
  TimelineVariant,
} from "./Timeline.types";

const sizeClass: Record<TimelineSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const variantClass: Record<TimelineVariant, string | undefined> = {
  filled: styles.variantFilled,
  outlined: styles.variantOutlined,
};

type Part = ReactElement<{ children?: ReactNode }>;

function kindOf(child: ReactNode): TimelineEntry<Part>["kind"] | null {
  if (!isValidElement(child)) return null;
  if (child.type === TimelineItem) return "item";
  if (child.type === TimelineGroup) return "group";
  if (child.type === TimelineEnd) return "end";
  return null;
}

/**
 * A read-only record of things that happened, oldest or newest first as you give them (an audit trail, an order's
 * tracking history, a changelog, an activity feed): an `<ol>` of `Timeline.Item`s, each with a marker, a title, a time and
 * an optional description and body, joined by a line, with an optional `Timeline.Group` heading before a run of them and a
 * `Timeline.End` after the last.
 *
 * It is not a `Stepper`: there is no current position and nothing to enter. It does not sort, fetch or format dates: the
 * order is the order of its children, and a time is the text you pass (`dateTime` adds the machine-readable form, and
 * `formatRelativeTime` writes "2 hours ago").
 *
 * `size`, `variant`, `tone`, `connector` (and `colorfulConnector`, which draws each line in its event's tone) set how every
 * event looks, and an item may set its own `tone` and `connector`. `orientation` runs the events down or across (a
 * breakpoint map is accepted), `align="alternate"` puts them on both sides of the line on a wide screen, and
 * `timePlacement` puts the time above the title or beside the marker. An event still under way is `pending`; an item with
 * `href` or `onPress` is a link or a button; and `detail` keeps more of it behind a button.
 *
 * `maxVisible` shows only the first events and a button for the rest (`expanded` makes that controlled). `onLoadMore`
 * draws a "load more" button for a history you page yourself, `loading` draws placeholders while a page arrives, and
 * `empty` says what an empty one shows. `announce` says "N new events" when events are added. Text the component writes
 * itself is in `labels`, and `formatNumber` writes its digits. Give the list a name with `aria-label` or `aria-labelledby`
 * when a page has more than one.
 *
 * `ref` forwards to the `<ol>`; `className` and `style` go on it too.
 *
 * @example
 * ```tsx
 * <Timeline aria-label="Order history" maxVisible={5}>
 *   <Timeline.Group>Today</Timeline.Group>
 *   <Timeline.Item title="Delivered" time="11:02" dateTime="2026-03-14T11:02" tone="success" statusText="Done" />
 *   <Timeline.Item title="Out for delivery" time="08:15" pending />
 *   <Timeline.Group>12 March</Timeline.Group>
 *   <Timeline.Item title="Order placed" time="14:22" description="Paid by card" />
 *   <Timeline.End>Order closed</Timeline.End>
 * </Timeline>
 * ```
 */
const TimelineRoot = forwardRef<HTMLOListElement, TimelineProps>(
  (
    {
      children,
      size = "md",
      variant = "filled",
      tone = "brand",
      connector = "solid",
      colorfulConnector = false,
      orientation: orientationProp = "vertical",
      align = "start",
      timePlacement: placementProp = "top",
      maxVisible: maxVisibleProp,
      expanded: expandedProp,
      defaultExpanded = false,
      onExpandedChange,
      loading = false,
      loadingCount = 3,
      onLoadMore,
      hasMore = true,
      empty,
      announce = false,
      formatNumber = String,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) => {
    const labels = mergeDefined(defaultLabelsFor(formatNumber), labelsProp);
    const orientation = useResolvedResponsiveValue<TimelineOrientation>(orientationProp, "vertical");
    const timePlacement = useResolvedResponsiveValue<TimelineTimePlacement>(placementProp, "top");
    const horizontal = orientation === "horizontal";

    const listRef = useRef<HTMLOListElement>(null);
    // A row that outgrows its width scrolls on its own, so it is a keyboard-reachable region while it does.
    const scrolls = useIsScrollable(listRef, "x");
    const scrollerTabIndex = horizontal && scrolls ? 0 : undefined;

    const rawChildren = Children.toArray(children);
    const entries: Array<TimelineEntry<Part>> = [];
    for (const child of rawChildren) {
      const kind = kindOf(child);
      if (kind) entries.push({ kind, node: child as Part });
    }
    const ignored = rawChildren.length - entries.length;
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && ignored > 0) {
        console.warn("Timeline: only `Timeline.Item`, `Timeline.Group` and `Timeline.End` elements are drawn; other children were ignored.");
      }
    }, [ignored]);

    const eventCount = entries.filter((entry) => entry.kind === "item").length;
    const cap = normalizeMaxVisible(maxVisibleProp);
    const hidden = cap === undefined ? 0 : Math.max(0, eventCount - cap);

    const { message, announce: say } = useAnnouncement();
    const { expanded, request } = useTimelineExpanded({
      expanded: expandedProp,
      defaultExpanded,
      onExpandedChange,
      hidden,
      write: labels.revealed,
      say,
    });
    useTimelineAdditions(eventCount, announce, labels.added, say);

    const selected = selectEntries(entries, visibleCount(eventCount, cap, expanded));
    const allShown = hidden === 0 || expanded;
    const showToggle = hidden > 0;
    const showLoadMore = Boolean(onLoadMore) && hasMore !== false && allShown;

    // The "load more" button is disabled while loading, which in some browsers drops its focus: hold on to the fact that
    // it was pressed and give focus back when loading ends if it was lost.
    const loadMoreRef = useRef<HTMLButtonElement>(null);
    const loadMorePressed = useRef(false);
    useEffect(() => {
      if (loading || !loadMorePressed.current) return;
      loadMorePressed.current = false;
      const active = document.activeElement;
      if (!active || active === document.body) loadMoreRef.current?.focus();
    }, [loading]);

    // The side of the line each event's content is on in an `alternate` timeline: events and the end alternate, headings don't count.
    let position = 0;
    const drawn = selected.map((entry) => {
      const side = entry.kind === "group" ? "end" : position++ % 2 === 0 ? "end" : "start";
      return (
        <TimelinePositionContext.Provider key={entry.node.key} value={{ side }}>
          {entry.node}
        </TimelinePositionContext.Provider>
      );
    });

    const showEmpty = eventCount === 0 && !loading && empty !== false;
    const context: TimelineContextValue = { size, variant, tone, connector, timePlacement, labels };
    const placeholders = loading ? Math.max(0, Math.floor(loadingCount)) : 0;
    const buttonSize = buttonSizeForSize[size];

    return (
      <TimelineContext.Provider value={context}>
        {/* The `list` role is stated outright, for the reason given at `TimelineItem`. */}
        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see `TimelineItem`. */}
        <ol
          {...props}
          ref={mergeRefs(ref, listRef)}
          role="list"
          tabIndex={scrollerTabIndex}
          aria-busy={loading || undefined}
          data-orientation={orientation}
          data-time-placement={timePlacement}
          className={cx(
            styles.root,
            sizeClass[size],
            toneClass[tone],
            variantClass[variant],
            horizontal ? styles.horizontal : styles.vertical,
            !horizontal && align === "alternate" && styles.alternate,
            !horizontal && timePlacement === "side" && styles.timeSide,
            connector === "dashed" && styles.connectorDashed,
            colorfulConnector && styles.colorfulConnector,
            className,
          )}
        >
          {drawn}
          {showEmpty && (
            // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see `TimelineItem`.
            <li role="listitem" className={styles.empty}>
              {empty ?? labels.empty}
            </li>
          )}
          {Array.from({ length: placeholders }, (_, index) => (
            <li key={`loading-${index}`} aria-hidden="true" className={cx(styles.item, styles.skeleton)} data-side={(eventCount + index) % 2 === 0 ? "end" : "start"}>
              <span className={styles.rail}>
                <Skeleton variant="circular" width="var(--timeline-marker)" height="var(--timeline-marker)" />
                <span className={styles.connector} />
              </span>
              <div className={styles.body}>
                <div className={styles.main}>
                  <Skeleton variant="text" width="45%" />
                  <Skeleton variant="text" width="80%" />
                </div>
              </div>
            </li>
          ))}
          {(showToggle || showLoadMore) && (
            // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see `TimelineItem`.
            <li role="listitem" className={styles.more}>
              <div className={styles.moreActions}>
                {showToggle && (
                  <Button type="button" variant="tertiary" size={buttonSize} onClick={() => request(!expanded)}>
                    {expanded ? labels.showLess : labels.showMore(hidden)}
                  </Button>
                )}
                {showLoadMore && (
                  <Button
                    ref={loadMoreRef}
                    type="button"
                    variant="secondary"
                    size={buttonSize}
                    isLoading={loading}
                    loadingText={labels.loadingMore}
                    onClick={() => {
                      loadMorePressed.current = true;
                      onLoadMore?.();
                    }}
                  >
                    {labels.loadMore}
                  </Button>
                )}
              </div>
            </li>
          )}
        </ol>
        {(cap !== undefined || announce) && <VisuallyHidden role="status">{message}</VisuallyHidden>}
      </TimelineContext.Provider>
    );
  },
);
TimelineRoot.displayName = "Timeline";

type TimelineComponent = typeof TimelineRoot & {
  Item: typeof TimelineItem;
  Group: typeof TimelineGroup;
  End: typeof TimelineEnd;
};

export const Timeline: TimelineComponent = Object.assign(TimelineRoot, {
  Item: TimelineItem,
  Group: TimelineGroup,
  End: TimelineEnd,
});
