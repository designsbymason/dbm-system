import { cx, mergeDefined, mergeRefs, useAnnouncement } from "@dbm-system/utils";
import { MinusIcon, TrendDownIcon, TrendUpIcon } from "@dbm-system/icons";
import { Children, createContext, forwardRef, isValidElement, useContext, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { Icon } from "../../atoms/Icon";
import type { IconSize, IconTone } from "../../atoms/Icon/Icon.types";
import { Text } from "../../atoms/Text";
import type { TextColor, TextSize } from "../../atoms/Text/Text.types";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./Stat.module.css";
import { fitProperty, useFitValue } from "./useFitValue";
import type {
  StatDescriptionProps,
  StatIconProps,
  StatLabelProps,
  StatOrientation,
  StatProps,
  StatSize,
  StatTone,
  StatTrendLabels,
  StatTrendProps,
  StatValueProps,
  StatVariant,
} from "./Stat.types";

const variantClass: Record<StatVariant, string | undefined> = {
  ghost: undefined,
  outlined: styles.outlined,
  filled: styles.filled,
};

const sizeClass: Record<StatSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const toneClass: Record<StatTone, string | undefined> = {
  neutral: undefined,
  brand: styles.toneBrand,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
};

// The parts read the root's own `size` from here — the atoms they render (Icon,
// Text) take font-size/icon-size props a stylesheet can't reach. The default is
// what a part used outside a root would get.
const StatSizeContext = createContext<StatSize>("md");

// Whether the value fits itself to the stat (`fitValue`). Outside a root: no.
const StatFitContext = createContext(false);

const iconSize: Record<StatSize, IconSize> = {
  xs: "sm",
  sm: "md",
  md: "lg",
  lg: "xl",
  xl: "2xl",
};

const labelSize: Record<StatSize, TextSize> = {
  xs: "sm",
  sm: "base",
  md: "base",
  lg: "md",
  xl: "md",
};

// `Stat.Description` keeps the smaller steps `Stat.Label` used before its own size increased —
// the two never shared a rationale for moving together, only a coincidentally identical table.
const descriptionSize: Record<StatSize, TextSize> = {
  xs: "xs",
  sm: "sm",
  md: "sm",
  lg: "base",
  xl: "base",
};

const valueSize: Record<StatSize, TextSize> = {
  xs: "2xl",
  sm: "3xl",
  md: "4xl",
  lg: "5xl",
  xl: "6xl",
};

const trendSize: Record<StatSize, TextSize> = {
  xs: "xs",
  sm: "sm",
  md: "sm",
  lg: "base",
  xl: "md",
};

const trendIconSize: Record<StatSize, IconSize> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "sm",
  xl: "md",
};

const defaultTrendLabels: StatTrendLabels = {
  increase: (formatted) => `Increased by ${formatted}`,
  decrease: (formatted) => `Decreased by ${formatted}`,
  flat: () => "No change",
};

function defaultFormatTrend(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/**
 * A single metric — a label, a value, and optionally a trend and supporting
 * text. A compound component, meaning it's made of named sub-parts you
 * compose together: `Stat.Icon` (an icon, tinted by `tone`), `Stat.Label`,
 * `Stat.Value` (usually holding a `Stat.Trend` beside it), and
 * `Stat.Description`, in reading order, any of them optional.
 *
 * `size` sets the padding, the spacing, and the size of the icon and text on
 * the standard xs–xl scale — small for a dense dashboard grid, large for a
 * stat that is a card's main content. `variant` picks the surface (`ghost`
 * for none, `outlined`, `filled`) and, together with `tone`, colours
 * `Stat.Icon` and `Stat.Label`. `orientation` sets how the icon and the label
 * relate to each other — stacked (`Stat.Icon` above `Stat.Label`, the
 * default) or paired into one row (the icon before the label, both the same
 * size) — found and moved together automatically wherever they appear among
 * the other children; nothing else about the layout changes.
 *
 * A stat is static content and adds no role. When its value updates after
 * this stat is already on the page — a live dashboard — set `announce` so a
 * screen reader is told about a later change (never the first value shown).
 *
 * `ref` forwards to the root `<div>`.
 *
 * @example
 * ```tsx
 * import { UsersIcon } from "@dbm-system/icons";
 *
 * <Stat>
 *   <Stat.Icon icon={UsersIcon} />
 *   <Stat.Label>Active users</Stat.Label>
 *   <Stat.Value>
 *     12,480
 *     <Stat.Trend value={4.2} />
 *   </Stat.Value>
 *   <Stat.Description>vs. last month</Stat.Description>
 * </Stat>
 *
 * <Stat variant="outlined" size="sm" tone="danger">
 *   <Stat.Icon icon={TicketIcon} />
 *   <Stat.Label>Open tickets</Stat.Label>
 *   <Stat.Value>
 *     58
 *     <Stat.Trend value={12} goodDirection="decrease" />
 *   </Stat.Value>
 * </Stat>
 * ```
 */
const StatRoot = forwardRef<HTMLDivElement, StatProps>((statProps, ref) => {
  const {
    children,
    variant = "ghost",
    tone = "neutral",
    size = "md",
    orientation = "vertical",
    announce = false,
    fitValue = false,
    className,
    style,
    id,
    "data-testid": dataTestId,
    ...rest
  } = statProps;

  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);
  // `announce` fills a visually hidden live region a moment after the value or trend text
  // actually changes, then clears it again: the timing is `useAnnouncement`'s. What's specific
  // here is *what* to announce and, per the "never the first appearance" rule
  // (`06-engineering-standards.md` §9), *that the first render is remembered, not announced*.
  const { message: announcement, announce: announceChange } = useAnnouncement();
  const previousText = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!announce) {
      previousText.current = undefined;
      return;
    }
    const root = rootRef.current;
    // Only this stat's own value/trend — not those of one nested inside it.
    const values = [...(root?.querySelectorAll(`.${styles.value}`) ?? [])].filter(
      (element) => element.closest(`.${styles.root}`) === root,
    );
    const text = values
      .map((value) => {
        // `Stat.Trend` usually nests inside `Stat.Value`, so its own text would otherwise be read
        // twice: once as part of the value's plain textContent, once from its own accessible
        // label — confirmed live ("13,188+1.9, Increased by +1.9"), not just reasoned about. Read
        // the value's own text from a clone with any trend removed, then append the trend's own
        // label once, separately.
        const clone = value.cloneNode(true) as Element;
        const trend = clone.querySelector("[data-stat-trend-label]");
        const trendLabel = trend?.getAttribute("data-stat-trend-label") ?? "";
        trend?.remove();
        const valueText = clone.textContent?.trim() ?? "";
        return [valueText, trendLabel].filter(Boolean).join(", ");
      })
      .filter(Boolean)
      .join(", ");
    if (!text) return;
    if (previousText.current === undefined) {
      previousText.current = text;
      return;
    }
    if (previousText.current === text) return;
    previousText.current = text;
    announceChange(text);
  });

  // On unmount, forget what was announced (the hook cancels its own timers). React's
  // StrictMode (development) mounts, unmounts, and remounts a component keeping its
  // refs — forgetting here is what makes the remount treat its first render as a first
  // render again, not as an already-seen value with nothing new to announce.
  useEffect(
    () => () => {
      previousText.current = undefined;
    },
    [],
  );

  // Horizontal orientation pairs `Stat.Icon` and `Stat.Label` into one row — the icon before the
  // label, aligned together — rather than each stacking as its own separate part. This finds
  // them (in whichever order they were written) and moves the pair to the front, ahead of
  // whatever else the caller wrote (usually `Stat.Value` and `Stat.Description`), which stay
  // stacked exactly as they already are in vertical orientation. Nothing to do (or to detect)
  // when neither part is present.
  let content: ReactNode = children;
  if (orientation === "horizontal") {
    const items = Children.toArray(children);
    const icon = items.find((item) => isValidElement(item) && item.type === StatIcon);
    const label = items.find((item) => isValidElement(item) && item.type === StatLabel);
    if (icon || label) {
      // Named to avoid shadowing the outer `rest` (the native props spread onto the root below).
      const otherChildren = items.filter((item) => item !== icon && item !== label);
      content = (
        <>
          {/* The row's own font-size is what the icon's `1em` sizing (Stat.module.css) resolves
              against — set from the exact value driving Stat.Label's own size, so an icon in this
              row can never drift out of sync with the label beside it. */}
          <div className={styles.iconLabelRow} style={{ fontSize: `var(--dbm-font-size-${labelSize[size]})` }}>
            {icon}
            {label}
          </div>
          {otherChildren}
        </>
      );
    }
  }

  return (
    <StatSizeContext.Provider value={size}>
      <StatFitContext.Provider value={fitValue}>
        <div
          {...rest}
          ref={mergedRef}
          id={id}
          style={style}
          data-testid={dataTestId}
          data-orientation={orientation}
          className={cx(styles.root, variantClass[variant], sizeClass[size], toneClass[tone], className)}
        >
          {content}
          {announce && <VisuallyHidden role="status">{announcement}</VisuallyHidden>}
        </div>
      </StatFitContext.Provider>
    </StatSizeContext.Provider>
  );
});
StatRoot.displayName = "Stat";

/**
 * The icon, tinted by the stat's `tone`. In a badge — a light fill (`ghost`/`outlined`) or a
 * solid one (`filled`) — when stacked above `Stat.Label`; a plain glyph, no badge, the same size
 * as the label beside it, when the two are paired into a row (`orientation="horizontal"`).
 * Decorative unless given a `label`.
 */
const StatIcon = forwardRef<HTMLDivElement, StatIconProps>(({ icon, label, className, ...props }, ref) => {
  const size = useContext(StatSizeContext);
  return (
    <div {...props} ref={ref} className={cx(styles.iconBadge, className)}>
      <Icon icon={icon} size={iconSize[size]} label={label} />
    </div>
  );
});
StatIcon.displayName = "Stat.Icon";

/**
 * What the metric is, sized to the stat's `size`, medium weight, and uppercase — all three CSS
 * class defaults, not separate props. Override any of them with `style` (e.g.
 * `style={{ fontWeight: "var(--dbm-font-weight-regular)", textTransform: "none" }}`), since an
 * inline style always wins over a class regardless of order. Coloured by `tone`
 * (`--stat-label-color` in `Stat.module.css`, not this component's own `color` prop, which
 * `Text` would apply as a same-specificity class no more or less "correct" than the stylesheet's
 * own — the stylesheet wins deliberately, by a higher-specificity selector, not by accident of
 * file order).
 */
const StatLabel = forwardRef<HTMLParagraphElement, StatLabelProps>(({ className, ...props }, ref) => {
  const size = useContext(StatSizeContext);
  return (
    <Text {...props} ref={ref} size={labelSize[size]} weight="medium" className={cx(styles.label, className)} />
  );
});
StatLabel.displayName = "Stat.Label";

/**
 * The metric itself, bold and large, sized to the stat's `size`. Lays out a following `Stat.Trend` beside it on the same line. It keeps
 * that size and never wraps, unless the stat has `fitValue`, which shrinks it just enough to fit inside the stat's border.
 */
const StatValue = forwardRef<HTMLParagraphElement, StatValueProps>(({ className, style, ...props }, ref) => {
  const size = useContext(StatSizeContext);
  const fit = useContext(StatFitContext);
  const valueRef = useRef<HTMLParagraphElement>(null);
  useFitValue(fit, valueRef, `.${styles.root}`);
  return (
    <Text
      {...props}
      ref={mergeRefs(ref, valueRef)}
      size={valueSize[size]}
      weight="bold"
      className={cx(styles.value, className)}
      // The fit is a scale on the full size (`--stat-value-fit`, set while measuring); unset it is 1, so the size is the one `size` gives.
      style={fit ? { fontSize: `calc(var(--dbm-font-size-${valueSize[size]}) * var(${fitProperty}, 1))`, ...style } : style}
    />
  );
});
StatValue.displayName = "Stat.Value";

/** The change since whatever this is being compared to — an icon and a coloured number, from a plain signed value. */
const StatTrend = forwardRef<HTMLSpanElement, StatTrendProps>(
  ({ value, goodDirection = "increase", formatNumber = defaultFormatTrend, labels: labelsProp, className, ...props }, ref) => {
    const size = useContext(StatSizeContext);
    const labels = mergeDefined(defaultTrendLabels, labelsProp);

    const direction = value > 0 ? "increase" : value < 0 ? "decrease" : "flat";
    const sentiment = direction === "flat" ? "flat" : direction === goodDirection ? "positive" : "negative";
    const formatted = formatNumber(value);
    const accessibleLabel = labels[direction](formatted, value);

    const TrendIcon = direction === "increase" ? TrendUpIcon : direction === "decrease" ? TrendDownIcon : MinusIcon;
    const iconTone: IconTone = sentiment === "positive" ? "success" : sentiment === "negative" ? "danger" : "secondary";
    const textColor: TextColor = sentiment === "positive" ? "success" : sentiment === "negative" ? "danger" : "secondary";

    return (
      <span
        {...props}
        ref={ref}
        // `aria-label` on a plain `<span>` has no role that permits it (confirmed by axe) — `role="img"`
        // is the same fix `Avatar` already uses to flatten a composite visual into one named unit.
        role="img"
        data-direction={direction}
        data-sentiment={sentiment}
        data-stat-trend-label={accessibleLabel}
        aria-label={accessibleLabel}
        className={cx(styles.trend, className)}
      >
        <Icon icon={TrendIcon} size={trendIconSize[size]} tone={iconTone} className={styles.trendIcon} />
        <Text as="span" size={trendSize[size]} weight="medium" color={textColor} aria-hidden="true">
          {formatted}
        </Text>
      </span>
    );
  },
);
StatTrend.displayName = "Stat.Trend";

/** The supporting text, in the secondary text colour, sized to the stat's `size`. */
const StatDescription = forwardRef<HTMLParagraphElement, StatDescriptionProps>(({ className, ...props }, ref) => {
  const size = useContext(StatSizeContext);
  return (
    <Text
      {...props}
      ref={ref}
      size={descriptionSize[size]}
      color="secondary"
      className={cx(styles.description, className)}
    />
  );
});
StatDescription.displayName = "Stat.Description";

type StatComponent = typeof StatRoot & {
  Icon: typeof StatIcon;
  Label: typeof StatLabel;
  Value: typeof StatValue;
  Trend: typeof StatTrend;
  Description: typeof StatDescription;
};

export const Stat: StatComponent = Object.assign(StatRoot, {
  Icon: StatIcon,
  Label: StatLabel,
  Value: StatValue,
  Trend: StatTrend,
  Description: StatDescription,
});

export type { StatOrientation };
