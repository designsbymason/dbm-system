import { CaretDownIcon, CaretLeftIcon, CaretRightIcon, CaretUpIcon } from "@dbm-system/icons";
import { cx } from "@dbm-system/utils";
import { useRef, useState } from "react";
import type { RefObject } from "react";
import { IconButton } from "../../atoms/IconButton";
import { Tooltip } from "../../atoms/Tooltip";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./Stepper.module.css";
import type { StepperLabelAlignment, StepperLabels, StepStatus } from "./Stepper.types";

interface StepperSummaryProps {
  vertical: boolean;
  /** Where the horizontal form puts its text. */
  alignment: StepperLabelAlignment;
  /** Whether the text is shown; when not it is still read. */
  showText: boolean;
  labels: StepperLabels;
  /** Zero-based; `-1` when no step is current. */
  currentIndex: number;
  total: number;
  /** The current step's title as plain text, `""` when it has none. */
  title: string;
  /** One entry per step, in order, for the bars. */
  segments: Array<{ value: string; status: StepStatus; done: boolean }>;
  /** Whether Back and Next are drawn: the stepper is interactive. */
  buttons: boolean;
  /** The step Back goes to, or `-1`. */
  previousIndex: number;
  /** The step Next goes to, or `-1`. */
  nextIndex: number;
  onPress: (index: number) => void;
  summaryRef: RefObject<HTMLDivElement | null>;
  backRef: RefObject<HTMLButtonElement | null>;
  nextRef: RefObject<HTMLButtonElement | null>;
}

/** The horizontal summary's text, with the whole text in a tooltip, shown only when the text has been cut short. */
function SummaryText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <Tooltip
      content={text}
      open={open}
      onOpenChange={(next) => setOpen(next && ref.current !== null && ref.current.scrollWidth > ref.current.clientWidth)}
    >
      <span ref={ref} className={styles.summaryText}>
        {text}
      </span>
    </Tooltip>
  );
}

/**
 * The compact form: where the person is, a row of bars, and (when interactive) Back and Next.
 *
 * Horizontally: the text, then Back and Next side by side at the end (or, with `alignment="center"`, Back at the start,
 * the text in the middle and Next at the end), with the bars beneath; with no text (`showText` off) and buttons, Back and
 * Next go at the two ends of the bars, in one row. Vertically, one column: Back
 * (up), the bars, Next (down), then the place as numbers. Both buttons are always drawn when the stepper is interactive:
 * one with nowhere to go is disabled, not removed, so nothing in the row moves or changes size.
 */
export function StepperSummary({
  vertical,
  alignment,
  showText,
  labels,
  currentIndex,
  total,
  title,
  segments,
  buttons,
  previousIndex,
  nextIndex,
  onPress,
  summaryRef,
  backRef,
  nextRef,
}: StepperSummaryProps) {
  const summaryText = labels.summary(currentIndex + 1, total, title);
  const backNode = buttons && (
    <IconButton
      ref={backRef}
      icon={vertical ? CaretUpIcon : CaretLeftIcon}
      variant="tertiary"
      size="xs"
      aria-label={labels.previous}
      className={styles.back}
      disabled={previousIndex < 0}
      onClick={() => onPress(previousIndex)}
    />
  );
  const nextNode = buttons && (
    <IconButton
      ref={nextRef}
      icon={vertical ? CaretDownIcon : CaretRightIcon}
      variant="tertiary"
      size="xs"
      aria-label={labels.next}
      className={styles.next}
      disabled={nextIndex < 0}
      onClick={() => onPress(nextIndex)}
    />
  );
  // Vertically the text is only the place ("3/4"), drawn for the eye; a screen reader gets the full words and the title.
  const text =
    currentIndex >= 0 &&
    (vertical ? (
      <span className={styles.summaryText}>
        <span aria-hidden="true">{labels.place(currentIndex + 1, total)}</span>
        <VisuallyHidden>{summaryText}</VisuallyHidden>
      </span>
    ) : showText ? (
      <SummaryText text={summaryText} />
    ) : (
      <span className={styles.summaryText}>{summaryText}</span>
    ));
  const textNode = showText ? text : text && <VisuallyHidden>{text}</VisuallyHidden>;
  const segmentsNode = (
    <span aria-hidden="true" className={styles.segments}>
      {segments.map((segment) => (
        <span key={segment.value} className={styles.segment} data-status={segment.status} data-done={segment.done || undefined} />
      ))}
    </span>
  );
  // Without labels there is no text to put the buttons beside, so, horizontally, they go at the two ends of the bars.
  const trackOnly = !vertical && !showText && buttons;
  return (
    <div ref={summaryRef} tabIndex={-1} className={styles.summary}>
      {trackOnly ? (
        <>
          {textNode}
          <span className={styles.summaryTrack}>
            {backNode}
            {segmentsNode}
            {nextNode}
          </span>
        </>
      ) : vertical ? (
        <>
          {backNode}
          {segmentsNode}
          {nextNode}
          {textNode}
        </>
      ) : (
        <>
          <span className={cx(styles.summaryRow, buttons && styles.summaryRowButtons, alignment === "center" && styles.summaryRowCenter)}>
            {alignment === "center" ? (
              // Centred: Back at the start of the row, the text in the middle, Next at the end.
              <>
                {backNode}
                {textNode}
                {nextNode}
              </>
            ) : (
              <>
                {textNode}
                {buttons && (
                  <span className={styles.summaryButtons}>
                    {backNode}
                    {nextNode}
                  </span>
                )}
              </>
            )}
          </span>
          {segmentsNode}
        </>
      )}
    </div>
  );
}
