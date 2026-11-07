import type { ComponentPropsWithoutRef, CSSProperties } from "react";

export type SliderSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SliderProps
  extends Omit<
    ComponentPropsWithoutRef<"span">,
    "value" | "defaultValue" | "onChange" | "dir"
  > {
  /** @default 'md' */
  size?: SliderSize;
  /**
   * Marks the slider as invalid, visually (a danger-colored track/thumb)
   * and via `aria-invalid`.
   * @default false
   */
  hasError?: boolean;
  /**
   * The controlled value, as a real number — not the array Radix's own
   * underlying primitive uses internally (that shape only matters once a
   * slider has more than one thumb, as on `RangeSlider`, which takes a `[minimum, maximum]` pair).
   * Passing this switches the slider into controlled mode; pair with
   * `onValueChange` to update it, or the value will appear frozen.
   */
  value?: number;
  /**
   * The initial value when uncontrolled. Defaults to `min` when omitted —
   * matching the underlying Radix primitive's own default — rather than
   * `0`, which could sit outside `[min, max]`.
   */
  defaultValue?: number;
  /**
   * Called continuously with the new value while dragging, or on each
   * discrete step via the arrow keys. Fires on every intermediate value,
   * not just the final one — reach for `onValueCommit` instead if you only
   * care about the value once the user finishes interacting (e.g. to avoid
   * firing an expensive network request on every pixel of movement).
   */
  onValueChange?: (value: number) => void;
  /**
   * Called once, with the final value, when the user finishes interacting
   * (mouse/touch release, or a completed keyboard step). Unlike
   * `onValueChange`, this doesn't fire on every intermediate value while
   * dragging — the right hook for anything expensive that should only run
   * once the user has settled on a value.
   */
  onValueCommit?: (value: number) => void;
  /**
   * The minimum allowed value, and the floor the track/range fill is
   * measured from.
   * @default 0
   */
  min?: number;
  /**
   * The maximum allowed value, and the ceiling the track/range fill is
   * measured against.
   * @default 100
   */
  max?: number;
  /**
   * The increment each arrow-key press (or a completed drag snapping to
   * the nearest step) changes the value by.
   * @default 1
   */
  step?: number;
  /**
   * Lays the slider out horizontally or vertically. A vertical slider has
   * no intrinsic height of its own — set one explicitly via `style` or
   * `className` (e.g. `style={{ height: "12rem" }}`), matching the
   * underlying Radix primitive's own documented requirement.
   * @default 'horizontal'
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Reverses which end of the track represents the minimum — the filled
   * range grows from the opposite end instead. Useful when "less" is
   * visually meaningful in the reversed direction (e.g. a brightness
   * slider where the dark end is on the right).
   * @default false
   */
  inverted?: boolean;
  /**
   * Shows the current value as live text next to the slider (below it when
   * `orientation="vertical"`) — `aria-valuetext` in place of the raw number
   * when set, matching `showValueTooltip`'s own preference and what's
   * announced to assistive tech. Off by default since the value is already
   * exposed to assistive tech via `aria-valuenow`/`aria-valuetext`
   * regardless — this is a purely visual convenience for sighted users when
   * no other on-screen element already shows it (e.g. a paired
   * `FieldHelperText` reflecting the value some other way). The label reserves
   * the width of the widest value it can show (the ends, and one step in from
   * each), so the track doesn't resize or shift as the value gains or loses
   * digits; a custom `aria-valuetext` of varying length can't be known ahead
   * of time, so the label takes the width of the longest text it has shown.
   * The text starts at the label's start edge beside a horizontal slider, and is
   * centred under a vertical one.
   * @default false
   */
  showValue?: boolean;
  /**
   * Shows the current value in a tooltip above the thumb while hovering,
   * dragging, or focused via keyboard — reusing the `Tooltip` atom.
   * Independent of `showValue`; use either, both, or neither. Relies on
   * `Tooltip`'s own native hover/focus triggers rather than custom
   * drag-tracking state — the thumb visually tracks the pointer during a
   * drag, so hover naturally stays engaged for its whole duration.
   * @default false
   */
  showValueTooltip?: boolean;
  /**
   * Shows `min` and `max` as text labels at each end of the track. A
   * purely visual convenience — pair with `FieldHelperText` instead when a
   * plain sentence ("Between 0 and 100") reads more naturally than two
   * floating numbers.
   * @default false
   */
  showMinMaxLabels?: boolean;
  /**
   * How a number is written where the slider shows one — the current value (`showValue` and
   * `showValueTooltip`) and the `min` and `max` labels (`showMinMaxLabels`) — for a language or region
   * whose numerals or digit grouping differ from the plain `5` and `1234`, or to add a unit
   * (`50%`, `$50`): given a number, returns the text to show. It also becomes what assistive tech
   * announces (`aria-valuetext`) unless you pass an `aria-valuetext` of your own, which wins everywhere
   * — in the value label and tooltip too — so what is shown and what is announced always agree. For
   * example, `new Intl.NumberFormat("ar-EG").format` shows `٥٠`. `onValueChange` and `onValueCommit`
   * still receive the plain number, and the hidden form input's value is unaffected. Tick marks are
   * decorative and show no number.
   * @default (value) => String(value)
   */
  formatNumber?: (value: number) => string;
  /**
   * Shows a small tick mark at every `tickInterval` between `min` and
   * `max` (inclusive of both ends) — purely decorative and hidden from
   * assistive tech, since the same information is already exposed via
   * `aria-valuemin`/`aria-valuemax`/`step`.
   * @default false
   */
  showTicks?: boolean;
  /**
   * The spacing between tick marks, in the same units as `value` — not
   * necessarily every `step`, since a small `step` on a wide range would
   * otherwise crowd the track with unreadable ticks (e.g. `step={1}` on a
   * 0–100 range). Only meaningful when `showTicks` is set.
   * @default step
   */
  tickInterval?: number;
  /**
   * Text direction: `"rtl"` mirrors the slider for right-to-left languages — the minimum sits at
   * the right, the fill, thumbs and tick marks run from there, the arrow keys move the other
   * way (`ArrowLeft` raises the value), and the value label and min/max labels swap sides with
   * them. Left out, it follows the nearest `DirectionProvider`, else left-to-right. It is not
   * read from the page, so the slider's parts always agree with each other. A vertical slider runs bottom to top either
   * way; only its labels and value sit differently.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /**
   * Disables the slider natively. Redeclared explicitly (the underlying
   * Radix primitive already has this) so it's positioned correctly in the
   * rendered Properties table and Storybook Controls panel, matching this
   * component's own intended prop order.
   * @default false
   */
  disabled?: boolean;
  /**
   * Focuses the slider's thumb automatically on mount. Use sparingly —
   * stealing focus on page load is disorienting for screen-reader/keyboard
   * users unless this slider is genuinely the page's primary action.
   * @default false
   */
  autoFocus?: boolean;
  /**
   * Form field name. When set, the underlying Radix primitive renders a
   * hidden native `<input>` so the slider participates in real form
   * submission (including an uncontrolled form with no JS handler) — the
   * same mechanism `Switch`'s own `name` documents.
   */
  name?: string;
  /**
   * Associates the slider with a `<form>` by `id`, for use outside that
   * form's own DOM subtree — same purpose as the native `form` attribute.
   */
  form?: string;
  /**
   * Accessible label announced by assistive tech when there's no visible
   * label (e.g. no paired `FieldLabel`) — required for label-less usage,
   * since this component has no built-in visible-label slot of its own.
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing, already-visible element to use as
   * the accessible name instead — typically a paired `FieldLabel`'s own
   * `id`. Use instead of `aria-label` when that visible label already
   * exists; use `aria-label` when it doesn't.
   */
  "aria-labelledby"?: string;
  /**
   * Points to the `id` of a helper or error message associated with this
   * slider (e.g. a paired `FieldHelperText` or `FieldError`) — announced
   * by assistive tech alongside the accessible name.
   */
  "aria-describedby"?: string;
  /**
   * A human-readable alternative to the raw numeric value announced by
   * assistive tech instead of (not alongside) the plain number — e.g.
   * `"Medium"` for a 3-step scale, or `"$50"` for a currency value. Omit
   * to announce the plain number, which is already correct for most
   * sliders.
   */
  "aria-valuetext"?: string;
  /**
   * Standard DOM id, applied to the slider's own root element — needed
   * whenever another element's `aria-labelledby`/`aria-describedby` must
   * point at it, or a test/router needs a stable anchor.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Applies to the slider
   * control itself, not the value label rendered alongside it when
   * `showValue` is set.
   */
  className?: string;
  /**
   * Inline styles, merged onto the component's own internal styles.
   * Applies to the slider control itself, matching `className`'s own
   * target. Set an explicit `height` here for `orientation="vertical"`.
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute on the slider's own root element; has no
   * visual or behavioral effect.
   */
  "data-testid"?: string;
}
