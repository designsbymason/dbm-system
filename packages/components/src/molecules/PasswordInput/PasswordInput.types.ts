import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { InputSize } from "../../atoms/Input";

export interface PasswordInputProps
  extends Omit<
    ComponentPropsWithoutRef<"input">,
    "prefix" | "size" | "type" | "suffix"
  > {
  /**
   * Leading slot content — an icon, currency symbol, etc. Same slot as
   * `Input`'s own `prefix`; the trailing slot is reserved internally for
   * the show/hide toggle, so there's no `suffix` prop here to collide
   * with it.
   */
  prefix?: ReactNode;
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
   * Shows a clear ("×") button after the show/hide toggle whenever the
   * input has a value, calling this when it's clicked. Clearing the
   * value — whether that's your own controlled `value` state or the
   * uncontrolled DOM value — is the caller's responsibility.
   */
  onClear?: () => void;
  /**
   * Disables the input (and its show/hide toggle) natively. Redeclared
   * explicitly (native `<input>` already has this) so it's positioned
   * correctly in the rendered Properties table and Storybook Controls
   * panel, matching this component's own intended prop order.
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks the input as required for HTML5 form validation — blocks form
   * submission until filled, and is announced to assistive tech
   * automatically. Pair with a `FieldLabel` whose own `required` shows the
   * matching visual asterisk.
   * @default false
   */
  required?: boolean;
  /**
   * Prevents editing without disabling the input — unlike `disabled`, a
   * read-only input still receives focus, lets the user select/copy its
   * value, and submits that value in a real `<form>`. The show/hide
   * toggle still works while read-only, since revealing the value isn't
   * itself an edit.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Focuses the input automatically on mount. Use sparingly — stealing
   * focus on page load is disorienting for screen-reader/keyboard users
   * unless this input is genuinely the page's primary action.
   * @default false
   */
  autoFocus?: boolean;
  /**
   * Hints the browser's autofill — typically `'current-password'` (an
   * existing login form) or `'new-password'` (a signup/change-password
   * form, which also signals a password manager to suggest a strong
   * generated value instead of an existing saved one). Omit to let the
   * browser infer it from `name` on its own, though an explicit value is
   * usually worth setting for a password field specifically, more so than
   * for `Input`'s own plain text-like types.
   */
  autoComplete?: ComponentPropsWithoutRef<"input">["autoComplete"];
  /** Maximum number of characters the input accepts. */
  maxLength?: number;
  /**
   * Shows a live `current/max` character count inline, before the
   * show/hide toggle. Only renders when `maxLength` is also set — matches
   * `Input`'s own `showCount`.
   * @default false
   */
  showCount?: boolean;
  /**
   * How the numbers in the `showCount` counter (`Input`'s own `formatNumber`, passed straight through) are written — both the current length and `maxLength` —
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
   * — commonly used for a password-strength rule (e.g. requiring at
   * least one digit and one symbol).
   */
  pattern?: string;
  /**
   * Hints which virtual keyboard a mobile device should show. Rarely
   * needed for a password field — the browser's own `type="password"`
   * handling (applied internally, toggling to `type="text"` only while
   * revealed) already selects a sensible default keyboard.
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
   * visual input box), not the native `<input>` element inside it —
   * merged with the component's own internal classes rather than
   * replacing them.
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
   * `data-testid` attribute on the native `<input>` element; has no
   * visual or behavioral effect.
   */
  "data-testid"?: string;
}
