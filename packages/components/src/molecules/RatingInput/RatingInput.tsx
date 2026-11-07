import { StarIcon } from "@dbm-system/icons";
import { cx, mergeDefined } from "@dbm-system/utils";
import { forwardRef, useEffect, useId, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { Icon } from "../../atoms/Icon";
import type { IconProps } from "../../atoms/Icon";
import type { InputSize } from "../../atoms/Input";
import styles from "./RatingInput.module.css";
import type { RatingInputLabels, RatingInputProps, RatingInputTone } from "./RatingInput.types";
import { useDirection } from "../../atoms/DirectionProvider";

const defaultMax = 5;
const defaultFormatValue = (value: number) => (value > 0 ? value.toFixed(1) : "–");
const maxIcons = 10;

const sizeClass: Record<InputSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// The icon is one step up from the shared scale's own icon size, so the largest rating is a comfortable 40px.
const iconSize: Record<InputSize, IconProps["size"]> = { xs: "sm", sm: "md", md: "lg", lg: "xl", xl: "2xl" };

// The look of a star the pointer is previewing: a pale tone fill with a tone-coloured outline, set in the stylesheet.
const toneClass: Record<RatingInputTone, string | undefined> = {
  highlight: styles.toneHighlight,
  warning: styles.toneWarning,
  brand: styles.toneBrand,
  success: styles.toneSuccess,
  info: styles.toneInfo,
  danger: styles.toneDanger,
};

const toneToIcon: Record<RatingInputTone, IconProps["tone"]> = {
  highlight: "highlight",
  warning: "warning",
  brand: "brand",
  success: "success",
  info: "info",
  danger: "danger",
};

function resolveMax(max: number): number {
  if (Number.isInteger(max) && max >= 1 && max <= maxIcons) return max;
  if (process.env.NODE_ENV !== "production") {
    console.warn(`RatingInput: \`max\` must be a whole number from 1 to ${maxIcons}; got ${String(max)}. Using ${defaultMax}.`);
  }
  return defaultMax;
}

/**
 * A rating field: a row of icons (stars by default) of which a person chooses one, by pointer or keyboard. It is a
 * native radio group, one radio for each value (two for each icon at `precision={0.5}`), so the arrow keys, a
 * single tab stop, form submission under `name` and `required` validation are the browser's own, and a screen reader
 * hears "3 out of 5". The value is a number, `0` for no rating. Icons light up under the pointer before a choice is
 * made (the stars it would add are drawn pale, with a tone-coloured outline), `clearable` lets a rating be taken back, and `readOnly` shows any value exactly (4.3 fills a third of the
 * fifth icon) as one image with a text alternative, to which `count` adds the number of ratings behind it. `showValue`
 * writes the number before the icons, `count` writes `(124)` after them, and `suffix` puts a "Read reviews" link on the same row. `ref` forwards to the element that carries the role;
 * `className` and `style` go on the outermost box. `dir="rtl"` mirrors it.
 *
 * @example
 * ```tsx
 * <RatingInput aria-label="Rate this recipe" onValueChange={save} />
 * <RatingInput aria-label="Rating" precision={0.5} defaultValue={3.5} />
 * <RatingInput aria-label="Average rating" readOnly value={4.3} />
 * <RatingInput aria-label="Rating" valueNames={["Poor", "Fair", "Good", "Great", "Excellent"]} showValueName />
 * ```
 */
export const RatingInput = forwardRef<HTMLDivElement, RatingInputProps>(
  (
    {
      max: maxProp = defaultMax,
      value,
      defaultValue = 0,
      onValueChange,
      precision = 1,
      roundTo,
      size = "md",
      tone = "brand",
      icon = StarIcon,
      readOnly = false,
      clearable = false,
      hasError = false,
      disabled = false,
      required = false,
      dir: dirProp,
      name,
      showValue = false,
      valueNames,
      showValueName = false,
      count,
      suffix,
      formatValue = defaultFormatValue,
      formatNumber = String,
      labels: labelOverrides,
      className,
      style,
      onKeyDown,
      onPointerLeave,
      id,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const dir = useDirection(dirProp);
    const max = resolveMax(maxProp);
    const step = precision === 0.5 ? 0.5 : 1;
    const uid = useId();

    const defaultLabels: RatingInputLabels = {
      itemLabel: (current, total) => `${formatNumber(current)} out of ${formatNumber(total)}`,
      valueText: (current, total) => `Rated ${formatNumber(current)} out of ${formatNumber(total)}`,
      notRated: "Not rated",
      count: (total) => `(${formatNumber(total)})`,
      countText: (total) => `${formatNumber(total)} ${total === 1 ? "review" : "reviews"}`,
    };
    const labels = mergeDefined(defaultLabels, labelOverrides);

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (precision !== 1 && precision !== 0.5) {
        console.warn(`RatingInput: \`precision\` must be 1 or 0.5; got ${String(precision)}. Using 1.`);
      }
      if (value !== undefined && defaultValue !== 0) {
        console.warn("RatingInput: pass either `value` or `defaultValue`, not both. `defaultValue` is ignored once `value` is set.");
      }
      if (showValueName && !valueNames) {
        console.warn("RatingInput: `showValueName` has no text to show without `valueNames`.");
      }
      if (roundTo !== undefined && roundTo !== 1 && roundTo !== 0.5) {
        console.warn(`RatingInput: \`roundTo\` must be 1 or 0.5; got ${String(roundTo)}. The value is drawn exactly.`);
      } else if (roundTo !== undefined && !readOnly) {
        console.warn("RatingInput: `roundTo` is for a read-only rating; one a person can change always uses `precision`.");
      }
      if (!readOnly && !ariaLabel && !ariaLabelledBy) {
        console.warn(
          "RatingInput: a rating a person can change needs an accessible name: pass `aria-label` or `aria-labelledby`, or put it in a `FormField`. (A `<label htmlFor>` can't name it: the group is not a labelable element.)",
        );
      }
      if (!readOnly && (count !== undefined || suffix !== undefined)) {
        console.warn("RatingInput: `count` and `suffix` are for a read-only summary; they are ignored on a rating a person can change.");
      }
    }, [precision, roundTo, value, defaultValue, showValueName, valueNames, readOnly, count, suffix, ariaLabel, ariaLabelledBy]);

    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const raw = isControlled ? value : uncontrolledValue;
    // A value that isn't a number (untyped data on its way) reads as no rating rather than throwing.
    const clamped = typeof raw === "number" && Number.isFinite(raw) ? Math.min(max, Math.max(0, raw)) : 0;
    // Chosen values sit on a step. A read-only rating reports its exact value, and is drawn exactly unless `roundTo`
    // says to the nearest whole or half icon.
    const rounding = readOnly && (roundTo === 1 || roundTo === 0.5) ? roundTo : undefined;
    const reported = readOnly ? clamped : Math.round(clamped / step) * step;
    const current = rounding ? Math.round(clamped / rounding) * rounding : reported;

    const [hovered, setHovered] = useState<number | null>(null);
    const previewing = !readOnly && !disabled && hovered !== null;
    const shown = previewing ? hovered : current;
    // While previewing, the chosen stars stay solid up to the pointer (a lower hover empties those above it), and
    // the stars the pointer would add are drawn in the preview look.
    const solid = previewing ? Math.min(current, hovered) : current;

    const commit = (next: number) => {
      if (!isControlled) setUncontrolledValue(next);
      if (next !== current) onValueChange?.(next);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      // A key press means the keyboard is in charge: a pointer resting over an icon stops previewing until it moves.
      setHovered(null);
      // Browsers disagree on whether a radio group's Left and Right follow the direction it is drawn in, so in a
      // right-to-left rating they are handled here: Left chooses the next value, which is the icon to the left.
      if (!event.defaultPrevented && dir === "rtl" && !readOnly && !disabled && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
        const choices = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>("input[type=radio]:not(:disabled)"));
        const position = choices.indexOf(event.target as HTMLInputElement);
        if (position >= 0) {
          event.preventDefault();
          const target = choices[(position + (event.key === "ArrowLeft" ? 1 : -1) + choices.length) % choices.length] as HTMLInputElement;
          target.focus();
          commit(Number(target.value));
        }
        return;
      }
      if (event.defaultPrevented || !clearable || readOnly || disabled || current === 0) return;
      if (event.key === "Backspace" || event.key === "Delete" || event.key === "Escape") {
        event.preventDefault();
        commit(0);
      }
    };

    const hasCount = readOnly && typeof count === "number" && Number.isFinite(count) && count >= 0;
    const countText = hasCount ? labels.countText(count) : undefined;
    const nameFor = (whole: number) => valueNames?.[whole - 1];
    // A half step shows the name of the whole value below it.
    const shownWhole = Math.floor(shown);

    const iconProps = (weight: "bold" | "fill", iconTone: IconProps["tone"]) =>
      ({ icon, size: iconSize[size], weight, tone: iconTone }) as const;

    const items = Array.from({ length: max }, (_, index) => {
      const position = index + 1;
      // Rounded so a value like 4.3 doesn't carry the float noise of 4.3 - 4 into the style.
      const portion = (value: number) => Math.round(Math.min(1, Math.max(0, value - index)) * 1000) / 1000;
      const fill = portion(solid);
      const preview = previewing ? portion(shown) : undefined;
      const steps = step === 0.5 ? [position - 0.5, position] : [position];
      return (
        <span key={position} className={styles.item} data-fill={fill} data-preview={preview}>
          <span className={styles.icons} style={{ "--fill": fill, "--preview": preview ?? 0 } as CSSProperties} aria-hidden="true">
            <Icon {...iconProps("bold", hasError ? "danger" : "secondary")} />
            <span className={styles.preview}>
              <span className={styles.previewFill}>
                <Icon {...iconProps("fill", undefined)} />
              </span>
              <span className={styles.previewStroke}>
                <Icon {...iconProps("bold", undefined)} />
              </span>
            </span>
            <span className={styles.filled}>
              <Icon {...iconProps("fill", toneToIcon[tone])} />
            </span>
          </span>
          {readOnly
            ? null
            : steps.map((choice) => {
                const whole = Number.isInteger(choice);
                const choiceName = whole ? nameFor(choice) : undefined;
                return (
                  <input
                    key={choice}
                    type="radio"
                    className={cx(styles.radio, step === 0.5 && (whole ? styles.radioEnd : styles.radioStart))}
                    name={name || `${uid}-rating`}
                    // Without a `name` the radios still group by it, but belong to no form, so nothing is submitted.
                    form={name ? undefined : `${uid}-no-form`}
                    value={choice}
                    checked={current === choice}
                    disabled={disabled}
                    required={required}
                    aria-label={`${labels.itemLabel(choice, max)}${choiceName ? `, ${choiceName}` : ""}`}
                    onChange={() => commit(choice)}
                    onClick={() => {
                      if (clearable && current === choice) commit(0);
                    }}
                    onPointerEnter={(event) => {
                      if (event.pointerType === "mouse") setHovered(choice);
                    }}
                  />
                );
              })}
        </span>
      );
    });

    // A read-only rating is named from its own text, so a `aria-labelledby` has to point at the rating itself too.
    const groupId = id ?? (readOnly && ariaLabelledBy ? `${uid}-self` : undefined);
    const group = readOnly ? (
      // The handlers are the consumer's own, passed through as any native prop is; the component adds none here.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <div
        {...props}
        ref={ref}
        id={groupId}
        onKeyDown={onKeyDown}
        onPointerLeave={onPointerLeave}
        className={styles.group}
        role="img"
        aria-label={[ariaLabel, reported > 0 ? labels.valueText(reported, max) : labels.notRated, countText]
          .filter((part): part is string => Boolean(part))
          .join(", ")}
        aria-labelledby={ariaLabelledBy ? `${ariaLabelledBy} ${groupId}` : undefined}
        aria-describedby={ariaDescribedBy}
      >
        {items}
      </div>
    ) : (
      // The radios inside are the focusable parts; key presses and the pointer leaving reach the group from them.
      // eslint-disable-next-line jsx-a11y/interactive-supports-focus
      <div
        {...props}
        ref={ref}
        id={id}
        className={styles.group}
        role="radiogroup"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={hasError || undefined}
        aria-required={required || undefined}
        aria-disabled={disabled || undefined}
        onKeyDown={handleKeyDown}
        onPointerLeave={(event) => {
          setHovered(null);
          onPointerLeave?.(event);
        }}
      >
        {items}
      </div>
    );

    return (
      <div
        className={cx(styles.root, sizeClass[size], toneClass[tone], hasError && styles.error, disabled && styles.disabled, className)}
        style={style}
        // Left to right unless `dir` says otherwise: set explicitly, never read from the page.
        dir={dir}
      >
        <span className={styles.main}>
          {showValue ? (
            // The space for the widest value is kept, so a value that changes never moves the icons.
            <span className={styles.value} aria-hidden="true" style={{ minInlineSize: `${String(formatValue(max)).length}ch` }}>
              {String(formatValue(previewing ? shown : reported))}
            </span>
          ) : null}
          {group}
        </span>
        {readOnly && name ? <input type="hidden" name={name} value={reported} /> : null}
        {showValueName && valueNames && valueNames.length > 0 ? (
          <span className={styles.valueName} aria-hidden="true">
            {valueNames.map((text, index) => (
              <span key={`${index}-${text}`} className={styles.nameSlot} data-active={shownWhole === index + 1}>
                {text}
              </span>
            ))}
          </span>
        ) : null}
        {hasCount ? (
          <span className={styles.count} aria-hidden="true">
            {labels.count(count)}
          </span>
        ) : null}
        {readOnly && suffix !== undefined && suffix !== null ? <span className={styles.suffix}>{suffix}</span> : null}
      </div>
    );
  },
);

RatingInput.displayName = "RatingInput";
