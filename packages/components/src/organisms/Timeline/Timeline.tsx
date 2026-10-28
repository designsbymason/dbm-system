import { cx, mergeDefined, useResolvedResponsiveValue } from "@dbm-system/utils";
import { Children, forwardRef, isValidElement, useEffect } from "react";
import type { ReactElement, ReactNode } from "react";
import { Button } from "../../atoms/Button";
import type { ButtonSize } from "../../atoms/Button";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { toneClass } from "./timelineClasses";
import { TimelineContext } from "./TimelineContext";
import type { TimelineContextValue } from "./TimelineContext";
import { TimelineItem } from "./TimelineItem";
import { defaultLabelsFor, normalizeMaxVisible, visibleCount } from "./timelineHelpers";
import { useTimelineExpanded } from "./useTimelineExpanded";
import styles from "./Timeline.module.css";
import type { TimelineItemProps, TimelineProps, TimelineSize, TimelineTimePlacement, TimelineVariant } from "./Timeline.types";

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

const placementClass: Record<TimelineTimePlacement, string | undefined> = {
  top: undefined,
  side: styles.timeSide,
};

const buttonSizeForSize: Record<TimelineSize, ButtonSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

function isItem(child: ReactNode): child is ReactElement<TimelineItemProps> {
  return isValidElement(child) && child.type === TimelineItem;
}

/**
 * A read-only record of things that happened, oldest or newest first as you give them (an audit trail, an order's
 * tracking history, a changelog, an activity feed): an `<ol>` of `Timeline.Item`s, each with a marker, a title, a time and
 * an optional description and body, joined by a line.
 *
 * It is not a `Stepper`: there is no current position and nothing to enter. It does not sort, fetch or format dates: the
 * order is the order of its children, and a time is the text you pass (`dateTime` adds the machine-readable form).
 *
 * `size`, `variant`, `tone`, `connector` and `timePlacement` (`"side"` puts the time in a column beside the marker from
 * the `sm` breakpoint up; it takes a breakpoint map) set how every event looks, and an item may set its own `tone`. An
 * event that is still under way is `pending`. `maxVisible` shows only the first events and a button for the rest
 * (`expanded` makes that controlled); a long history that outgrows that is better paged by the caller. Text the component
 * writes itself is in `labels`, and `formatNumber` writes its digits. Give the list a name with `aria-label` or
 * `aria-labelledby` when a page has more than one.
 *
 * `ref` forwards to the `<ol>`; `className` and `style` go on it too.
 *
 * @example
 * ```tsx
 * <Timeline aria-label="Order history" maxVisible={5}>
 *   <Timeline.Item title="Delivered" time="Today, 11:02" dateTime="2026-03-14T11:02" tone="success" statusText="Done" />
 *   <Timeline.Item title="Out for delivery" time="Today, 08:15" pending />
 *   <Timeline.Item title="Order placed" time="12 Mar" description="Paid by card" />
 * </Timeline>
 * ```
 */
const TimelineRoot = forwardRef<HTMLOListElement, TimelineProps>(
  (
    {
      children,
      size = "md",
      variant = "filled",
      tone = "neutral",
      connector = "solid",
      timePlacement: placementProp = "top",
      maxVisible: maxVisibleProp,
      expanded: expandedProp,
      defaultExpanded = false,
      onExpandedChange,
      formatNumber = String,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) => {
    const labels = mergeDefined(defaultLabelsFor(formatNumber), labelsProp);
    const timePlacement = useResolvedResponsiveValue<TimelineTimePlacement>(placementProp, "top");

    const rawChildren = Children.toArray(children);
    const items = rawChildren.filter(isItem);
    const ignored = rawChildren.length - items.length;
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && ignored > 0) {
        console.warn("Timeline: only `Timeline.Item` elements are drawn; other children were ignored.");
      }
    }, [ignored]);

    const cap = normalizeMaxVisible(maxVisibleProp);
    const hidden = cap === undefined ? 0 : Math.max(0, items.length - cap);
    const { expanded, request, message } = useTimelineExpanded({
      expanded: expandedProp,
      defaultExpanded,
      onExpandedChange,
      hidden,
      write: labels.revealed,
    });
    const shown = items.slice(0, visibleCount(items.length, cap, expanded));
    const hasToggle = hidden > 0;

    const context: TimelineContextValue = { size, variant, tone, connector, timePlacement, labels };

    return (
      <TimelineContext.Provider value={context}>
        {/* The `list` role is stated outright, for the reason given at `TimelineItem`. */}
        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see `TimelineItem`. */}
        <ol
          {...props}
          ref={ref}
          role="list"
          data-time-placement={timePlacement}
          className={cx(styles.root, sizeClass[size], toneClass[tone], variantClass[variant], placementClass[timePlacement], connector === "dashed" && styles.connectorDashed, className)}
        >
          {shown}
          {hasToggle && (
            // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see `TimelineItem`.
            <li role="listitem" className={styles.more}>
              <Button type="button" variant="tertiary" size={buttonSizeForSize[size]} onClick={() => request(!expanded)}>
                {expanded ? labels.showLess : labels.showMore(hidden)}
              </Button>
            </li>
          )}
        </ol>
        {cap !== undefined && <VisuallyHidden role="status">{message}</VisuallyHidden>}
      </TimelineContext.Provider>
    );
  },
);
TimelineRoot.displayName = "Timeline";

type TimelineComponent = typeof TimelineRoot & {
  Item: typeof TimelineItem;
};

export const Timeline: TimelineComponent = Object.assign(TimelineRoot, {
  Item: TimelineItem,
});
