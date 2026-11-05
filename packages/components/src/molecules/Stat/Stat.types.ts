import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

/**
 * The stat's surface treatment. `tone` colours `Stat.Icon` and `Stat.Label`
 * the same way regardless of which of these is chosen; each variant only
 * changes what (if anything) sits *behind* them.
 *
 * - `"ghost"` (the default) — no border or fill: just the metric, for a stat
 *   that sits inside a container that already provides its own boundary (a
 *   `Card`, a dashboard grid cell). `Stat.Icon`'s badge is a light,
 *   `tone`-tinted fill.
 * - `"outlined"` — a border around the stat, for a self-contained "stat
 *   card" with no wrapping `Card` — also `tone`-tinted, a decorative accent
 *   rather than a stronger, state-identifying one. The icon badge is the
 *   same light fill `ghost` uses.
 * - `"filled"` — a light, `tone`-tinted fill across the whole stat (plain
 *   neutral when `tone` is left at its default), and `Stat.Icon`'s own badge
 *   becomes a solid, saturated fill of that same tone instead of the light
 *   one the other two variants use.
 */
export type StatVariant = "ghost" | "outlined" | "filled";

/**
 * A colour accent on the standard tone scale (`05-component-api-conventions.md`
 * §2), applied to `Stat.Icon` and `Stat.Label` together — and, on `outlined`,
 * the border, and on `filled`, the whole stat's own fill — so a metric can
 * read as "this one's about revenue" or "this one needs attention" at a
 * glance. `"neutral"` (the default) is uncoloured. `"brand"` follows the
 * active brand theme; `"success"`, `"warning"`, `"danger"`, and `"info"` are
 * fixed status colours. Decorative reinforcement only — the metric's own
 * meaning belongs in the label's own words, not the colour alone. Unrelated
 * to `Stat.Trend`'s own colour, which comes from whether the change is an
 * improvement, not from this tone.
 */
export type StatTone = "brand" | "neutral" | "info" | "success" | "warning" | "danger";

/**
 * Padding, gap, and the size of the icon badge and text, on the standard
 * 5-step scale (`05-component-api-conventions.md` §2) — never a
 * component-specific scale. `xs`/`sm` suit a dense dashboard grid; `lg`/`xl`
 * suit a stat that is the main content of a card.
 */
export type StatSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Whether `Stat.Icon` stacks above `Stat.Label` (`"vertical"`, the default)
 * or the two are paired into one row instead, the icon before the label,
 * both the same size (`"horizontal"`). Found and moved together
 * automatically, wherever they appear among `Stat`'s other children —
 * everything else about the layout is unaffected.
 */
export type StatOrientation = "vertical" | "horizontal";

/**
 * Which direction of change `Stat.Trend` colours as an improvement.
 * `"increase"` (the default) fits most counted metrics (revenue, users,
 * sales); pass `"decrease"` for a metric where less is better (support
 * tickets, error rate, cost).
 */
export type StatTrendGoodDirection = "increase" | "decrease";

/**
 * Every piece of text `Stat.Trend` supplies itself — its accessible name,
 * given the plain signed number and the same text `formatNumber` already
 * wrote on screen (so the name contains what it shows, WCAG 2.5.3). English
 * by default; pass your own to translate them.
 */
export interface StatTrendLabels {
  /** @default (formatted) => `Increased by ${formatted}` */
  increase: (formatted: string, value: number) => string;
  /** @default (formatted) => `Decreased by ${formatted}` */
  decrease: (formatted: string, value: number) => string;
  /** @default () => "No change" */
  flat: (formatted: string, value: number) => string;
}

export interface StatProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style" | "id"> {
  /**
   * `Stat.Icon`, `Stat.Label`, `Stat.Value` (usually holding a `Stat.Trend`),
   * and `Stat.Description` — in reading order, any of them optional. Anything
   * else is laid out in the same column.
   */
  children: ReactNode;
  /**
   * The surface treatment — no surface at all, a solid border, or a subtle
   * fill.
   * @default 'ghost'
   */
  variant?: StatVariant;
  /**
   * A colour accent for `Stat.Icon` and `Stat.Label` together (and, on
   * `outlined`, the border, and on `filled`, the whole stat's own fill).
   * @default 'neutral'
   */
  tone?: StatTone;
  /**
   * Padding, spacing, and the size of the icon badge and text.
   * @default 'md'
   */
  size?: StatSize;
  /**
   * Whether `Stat.Icon` stacks above `Stat.Label`, or the two are paired
   * into one row instead.
   * @default 'vertical'
   */
  orientation?: StatOrientation;
  /**
   * Announces `Stat.Value` (and `Stat.Trend`, if present) to screen readers
   * whenever their text changes after this stat is already on the page —
   * for a metric a live dashboard updates in place. The very first value
   * shown is never announced (it isn't a change from anything a reader
   * already knew), only a later one that differs from it. Renders a visually
   * hidden status region that starts empty and is filled a moment after the
   * text actually changes. Leave it off for a stat that never updates once
   * mounted.
   * @default false
   */
  announce?: boolean;
  /**
   * Shrinks `Stat.Value`'s font size, only as far as it takes, so the value (with any `Stat.Trend` beside it) always fits inside the stat's
   * border, and grows it back as the stat gets wider. A stat's value is otherwise a fixed size for its `size` and never wraps, so a number
   * wider than the room overflows the border. Measured from the stat's own width, not the window's, so it suits a stat in a grid or a
   * card whose width you do not control. Off, nothing changes: the value keeps the full size of its `size`.
   * @default false
   */
  fitValue?: boolean;
  /**
   * The ARIA role. Unset by default: a stat is static content and adds no
   * role of its own. To have a screen reader announce a value that changes
   * after mount, use `announce` rather than a role here.
   */
  role?: ComponentPropsWithoutRef<"div">["role"];
  /**
   * An accessible name for the stat, for when it acts as a labelled region
   * and `Stat.Label` alone shouldn't be assumed to name it.
   */
  "aria-label"?: string;
  /** The id of an element that names this stat (e.g. its own `Stat.Label`). */
  "aria-labelledby"?: string;
  /** The id of an element that describes this stat (e.g. its own `Stat.Description`). */
  "aria-describedby"?: string;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * stat, or when a test or router needs a stable anchor.
   */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface StatIconProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style" | "id"> {
  /**
   * The Phosphor icon component to show — a component reference, not a
   * string name, so unused icons stay tree-shaken and references are
   * type-checked.
   * @example
   * ```tsx
   * import { CurrencyDollarIcon } from '@dbm-system/icons';
   * <Stat.Icon icon={CurrencyDollarIcon} />
   * ```
   */
  icon: PhosphorIcon;
  /**
   * A text alternative for the icon. Unset by default, which hides the icon
   * from assistive technology — right when `Stat.Label` already says what
   * the icon shows. Set it only when the icon conveys something the label
   * doesn't.
   */
  label?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * icon, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface StatLabelProps
  extends Omit<ComponentPropsWithoutRef<"p">, "children" | "className" | "style" | "id" | "color"> {
  /** What the metric is — a short name ("Total revenue", "Active users"). */
  children: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /**
   * Inline styles, merged onto the component's own internal styles. Size, weight, and uppercase
   * are all CSS class defaults, not separate props — pass `{ fontWeight, textTransform }` (or
   * any other value) here to override any of them, since an inline style always wins over a
   * class regardless of order.
   */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * label (e.g. to name the stat), or when a test or router needs a stable
   * anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface StatValueProps
  extends Omit<ComponentPropsWithoutRef<"p">, "children" | "className" | "style" | "id" | "color"> {
  /**
   * The metric itself, already formatted however you want it shown ("1,204",
   * "$42.5K", "98%") — write it however you like, this component doesn't
   * reformat it. Usually followed by a `Stat.Trend`, which this renders
   * beside it on the same line.
   */
  children: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * value, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface StatTrendProps
  extends Omit<ComponentPropsWithoutRef<"span">, "children" | "className" | "style" | "id"> {
  /**
   * The signed change since whatever this is being compared to — positive for
   * an increase, negative for a decrease, `0` for no change. The icon (an
   * upward or downward trend, or a dash) and the colour both follow its sign,
   * not its formatted text, so a negative value always reads as a decrease
   * even if `formatNumber` drops the sign.
   */
  value: number;
  /**
   * Which direction of change counts as an improvement — coloured
   * `text.success`/`icon.success` — and which counts as a regression,
   * coloured `text.danger`/`icon.danger`. A change of exactly `0` is always
   * neutral, regardless of this.
   * @default 'increase'
   */
  goodDirection?: StatTrendGoodDirection;
  /**
   * Formats `value` for display and for the accessible name. Given the plain
   * signed number; write your own sign, unit, or locale numerals as needed
   * (e.g. `(n) => \`${n > 0 ? "+" : ""}${n}%\``).
   * @default (n) => (n > 0 ? `+${n}` : String(n))
   */
  formatNumber?: (value: number) => string;
  /**
   * The accessible name, built from the plain number and the same text
   * `formatNumber` already wrote on screen.
   */
  labels?: Partial<StatTrendLabels>;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * trend, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface StatDescriptionProps
  extends Omit<ComponentPropsWithoutRef<"p">, "children" | "className" | "style" | "id" | "color"> {
  /**
   * The supporting text — what the metric is being compared to, or any other
   * context ("vs. last month", "as of today").
   */
  children: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * description, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
