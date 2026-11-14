import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import type { IconTone } from "../Icon";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SpinnerProps extends ComponentPropsWithoutRef<"span"> {
  /**
   * The spinner's size: one step on the shared size scale (`xs` to `xl`).
   * @default 'md'
   */
  size?: SpinnerSize;
  /**
   * Color, from the same scale `Icon`'s `tone` uses. Defaults to
   * inheriting `currentColor` from context (e.g. a colored button or
   * banner) rather than a fixed tone. `white` is the right choice for a
   * loading spinner sitting directly on `Backdrop`'s dimming scrim
   * (`bg.overlay`), which stays black in every theme/mode — see `Icon`'s
   * own `tone` JSDoc for why that's distinct from the `on-{tone}` family.
   */
  tone?: IconTone;
  /**
   * Accessible label announced to assistive tech (e.g. `"Loading"`).
   * Decorative (`aria-hidden`) and silent to screen readers when omitted —
   * pair with a visible loading message elsewhere, or set this, so the
   * loading state isn't invisible to assistive tech.
   */
  label?: string;
  /**
   * Standard DOM id. Rarely needed directly, but useful when another
   * element needs to reference this spinner (e.g. via `aria-describedby`).
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
