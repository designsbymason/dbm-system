import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import type { SliderSize } from "../Slider";

export type RangeSliderSize = SliderSize;

/** The two ends of the selected range, lower first: `[minimum, maximum]`. */
export type RangeSliderValue = [number, number];

/**
 * The text `RangeSlider` supplies itself, translatable through the `labels`
 * prop (`ADR-0021`). A label that needs numbers is a function of the plain
 * numbers.
 */
export interface RangeSliderLabels {
  /**
   * What the lower thumb is called. It is added to the slider's own name
   * (`aria-label` or `aria-labelledby`), so "Price" and "Minimum" read as
   * "Price Minimum". @default 'Minimum'
   */
  minimum: string;
  /** What the upper thumb is called; see `minimum`. @default 'Maximum' */
  maximum: string;
  /**
   * The text of the `showValue` label, given the plain lower and upper
   * values — write them with the same `formatNumber` you pass the slider.
   * @default (minimum, maximum) => `${format(minimum)} – ${format(maximum)}`
   */
  range: (minimum: number, maximum: number) => string;
}

export interface RangeSliderProps
  extends Omit<
    ComponentPropsWithoutRef<"span">,
    "value" | "defaultValue" | "onChange" | "dir"
  > {
  /**
   * The slider's size: one step on the shared size scale (`xs` to `xl`), the same as `Slider`'s.
   * @default 'md'
   */
  size?: RangeSliderSize;
  /**
   * Marks the slider as invalid, visually (a danger-colored range and thumbs)
   * and via `aria-invalid` on both thumbs.
   * @default false
   */
  hasError?: boolean;
  /**
   * The controlled range as `[minimum, maximum]`, lower first. Passing this
   * switches the slider into controlled mode; pair with `onValueChange` to
   * update it, or the thumbs will appear frozen.
   */
  value?: RangeSliderValue;
  /**
   * The initial range when uncontrolled. Defaults to the whole track
   * (`[min, max]`) when omitted.
   */
  defaultValue?: RangeSliderValue;
  /**
   * Called continuously with the new `[minimum, maximum]` while dragging, or
   * on each discrete step via the arrow keys. Reach for `onValueCommit`
   * instead to run something expensive only once the user has settled.
   */
  onValueChange?: (value: RangeSliderValue) => void;
  /**
   * Called once, with the final `[minimum, maximum]`, when the user finishes
   * interacting (release, or a completed keyboard step).
   */
  onValueCommit?: (value: RangeSliderValue) => void;
  /**
   * The lowest value either thumb can take, and the floor the track is
   * measured from.
   * @default 0
   */
  min?: number;
  /**
   * The highest value either thumb can take, and the ceiling the track is
   * measured against.
   * @default 100
   */
  max?: number;
  /**
   * The increment each arrow-key press (or a drag snapping to the nearest
   * step) changes a thumb by.
   * @default 1
   */
  step?: number;
  /**
   * How many `step`s must always separate the two thumbs. `0` lets them meet
   * on the same value; `1` keeps them at least one step apart, so they never
   * overlap and the lower one is never hidden underneath the upper.
   * @default 0
   */
  minStepsBetweenThumbs?: number;
  /**
   * Lays the slider out horizontally or vertically. A vertical slider has no
   * intrinsic height of its own — set one explicitly via `style` or
   * `className` (e.g. `style={{ height: "12rem" }}`).
   * @default 'horizontal'
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Reverses which end of the track is the minimum — the filled range is
   * still the stretch between the two thumbs.
   * @default false
   */
  inverted?: boolean;
  /**
   * Shows the current range as live text next to the slider (below it when
   * `orientation="vertical"`), as "20 – 80" unless `labels.range` says
   * otherwise. Off by default since the values are already exposed to
   * assistive tech on each thumb — a purely visual convenience. The label
   * reserves the width of the widest range it can show, so the track doesn't
   * resize or shift as either thumb gains or loses digits. The text starts at
   * the label's start edge beside a horizontal slider, and is centred under a
   * vertical one.
   * @default false
   */
  showValue?: boolean;
  /**
   * Shows each thumb's value in a tooltip above it while it is hovered,
   * dragged, or focused via keyboard. Independent of `showValue`.
   * @default false
   */
  showValueTooltip?: boolean;
  /**
   * Shows `min` and `max` as text labels at each end of the track.
   * @default false
   */
  showMinMaxLabels?: boolean;
  /**
   * How a number is written where the slider shows one — the range
   * (`showValue`), a thumb's tooltip (`showValueTooltip`), and the `min` and
   * `max` labels (`showMinMaxLabels`) — for a language or region whose
   * numerals or digit grouping differ, or to add a unit (`50%`, `$50`): given
   * a number, returns the text to show. It also becomes what assistive tech
   * announces on each thumb (`aria-valuetext`), so what is shown and what is
   * announced agree. `onValueChange` and `onValueCommit` still receive the
   * plain numbers, and so does the hidden form input. Tick marks show no
   * number.
   * @default (value) => String(value)
   */
  formatNumber?: (value: number) => string;
  /**
   * Shows a small tick mark at every `tickInterval` between `min` and `max` —
   * purely decorative and hidden from assistive tech.
   * @default false
   */
  showTicks?: boolean;
  /**
   * The spacing between tick marks, in the same units as `value`. Only
   * meaningful when `showTicks` is set.
   * @default step
   */
  tickInterval?: number;
  /**
   * Text direction: `"rtl"` mirrors the slider for right-to-left languages — the minimum sits at
   * the right, the filled range, thumbs and tick marks run from there, the arrow keys move the other
   * way (`ArrowLeft` raises the value), and the value label and min/max labels swap sides with
   * them. Left out, it follows the nearest `DirectionProvider`, else left-to-right. It is not
   * read from the page, so the slider's parts always agree with each other. A vertical slider runs bottom to top either
   * way; only its labels and value sit differently.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /**
   * Disables both thumbs natively.
   * @default false
   */
  disabled?: boolean;
  /**
   * Focuses the lower thumb automatically on mount. Use sparingly — stealing
   * focus on page load is disorienting unless this slider is genuinely the
   * page's primary action.
   * @default false
   */
  autoFocus?: boolean;
  /**
   * Form field name. When set inside a real `<form>`, the slider submits two
   * values under `name[]` — the lower, then the upper — through hidden native
   * inputs.
   */
  name?: string;
  /**
   * Associates the slider with a `<form>` by `id`, for use outside that
   * form's own DOM subtree — same purpose as the native `form` attribute.
   */
  form?: string;
  /** The text the component supplies itself, each part replaceable. See {@link RangeSliderLabels}. */
  labels?: Partial<RangeSliderLabels>;
  /**
   * Names the slider when there's no visible label (e.g. "Price"). Each
   * thumb's own name adds `labels.minimum`/`labels.maximum` to it ("Price
   * Minimum"). Required for label-less usage — with neither this nor
   * `aria-labelledby`, the thumbs are only "Minimum" and "Maximum".
   */
  "aria-label"?: string;
  /**
   * The `id` of an already-visible element (typically a `FieldLabel`) that
   * names the slider, in place of `aria-label`. Each thumb's own name adds
   * `labels.minimum`/`labels.maximum` to it.
   */
  "aria-labelledby"?: string;
  /**
   * The `id` of a helper or error message for this slider (e.g. a paired
   * `FieldHelperText` or `FieldError`) — announced with both thumbs.
   */
  "aria-describedby"?: string;
  /**
   * Standard DOM id, applied to the lower thumb (the first focusable part), so a
   * `FieldLabel`'s `htmlFor` focuses it. The upper thumb's id is this with
   * `-maximum` added. When left out, both get generated ids.
   */
  id?: string;
  /** Additional CSS classes for customization. Applies to the slider control itself. */
  className?: string;
  /**
   * Inline styles, merged onto the component's own internal styles. Set an
   * explicit `height` here for `orientation="vertical"`.
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing. Rendered as the DOM `data-testid`
   * attribute on the slider's own root element (unlike `Slider`, which has one
   * thumb and puts it there); has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
