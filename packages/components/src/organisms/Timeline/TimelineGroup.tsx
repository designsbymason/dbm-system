import { cx } from "@dbm-system/utils";
import { forwardRef } from "react";
import styles from "./Timeline.module.css";
import type { TimelineGroupProps } from "./Timeline.types";

/**
 * A heading for the run of events that follows it ("Today", "12 March"), drawn in the text column with the line passing
 * by. It is a list entry that announces itself as a heading (`level`, 3 by default, so it fits the page's outline) and is
 * drawn only while an event after it is, so a heading never stands over nothing when `maxVisible` hides the rest. It does
 * not group its events in the markup: they are the entries after it, up to the next heading.
 *
 * `ref` forwards to the `<li>`.
 *
 * @example
 * ```tsx
 * <Timeline.Group>Today</Timeline.Group>
 * <Timeline.Item title="Deployed" time="10:31" />
 * <Timeline.Group>Yesterday</Timeline.Group>
 * <Timeline.Item title="Merged" time="17:02" />
 * ```
 */
export const TimelineGroup = forwardRef<HTMLLIElement, TimelineGroupProps>(({ children, level = 3, className, ...props }, ref) => (
  // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see `TimelineItem`.
  <li {...props} ref={ref} role="listitem" className={cx(styles.item, styles.group, className)}>
    <span aria-hidden="true" className={styles.rail}>
      <span className={styles.connector} />
    </span>
    <div className={styles.body}>
      <div className={styles.main}>
        <span role="heading" aria-level={level} className={styles.groupLabel}>
          {children}
        </span>
      </div>
    </div>
  </li>
));
TimelineGroup.displayName = "Timeline.Group";
