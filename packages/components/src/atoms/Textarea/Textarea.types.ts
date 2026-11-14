import type { ComponentPropsWithoutRef, CSSProperties } from "react";

export type TextareaSize = "xs" | "sm" | "md" | "lg" | "xl";

export type TextareaResize = "none" | "vertical" | "horizontal" | "both";

export interface TextareaProps
  extends Omit<ComponentPropsWithoutRef<"textarea">, "size"> {
  /**
   * Marks the textarea as invalid, visually and via `aria-invalid`.
   * @default false
   */
  hasError?: boolean;
  /**
   * The field's size: one step on the shared size scale (`xs` to `xl`), which sets its height, padding and text size together.
   * @default 'md'
   */
  size?: TextareaSize;
  /**
   * Grows the textarea's height to fit its content as the user types,
   * instead of scrolling internally. Disables manual resizing (the
   * `resize` prop is ignored) while enabled, since the two behaviors
   * conflict.
   * @default false
   */
  autoResize?: boolean;
  /**
   * Which direction, if any, the user can manually resize the textarea by
   * dragging its corner handle. Ignored when `autoResize` is `true`.
   * @default 'vertical'
   */
  resize?: TextareaResize;
  /**
   * Native row count controlling the textarea's initial/minimum height.
   * @default 3
   */
  rows?: number;
  /**
   * When `autoResize` is `true`, sets a minimum height in rows — the
   * textarea won't shrink below this many rows' worth of height even if
   * its content is shorter. Ignored when `autoResize` is `false`.
   */
  minRows?: number;
  /**
   * When `autoResize` is `true`, sets a maximum height in rows — beyond
   * this many rows' worth of content, the textarea stops growing and
   * scrolls internally instead. Ignored when `autoResize` is `false`.
   */
  maxRows?: number;
  /**
   * The controlled value. Passing this — even as an empty string, since
   * that's still not `undefined` — switches this textarea into
   * controlled mode, same as a native `<textarea>`; pair with `onChange`
   * to update it, or the value will appear frozen (can't be typed into).
   */
  value?: ComponentPropsWithoutRef<"textarea">["value"];
  /**
   * The initial value when uncontrolled — sets where the textarea starts,
   * not a live value; the DOM (and the user's own typing) owns it from
   * then on. Omit both this and `value` for an empty uncontrolled
   * textarea.
   */
  defaultValue?: ComponentPropsWithoutRef<"textarea">["defaultValue"];
  /**
   * Shows a clear ("×") button in the textarea's top-inline-end corner
   * whenever it has a value, calling this when it's clicked. Clearing the
   * value — whether that's your own controlled `value` state or the
   * uncontrolled DOM value — is the caller's responsibility, matching
   * `Input`'s own `onClear`.
   */
  onClear?: () => void;
  /**
   * Disables the textarea natively. Redeclared explicitly (native
   * `<textarea>` already has this) so it's positioned correctly in the
   * rendered Properties table and Storybook Controls panel, matching this
   * component's own intended prop order.
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks the textarea as required for HTML5 form validation — blocks
   * form submission until filled, and is announced to assistive tech
   * automatically. A genuine native `<textarea>` attribute already —
   * redeclared here purely for documentation visibility, same reason as
   * `disabled` above. Pair with a `FieldLabel` whose own `required` shows
   * the matching visual asterisk.
   * @default false
   */
  required?: boolean;
  /**
   * Prevents editing without disabling the textarea — unlike `disabled`,
   * a read-only textarea still receives focus, lets the user select/copy
   * its value, and submits that value in a real `<form>`.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Focuses the textarea automatically on mount. Use sparingly — stealing
   * focus on page load is disorienting for screen-reader/keyboard users
   * unless this textarea is genuinely the page's primary action.
   * @default false
   */
  autoFocus?: boolean;
  /**
   * Hints the browser's autofill — a token like `'on'`, `'off'`, etc.
   * Genuinely useful for real-world forms (password managers,
   * browser-remembered addresses); omit to let the browser infer it on
   * its own.
   */
  autoComplete?: ComponentPropsWithoutRef<"textarea">["autoComplete"];
  /** Maximum number of characters the textarea accepts. */
  maxLength?: number;
  /**
   * Shows a live `current/max` character count below the textarea. Only
   * renders when `maxLength` is also set.
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
   * Form field name, submitted in the surrounding `<form>`'s data. Only
   * meaningful inside a real `<form>`.
   */
  name?: string;
  /**
   * Associates the textarea with a `<form>` by `id`, for use outside that
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
   * textarea (e.g. a paired `FieldHelperText` or `FieldError`) —
   * announced by assistive tech alongside the accessible name.
   * Space-separate multiple ids when pairing with both at once.
   */
  "aria-describedby"?: string;
  /**
   * Standard DOM id, applied to the native `<textarea>` element — needed
   * whenever another element's `aria-labelledby`/`aria-describedby`/
   * `htmlFor` must point at this textarea, or a test/router needs a
   * stable anchor.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Applies to the wrapper (the
   * visual textarea box), not the native `<textarea>` element inside it —
   * merged with the component's own internal classes rather than
   * replacing them.
   */
  className?: string;
  /**
   * Inline styles, merged onto the component's own internal styles.
   * Applies to the wrapper (the visual textarea box), matching
   * `className`'s own target — not the native `<textarea>` element
   * inside it.
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute on the native `<textarea>` element; has no
   * visual or behavioral effect.
   */
  "data-testid"?: string;
}
