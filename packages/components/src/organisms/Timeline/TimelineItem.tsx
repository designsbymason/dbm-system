import { CaretDownIcon, CaretUpIcon } from "@dbm-system/icons";
import { cx } from "@dbm-system/utils";
import { forwardRef, useContext, useEffect, useId, useRef, useState } from "react";
import { Button } from "../../atoms/Button";
import { Icon } from "../../atoms/Icon";
import { Link } from "../../atoms/Link";
import { Spinner } from "../../atoms/Spinner";
import type { SpinnerSize } from "../../atoms/Spinner";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { buttonSizeForSize, iconSizeForSize } from "./timelineHelpers";
import { toneClass } from "./timelineClasses";
import { TimelinePositionContext, useTimelineContext } from "./TimelineContext";
import styles from "./Timeline.module.css";
import type { TimelineItemProps, TimelineSize } from "./Timeline.types";

// The spinner that replaces the icon, one step down from the marker's own size.
const spinnerSizeForSize: Record<TimelineSize, SpinnerSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

const hasBody = (value: unknown) => value != null && value !== false && value !== "";

/**
 * One event of a `Timeline`: a marker (a dot, an icon, or anything of your own), a title, a time, and an optional
 * description, `detail` and body. By default it is a plain list item with nothing to press; `href` or `onPress` makes the
 * whole event a link or a button (its title, stretched over it), and `detail` keeps more behind a disclosure button. Links
 * and buttons in its `children` are the caller's own. Its `listitem` role is stated outright, since Safari with VoiceOver
 * stops treating a list as one once its markers are removed (`list-style: none`) — the same fix `List`, `Breadcrumb` and
 * `Stepper` apply.
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
 * <Timeline.Item title="Payment failed" tone="danger" statusText="Failed" detail="The card was declined." />
 * <Timeline.Item title="Out for delivery" pending href="/track/1Z999" />
 * ```
 */
export const TimelineItem = forwardRef<HTMLLIElement, TimelineItemProps>(
  (
    {
      title,
      time,
      dateTime,
      description,
      icon,
      marker,
      tone: toneProp,
      statusText,
      pending = false,
      connector: connectorProp,
      href,
      onPress,
      detail,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const { size, tone: timelineTone, connector: timelineConnector, labels } = useTimelineContext();
    const { side } = useContext(TimelinePositionContext);
    const tone = toneProp ?? timelineTone;
    const line = connectorProp ?? timelineConnector;
    const hasTime = hasBody(time);
    const hasTitle = hasBody(title);
    const hasDetail = hasBody(detail);
    const empty = !hasTitle && !hasBody(description) && !hasBody(children) && !hasBody(marker) && !hasDetail;

    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && empty) {
        console.warn("Timeline.Item: it has no `title`, `description` or `children`, so it says nothing.");
      }
    }, [empty]);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && (href !== undefined || onPress) && !hasTitle) {
        console.warn("Timeline.Item: `href` and `onPress` make the title the link or button, so they need a `title`.");
      }
    }, [href, onPress, hasTitle]);

    // The detail's disclosure: controlled when `open` is given, and asking through `onOpenChange` either way.
    const controlled = openProp !== undefined;
    const [innerOpen, setInnerOpen] = useState(defaultOpen);
    const open = controlled ? openProp : innerOpen;
    const wasControlled = useRef(controlled);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && wasControlled.current !== controlled) {
        console.warn(
          `Timeline.Item: changed from ${wasControlled.current ? "controlled" : "uncontrolled"} to ${controlled ? "controlled" : "uncontrolled"}. Decide between \`open\` and \`defaultOpen\` for the event's life.`,
        );
      }
      wasControlled.current = controlled;
    }, [controlled]);
    const detailId = useId();
    const toggleDetail = () => {
      if (!controlled) setInnerOpen(!open);
      onOpenChange?.(!open);
    };

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
    const statusWords = status && <VisuallyHidden>{hasTitle ? `, ${status}` : status}</VisuallyHidden>;
    const linked = hasTitle && (href !== undefined || Boolean(onPress));

    // With `href` or `onPress` the title is the control, stretched over the event by the stylesheet.
    const titleContent = href !== undefined && hasTitle ? (
      <Link href={href} underline="hover" className={styles.titleLink}>
        {title}
        {statusWords}
      </Link>
    ) : onPress && hasTitle ? (
      <button type="button" className={styles.titleButton} onClick={onPress}>
        {title}
        {statusWords}
      </button>
    ) : (
      <>
        {title}
        {statusWords}
      </>
    );

    return (
      // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see the comment above.
      <li
        {...props}
        ref={ref}
        role="listitem"
        data-pending={pending || undefined}
        data-side={side}
        data-connector={connectorProp}
        className={cx(styles.item, toneClass[tone], pending && styles.pending, linked && styles.linked, className)}
      >
        <span aria-hidden="true" className={styles.rail}>
          <span className={cx(styles.marker, kind === "dot" ? styles.markerDot : kind === "icon" ? styles.markerIcon : styles.markerNode)}>
            {markerContent}
          </span>
          {line !== "none" && <span className={styles.connector} />}
        </span>
        <div className={styles.body}>
          {hasTime &&
            (dateTime ? (
              <time dateTime={dateTime} className={styles.time}>
                {time}
              </time>
            ) : (
              <span className={styles.time}>{time}</span>
            ))}
          <div className={styles.main}>
            {(hasTitle || status) && <span className={styles.title}>{titleContent}</span>}
            {hasBody(description) && <div className={styles.description}>{description}</div>}
            {hasDetail && (
              <div className={styles.detailRow}>
                <Button
                  type="button"
                  variant="tertiary"
                  size={buttonSizeForSize[size]}
                  trailingIcon={open ? CaretUpIcon : CaretDownIcon}
                  aria-expanded={open}
                  aria-controls={detailId}
                  onClick={toggleDetail}
                >
                  {labels.details}
                </Button>
              </div>
            )}
            {hasDetail && (
              <div id={detailId} hidden={!open} className={styles.detail}>
                {detail}
              </div>
            )}
            {hasBody(children) && <div className={styles.content}>{children}</div>}
          </div>
        </div>
      </li>
    );
  },
);
TimelineItem.displayName = "Timeline.Item";
