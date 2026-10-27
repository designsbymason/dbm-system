import { CaretDownIcon, CaretLeftIcon, CaretRightIcon, CaretUpIcon, CheckIcon, MinusIcon, WarningIcon, XIcon } from "@dbm-system/icons";
import { cx, mergeDefined, useAnnouncement, useIsScrollable, useResolvedResponsiveValue } from "@dbm-system/utils";
import { Slot } from "@radix-ui/react-slot";
import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FocusEvent, MouseEvent, ReactElement, ReactNode } from "react";
import { Icon } from "../../atoms/Icon";
import { IconButton } from "../../atoms/IconButton";
import { Spinner } from "../../atoms/Spinner";
import type { SpinnerSize } from "../../atoms/Spinner";
import type { IconSize } from "../../atoms/Icon";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./Stepper.module.css";
import type {
  StepperCompact,
  StepperConnector,
  StepperController,
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
  connector: StepperConnector;
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

const connectorClass: Record<StepperConnector, string | undefined> = {
  solid: undefined,
  dashed: styles.connectorDashed,
  none: undefined,
};

// The spinner that replaces a mark: the same step down from the indicator as the icons.
const spinnerSizeForSize: Record<StepperSize, SpinnerSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

// The width at which `compact="auto"` switches, one pixel under the literal value of the breakpoint.sm primitive token
// (the stylesheet's own `@media` condition says the same, and custom properties can't be used in one).
const COMPACT_QUERY = "(max-width: 639px)";

const toneClass: Record<StepperTone, string | undefined> = {
  brand: styles.toneBrand,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  highlight: styles.toneHighlight,
  neutral: styles.toneNeutral,
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

// The default numbers go through `formatNumber`, so a step's digits and the words that name it agree.
const defaultLabelsFor = (format: (value: number) => string): StepperLabels => ({
  navigation: "Progress",
  stepOf: (position, total) => `Step ${format(position)} of ${format(total)}`,
  place: (position, total) => `${format(position)}/${format(total)}`,
  complete: "completed",
  current: "current",
  upcoming: "not started",
  error: "has an error",
  warning: "has a warning",
  skipped: "skipped",
  busy: "in progress",
  previous: "Previous step",
  next: "Next step",
  optional: "Optional",
});

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
const StepperStep = forwardRef<HTMLLIElement, StepperStepProps>(
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
    const { size, orientation, labelPlacement, connector: connectorStyle, labels, formatNumber, request } = useStepperContext();
    const { index, total, status, enterable } = useContext(StepPositionContext);
    const isLast = index === total - 1;
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
        <VisuallyHidden>{` (${labels.stepOf(index + 1, total)}, ${statusWord(labels, status)}${busy ? `, ${labels.busy}` : ""})`}</VisuallyHidden>
      </span>
    );

    const connector = !isLast && connectorStyle !== "none" && <span aria-hidden="true" className={styles.connector} />;
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
      "aria-busy": busy || undefined,
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

/**
 * A multi-step flow indicator (a checkout, an onboarding, a wizard): a `<nav>` around an ordered list of
 * `Stepper.Step`s, each with an indicator and a title. The current step is `value` (controlled, with `onValueChange`)
 * or `defaultValue`; steps before it show as finished and steps after it as not started, and a step may set its own
 * `status` (`"error"`, `"warning"`, `"skipped"`, `"complete"`) or be `busy` while its check or save runs.
 *
 * It draws the indicator and nothing else: the current step's content, next and back, and deciding whether a step may
 * be left are the caller's. By default it only shows progress and has no focus stop; `interactive` lets a person
 * enter finished steps (`"completed"`) or any step but the current one (`"all"`), each a real button in the tab
 * order. The current step carries `aria-current="step"`, and a change of step is announced to a screen reader
 * (`announce`).
 *
 * `size`, `variant`, `rounded`, `tone`, `connector` and `orientation` (which takes a breakpoint map) set how every step
 * looks, `labelPlacement` puts a horizontal step's text under its indicator, and `compact` swaps the steps for a
 * one-line summary on a phone (or always), with a way back when `interactive`. `controllerRef` hands `next()`,
 * `back()` and `goTo()` to a button of your own. Text the component writes itself is in `labels`, and `formatNumber`
 * writes its digits.
 *
 * `ref` forwards to the `<nav>`.
 *
 * @example
 * ```tsx
 * const [step, setStep] = useState("shipping");
 *
 * <Stepper value={step} onValueChange={setStep} interactive="completed">
 *   <Stepper.Step value="account" title="Account" />
 *   <Stepper.Step value="shipping" title="Shipping" description="Where it goes" />
 *   <Stepper.Step value="payment" title="Payment" />
 * </Stepper>
 * ```
 */
const StepperRoot = forwardRef<HTMLElement, StepperProps>(
  (
    {
      children,
      value: valueProp,
      defaultValue,
      onValueChange,
      orientation: orientationProp = "horizontal",
      size = "md",
      variant = "filled",
      tone = "brand",
      rounded = true,
      connector = "solid",
      labelPlacement = "end",
      compact = "never",
      interactive = "none",
      announce = true,
      formatNumber = String,
      labels: labelsProp,
      controllerRef,
      dir = "ltr",
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      className,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const labels = mergeDefined(defaultLabelsFor(formatNumber), labelsProp);
    const orientation = useResolvedResponsiveValue<StepperOrientation>(orientationProp, "horizontal");
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

    const context: StepperContextValue = {
      size,
      variant,
      tone,
      orientation,
      labelPlacement,
      connector,
      labels,
      formatNumber,
      request,
    };

    // The furthest step the person has been on: with `interactive="completed"` every step up to it can be entered, so after
    // going back they can go forward again. Set while rendering, from the current step, the way React asks for a value
    // derived from props and state.
    const [furthest, setFurthest] = useState(currentIndex);
    if (currentIndex > furthest) setFurthest(currentIndex);

    const positionFor = (step: ReactElement<StepperStepProps>, index: number): StepPosition => {
      const override = step.props.status;
      const status: StepStatus =
        override ?? (index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming");
      const enterable = canEnter(interactive, status, index, currentIndex, furthest);
      return { index, total, status, enterable };
    };

    const listRef = useRef<HTMLOListElement | null>(null);
    const navRef = useRef<HTMLElement | null>(null);
    const summaryRef = useRef<HTMLDivElement | null>(null);
    const backRef = useRef<HTMLButtonElement | null>(null);
    const nextRef = useRef<HTMLButtonElement | null>(null);
    const setNavRefs = (node: HTMLElement | null) => {
      navRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    // The controls handed to code outside: one object for the stepper's life, reading the latest state.
    const latest = useRef({ values, disabled: steps.map((step) => step.props.disabled === true), currentIndex, request });
    useEffect(() => {
      latest.current = { values, disabled: steps.map((step) => step.props.disabled === true), currentIndex, request };
    });
    const controller = useMemo<StepperController>(() => {
      const ask = (index: number): boolean => {
        const { values: all, disabled, currentIndex: now, request: ask } = latest.current;
        if (index < 0 || index >= all.length || index === now || disabled[index]) return false;
        ask(all[index]!);
        return true;
      };
      const find = (from: number, direction: 1 | -1): number => {
        const { values: all, disabled } = latest.current;
        for (let index = from + direction; index >= 0 && index < all.length; index += direction) {
          if (!disabled[index]) return index;
        }
        return -1;
      };
      return {
        get value() {
          const { values: all, currentIndex: now } = latest.current;
          return now >= 0 ? all[now] : undefined;
        },
        next: () => ask(find(latest.current.currentIndex, 1)),
        back: () => {
          const { currentIndex: now } = latest.current;
          return now > 0 && ask(find(now, -1));
        },
        goTo: (target) => ask(latest.current.values.indexOf(target)),
      };
    }, []);
    useImperativeHandle(controllerRef, () => controller, [controller]);

    // A focused step that is only partly inside the scrolling strip is brought fully into view: a browser scrolls only
    // when the control is completely hidden.
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const scrollable = useIsScrollable(scrollerRef, "x");
    const hasEnterable = steps.some((step, index) => positionFor(step, index).enterable && !step.props.disabled);
    // Where focus is in the stepper, kept from the focus events: by the time the width changes, the browser has already
    // taken focus off a control it hid, so asking where focus is then finds nothing. A blur that comes from the control
    // being hidden leaves it as it was; any other leaving of the stepper clears it.
    const focusPlace = useRef<"list" | "summary" | null>(null);
    const handleFocus = (event: FocusEvent<HTMLElement>) => {
      onFocus?.(event);
      const scroller = scrollerRef.current;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (summaryRef.current?.contains(target)) focusPlace.current = "summary";
      else if (listRef.current?.contains(target)) focusPlace.current = "list";
      if (!scroller || target === scroller) return;
      requestAnimationFrame(() => revealInline(scroller, target));
    };
    const handleBlur = (event: FocusEvent<HTMLElement>) => {
      onBlur?.(event);
      const next = event.relatedTarget;
      if (next instanceof Node) {
        if (!navRef.current?.contains(next)) focusPlace.current = null;
      } else if (event.target instanceof HTMLElement && event.target.getClientRects().length > 0) {
        focusPlace.current = null;
      }
    };

    // The current step is in view whenever it changes, and when the stepper first draws: a strip that scrolls can
    // otherwise hold it off the edge.
    useEffect(() => {
      const scroller = scrollerRef.current;
      const item = currentIndex >= 0 ? listRef.current?.children[currentIndex] : undefined;
      if (scroller && item instanceof HTMLElement) revealInline(scroller, item);
    }, [currentIndex, orientation, size]);

    // The nearest steps either side of the current one that the compact summary's buttons can enter.
    const enterableAt = (index: number): boolean => positionFor(steps[index]!, index).enterable && !steps[index]!.props.disabled;
    let previousIndex = -1;
    for (let index = currentIndex - 1; index >= 0; index -= 1) {
      if (enterableAt(index)) {
        previousIndex = index;
        break;
      }
    }
    let nextIndex = -1;
    for (let index = Math.max(currentIndex, -1) + 1; index < steps.length; index += 1) {
      if (enterableAt(index)) {
        nextIndex = index;
        break;
      }
    }
    const summaryButtons = compact !== "never" && interactive !== "none";

    // A summary button that is pressed and then leaves (back at the first step, next at the last) would drop focus to the
    // page. A press leaves a short-lived note, and if focus is lost by the next commit it goes to the other button, or
    // the summary.
    const pendingFocus = useRef(0);
    const firstEnabledSummaryButton = (): HTMLElement | null => {
      for (const button of [backRef.current, nextRef.current]) {
        if (button && !button.disabled) return button;
      }
      return summaryRef.current;
    };
    useEffect(() => {
      if (pendingFocus.current === 0) return;
      if (Date.now() - pendingFocus.current > 1000) {
        pendingFocus.current = 0;
        return;
      }
      // Focus is lost when it fell to the page, and, in a browser that leaves it on a button that has just been disabled,
      // when it is still on that dead button.
      const active = document.activeElement;
      const stillAlive =
        active && active !== document.body && navRef.current?.contains(active) && !(active instanceof HTMLButtonElement && active.disabled);
      if (stillAlive) return;
      pendingFocus.current = 0;
      firstEnabledSummaryButton()?.focus();
    });
    const pressSummaryButton = (index: number) => {
      pendingFocus.current = Date.now();
      request(values[index]!);
    };

    // When the width crosses the breakpoint `compact="auto"` switches at, the form that was drawn is hidden: focus inside
    // it moves to the other form instead of falling to the top of the page. Done here, in the change event, while the
    // focused element is still the one that was focused.
    useEffect(() => {
      if (compact !== "auto" || typeof window.matchMedia !== "function") return;
      const query = window.matchMedia(COMPACT_QUERY);
      const onChange = (event: MediaQueryListEvent) => {
        const place = focusPlace.current;
        if (event.matches && place === "list") {
          firstEnabledSummaryButton()?.focus();
        } else if (!event.matches && place === "summary") {
          const target = listRef.current?.querySelector<HTMLElement>("button, a[href]") ?? scrollerRef.current;
          target?.focus();
        }
      };
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    }, [compact]);

    const vertical = orientation === "vertical";
    // Both buttons are always drawn when the stepper is interactive: one with nowhere to go is disabled, not removed, so
    // nothing in the row moves or changes size.
    const backNode = summaryButtons && (
      <IconButton
        ref={backRef}
        icon={vertical ? CaretUpIcon : CaretLeftIcon}
        variant="tertiary"
        size="xs"
        aria-label={labels.previous}
        className={styles.back}
        disabled={previousIndex < 0}
        onClick={() => pressSummaryButton(previousIndex)}
      />
    );
    const nextNode = summaryButtons && (
      <IconButton
        ref={nextRef}
        icon={vertical ? CaretDownIcon : CaretRightIcon}
        variant="tertiary"
        size="xs"
        aria-label={labels.next}
        className={styles.next}
        disabled={nextIndex < 0}
        onClick={() => pressSummaryButton(nextIndex)}
      />
    );
    // Vertically the text is only the place ("3/4"), drawn for the eye; a screen reader gets the full words and the title.
    const textNode = currentStep && (
      <span className={styles.summaryText}>
        {vertical ? (
          <>
            <span aria-hidden="true">{labels.place(currentIndex + 1, total)}</span>
            <VisuallyHidden>
              {labels.stepOf(currentIndex + 1, total)}
              {currentStep.props.title ? ` — ${titleText(currentStep.props) || ""}` : ""}
            </VisuallyHidden>
          </>
        ) : (
          <>
            {labels.stepOf(currentIndex + 1, total)}
            {currentStep.props.title ? <> — {currentStep.props.title}</> : null}
          </>
        )}
      </span>
    );
    const segmentsNode = (
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
    );
    // Horizontally: the text, then Back and Next side by side at the end, with the bars beneath. Vertically, one column:
    // Back (up), the bars, Next (down), then the place as text.
    const summary = compact !== "never" && (
      <div ref={summaryRef} tabIndex={-1} className={styles.summary}>
        {vertical ? (
          <>
            {backNode}
            {segmentsNode}
            {nextNode}
            {textNode}
          </>
        ) : (
          <>
            <span className={cx(styles.summaryRow, summaryButtons && styles.summaryRowButtons)}>
              {textNode}
              {summaryButtons && (
                <span className={styles.summaryButtons}>
                  {backNode}
                  {nextNode}
                </span>
              )}
            </span>
            {segmentsNode}
          </>
        )}
      </div>
    );

    return (
      <StepperContext.Provider value={context}>
        <nav
          {...props}
          ref={setNavRefs}
          dir={dir}
          aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? labels.navigation)}
          aria-labelledby={ariaLabelledBy}
          data-orientation={orientation}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cx(
            styles.root,
            sizeClass[size],
            toneClass[tone],
            variantClass[variant],
            rounded && styles.rounded,
            connectorClass[connector],
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
            <ol ref={listRef} role="list" className={styles.list}>
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

/**
 * Whether a step can be entered. `"completed"` allows every step the person has reached — the furthest one they have been
 * on and all before it, whatever they show, so a step with an error that was left behind can be gone back to and a step
 * that was gone back from can be returned to — and any step marked complete.
 */
function canEnter(
  interactive: StepperInteractive,
  status: StepStatus,
  index: number,
  currentIndex: number,
  furthestIndex: number,
): boolean {
  if (interactive === "none" || index === currentIndex) return false;
  if (interactive === "all") return true;
  return index <= furthestIndex || status === "complete";
}

/** Scrolls `scroller` sideways just far enough for `element` to lie fully inside it. Nothing when it has no box (hidden). */
function revealInline(scroller: HTMLElement, element: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;
  const box = scroller.getBoundingClientRect();
  const delta = rect.left < box.left ? rect.left - box.left : rect.right > box.right ? rect.right - box.right : 0;
  if (delta !== 0) scroller.scrollBy({ left: delta });
}

type StepperComponent = typeof StepperRoot & {
  Step: typeof StepperStep;
};

export const Stepper: StepperComponent = Object.assign(StepperRoot, {
  Step: StepperStep,
});
