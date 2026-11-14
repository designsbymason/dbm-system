import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export type InputSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface InputProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "prefix" | "size"
> {
  /**
   * Leading slot content — an icon, currency symbol, etc. An `<Icon>` passed directly here with no `size` of its own scales with this
   * input's `size`, the same step (`xs` 12px, `sm` 16px, `md` 20px, `lg` 24px, `xl` 32px), as the built-in
   * clear icon. An icon that sets its own `size` keeps it, and an icon wrapped in another element, or any other content, is drawn as
   * written.
   */
  prefix?: ReactNode;
  /**
   * Trailing slot content. Sized the same way as `prefix`: an `<Icon>` passed directly with no `size` follows the input's `size`.
   */
  suffix?: ReactNode;
  /**
   * Marks the input as invalid, visually and via `aria-invalid`.
   * @default false
   */
  hasError?: boolean;
  /**
   * The field's size: one step on the shared size scale (`xs` to `xl`), which sets its height, padding and text size together.
   * @default 'md'
   */
  size?: InputSize;
  /**
   * The kind of value this input collects — the native browser adjusts
   * keyboard hints (mobile) and built-in format validation accordingly.
   * This atom is intended for plain text-like types — `'text'` (default),
   * `'email'`, `'tel'`, `'url'`, `'search'` — where that native behavior
   * alone is already the whole feature, no extra UI needed. `'password'`
   * and `'number'` also work here (this is a genuine, unrestricted native
   * `<input>` attribute), but come with their own dedicated molecules
   * (`PasswordInput`, `NumberInput`) that add UI this atom doesn't — a
   * visibility toggle and stepper controls, respectively — once those are
   * built; using this atom directly with those two types is a stand-in
   * until then, not the long-term intended usage.
   * @default 'text'
   */
  type?: ComponentPropsWithoutRef<"input">["type"];
  /**
   * The controlled value. Passing this — even as an empty string, since
   * that's still not `undefined` — switches this input into controlled
   * mode, same as a native `<input>`; pair with `onChange` to update it,
   * or the value will appear frozen (can't be typed into).
   */
  value?: ComponentPropsWithoutRef<"input">["value"];
  /**
   * The initial value when uncontrolled — sets where the input starts,
   * not a live value; the DOM (and the user's own typing) owns it from
   * then on. Omit both this and `value` for an empty uncontrolled input.
   */
  defaultValue?: ComponentPropsWithoutRef<"input">["defaultValue"];
  /**
   * Shows a clear ("×") button after `suffix` whenever the input has a
   * value, calling this when it's clicked. Clearing the value — whether
   * that's your own controlled `value` state or the uncontrolled DOM
   * value — is the caller's responsibility.
   */
  onClear?: () => void;
  /**
   * Disables the input natively. Redeclared explicitly (native `<input>`
   * already has this) so it's positioned correctly in the rendered
   * Properties table and Storybook Controls panel, matching this
   * component's own intended prop order.
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks the input as required for HTML5 form validation — blocks form
   * submission until filled, and is announced to assistive tech
   * automatically. A genuine native `<input>` attribute already (unlike
   * `Checkbox`'s own `required`, which Radix injects onto a non-natively-
   * required `<button>`) — redeclared here purely for documentation
   * visibility, same reason as `disabled` above. Pair with a `FieldLabel`
   * whose own `required` shows the matching visual asterisk.
   * @default false
   */
  required?: boolean;
  /**
   * Prevents editing without disabling the input — unlike `disabled`, a
   * read-only input still receives focus, lets the user select/copy its
   * value, and submits that value in a real `<form>`.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Focuses the input automatically on mount. Use sparingly — stealing
   * focus on page load is disorienting for screen-reader/keyboard users
   * unless this input is genuinely the page's primary action (e.g. a
   * search field as the very first thing on a search results page).
   * @default false
   */
  autoFocus?: boolean;
  /**
   * Hints the browser's autofill — a token like `'email'`,
   * `'current-password'`, `'off'`, etc. Genuinely useful for real-world
   * forms (password managers, browser-remembered addresses); omit to let
   * the browser infer it from `type`/`name` on its own.
   */
  autoComplete?: ComponentPropsWithoutRef<"input">["autoComplete"];
  /** Maximum number of characters the input accepts. */
  maxLength?: number;
  /**
   * Shows a live `current/max` character count inline, after `suffix`.
   * Only renders when `maxLength` is also set — matches `Textarea`'s own
   * `showCount`, positioned inline here instead of below the box, since
   * this component is a compact single-line row rather than a multi-line
   * block.
   * @default false
   */
  showCount?: boolean;
  /**
   * How the numbers in the `showCount` counter are written — both the current length and `maxLength` —
   * for a language or region whose numerals or digit grouping differ from the plain `5` and `1234`:
   * given a number, returns the text to show. For example, `new Intl.NumberFormat("ar-EG").format`
   * shows `٥/١٠`. Only used while the counter is shown (`showCount` with `maxLength`); the native
   * `maxLength` limit and the value itself are unaffected.
   * @default (count) => String(count)
   */
  formatNumber?: (count: number) => string;
  /** Minimum number of characters required for HTML5 form validation. */
  minLength?: number;
  /**
   * A regular expression the value must match for HTML5 form validation
   * (e.g. `pattern="[0-9]{5}"` for a 5-digit ZIP code).
   */
  pattern?: string;
  /**
   * Hints which virtual keyboard a mobile device should show —
   * independent of `type`, e.g. a `type="text"` field that still needs a
   * numeric keypad for a formatted value `type="number"` can't represent
   * (a credit card number with inline spaces).
   */
  inputMode?: ComponentPropsWithoutRef<"input">["inputMode"];
  /**
   * Form field name, submitted in the surrounding `<form>`'s data. Only
   * meaningful inside a real `<form>`.
   */
  name?: string;
  /**
   * Associates the input with a `<form>` by `id`, for use outside that
   * form's own DOM subtree — same purpose as the native `form` attribute.
   */
  form?: string;
  /**
   * Accessible label announced by assistive tech when there's no visible
   * label (e.g. no paired `FieldLabel`) — required for label-less usage.
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
   * input (e.g. a paired `FieldHelperText` or `FieldError`) — announced by
   * assistive tech alongside the accessible name. Space-separate multiple
   * ids when pairing with both at once.
   */
  "aria-describedby"?: string;
  /**
   * Standard DOM id, applied to the native `<input>` element — needed
   * whenever another element's `aria-labelledby`/`aria-describedby`/
   * `htmlFor` must point at this input, or a test/router needs a stable
   * anchor.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Applies to the wrapper (the
   * visual input box), not the native `<input>` element inside it — merged
   * with the component's own internal classes rather than replacing them.
   */
  className?: string;
  /**
   * Inline styles, merged onto the component's own internal styles.
   * Applies to the wrapper (the visual input box), matching `className`'s
   * own target — not the native `<input>` element inside it.
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute on the native `<input>` element; has no visual
   * or behavioral effect.
   */
  "data-testid"?: string;
}
