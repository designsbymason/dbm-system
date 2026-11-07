import { cx } from "@dbm-system/utils";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { forwardRef, useEffect, useRef, useState } from "react";
import { Tooltip } from "../../atoms/Tooltip";
import styles from "./Slider.module.css";
import type { SliderProps } from "./Slider.types";
import { useDirection } from "../../atoms/DirectionProvider";
import {
  needsVerticalWrapper,
  SliderLayout,
  sliderSizeClass,
  SliderTicks,
  useThumbTooltip,
  visibleTickValues,
  widestValueCandidates,
} from "./sliderShared";

/**
 * A single-value slider built on Radix Slider, with a token-driven track,
 * range fill, and thumb. Accepts both controlled (`value`/`onValueChange`)
 * and uncontrolled (`defaultValue`) usage, mirroring Radix's own pattern —
 * as a plain number, not the array the underlying primitive uses
 * internally (that shape only matters once a slider has more than one
 * thumb). `onValueCommit` fires once, on release, distinct from
 * `onValueChange`'s continuous firing while dragging. `ref` forwards to the
 * slider's own root element; the accessible name/description/id all land
 * on the thumb instead — the actual `role="slider"` element assistive tech
 * inspects, not the plain layout wrapper around it.
 *
 * A vertical slider (`orientation="vertical"`) has no intrinsic height of
 * its own — set one explicitly via `style`/`className`. That explicit
 * height always applies to this component's own true outermost rendered
 * element, whichever one that ends up being once `showValue`/
 * `showMinMaxLabels` add their own wrapping layers — never to `Root`
 * directly once it's nested inside one of them, since a CSS percentage
 * height (e.g. `style={{ height: "100%" }}`) can only ever resolve against
 * an ancestor that itself has a real, definite height.
 *
 * @example
 * ```tsx
 * <Slider aria-label="Volume" defaultValue={50} />
 * <Slider aria-label="Brightness" value={value} onValueChange={setValue} min={0} max={10} />
 * <Slider aria-label="Price" onValueCommit={runExpensiveFilter} showValue />
 * <Slider aria-label="Opacity" orientation="vertical" style={{ height: "12rem" }} />
 * <Slider aria-label="Zoom" showTicks tickInterval={25} showMinMaxLabels showValueTooltip />
 * ```
 */
export const Slider = forwardRef<HTMLSpanElement, SliderProps>(
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
      name,
      form,
      autoFocus,
      className,
      style,
      id,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      "aria-valuetext": ariaValueText,
      "data-testid": dataTestId,
      ...props
    },
    ref,
  ) => {
    const dir = useDirection(dirProp);
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(
      () => defaultValue ?? min,
    );
    const currentValue = isControlled ? value : uncontrolledValue;
    const isVertical = orientation === "vertical";

    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        !ariaLabel &&
        !ariaLabelledBy &&
        !hasWarnedNoAccessibleNameRef.current
      ) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "Slider: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label, so assistive tech has something to announce. A slider with no label is invisible to screen reader users.",
        );
      }
    }

    const {
      open: tooltipOpen,
      thumbProps: tooltipThumbProps,
    } = useThumbTooltip(showValueTooltip);

    // `autoFocus` is not passed to the thumb: React only auto-focuses a
    // button, input, select or textarea on mount, and a thumb is a `span`,
    // so the attribute did nothing. Focus the thumb from a ref instead.
    const thumbRef = useRef<HTMLSpanElement>(null);
    useEffect(() => {
      if (autoFocus) thumbRef.current?.focus();
    }, [autoFocus]);

    const handleValueChange = ([next]: number[]) => {
      if (next === undefined) return;
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    };

    const handleValueCommit = ([next]: number[]) => {
      if (next === undefined) return;
      onValueCommit?.(next);
    };

    const visibleTicks = visibleTickValues(showTicks, min, max, tickInterval);

    // Shared by both the tooltip and every `showValue` label below — found
    // during this component's final review pass that only the tooltip
    // preferred `ariaValueText` over the raw number, while `showValue`'s own
    // persistent label always showed the raw number regardless. A sighted
    // user with both set (e.g. `aria-valuetext="Medium"` on a 1-3 scale)
    // would see "2" in the permanent label but "Medium" in the tooltip —
    // inconsistent with each other and with what's announced to assistive
    // tech, which always gets `ariaValueText` when set.
    // With no `formatNumber` the number is written exactly as before (`String`); `aria-valuetext` still wins.
    const format = formatNumber ?? String;
    const displayValue = ariaValueText || format(currentValue);

    let thumb = (
      <SliderPrimitive.Thumb
        ref={thumbRef}
        className={styles.thumb}
        id={id}
        data-testid={dataTestId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        // Announce what is shown: the consumer's own text, else the formatted number, but only when a formatter
        // was given — without one the plain number is announced, as before.
        aria-valuetext={ariaValueText ?? (formatNumber ? format(currentValue) : undefined)}
        {...tooltipThumbProps}
        // Applied last (after every other Thumb prop above) so a
        // same-named consumer prop can never silently override it — the
        // same JSX-ordering bug already found and fixed across a dozen
        // other components (05-component-api-conventions.md §3).
        aria-invalid={hasError || undefined}
      />
    );

    if (showValueTooltip) {
      thumb = (
        <Tooltip
          content={displayValue}
          side={isVertical ? "right" : "top"}
          // Controlled explicitly (see `useThumbTooltip`) rather than left to
          // Tooltip's own uncontrolled hover/focus handling, specifically
          // so it stays open through a pointer drag, not just a plain
          // hover. `delayDuration` no longer has any effect once `open` is
          // controlled — harmless to leave set, since it costs nothing and
          // documents the original intent (no artificial delay) if this
          // ever reverts to uncontrolled.
          delayDuration={0}
          open={tooltipOpen}
        >
          {thumb}
        </Tooltip>
      );
    }

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
        orientation={orientation}
        inverted={inverted}
        dir={dir}
        disabled={disabled}
        name={name}
        form={form}
        value={[currentValue]}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        className={cx(
          styles.root,
          sliderSizeClass[size],
          hasError && styles.error,
          className,
        )}
        // `undefined`, not `style`, whenever about to be wrapped for
        // vertical orientation (see `needsVerticalWrapper` and this
        // component's own top-level doc comment for the full reasoning).
        // Every wrapping layer between the true outermost element and Root
        // itself instead gets a plain CSS `height: 100%` (see
        // Slider.module.css), forming an unbroken chain back down to a real
        // height. Every other case is unaffected and keeps receiving `style`
        // directly.
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
        {thumb}
      </SliderPrimitive.Root>
    );

    return (
      <SliderLayout
        control={control}
        size={size}
        isVertical={isVertical}
        showValue={showValue}
        showMinMaxLabels={showMinMaxLabels}
        valueText={displayValue}
        valueSizer={[displayValue, ...new Set(widestValueCandidates(min, max, step).map(format))]}
        minText={format(min)}
        maxText={format(max)}
        style={style}
        dir={dir}
      />
    );
  },
);

Slider.displayName = "Slider";
