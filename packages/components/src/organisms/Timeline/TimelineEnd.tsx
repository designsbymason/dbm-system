import { cx } from "@dbm-system/utils";
import { forwardRef, useContext } from "react";
import { Icon } from "../../atoms/Icon";
import { iconSizeForSize } from "./timelineHelpers";
import { toneClass } from "./timelineClasses";
import { TimelinePositionContext, useTimelineContext } from "./TimelineContext";
import styles from "./Timeline.module.css";
import type { TimelineEndProps } from "./Timeline.types";

/**
 * The end of a timeline: a bar across the line (or an icon in a disc) and, if it has children, a word for how it ended
 * ("Order closed"). The line stops there. Put it last, after the final event; it is drawn only once every event is shown,
 * so a `maxVisible` that is still hiding events does not show an end.
 *
 * `ref` forwards to the `<li>`.
 *
 * @example
 * ```tsx
 * <Timeline.Item title="Delivered" time="14 Mar" />
 * <Timeline.End>Order closed</Timeline.End>
 * ```
 */
export const TimelineEnd = forwardRef<HTMLLIElement, TimelineEndProps>(({ children, icon, tone: toneProp, className, ...props }, ref) => {
  const { size, tone: timelineTone } = useTimelineContext();
  const { side } = useContext(TimelinePositionContext);
  const hasLabel = children != null && children !== false && children !== "";
  return (
    // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see `TimelineItem`.
    <li
      {...props}
      ref={ref}
      role="listitem"
      data-side={side}
      className={cx(styles.item, styles.end, toneClass[toneProp ?? timelineTone], className)}
    >
      <span aria-hidden="true" className={styles.rail}>
        <span className={cx(styles.marker, icon ? styles.markerIcon : styles.markerEnd)}>
          {icon ? <Icon icon={icon} size={iconSizeForSize[size]} /> : null}
        </span>
      </span>
      <div className={styles.body}>
        <div className={styles.main}>{hasLabel && <span className={styles.endLabel}>{children}</span>}</div>
      </div>
    </li>
  );
});
TimelineEnd.displayName = "Timeline.End";
