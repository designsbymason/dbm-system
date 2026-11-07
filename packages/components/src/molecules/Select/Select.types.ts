import type { ComponentPropsWithoutRef, CSSProperties, ReactElement, ReactNode } from "react";

export type SelectSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SelectSide = "top" | "right" | "bottom" | "left";
export type SelectAlign = "start" | "center" | "end";

export interface SelectProps
  extends Omit<
    ComponentPropsWithoutRef<"button">,
    "value" | "defaultValue" | "onChange" | "children"
  > {
  /** The controlled selected value. */
  value?: string;
  /** The initial selected value when uncontrolled. */
  defaultValue?: string;
  /** Called with the new value whenever the selection changes. */
  onValueChange?: (value: string) => void;
  /**
   * Shows a clear ("×") button in the trigger, in place of the caret,
   * whenever a value is currently selected — calling this when it's
   * clicked. Unlike `Input`'s own `onClear`, this fully resets the
   * selection back to the placeholder either way: for controlled usage,
   * update your own `value` state inside this callback as usual; for
   * uncontrolled usage (`defaultValue` only), Select resets its own
   * internal selection automatically, no extra wiring needed. No effect
   * when `asChild` is set (warns in development if passed alongside it) —
   * a custom `trigger` has no built-in caret slot for a clear button to
   * take over.
   */
  onClear?: () => void;
  /**
   * Shown in the trigger when nothing is selected. No effect when
   * `asChild` is set (the built-in value display isn't rendered in that
   * mode — see `asChild`'s own doc).
   */
  placeholder?: ReactNode;
  /**
   * No visual effect when `asChild` is set — the custom `trigger` brings
   * its own sizing (see `trigger`'s own doc).
   * @default 'md'
   */
  size?: SelectSize;
  /**
   * Marks the select as invalid, visually and via `aria-invalid`.
   * `aria-invalid` is still set when `asChild` is used, but the visual
   * error styling isn't — the custom `trigger` brings its own appearance
   * (see `trigger`'s own doc).
   * @default false
   */
  hasError?: boolean;
  /**
   * Disables the select entirely — no trigger interaction, not focusable,
   * excluded from the enclosing form's submitted values.
   */
  disabled?: boolean;
  /** Name submitted with the enclosing form. */
  name?: string;
  /** Marks the field as required for native form validation. */
  required?: boolean;
  /** The controlled open state of the dropdown. */
  open?: boolean;
  /** The initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Called whenever the dropdown opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Text direction, passed through to Radix Select. Left out, the nearest `DirectionProvider`'s, then a Radix one's if the app has one, else left-to-right. */
  dir?: "ltr" | "rtl";
  /** Associates the field with a `<form>` by id, for use outside one. */
  form?: string;
  /**
   * Native `autocomplete` hint. Passed through to Radix Select's own
   * hidden native `<select>` (rendered internally for real browser
   * autofill/password-manager/form-submission compatibility, since the
   * visible trigger is a styled `<button>`, not a real `<select>`) — not
   * to the trigger itself.
   */
  autoComplete?: string;
  /**
   * Which side of the trigger the dropdown opens on. Radix repositions it
   * automatically to stay within the viewport if the requested side would
   * overflow.
   * @default 'bottom'
   */
  side?: SelectSide;
  /**
   * Alignment along the chosen `side`, matching `Tooltip`'s identical prop.
   * @default 'start'
   */
  align?: SelectAlign;
  /**
   * Renders the trigger as a single provided element (via Radix `Slot`
   * composition) instead of the built-in styled `<button>` — matching this
   * system's `asChild` convention elsewhere (`Button`, `Tooltip`'s own
   * `children`). Requires `trigger`; the built-in value/placeholder/caret
   * display isn't rendered in this mode, since `Slot` requires exactly one
   * child (warns in development if `trigger` isn't also provided).
   * @default false
   */
  asChild?: boolean;
  /**
   * The custom trigger element used when `asChild` is set — a single
   * element that accepts a ref, replacing the built-in value/caret display
   * entirely (warns in development if passed without `asChild`). Not
   * `children`, since that's already `<Select.Option>`s for the dropdown
   * — matching `Tooltip`'s own single-`ReactElement` trigger shape, just
   * under its own name here since `children` was already spoken for.
   * Select's own built-in trigger chrome (background/border/color, and
   * `size`/`hasError`'s own visual effect) isn't applied in this mode —
   * `trigger` is expected to bring its own complete styling (e.g. this
   * system's own `Button`); only `className` still merges onto it.
   */
  trigger?: ReactElement;
  /** `<Select.Option>` elements. */
  children?: ReactNode;
  /**
   * Accessible name — required unless a visible `<label>`/`FieldLabel` is
   * associated via `aria-labelledby` or a native `<label for>`/`id` pair,
   * since the trigger has no visible text of its own until a value is
   * selected.
   */
  "aria-label"?: string;
  /**
   * References the id of an element that labels this select, as an
   * alternative to `aria-label`. Use instead of `aria-label` when a
   * visible label already exists.
   */
  "aria-labelledby"?: string;
  /**
   * Points to the `id` of a helper or error message associated with this
   * select (e.g. a paired `FieldHelperText` or `FieldError`) — announced
   * by assistive tech alongside the accessible name. Space-separate
   * multiple ids when pairing with both at once.
   */
  "aria-describedby"?: string;
  /**
   * Standard DOM id. Auto-generated via `useId` when omitted — pass your
   * own when another element's `aria-labelledby`/`aria-describedby` needs
   * to point at this component, or a test/router needs a stable, known
   * anchor.
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

export interface SelectOptionProps
  extends Omit<ComponentPropsWithoutRef<"div">, "value" | "children" | "id" | "className" | "style"> {
  /** The value submitted when this option is selected. */
  value: string;
  /** Prevents this specific option from being selected. */
  disabled?: boolean;
  /**
   * Plain-text label used for typeahead search (typing a letter to jump to
   * a matching option) when `children` isn't plain, searchable text.
   * Defaults to `children` itself when omitted, matching Radix's own
   * `Select.Item` behavior — only needed when that default wouldn't be a
   * sensible search string.
   */
  textValue?: string;
  /** The option's own visible content. */
  children?: ReactNode;
  /**
   * Renders as a single provided child element (via Radix `Slot`
   * composition) instead of the built-in `<div>` — for a custom option row
   * component (e.g. with a leading icon or a secondary description line)
   * that still needs Radix's own selection/typeahead/highlight behavior.
   * @default false
   */
  asChild?: boolean;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * option, or a test/router needs a stable anchor.
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
