import { cx, mergeDefined, useResolvedResponsiveValue } from "@dbm-system/utils";
import { Children, forwardRef, isValidElement, useEffect } from "react";
import type { ReactElement, ReactNode } from "react";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { canEnter, defaultLabelsFor, derivedStatus, titleText } from "./stepperHelpers";
import { StepperContext, StepPositionContext } from "./StepperContext";
import type { StepperContextValue, StepPosition } from "./StepperContext";
import { StepperStep } from "./StepperStep";
import { StepperSummary } from "./StepperSummary";
import { useStepAnnouncement, useStepperValue } from "./useStepperState";
import { useStepperController } from "./useStepperController";
import { useStepperFocus } from "./useStepperFocus";
import styles from "./Stepper.module.css";
import type {
  StepperCompact,
  StepperConnector,
  StepperOrientation,
  StepperProps,
  StepperSize,
  StepperStepProps,
  StepperTone,
  StepperVariant,
} from "./Stepper.types";

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
  neutral: styles.toneNeutral,
};

const variantClass: Record<StepperVariant, string | undefined> = {
  filled: styles.variantFilled,
  outlined: styles.variantOutlined,
};

const connectorClass: Record<StepperConnector, string | undefined> = {
  solid: undefined,
  dashed: styles.connectorDashed,
  none: undefined,
};

const compactClass: Record<StepperCompact, string | undefined> = {
  never: undefined,
  auto: styles.compactAuto,
  always: styles.compactAlways,
};

function isStep(child: ReactNode): child is ReactElement<StepperStepProps> {
  return isValidElement(child) && child.type === StepperStep;
}

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
    const labels = mergeDefined(defaultLabelsFor(formatNumber, labelsProp?.stepOf), labelsProp);
    const orientation = useResolvedResponsiveValue<StepperOrientation>(orientationProp, "horizontal");
    const vertical = orientation === "vertical";

    const rawChildren = Children.toArray(children);
    const steps = rawChildren.filter(isStep);
    const ignored = rawChildren.length - steps.length;
    const values = steps.map((step) => step.props.value);
    const duplicate = values.find((v, i) => values.indexOf(v) !== i);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && ignored > 0) {
        console.warn("Stepper: only `Stepper.Step` elements are drawn; other children were ignored.");
      }
    }, [ignored]);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && duplicate !== undefined) {
        console.warn(`Stepper: two steps share the value "${duplicate}". Each step's \`value\` must be unique.`);
      }
    }, [duplicate]);

    const { current, currentIndex, furthest, request } = useStepperValue({
      value: valueProp,
      defaultValue,
      onValueChange,
      values,
    });
    const total = steps.length;
    const currentStep = currentIndex >= 0 ? steps[currentIndex] : undefined;
    const currentTitle = currentStep ? titleText(currentStep.props) : "";
    const announcement = useStepAnnouncement({ announce, current, currentIndex, total, title: currentTitle, labels });
    useStepperController({
      controllerRef,
      values,
      disabled: steps.map((step) => step.props.disabled === true),
      currentIndex,
      request,
    });

    const positionFor = (step: ReactElement<StepperStepProps>, index: number): StepPosition => {
      const status = derivedStatus(step, index, currentIndex);
      return { index, total, status, enterable: canEnter(interactive, status, index, currentIndex, furthest) };
    };
    const enterableAt = (index: number): boolean => positionFor(steps[index]!, index).enterable && !steps[index]!.props.disabled;

    // The nearest steps either side of the current one that the compact summary's buttons can enter.
    let previousIndex = -1;
    for (let index = currentIndex - 1; index >= 0; index -= 1) {
      if (enterableAt(index)) {
        previousIndex = index;
        break;
      }
    }
    let nextIndex = -1;
    for (let index = Math.max(currentIndex, -1) + 1; index < total; index += 1) {
      if (enterableAt(index)) {
        nextIndex = index;
        break;
      }
    }

    const focus = useStepperFocus({
      compact,
      orientation,
      size,
      currentIndex,
      hasEnterable: steps.some((_, index) => enterableAt(index)),
      requestIndex: (index) => request(values[index]!),
      onFocus,
      onBlur,
    });
    const setNavRefs = (node: HTMLElement | null) => {
      focus.navRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

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

    return (
      <StepperContext.Provider value={context}>
        <nav
          {...props}
          ref={setNavRefs}
          dir={dir}
          aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? labels.navigation)}
          aria-labelledby={ariaLabelledBy}
          data-orientation={orientation}
          onFocus={focus.handleFocus}
          onBlur={focus.handleBlur}
          className={cx(
            styles.root,
            sizeClass[size],
            toneClass[tone],
            variantClass[variant],
            rounded && styles.rounded,
            connectorClass[connector],
            compactClass[compact],
            vertical ? styles.vertical : styles.horizontal,
            className,
          )}
        >
          <div ref={focus.scrollerRef} className={styles.scroller} tabIndex={focus.scrollerTabIndex}>
            {compact !== "never" && (
              <StepperSummary
                vertical={vertical}
                labels={labels}
                currentIndex={currentIndex}
                total={total}
                title={currentTitle}
                segments={steps.map((step, index) => ({
                  value: step.props.value,
                  status: positionFor(step, index).status,
                  done: index <= currentIndex,
                }))}
                buttons={interactive !== "none"}
                previousIndex={previousIndex}
                nextIndex={nextIndex}
                onPress={focus.pressSummaryButton}
                summaryRef={focus.summaryRef}
                backRef={focus.backRef}
                nextRef={focus.nextRef}
              />
            )}
            {/* The `list` role is stated outright, for the reason given at `StepperStep`. */}
            {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see `StepperStep`. */}
            <ol ref={focus.listRef} role="list" className={styles.list}>
              {steps.map((step, index) => (
                <StepPositionContext.Provider key={step.props.value} value={positionFor(step, index)}>
                  {step}
                </StepPositionContext.Provider>
              ))}
            </ol>
            {announce && <VisuallyHidden role="status">{announcement}</VisuallyHidden>}
          </div>
        </nav>
      </StepperContext.Provider>
    );
  },
);
StepperRoot.displayName = "Stepper";

type StepperComponent = typeof StepperRoot & {
  Step: typeof StepperStep;
};

export const Stepper: StepperComponent = Object.assign(StepperRoot, {
  Step: StepperStep,
});
