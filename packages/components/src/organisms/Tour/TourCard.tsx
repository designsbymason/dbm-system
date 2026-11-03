import { cx } from "@dbm-system/utils";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from "react";
import { DotsThreeIcon } from "@dbm-system/icons";
import { Button } from "../../atoms/Button";
import { ButtonGroupReset } from "../../atoms/Button/buttonGroupContext";
import { Heading } from "../../atoms/Heading";
import { IconButton } from "../../atoms/IconButton";
import { Text } from "../../atoms/Text";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { Menu } from "../Menu";
import type { TourDismissal, TourLabels, TourProgress } from "./Tour.types";
import styles from "./Tour.module.css";

export type TourAction = "next" | "back" | "skip" | "later" | "never";

interface TourCardProps
  extends Omit<ComponentPropsWithoutRef<"div">, "title" | "content" | "dir" | "onKeyDown" | "children"> {
  title: ReactNode;
  content: ReactNode;
  media: ReactNode;
  footer: ReactNode;
  /** The step's own buttons, in place of the standard ones. */
  actions: ReactNode;
  titleId: string;
  contentId: string;
  index: number;
  total: number;
  labels: TourLabels;
  progress: TourProgress;
  dismissals: TourDismissal[];
  dir: "ltr" | "rtl";
  /** Where the card sits: beside the element, in the middle of the screen, or across the bottom. */
  placement: "anchored" | "centered" | "docked";
  /** Whether the step lets the person use the highlighted element (so the card does not hold focus). */
  interactive: boolean;
  /** The pointer arrow, drawn inside the card when it is beside an element. */
  arrow?: ReactNode;
  onAction: (action: TourAction) => void;
  /** Told when the dismissals menu opens and closes: the card's focus trap stands down while it is open. */
  onMenuOpenChange: (open: boolean) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

const has = (node: ReactNode) => node !== undefined && node !== null && node !== false && node !== "";

/**
 * The card: media, progress, the step's title and text, its footer, and Skip / Back / Next (or the step's own buttons).
 * It is the element with `role="dialog"`; its props spread first so the attributes the tour computes cannot be replaced
 * by a same-named prop.
 */
export const TourCard = forwardRef<HTMLDivElement, TourCardProps>(
  (
    {
      title,
      content,
      media,
      footer,
      actions,
      titleId,
      contentId,
      index,
      total,
      labels,
      progress,
      dismissals,
      dir,
      placement,
      interactive,
      arrow,
      onAction,
      onMenuOpenChange,
      onKeyDown,
      className,
      ...rest
    },
    ref,
  ) => {
    const last = index === total - 1;
    const showText = progress === "text" || progress === "both";
    const showBar = progress === "bar" || progress === "both";
    return (
      // The dialog is where focus lives, so it is where the arrow keys are heard; the buttons inside are the real controls.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <div
        {...rest}
        ref={ref}
        role="dialog"
        dir={dir}
        tabIndex={-1}
        aria-labelledby={rest["aria-label"] ? undefined : titleId}
        aria-describedby={has(content) ? contentId : undefined}
        data-placement={placement}
        data-interactive={interactive ? "" : undefined}
        className={cx(styles.card, styles[placement], className)}
        onKeyDown={onKeyDown}
      >
        {has(media) && <div className={styles.media}>{media}</div>}
        {showBar && (
          <div className={styles.bar} aria-hidden="true">
            {Array.from({ length: total }, (_, position) => (
              <span key={position} className={styles.segment} data-reached={position <= index ? "" : undefined} />
            ))}
          </div>
        )}
        {(showText || !last) && (
          <div className={styles.topRow}>
            {showText ? (
              <Text size="xs" color="secondary" className={styles.progress}>
                {labels.stepOf(index + 1, total)}
              </Text>
            ) : (
              <span />
            )}
            {!last && (
              <div className={styles.topActions}>
                <Button variant="tertiary" size="xs" data-tour-action="skip" onClick={() => onAction("skip")}>
                  {labels.skip}
                </Button>
                {dismissals.length > 0 && (
                  <Menu onOpenChange={onMenuOpenChange}>
                    <Menu.Trigger asChild>
                      <IconButton icon={DotsThreeIcon} variant="ghost" tone="brand" size="xs" aria-label={labels.more} />
                    </Menu.Trigger>
                    <Menu.Content align="end" size="sm">
                      {dismissals.includes("later") && <Menu.Item onSelect={() => onAction("later")}>{labels.later}</Menu.Item>}
                      {dismissals.includes("never") && <Menu.Item onSelect={() => onAction("never")}>{labels.never}</Menu.Item>}
                    </Menu.Content>
                  </Menu>
                )}
              </div>
            )}
          </div>
        )}
        {progress === "bar" && <VisuallyHidden>{labels.stepOf(index + 1, total)}</VisuallyHidden>}
        <Heading level={2} size="md" id={titleId} className={styles.title}>
          {title}
        </Heading>
        {has(content) && (
          <Text as="div" size="sm" color="secondary" id={contentId} className={styles.content}>
            {content}
          </Text>
        )}
        {has(footer) && <div className={styles.footer}>{footer}</div>}
        <ButtonGroupReset>
          <div className={styles.actions}>
            {has(actions) ? (
              actions
            ) : (
              <>
                <span className={styles.spacer} />
                {index > 0 && (
                  <Button variant="secondary" size="sm" data-tour-action="back" onClick={() => onAction("back")}>
                    {labels.back}
                  </Button>
                )}
                <Button variant="primary" size="sm" data-tour-action="next" onClick={() => onAction("next")}>
                  {last ? labels.finish : labels.next}
                </Button>
              </>
            )}
          </div>
        </ButtonGroupReset>
        {arrow}
      </div>
    );
  },
);
TourCard.displayName = "TourCard";
