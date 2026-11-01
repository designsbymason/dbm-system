import { cx } from "@dbm-system/utils";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from "react";
import { Button } from "../../atoms/Button";
import { ButtonGroupReset } from "../../atoms/Button/buttonGroupContext";
import { Heading } from "../../atoms/Heading";
import { Text } from "../../atoms/Text";
import type { TourLabels, TourProgress } from "./Tour.types";
import styles from "./Tour.module.css";

export type TourAction = "next" | "back" | "skip";

interface TourCardProps
  extends Omit<ComponentPropsWithoutRef<"div">, "title" | "content" | "dir" | "onKeyDown" | "children"> {
  title: ReactNode;
  content: ReactNode;
  titleId: string;
  contentId: string;
  index: number;
  total: number;
  labels: TourLabels;
  progress: TourProgress;
  dir: "ltr" | "rtl";
  /** Where the card sits: beside the element, in the middle of the screen, or across the bottom. */
  placement: "anchored" | "centered" | "docked";
  /** Whether the step lets the person use the highlighted element (so the card does not hold focus). */
  interactive: boolean;
  /** The pointer arrow, drawn inside the card when it is beside an element. */
  arrow?: ReactNode;
  onAction: (action: TourAction) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * The card: progress, the step's title and text, and Skip / Back / Next. It is the element with `role="dialog"`; its
 * props spread first so the attributes the tour computes cannot be replaced by a same-named prop.
 */
export const TourCard = forwardRef<HTMLDivElement, TourCardProps>(
  (
    {
      title,
      content,
      titleId,
      contentId,
      index,
      total,
      labels,
      progress,
      dir,
      placement,
      interactive,
      arrow,
      onAction,
      onKeyDown,
      className,
      ...rest
    },
    ref,
  ) => {
    const last = index === total - 1;
    const hasContent = content !== undefined && content !== null && content !== false && content !== "";
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
        aria-describedby={hasContent ? contentId : undefined}
        data-placement={placement}
        data-interactive={interactive ? "" : undefined}
        className={cx(styles.card, styles[placement], className)}
        onKeyDown={onKeyDown}
      >
        {progress === "text" && (
          <Text size="xs" color="secondary" className={styles.progress}>
            {labels.stepOf(index + 1, total)}
          </Text>
        )}
        <Heading level={2} size="md" id={titleId} className={styles.title}>
          {title}
        </Heading>
        {hasContent && (
          <Text as="div" size="sm" color="secondary" id={contentId} className={styles.content}>
            {content}
          </Text>
        )}
        <ButtonGroupReset>
          <div className={styles.actions}>
            {!last && (
              <Button variant="tertiary" size="sm" data-tour-action="skip" onClick={() => onAction("skip")}>
                {labels.skip}
              </Button>
            )}
            <span className={styles.spacer} />
            {index > 0 && (
              <Button variant="secondary" size="sm" data-tour-action="back" onClick={() => onAction("back")}>
                {labels.back}
              </Button>
            )}
            <Button variant="primary" size="sm" data-tour-action="next" onClick={() => onAction("next")}>
              {last ? labels.finish : labels.next}
            </Button>
          </div>
        </ButtonGroupReset>
        {arrow}
      </div>
    );
  },
);
TourCard.displayName = "TourCard";
