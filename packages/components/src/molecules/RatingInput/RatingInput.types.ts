import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { InputSize } from "../../atoms/Input";

/** The colour a `RatingInput`'s filled icons are drawn in. */
export type RatingInputTone = "brand" | "highlight" | "warning" | "success" | "info" | "danger";

/** The smallest step a rating moves in: a whole icon, or half of one. */
export type RatingInputPrecision = 1 | 0.5;

/** The text a `RatingInput` writes itself. Each function receives the plain numbers. */
export interface RatingInputLabels {
  /** The accessible name of one choice, `value` out of `max`. @default (value, max) => "3 out of 5" */
  itemLabel: (value: number, max: number) => string;
  /** The text alternative of a read-only rating. @default (value, max) => "Rated 4.3 out of 5" */
  valueText: (value: number, max: number) => string;
  /** The text alternative of a read-only rating that has no value. @default "Not rated" */
  notRated: string;
  /** The count written after the icons, from `count`. @default (count) => "(124)" */
  count: (count: number) => string;
  /** The count in words, added to a read-only rating's text alternative. @default (count) => "124 reviews" */
  countText: (count: number) => string;
}

export interface RatingInputProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "children" | "onChange" | "defaultValue" | "role"
  > {
  /**
   * The number of icons.
   * @default 5
   */
  max?: number;
  /**
   * The controlled value: `0` for no rating, up to `max`. Pair with `onValueChange`, or the rating will appear
   * frozen. A value between steps is shown as the nearest step, except when `readOnly`, which draws it exactly.
   */
  value?: number;
  /**
   * The initial value when uncontrolled.
   * @default 0
   */
  defaultValue?: number;
  /**
   * Called with the new value when a person chooses one: `0` when a rating is cleared.
   */
  onValueChange?: (value: number) => void;
  /**
   * The smallest step: `1` for whole icons, `0.5` for halves. Each icon then has two choices, one for each half.
   * @default 1
   */
  precision?: RatingInputPrecision;
  /**
   * Draws a read-only rating's icons to the nearest `1` or `0.5` instead of exactly, so an average of 3.2 shows three
   * icons and 3.3 three and a half. The number from `showValue`, the text alternative and the submitted value keep the
   * exact value. For a read-only rating: ignored, with a development warning, on one a person can change, which
   * always uses `precision`. Leave it out to draw the value exactly.
   */
  roundTo?: RatingInputPrecision;
  /**
   * The icon's box, on the shared size scale. At whole steps every choice is a target of at least 24px; at half steps each half is half an icon's width.
   * @default "md"
   */
  size?: InputSize;
  /**
   * The colour of the filled icons.
   * @default "brand"
   */
  tone?: RatingInputTone;
  /**
   * The icon to draw, a Phosphor component reference (a heart, a thumb). It is drawn filled for the part of the
   * rating that is chosen and as an outline for the rest.
   * @default A star
   */
  icon?: PhosphorIcon;
  /**
   * Shows the value without letting it be changed, and draws a value between steps exactly (4.3 fills a
   * third of the fifth icon). It is exposed as one image with a text alternative, not as a group of choices.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Lets a person take their rating back: pressing the chosen value again, or Backspace, Delete or Escape, sets
   * it to `0`.
   * @default false
   */
  clearable?: boolean;
  /**
   * Marks the rating as invalid, visually and with `aria-invalid`.
   * @default false
   */
  hasError?: boolean;
  /**
   * Disables every choice.
   * @default false
   */
  disabled?: boolean;
  /**
   * Makes a rating required for form validation.
   * @default false
   */
  required?: boolean;
  /**
   * The direction the rating reads in. `rtl` puts the first icon at the right, fills from the right and turns the
   * arrow keys round, with the number, the count and the link in the same order. Left out, it follows the nearest `DirectionProvider`, else left-to-right; it is not read from the page.
   * @default "ltr"
   */
  dir?: "ltr" | "rtl";
  /**
   * Writes the rating as a number before the icons (`4.2`), on the same row: the chosen value, or the one under the
   * pointer while one is being previewed. One decimal by default (`4.0`), through `formatValue`; the space for the
   * widest value is kept, so nothing moves as it changes. Hidden from assistive technology, since the rating's own
   * text alternative already says it.
   * @default false
   */
  showValue?: boolean;
  /**
   * A name for each whole value, from `1` to `max` (`["Poor", "Fair", "Good", "Great", "Excellent"]`). It is
   * added to that choice's accessible name and, with `showValueName`, written beside the icons.
   */
  valueNames?: string[];
  /**
   * Writes the name of the value under the pointer, or of the chosen one, beside the icons (a half step shows
   * the name of the whole value below it). Needs `valueNames`. The space for the longest name is kept, so nothing moves as it changes.
   * @default false
   */
  showValueName?: boolean;
  /**
   * How many ratings the value is made of, written after the icons as `(124)` (change the wording with
   * `labels.count`) and added to the text alternative in words ("124 reviews"). For a read-only summary: it is
   * ignored, with a development warning, on a rating a person can change.
   */
  count?: number;
  /**
   * Anything to put after the icons and the count on the same row, such as a "Read reviews" `Link` or `Button`. For a
   * read-only summary, like `count`. It is a real, separate control: it keeps its own role, focus and name.
   */
  suffix?: ReactNode;
  /**
   * The name the value is submitted under in a surrounding `<form>`, as a number.
   */
  name?: string;
  /**
   * Writes the number `showValue` draws. Receives the plain number, already between 0 and `max`, and `0` when there
   * is no rating, so it decides what that reads as (a dash by default, `0.0` if you want it).
   * @default (value) => (value > 0 ? value.toFixed(1) : "–")
   */
  formatValue?: (value: number) => string;
  /**
   * Turns a number into the text shown or announced, for a locale's own numerals. Used by the default labels.
   * Callbacks and the submitted value keep plain numbers.
   * @default String
   */
  formatNumber?: (value: number) => string;
  /**
   * Text this component writes itself, for translation. Missing keys keep their English defaults.
   */
  labels?: Partial<RatingInputLabels>;
  /**
   * The accessible name of the rating when there is no visible label.
   */
  "aria-label"?: string;
  /**
   * The id of the element that names the rating.
   */
  "aria-labelledby"?: string;
  /**
   * The id of the helper or error text that describes the rating.
   */
  "aria-describedby"?: string;
  /**
   * The id of the element that carries the role, so an `aria-labelledby` or `aria-describedby` elsewhere can refer to it. A `<label htmlFor>` can't name the rating: the group is not a labelable element.
   */
  id?: string;
  /**
   * Extra classes, on the outermost box.
   */
  className?: string;
  /**
   * Inline styles, on the outermost box.
   */
  style?: CSSProperties;
  /**
   * A test identifier, on the element that carries the role.
   */
  "data-testid"?: string;
}
