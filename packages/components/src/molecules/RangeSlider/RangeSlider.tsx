import { cx, mergeDefined } from "@dbm-system/utils";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { forwardRef, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactElement } from "react";
import { Tooltip } from "../../atoms/Tooltip";
import styles from "../Slider/Slider.module.css";
import { useDirection } from "../../atoms/DirectionProvider";
import {
  needsVerticalWrapper,
  SliderLayout,
  sliderSizeClass,
  SliderTicks,
  useThumbTooltip,
  visibleTickValues,
  widestValueCandidates,
} from "../Slider/sliderShared";
import type {
  RangeSliderLabels,
  RangeSliderProps,
  RangeSliderValue,
} from "./RangeSlider.types";

// Step sizes like 0.1 don't add up exactly in floating point (0.1 * 3 is
// 0.30000000000000004), so a value worked out from another is rounded to the
// step's own number of decimals before it is used.
function decimalsOf(step: number): number {
  const [, fraction = ""] = String(step).split(".");
  return fraction.length;
}

// The two numbers of the `showValue` text are each wrapped in a bidirectional
// isolate (U+2068 ... U+2069). Without it, numbers in a script with right-to-left
// digits (Arabic-Indic, via `formatNumber`) pull the neutral dash between them
// into their own right-to-left run, and a left-to-right page draws the pair
// backwards — "80 – 20" for a range of 20 to 80. Isolated, they act as neutrals,
// so the pair follows the direction of the page.
const isolate = (text: string) => `\u2068${text}\u2069`;

const defaultLabels = {
  minimum: "Minimum",
  maximum: "Maximum",
} satisfies Partial<RangeSliderLabels>;

/**
 * A slider with two thumbs, for choosing a range of values — a price band, a
 * date span, a volume window — built on Radix Slider and drawn exactly like
 * `Slider` (it shares that component's track, thumb and label layout). The value is
 * a `[minimum, maximum]` pair, lower first, in both controlled
 * (`value`/`onValueChange`) and uncontrolled (`defaultValue`) use; a thumb can
 * never pass the other. `minStepsBetweenThumbs` keeps them apart.
 * `onValueCommit` fires once, on release, distinct from `onValueChange`'s
 * continuous firing while dragging. `ref` forwards to the slider's own root
 * element; each thumb is its own `role="slider"` with a name made of the
 * slider's (`aria-label` or `aria-labelledby`) and "Minimum" / "Maximum"
 * (`labels`).
 *
 * A vertical slider (`orientation="vertical"`) has no intrinsic height of its
 * own — set one explicitly via `style`/`className`, which always applies to the
 * component's true outermost element, as on `Slider`.
 *
 * @example
 * ```tsx
 * <RangeSlider aria-label="Price" defaultValue={[20, 80]} />
 * <RangeSlider aria-label="Price" value={range} onValueChange={setRange} min={0} max={500} step={10} />
 * <RangeSlider aria-label="Price" defaultValue={[100, 300]} min={0} max={500} showValue showMinMaxLabels formatNumber={(n) => `$${n}`} />
 * <RangeSlider aria-label="Volume" minStepsBetweenThumbs={5} showValueTooltip />
 * ```
 */
export const RangeSlider = forwardRef<HTMLSpanElement, RangeSliderProps>(
  (
    {
      size = "md",
      hasError = false,
      value,
      defaultValue,
      onValueChange,
      onValueCommit,
      min = 0,
      max = 100,
      step = 1,
      minStepsBetweenThumbs = 0,
      orientation = "horizontal",
      inverted = false,
      showValue = false,
      showValueTooltip = false,
      showMinMaxLabels = false,
      formatNumber,
      showTicks = false,
      tickInterval = step,
      disabled,
      dir: dirProp,
      autoFocus,
      name,
      form,
      labels: labelOverrides,
      className,
      style,
      id,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      "data-testid": dataTestId,
      ...props
    },
    ref,
  ) => {
    const dir = useDirection(dirProp);
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] =
      useState<RangeSliderValue>(() => defaultValue ?? [min, max]);
    const currentValue = isControlled ? value : uncontrolledValue;
    const [lowValue, highValue] = currentValue;
    const isVertical = orientation === "vertical";

    const generatedId = useId();
    const minimumThumbId = id ?? `${generatedId}-minimum`;
    const maximumThumbId = id ? `${id}-maximum` : `${generatedId}-maximum`;

    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        !ariaLabel &&
        !ariaLabelledBy &&
        !hasWarnedNoAccessibleNameRef.current
      ) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "RangeSlider: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label, so the thumbs are more than just \"Minimum\" and \"Maximum\" to assistive tech.",
        );
      }
    }

    // Radix renders whatever it is given: an unsorted pair puts the "Minimum" thumb above the "Maximum" one, and
    // a value outside the track leaves `aria-valuenow` outside `aria-valuemin`/`aria-valuemax`. Nothing here
    // can repair a wrong value the parent owns, so say so once, in development.
    const hasWarnedInvalidValueRef = useRef(false);
    if (process.env.NODE_ENV !== "production" && !hasWarnedInvalidValueRef.current) {
      if (lowValue > highValue) {
        hasWarnedInvalidValueRef.current = true;
        console.warn(
          `RangeSlider: the value must be [minimum, maximum], lower first — got [${lowValue}, ${highValue}]. The thumbs are named and limited by their position, so an unsorted pair reads as a "Minimum" thumb above the "Maximum" one.`,
        );
      } else if (lowValue < min || highValue > max) {
        hasWarnedInvalidValueRef.current = true;
        console.warn(
          `RangeSlider: the value [${lowValue}, ${highValue}] is outside the track [${min}, ${max}], so \`aria-valuenow\` falls outside \`aria-valuemin\`/\`aria-valuemax\`. Keep both numbers between \`min\` and \`max\`.`,
        );
      }
    }

    const minimumTooltip = useThumbTooltip(showValueTooltip);
    const maximumTooltip = useThumbTooltip(showValueTooltip);

    // `autoFocus` is not passed to the thumb: React only auto-focuses a
    // button, input, select or textarea, and a thumb is a `span`, so the
    // attribute would do nothing. Focus the lower thumb once on mount instead.
    const minimumThumbRef = useRef<HTMLSpanElement>(null);
    useEffect(() => {
      if (autoFocus) minimumThumbRef.current?.focus();
    }, [autoFocus]);

    const handleValueChange = ([nextLow, nextHigh]: number[]) => {
      if (nextLow === undefined || nextHigh === undefined) return;
      const next: RangeSliderValue = [nextLow, nextHigh];
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    };

    const handleValueCommit = ([nextLow, nextHigh]: number[]) => {
      if (nextLow === undefined || nextHigh === undefined) return;
      onValueCommit?.([nextLow, nextHigh]);
    };

    // Radix moves the *first* thumb on Home and the *last* on End whichever
    // thumb has focus, so End on the lower thumb would push the upper one to
    // `max`. Each thumb handles the two keys itself instead: it goes to the
    // furthest value it can take without crossing the other (or the end of the
    // track), and Radix's own handler never sees the event.
    const handleEdgeKey = (event: KeyboardEvent, isLowerThumb: boolean) => {
      if (event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      event.stopPropagation();
      if (disabled) return;
      const gap = minStepsBetweenThumbs * step;
      const round = (n: number) => Number(n.toFixed(decimalsOf(step)));
      const toStart = event.key === "Home";
      const next: RangeSliderValue = isLowerThumb
        ? [toStart ? min : Math.max(min, round(highValue - gap)), highValue]
        : [lowValue, toStart ? Math.min(max, round(lowValue + gap)) : max];
      if (next[0] === lowValue && next[1] === highValue) return;
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
      onValueCommit?.(next);
    };

    const visibleTicks = visibleTickValues(showTicks, min, max, tickInterval);

    const format = formatNumber ?? String;
    const rangeText = labelOverrides?.range
      ? labelOverrides.range(lowValue, highValue)
      : `${isolate(format(lowValue))} – ${isolate(format(highValue))}`;

    // A thumb is named by its slider's name plus "Minimum"/"Maximum". With a
    // visible label that is `aria-labelledby` pointing at the label and at the
    // thumb itself (whose own `aria-label` is the "Minimum"/"Maximum" part);
    // with a plain `aria-label` the two are joined.
    const thumbLabel = (own: string) => ({
      "aria-label": !ariaLabelledBy && ariaLabel ? `${ariaLabel} ${own}` : own,
    });

    const renderThumb = (
      thumbId: string,
      thumbValue: number,
      own: string,
      tooltip: ReturnType<typeof useThumbTooltip>,
      isLowerThumb: boolean,
    ): ReactElement => {
      let thumb = (
        <SliderPrimitive.Thumb
          ref={isLowerThumb ? minimumThumbRef : undefined}
          className={styles.thumb}
          id={thumbId}
          onKeyDown={(event) => handleEdgeKey(event, isLowerThumb)}
          aria-describedby={ariaDescribedBy}
          aria-valuetext={formatNumber ? format(thumbValue) : undefined}
          {...thumbLabel(own)}
          aria-labelledby={
            ariaLabelledBy ? `${ariaLabelledBy} ${thumbId}` : undefined
          }
          {...tooltip.thumbProps}
          // Applied last so a same-named consumer prop can never override it
          // (05-component-api-conventions.md §3).
          aria-invalid={hasError || undefined}
        />
      );

      if (showValueTooltip) {
        thumb = (
          <Tooltip
            content={format(thumbValue)}
            side={isVertical ? "right" : "top"}
            // Controlled through `useThumbTooltip`, as on `Slider`, so it stays
            // open through a pointer drag rather than closing on `pointerdown`.
            delayDuration={0}
            open={tooltip.open}
          >
            {thumb}
          </Tooltip>
        );
      }
      return thumb;
    };

    // The range text at its widest: the widest number at both ends, and each
    // end alone, so the label is as wide as any range can make it and never
    // resizes as the thumbs move.
    const writeRange = (low: number, high: number) =>
      labelOverrides?.range
        ? labelOverrides.range(low, high)
        : `${isolate(format(low))} – ${isolate(format(high))}`;
    const widestNumber = widestValueCandidates(min, max, step).reduce((widest, candidate) =>
      format(candidate).length > format(widest).length ? candidate : widest,
    );

    const labels = mergeDefined(defaultLabels, labelOverrides);
    const verticalNeedsWrapper = needsVerticalWrapper(
      isVertical,
      showValue,
      showMinMaxLabels,
    );

    const control = (
      <SliderPrimitive.Root
        ref={ref}
        {...props}
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={minStepsBetweenThumbs}
        orientation={orientation}
        inverted={inverted}
        dir={dir}
        disabled={disabled}
        name={name}
        form={form}
        value={[lowValue, highValue]}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        data-testid={dataTestId}
        className={cx(
          styles.root,
          sliderSizeClass[size],
          hasError && styles.error,
          className,
        )}
        // `undefined` when `SliderLayout` will put the caller's `style` on the
        // true outermost element instead — see `needsVerticalWrapper`.
        style={verticalNeedsWrapper ? undefined : style}
      >
        <SliderPrimitive.Track className={styles.track}>
          <SliderPrimitive.Range className={styles.range} />
          <SliderTicks
            values={visibleTicks}
            min={min}
            max={max}
            inverted={inverted}
            isVertical={isVertical}
          />
        </SliderPrimitive.Track>
        {renderThumb(minimumThumbId, lowValue, labels.minimum, minimumTooltip, true)}
        {renderThumb(maximumThumbId, highValue, labels.maximum, maximumTooltip, false)}
      </SliderPrimitive.Root>
    );

    return (
      <SliderLayout
        control={control}
        size={size}
        isVertical={isVertical}
        showValue={showValue}
        showMinMaxLabels={showMinMaxLabels}
        valueText={rangeText}
        valueSizer={[rangeText, writeRange(widestNumber, widestNumber), writeRange(min, max)]}
        minText={format(min)}
        maxText={format(max)}
        style={style}
        dir={dir}
      />
    );
  },
);

RangeSlider.displayName = "RangeSlider";
