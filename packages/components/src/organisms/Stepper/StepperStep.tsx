import { CheckIcon, MinusIcon, WarningIcon, XIcon } from "@dbm-system/icons";
import { cx } from "@dbm-system/utils";
import { Slot } from "@radix-ui/react-slot";
import { cloneElement, forwardRef, isValidElement, useContext, useState } from "react";
import type { MouseEvent, ReactElement, ReactNode } from "react";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon";
import { Spinner } from "../../atoms/Spinner";
import type { SpinnerSize } from "../../atoms/Spinner";
import { Tooltip } from "../../atoms/Tooltip";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { titleText } from "./stepperHelpers";
import { StepPositionContext, useStepperContext } from "./StepperContext";
import styles from "./Stepper.module.css";
import type { StepperSize, StepperStepProps } from "./Stepper.types";

// The icon inside the indicator, and the spinner that replaces it: one step down from the indicator's own size.
const iconSizeForSize: Record<StepperSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };
const spinnerSizeForSize: Record<StepperSize, SpinnerSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

/**
 * One step of a `Stepper`: an indicator (its number, an icon, or a check, warning or dash for its status) and its
 * title, with an optional description and "Optional" mark. Its status is worked out from the stepper's `value` unless
 * `status` sets it. A step that can be entered (see `Stepper`'s `interactive`) draws its indicator and text inside a
 * `<button>`, or the caller's own link through `asChild`; any other step draws them in a plain box with no focus stop.
 * Its `listitem` role is stated outright, since Safari with VoiceOver stops treating a list as one once its markers are
 * removed (`list-style: none`) — the same fix `List` and `Breadcrumb` apply.
 *
 * `ref` forwards to the `<li>`.
 *
 * @example
 * ```tsx
 * <Stepper.Step value="shipping" title="Shipping" description="Where it goes" />
 * <Stepper.Step value="payment" title="Payment" status="error" />
 * <Stepper.Step value="review" title="Review" busy />
 * ```
 */
export const StepperStep = forwardRef<HTMLLIElement, StepperStepProps>(
  (
    {
      value,
      title,
      description,
      textValue: _textValue,
      icon,
      status: _status,
      busy = false,
      optional = false,
      disabled = false,
      asChild = false,
      onClick,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const { size, orientation, labelPlacement, connector: connectorStyle, showLabels, labels, formatNumber, request } = useStepperContext();
    const { index, total, status, enterable } = useContext(StepPositionContext);
    const isLast = index === total - 1;
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const canEnter = enterable && !disabled;

    const mark = (() => {
      const iconSize = iconSizeForSize[size];
      if (busy) return <Spinner size={spinnerSizeForSize[size]} />;
      if (status === "complete") return <Icon icon={CheckIcon} size={iconSize} />;
      if (status === "error") return <Icon icon={XIcon} size={iconSize} />;
      if (status === "warning") return <Icon icon={WarningIcon} size={iconSize} />;
      if (status === "skipped") return <Icon icon={MinusIcon} size={iconSize} />;
      if (icon) return <Icon icon={icon} size={iconSize} />;
      return formatNumber(index + 1);
    })();

    const handleClick = (event: MouseEvent<HTMLElement>) => {
      // Only a `preventDefault()` made by the step's own `onClick` stops the change: a router's link prevents the
      // browser's navigation itself, before this runs, and the step should still become the current one.
      const alreadyPrevented = event.defaultPrevented;
      onClick?.(event);
      if (alreadyPrevented || !event.defaultPrevented) request(value);
    };

    const textWrap = (heading: ReactNode) => (
      <span className={styles.content}>
        <span className={styles.titleRow}>
          {/* A plain-text title reserves the width of its bold form, so the step does not resize when it becomes current. */}
          <span className={styles.title} data-text={typeof heading === "string" ? heading : undefined}>
            {heading}
          </span>
          {optional && <span className={styles.optional}>{labels.optional}</span>}
        </span>
        {description != null && description !== false && <span className={styles.description}>{description}</span>}
        {/* After the title and description, so the control's name starts with the words that are shown. */}
        <VisuallyHidden>{labels.statusText(index + 1, total, busy ? [labels[status], labels.busy] : [labels[status]])}</VisuallyHidden>
      </span>
    );

    const connector = !isLast && connectorStyle !== "none" && <span aria-hidden="true" className={styles.connector} />;
    const inner = (heading: ReactNode) => (
      <>
        <span aria-hidden="true" className={styles.indicator}>
          {mark}
        </span>
        {/* Without labels the text is hidden from the eye and still read: it names the step. */}
        {showLabels ? textWrap(heading) : <VisuallyHidden>{textWrap(heading)}</VisuallyHidden>}
        {orientation === "vertical" && connector}
      </>
    );

    const stepProps = {
      className: cx(styles.step, canEnter && styles.enterable, disabled && styles.disabled),
      "aria-busy": busy || undefined,
    };

    // With `asChild`, the caller's link becomes the clickable part and its own text is the title.
    const slotted = canEnter && asChild && isValidElement<{ children?: ReactNode }>(children) ? children : null;
    const heading = slotted ? (slotted.props.children ?? title) : title;

    let control: ReactElement;
    if (slotted) {
      control = (
        <Slot {...stepProps} onClick={handleClick}>
          {cloneElement(slotted, undefined, inner(heading))}
        </Slot>
      );
    } else if (canEnter) {
      control = (
        <button type="button" {...stepProps} onClick={handleClick}>
          {inner(heading)}
        </button>
      );
    } else if (disabled && enterable) {
      // A native disabled button: announced as unavailable, and out of the tab order.
      control = (
        <button type="button" disabled {...stepProps}>
          {inner(heading)}
        </button>
      );
    } else {
      control = <div {...stepProps}>{inner(heading)}</div>;
    }

    // With the text hidden, the title is the step's tooltip. A disabled button gets no pointer events, so it has none. The
    // tooltip is drawn whenever the text is hidden, and kept closed when there is nothing to say, so the step's element does
    // not change place in the tree as its title changes between plain text and a node.
    const tooltip = showLabels || (disabled && enterable) ? "" : titleText({ title: heading, textValue: _textValue });
    const hasTooltip = !showLabels && !(disabled && enterable);

    return (
      // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see the comment above.
      <li
        {...props}
        ref={ref}
        role="listitem"
        // The current step is never one that can be entered, so the marker is on the item, where a list reader finds it.
        aria-current={status === "current" ? "step" : undefined}
        data-status={status}
        data-orientation={orientation}
        data-label-placement={orientation === "horizontal" ? labelPlacement : "end"}
        className={cx(styles.item, isLast && styles.last, className)}
      >
        {hasTooltip ? (
          <Tooltip content={tooltip} open={tooltipOpen && tooltip !== ""} onOpenChange={setTooltipOpen}>
            {control}
          </Tooltip>
        ) : (
          control
        )}
        {orientation === "horizontal" && connector}
      </li>
    );
  },
);
StepperStep.displayName = "Stepper.Step";
