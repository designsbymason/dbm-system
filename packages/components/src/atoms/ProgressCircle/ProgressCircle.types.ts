import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export type ProgressCircleSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ProgressCircleTone =
  | "brand"
  | "info"
  | "success"
  | "warning"
  | "danger";

// `aria-valuenow`/`aria-valuemin`/`aria-valuemax` are deliberately omitted
// from the inherited native props (same reasoning as `children`) — the
// component computes and sets all three itself from `value`/`max`. Without
// this, a consumer-passed value of the same name would silently win over
// the computed one (native props spread after the component's own explicit
// attributes), desyncing the announced state from what's actually on
// screen — a real bug found and fixed during ProgressBar's review, and
// reproduced/fixed here for its own sibling. Note this `Omit` alone doesn't
// actually block `aria-*` names at the type level (TypeScript's JSX
// checker exempts them from prop-type checking regardless of the declared
// type) — the real fix is the JSX attribute ordering in ProgressCircle.tsx.
export interface ProgressCircleProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "children" | "aria-valuenow" | "aria-valuemin" | "aria-valuemax"
  > {
  /**
   * Current progress. Omit for an indeterminate ring (a continuously
   * spinning arc) when progress can't be measured yet.
   */
  value?: number;
  /**
   * The value that represents 100% completion. Must be greater than 0 —
   * an invalid value (0, negative, or `NaN`) falls back to the default,
   * with a development-mode warning.
   * @default 100
   */
  max?: number;
  /**
   * The circle's size: one step on the shared size scale (`xs` to `xl`).
   * @default 'md'
   */
  size?: ProgressCircleSize;
  /**
   * The colour of the filled arc: the brand colour or one of the status colours (`info`, `success`, `warning`, `danger`).
   * @default 'brand'
   */
  tone?: ProgressCircleTone;
  /**
   * Accessible label (e.g. `"Uploading file.zip"`). The ring has no
   * visible text of its own by default, so this — or `aria-labelledby` —
   * is required for it to have an accessible name at all. Development
   * mode warns once if neither is provided.
   */
  label?: string;
  /**
   * Points to the `id` of an existing, already-visible element to use as
   * the accessible name instead of `label`.
   */
  "aria-labelledby"?: string;
  /**
   * A human-readable description of the current value, announced instead
   * of the numeric percentage (e.g. `"3 of 5 files uploaded"`). Already
   * passed through natively via standard HTML attribute inheritance —
   * redeclared here for documentation visibility, per
   * `05-component-api-conventions.md` §3. Most useful when the raw
   * percentage alone doesn't convey the real unit of progress.
   */
  "aria-valuetext"?: string;
  /**
   * Shows the rounded percentage as text in the center. Has no effect
   * while indeterminate, since there's no percentage to show.
   * @default false
   */
  showValueLabel?: boolean;
  /**
   * Customizes the content of the value label shown when `showValueLabel`
   * is set — receives the clamped `value` and `max`, returns the content
   * to render. Defaults to the rounded percentage (`"60%"`). Has no
   * effect unless `showValueLabel` is also set — development mode warns
   * once if it's provided without it. The center of the ring is small, so
   * a compact format (e.g. `"3/5"`) usually reads better here than a
   * longer one.
   */
  formatValueLabel?: (value: number, max: number) => ReactNode;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * progress ring.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Merged with the component's
   * own internal classes rather than replacing them.
   */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect. Not part
   * of React's typed HTML attributes, so it's redeclared here rather than
   * inherited — see `05-component-api-conventions.md` §3 for why every
   * component in this system redeclares this same set of four props.
   */
  "data-testid"?: string;
}
