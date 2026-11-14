import type {
  ChangeEventHandler,
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
} from "react";
import type { InputSize } from "../../atoms/Input";

export interface NumberInputProps
  extends Omit<
    ComponentPropsWithoutRef<"input">,
    | "prefix"
    | "size"
    | "type"
    | "suffix"
    | "value"
    | "defaultValue"
    | "onChange"
    | "min"
    | "max"
    | "step"
  > {
  /**
   * Leading slot content — an icon, unit label, etc. Same slot as `Input`'s
   * own `prefix`; the trailing slot is reserved internally for the
   * increment/decrement stepper, so there's no `suffix` prop here to
   * collide with it.
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
   * The controlled value, as a real number — not a string to parse
   * yourself. Passing this switches the field into controlled mode; pair
   * with `onValueChange` to update it, or the value will appear frozen.
   * `undefined` represents an empty field, distinct from `0`.
   */
  value?: number;
  /** The initial value when uncontrolled. Omit both this and `value` for an empty uncontrolled field. */
  defaultValue?: number;
  /**
   * Called with the new value — as a real number, or `undefined` if the
   * field is now empty — whenever it changes, whether that's from typing,
   * clicking the increment/decrement stepper, or the clear button. This is
   * the one callback that covers every way the value can change; prefer it
   * over `onChange` unless you specifically need the raw native event.
   */
  onValueChange?: (value: number | undefined) => void;
  /**
   * The raw native change event, fired only when the value changes via
   * direct typing (not from the stepper or clear button, which call
   * `onValueChange` only — synthesizing a fake native event for a
   * button-driven change would need bypassing React's own value tracking,
   * a real but needless complication `onValueChange` exists specifically
   * to avoid). Rarely needed — reach for `onValueChange` first.
   */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /**
   * Minimum allowed value. Passed straight through as the native `min`
   * attribute (real HTML5 form validation, and it also bounds the
   * decrement stepper button — it's disabled once the value reaches this
   * floor). Typing a value below this isn't blocked or force-corrected
   * live; only the stepper buttons clamp to it, matching a native
   * `<input type="number">`'s own unopinionated typing behavior.
   */
  min?: number;
  /** Maximum allowed value — same treatment as `min`, mirrored for the increment button and the ceiling instead of the floor. */
  max?: number;
  /**
   * The amount each stepper click (or native Up/Down arrow key press, a
   * real browser-native `type="number"` behavior this component doesn't
   * have to implement itself) changes the value by.
   * @default 1
   */
  step?: number;
  /**
   * Shows a clear ("×") button after the stepper whenever the input has a
   * value, calling this when it's clicked. Unlike `Input`'s own `onClear`,
   * clearing the value itself isn't the caller's responsibility here — the
   * field resets to empty automatically (controlled or not), the same way
   * `onValueChange` already fires for every other kind of change. This
   * callback is a supplementary notification for anyone who wants to react
   * to the clear itself (analytics, a linked field, etc.), not a required
   * hook for making the clear actually work.
   */
  onClear?: () => void;
  /**
   * Disables the input and its stepper buttons natively. Redeclared
   * explicitly (native `<input>` already has this) so it's positioned
   * correctly in the rendered Properties table and Storybook Controls
   * panel, matching this component's own intended prop order.
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks the input as required for HTML5 form validation. Pair with a
   * `FieldLabel` whose own `required` shows the matching visual asterisk.
   * @default false
   */
  required?: boolean;
  /**
   * Prevents editing without disabling the input — unlike `disabled`, a
   * read-only field still receives focus, lets the user select/copy its
   * value, and submits that value in a real `<form>`. The stepper buttons
   * are disabled too while read-only — unlike `PasswordInput`'s own
   * visibility toggle, clicking a stepper button genuinely changes the
   * value, which is exactly what `readOnly` rules out.
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
   * Hints the browser's autofill (e.g. `'off'`, a token like `'postal-code'`
   * for a numeric field the browser can still recognize semantically).
   */
  autoComplete?: ComponentPropsWithoutRef<"input">["autoComplete"];
  /**
   * Hints which virtual keyboard a mobile device should show — `'numeric'`
   * (digits only) or `'decimal'` (digits plus a decimal separator; also
   * the only one of the two that reliably includes a minus-sign key on
   * most mobile keyboards, worth setting explicitly whenever `min` can be
   * negative). Independent of `type="number"`, which this component
   * already sets internally.
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
