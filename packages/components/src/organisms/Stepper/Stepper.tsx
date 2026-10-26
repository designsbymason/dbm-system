import { CheckIcon, MinusIcon, WarningIcon } from "@dbm-system/icons";
import { cx, mergeDefined, useAnnouncement, useIsScrollable } from "@dbm-system/utils";
import { Slot } from "@radix-ui/react-slot";
import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { FocusEvent, MouseEvent, ReactElement, ReactNode } from "react";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./Stepper.module.css";
import type {
  StepperCompact,
  StepperInteractive,
  StepperLabelPlacement,
  StepperLabels,
  StepperOrientation,
  StepperProps,
  StepperSize,
  StepperStepProps,
  StepperTone,
  StepperVariant,
  StepStatus,
} from "./Stepper.types";

interface StepperContextValue {
  size: StepperSize;
  variant: StepperVariant;
  tone: StepperTone;
  orientation: StepperOrientation;
  labelPlacement: StepperLabelPlacement;
  labels: StepperLabels;
  formatNumber: (value: number) => string;
  /** Asks for a step to become the current one. */
  request: (value: string) => void;
}

const StepperContext = createContext<StepperContextValue | null>(null);

/** What the root works out about one step and hands to it. */
interface StepPosition {
  /** Zero-based. */
  index: number;
  total: number;
  status: StepStatus;
  enterable: boolean;
}

const StepPositionContext = createContext<StepPosition>({ index: 0, total: 1, status: "upcoming", enterable: false });

const sizeClass: Record<StepperSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const toneClass: Record<StepperTone, string | undefined> = {
  brand: styles.toneBrand,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  highlight: styles.toneHighlight,
};

const variantClass: Record<StepperVariant, string | undefined> = {
  filled: styles.variantFilled,
  outlined: styles.variantOutlined,
};

const compactClass: Record<StepperCompact, string | undefined> = {
  never: undefined,
  auto: styles.compactAuto,
  always: styles.compactAlways,
};

// The icon inside the indicator: one step down from the indicator's own size.
const iconSizeForSize: Record<StepperSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

const defaultLabels: StepperLabels = {
  navigation: "Progress",
  stepOf: (position, total) => `Step ${position} of ${total}`,
  complete: "completed",
  current: "current",
  upcoming: "not started",
  error: "has an error",
  skipped: "skipped",
  optional: "Optional",
};

const statusWord = (labels: StepperLabels, status: StepStatus): string => labels[status];

/** The plain text of a step's title, for the announcement and the summary. */
function titleText(props: StepperStepProps): string {
  if (props.textValue) return props.textValue;
  return typeof props.title === "string" || typeof props.title === "number" ? String(props.title) : "";
}

function isStep(child: ReactNode): child is ReactElement<StepperStepProps> {
  return isValidElement(child) && child.type === StepperStep;
}

const useStepperContext = (): StepperContextValue => {
  const context = useContext(StepperContext);
  if (!context) throw new Error("Stepper.Step must be used inside a Stepper.");
  return context;
};

/**
 * One step: an indicator and its text. Its `listitem` role is stated outright, since Safari with VoiceOver stops
 * treating a list as one once its markers are removed (`list-style: none`) — the same fix `List` and `Breadcrumb`
 * apply. A step that can be entered draws its indicator and text inside a `<button>` (or the caller's own link through
 * `asChild`); any other step draws them in a plain box with no focus stop.
 */
const StepperStep = forwardRef<HTMLLIElement, StepperStepProps>(
  (
    {
      value,
      title,
      description,
      textValue: _textValue,
      icon,
      status: _status,
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
    const { size, orientation, labelPlacement, labels, formatNumber, request } = useStepperContext();
    const { index, total, status, enterable } = useContext(StepPositionContext);
    const isLast = index === total - 1;
    const canEnter = enterable && !disabled;

    const mark = (() => {
      const iconSize = iconSizeForSize[size];
      if (status === "complete") return <Icon icon={CheckIcon} size={iconSize} />;
      if (status === "error") return <Icon icon={WarningIcon} size={iconSize} />;
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
        <VisuallyHidden>{` (${labels.stepOf(index + 1, total)}, ${statusWord(labels, status)})`}</VisuallyHidden>
      </span>
    );

    const connector = !isLast && <span aria-hidden="true" className={styles.connector} />;
    const inner = (heading: ReactNode) => (
      <>
        <span aria-hidden="true" className={styles.indicator}>
          {mark}
        </span>
        {textWrap(heading)}
        {orientation === "vertical" && connector}
      </>
    );

    const stepProps = {
      className: cx(styles.step, canEnter && styles.enterable, disabled && styles.disabled),
      "aria-current": status === "current" ? ("step" as const) : undefined,
    };

    let control: ReactNode;
    if (canEnter && asChild && isValidElement<{ children?: ReactNode }>(children)) {
      // The caller's link becomes the clickable part; its own text is the title.
      const child = children;
      control = (
        <Slot {...stepProps} onClick={handleClick}>
          {cloneElement(child, undefined, inner(child.props.children ?? title))}
        </Slot>
      );
    } else if (canEnter) {
      control = (
        <button type="button" {...stepProps} onClick={handleClick}>
          {inner(title)}
        </button>
      );
    } else {
      control = (
        <div {...stepProps} aria-disabled={disabled && enterable ? true : undefined}>
          {inner(title)}
        </div>
      );
    }

    return (
      // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see the comment above.
      <li
        {...props}
        ref={ref}
        role="listitem"
        data-status={status}
        data-orientation={orientation}
        data-label-placement={orientation === "horizontal" ? labelPlacement : "end"}
        className={cx(styles.item, isLast && styles.last, className)}
      >
        {control}
        {orientation === "horizontal" && connector}
      </li>
    );
  },
);
StepperStep.displayName = "Stepper.Step";

const StepperRoot = forwardRef<HTMLElement, StepperProps>(
  (
    {
      children,
      value: valueProp,
      defaultValue,
      onValueChange,
      orientation = "horizontal",
      size = "md",
      variant = "filled",
      tone = "brand",
      labelPlacement = "end",
      compact = "never",
      interactive = "none",
      announce = true,
      formatNumber = String,
      labels: labelsProp,
      dir = "ltr",
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      className,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const labels = mergeDefined(defaultLabels, labelsProp);
    const rawChildren = Children.toArray(children);
    const steps = rawChildren.filter(isStep);
    const ignored = rawChildren.length - steps.length;
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && ignored > 0) {
        console.warn("Stepper: only `Stepper.Step` elements are drawn; other children were ignored.");
      }
    }, [ignored]);

    const values = steps.map((step) => step.props.value);
    const duplicate = values.find((v, i) => values.indexOf(v) !== i);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && duplicate !== undefined) {
        console.warn(`Stepper: two steps share the value "${duplicate}". Each step's \`value\` must be unique.`);
      }
    }, [duplicate]);

    const controlled = valueProp !== undefined;
    const [inner, setInner] = useState<string | undefined>(defaultValue);
    const current = controlled ? valueProp : (inner ?? values[0]);
    const currentIndex = current === undefined ? -1 : values.indexOf(current);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && current !== undefined && values.length > 0 && currentIndex === -1) {
        console.warn(`Stepper: the value "${current}" matches no step, so every step is shown as not started.`);
      }
    }, [current, currentIndex, values.length]);

    // A click asks for a value; the stepper changes it only when it holds the state itself.
    const request = (next: string) => {
      if (!controlled) setInner(next);
      onValueChange?.(next);
    };

    // A change of the current step is announced, never its first appearance (06 §9, live regions).
    const { message, announce: say } = useAnnouncement();
    const announced = useRef<string | undefined>(undefined);
    const currentStep = currentIndex >= 0 ? steps[currentIndex] : undefined;
    const currentText = currentStep ? titleText(currentStep.props) : "";
    const total = steps.length;
    const stepOfLabel = labels.stepOf;
    useEffect(() => {
      const previous = announced.current;
      announced.current = current;
      if (!announce || previous === undefined || previous === current || currentIndex < 0) return;
      const position = stepOfLabel(currentIndex + 1, total);
      say(currentText ? `${position}: ${currentText}` : position);
    }, [announce, current, currentIndex, currentText, say, stepOfLabel, total]);

    const context: StepperContextValue = { size, variant, tone, orientation, labelPlacement, labels, formatNumber, request };

    const positionFor = (step: ReactElement<StepperStepProps>, index: number): StepPosition => {
      const override = step.props.status;
      const status: StepStatus =
        override ?? (index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming");
      const enterable = canEnter(interactive, status, index === currentIndex);
      return { index, total, status, enterable };
    };

    // A focused step that is only partly inside the scrolling strip is brought fully into view: a browser scrolls only
    // when the control is completely hidden.
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const scrollable = useIsScrollable(scrollerRef, "x");
    const hasEnterable = steps.some((step, index) => positionFor(step, index).enterable && !step.props.disabled);
    const handleFocus = (event: FocusEvent<HTMLElement>) => {
      onFocus?.(event);
      const scroller = scrollerRef.current;
      const target = event.target;
      if (!scroller || !(target instanceof HTMLElement) || target === scroller) return;
      requestAnimationFrame(() => {
        const box = scroller.getBoundingClientRect();
        const rect = target.getBoundingClientRect();
        const delta = rect.left < box.left ? rect.left - box.left : rect.right > box.right ? rect.right - box.right : 0;
        if (delta !== 0) scroller.scrollBy({ left: delta });
      });
    };

    const summary = currentStep && (
      <div className={styles.summary}>
        <span className={styles.summaryText}>
          {labels.stepOf(currentIndex + 1, total)}
          {currentStep.props.title ? <> — {currentStep.props.title}</> : null}
        </span>
        <span aria-hidden="true" className={styles.segments}>
          {steps.map((step, index) => (
            <span
              key={step.props.value}
              className={styles.segment}
              data-status={positionFor(step, index).status}
              data-done={index <= currentIndex || undefined}
            />
          ))}
        </span>
      </div>
    );

    return (
      <StepperContext.Provider value={context}>
        <nav
          {...props}
          ref={ref}
          dir={dir}
          aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? labels.navigation)}
          aria-labelledby={ariaLabelledBy}
          data-orientation={orientation}
          onFocus={handleFocus}
          className={cx(
            styles.root,
            sizeClass[size],
            toneClass[tone],
            variantClass[variant],
            compactClass[compact],
            orientation === "vertical" ? styles.vertical : styles.horizontal,
            className,
          )}
        >
          {/* Reachable by keyboard only while it scrolls and has no step to focus (WCAG 2.1.1). */}
          <div ref={scrollerRef} className={styles.scroller} tabIndex={scrollable && !hasEnterable ? 0 : undefined}>
            {summary}
            {/* The `list` role is stated outright, for the reason given at `StepperStep`. */}
            {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see `StepperStep`. */}
            <ol role="list" className={styles.list}>
              {steps.map((step, index) => (
                <StepPositionContext.Provider key={step.props.value} value={positionFor(step, index)}>
                  {step}
                </StepPositionContext.Provider>
              ))}
            </ol>
            {announce && <VisuallyHidden role="status">{message}</VisuallyHidden>}
          </div>
        </nav>
      </StepperContext.Provider>
    );
  },
);
StepperRoot.displayName = "Stepper";

function canEnter(interactive: StepperInteractive, status: StepStatus, isCurrent: boolean): boolean {
  if (interactive === "none" || isCurrent) return false;
  if (interactive === "all") return true;
  return status === "complete";
}

type StepperComponent = typeof StepperRoot & {
  Step: typeof StepperStep;
};

export const Stepper: StepperComponent = Object.assign(StepperRoot, {
  Step: StepperStep,
});
