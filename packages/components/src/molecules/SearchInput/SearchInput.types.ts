import type {
  ChangeEventHandler,
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
} from "react";
import type { InputSize } from "../../atoms/Input";

export interface SearchInputProps
  extends Omit<ComponentPropsWithoutRef<"input">, "prefix" | "size" | "type"> {
  /**
   * Trailing slot content — a keyboard-shortcut hint (`⌘K`), a result
   * count, etc. Same slot as `Input`'s own `suffix`; the leading slot is
   * reserved internally for the search icon (or the loading spinner, once
   * `isLoading` is set), so there's no `prefix` prop here to collide with
   * it. The clear button — always available once there's a value — renders
   * after this slot, same position as `Input`'s own.
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
   * Swaps the leading search icon for a spinner — set while an async
   * search triggered by `onSearch` is still in flight. Purely visual; does
   * not disable typing or the clear button, since a user should be able to
   * keep refining or cancel a query while results are still loading.
   * @default false
   */
  isLoading?: boolean;
  /**
   * The controlled value. Passing this — even as an empty string, since
   * that's still not `undefined` — switches this input into controlled
   * mode; pair with `onChange` to update it, or the value will appear
   * frozen (can't be typed into).
   */
  value?: ComponentPropsWithoutRef<"input">["value"];
  /**
   * The initial value when uncontrolled — sets where the input starts, not
   * a live value; this component's own internal state (and the user's own
   * typing) owns it from then on. Omit both this and `value` for an empty
   * uncontrolled input.
   */
  defaultValue?: ComponentPropsWithoutRef<"input">["defaultValue"];
  /**
   * The raw native change event, fired on every keystroke — same contract
   * as `Input`'s own `onChange`, immediate and un-debounced. Reach for
   * this when you need the value on every keystroke (e.g. driving your own
   * controlled `value`); reach for `onSearch` instead when what you
   * actually want is "the user paused/committed a query."
   */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /**
   * Called with the current value once the user pauses typing for
   * `debounceMs` — the debounced signal to actually run a search, as
   * opposed to `onChange`'s per-keystroke firing. Also fires immediately,
   * bypassing any pending debounce: when the user presses Enter, and when
   * the value is cleared (via the clear button or the Escape key) — both
   * common "I want an answer right now" moments a debounce should never
   * delay. Pressing Enter never submits a surrounding `<form>` — this
   * component is a purely in-page, `onSearch`-driven control, not a
   * classic submit-to-navigate search form, even when composed with its
   * own `name`/`form` props.
   */
  onSearch?: (value: string) => void;
  /**
   * Milliseconds to wait after the last keystroke before calling
   * `onSearch`. Set to `0` to call `onSearch` on every keystroke instead
   * (no debounce) — still distinct from `onChange` in that it's skipped
   * entirely when there's no real change to report.
   * @default 300
   */
  debounceMs?: number;
  /**
   * Shows a clear ("×") button after `suffix` whenever the input has a
   * value, calling this when it's clicked or when Escape is pressed while
   * the input has a value. Unlike `Input`'s own `onClear` — a bare
   * notification with no value of its own to clear — this component
   * tracks its own value (controlled or not), so clearing already resets
   * it (and fires `onSearch` immediately with the empty string) the same
   * way typing or `onSearch`'s own debounce would; this callback is a
   * supplementary notification for anyone who wants to react to the clear
   * itself (analytics, a linked field, etc.), not a required hook for
   * making the clear actually work. Matches `NumberInput`'s own `onClear`
   * contract exactly.
   */
  onClear?: () => void;
  /**
   * Disables the input and its clear button natively. Redeclared
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
   * read-only input still receives focus and lets the user select/copy its
   * value. The clear button is disabled too while read-only, since
   * clearing genuinely changes the value.
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
   * Hints the browser's autofill — typically `'off'` for a live search
   * field, since autofill suggestions rarely make sense for a query box.
   */
  autoComplete?: ComponentPropsWithoutRef<"input">["autoComplete"];
  /** Maximum number of characters the input accepts. */
  maxLength?: number;
  /** Minimum number of characters required for HTML5 form validation. */
  minLength?: number;
  /**
   * A regular expression the value must match for HTML5 form validation —
   * rarely needed for free-text search, but genuinely useful when the
   * field is really a structured lookup (e.g. requiring a SKU-shaped
   * query).
   */
  pattern?: string;
  /**
   * Hints which virtual keyboard a mobile device should show, and which
   * label its Enter/Return key carries — `type="search"` (set internally
   * by this component) already hints mobile browsers to show a "Search"
   * key in place of "Return" without this being set.
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
   * label (e.g. no paired `FieldLabel`) — required for label-less usage,
   * which is the common case for a standalone search field.
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
   * Additional CSS classes for customization. Applies to the underlying
   * `Input`'s own wrapper (the visual input box) — this component renders
   * no wrapper of its own beyond `Input`'s.
   */
  className?: string;
  /**
   * Inline styles, merged onto `Input`'s own internal styles. Applies to
   * the same wrapper `className` targets.
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
