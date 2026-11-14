import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export type SwitchSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SwitchProps
  extends Omit<
    ComponentPropsWithoutRef<"button">,
    "checked" | "defaultChecked" | "onChange" | "disabled"
  > {
  /**
   * Inline label rendered next to the switch. When omitted, provide an
   * `aria-label` instead (matches `IconButton`'s icon-only convention).
   */
  children?: ReactNode;
  /**
   * The switch's size: one step on the shared size scale (`xs` to `xl`).
   * @default 'md'
   */
  size?: SwitchSize;
  /**
   * Marks the switch as invalid, visually (a danger-colored ring) and via
   * `aria-invalid`.
   * @default false
   */
  hasError?: boolean;
  /** The controlled checked state. */
  checked?: boolean;
  /** The initial checked state when uncontrolled. */
  defaultChecked?: boolean;
  /** Called with the new checked state whenever it changes. */
  onCheckedChange?: (checked: boolean) => void;
  /** Icon shown inside the thumb while the switch is on. */
  checkedIcon?: PhosphorIcon;
  /** Icon shown inside the thumb while the switch is off. */
  uncheckedIcon?: PhosphorIcon;
  /**
   * Shows a loading indicator in place of the thumb icon and blocks
   * interaction while `true` — implemented via the same native `disabled`
   * attribute `disabled` uses, so a loading switch can't be toggled by
   * mouse or keyboard.
   * @default false
   */
  loading?: boolean;
  /**
   * Disables the switch natively. Redeclared explicitly (native `<button>`
   * already has this) so it's positioned correctly in the rendered
   * Properties table and Storybook Controls panel, matching this
   * component's own intended prop order.
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks the switch as required for HTML5 form validation, and sets
   * `aria-required`. Native `<button>` has no `required` attribute of its
   * own — this is a Radix Switch primitive feature, forwarded straight
   * through, not something DBM adds on top.
   * @default false
   */
  required?: boolean;
  /**
   * Focuses the switch automatically on mount. Use sparingly — stealing
   * focus on page load is disorienting for screen-reader/keyboard users
   * unless this switch is genuinely the page's primary action.
   * @default false
   */
  autoFocus?: boolean;
  /**
   * Form field name. Only meaningful inside a `<form>` — Radix Switch
   * automatically renders a hidden native `<input type="checkbox">` there
   * so the switch participates in real form submission (including
   * uncontrolled forms with no JS handler), and `name` is what that hidden
   * input submits under.
   */
  name?: string;
  /**
   * Form field value, submitted by the hidden native input (see `name`)
   * when checked. Defaults to `"on"`, matching a native
   * `<input type="checkbox">` with no explicit `value`.
   */
  value?: string;
  /**
   * Associates the switch with a `<form>` by `id`, for use outside that
   * form's own DOM subtree — same purpose as the native `form` attribute.
   */
  form?: string;
  /**
   * Accessible label announced by assistive tech when there's no visible
   * `children` label. Required for icon-only/label-less usage — see the
   * component's own JSDoc example.
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing, already-visible element to use as
   * the accessible name instead. Use instead of `aria-label` when that
   * visible element's text is the better accessible name; use `aria-label`
   * when no such element exists.
   */
  "aria-labelledby"?: string;
  /**
   * Standard DOM id. Rarely needed directly — when omitted, Switch
   * generates one internally (via `useId`) to associate its own inline
   * `children` label via `htmlFor`. Pass one explicitly when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * switch, or when a test or router needs a stable, predictable anchor.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Merged with the component's
   * own internal classes rather than replacing them. Applies to the switch
   * control itself, not the outer label wrapper (when `children` is set).
   */
  className?: string;
  /**
   * Inline styles, merged onto the component's own internal styles.
   * Applies to the switch control itself, not the outer label wrapper
   * (when `children` is set).
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute on the switch control itself; has no visual or
   * behavioral effect.
   */
  "data-testid"?: string;
}
