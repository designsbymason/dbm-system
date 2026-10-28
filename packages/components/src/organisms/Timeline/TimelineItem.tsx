import { cx } from "@dbm-system/utils";
import { forwardRef, useEffect } from "react";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon";
import { Spinner } from "../../atoms/Spinner";
import type { SpinnerSize } from "../../atoms/Spinner";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { toneClass } from "./timelineClasses";
import { useTimelineContext } from "./TimelineContext";
import styles from "./Timeline.module.css";
import type { TimelineItemProps, TimelineSize } from "./Timeline.types";

// The icon inside the marker, and the spinner that replaces it: one step down from the marker's own size.
const iconSizeForSize: Record<TimelineSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };
const spinnerSizeForSize: Record<TimelineSize, SpinnerSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

/**
 * One event of a `Timeline`: a marker (a dot, an icon, or anything of your own), a title, a time, and an optional
 * description and body. It is a plain list item with nothing to press; links and buttons in its `children` are the
 * caller's own. Its `listitem` role is stated outright, since Safari with VoiceOver stops treating a list as one once its
 * markers are removed (`list-style: none`) — the same fix `List`, `Breadcrumb` and `Stepper` apply.
 *
 * The marker and the line are hidden from assistive technology, so anything their colour says must be said in words:
 * `statusText` is read after the title, and a `pending` event says it is in progress.
 *
 * `ref` forwards to the `<li>`.
 *
 * @example
 * ```tsx
 * <Timeline.Item title="Order shipped" time="14 Mar, 09:30" dateTime="2026-03-14T09:30" icon={TruckIcon}>
 *   Tracking number 1Z999
 * </Timeline.Item>
 * <Timeline.Item title="Payment failed" tone="danger" statusText="Failed" />
 * <Timeline.Item title="Out for delivery" pending />
 * ```
 */
export const TimelineItem = forwardRef<HTMLLIElement, TimelineItemProps>(
  (
    { title, time, dateTime, description, icon, marker, tone: toneProp, statusText, pending = false, children, className, ...props },
    ref,
  ) => {
    const { size, tone: timelineTone, connector, labels } = useTimelineContext();
    const tone = toneProp ?? timelineTone;
    const hasTime = time != null && time !== false;
    const hasBody = (v: unknown) => v != null && v !== false && v !== "";
    const empty = !hasBody(title) && !hasBody(description) && !hasBody(children) && !hasBody(marker);

    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && empty) {
        console.warn("Timeline.Item: it has no `title`, `description` or `children`, so it says nothing.");
      }
    }, [empty]);

    const kind = hasBody(marker) ? "node" : pending || icon ? "icon" : "dot";
    const markerContent =
      kind === "node" ? (
        marker
      ) : pending ? (
        <Spinner size={spinnerSizeForSize[size]} />
      ) : icon ? (
        <Icon icon={icon} size={iconSizeForSize[size]} />
      ) : null;

    const status = statusText ?? (pending ? labels.pending : undefined);
    const timeClass = styles.time;

    return (
      // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see the comment above.
      <li
        {...props}
        ref={ref}
        role="listitem"
        data-pending={pending || undefined}
        className={cx(styles.item, toneClass[tone], pending && styles.pending, className)}
      >
        <span aria-hidden="true" className={styles.rail}>
          <span className={cx(styles.marker, kind === "dot" ? styles.markerDot : kind === "icon" ? styles.markerIcon : styles.markerNode)}>
            {markerContent}
          </span>
          {connector !== "none" && <span className={styles.connector} />}
        </span>
        <div className={styles.body}>
          {hasTime &&
            (dateTime ? (
              <time dateTime={dateTime} className={timeClass}>
                {time}
              </time>
            ) : (
              <span className={timeClass}>{time}</span>
            ))}
          <div className={styles.main}>
            {(hasBody(title) || status) && (
              <span className={styles.title}>
                {title}
                {status && <VisuallyHidden>{hasBody(title) ? `, ${status}` : status}</VisuallyHidden>}
              </span>
            )}
            {hasBody(description) && <div className={styles.description}>{description}</div>}
            {hasBody(children) && <div className={styles.content}>{children}</div>}
          </div>
        </div>
      </li>
    );
  },
);
TimelineItem.displayName = "Timeline.Item";
