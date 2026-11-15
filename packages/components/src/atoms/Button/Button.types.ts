import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  MouseEventHandler,
} from "react";

export type ButtonVariant =
  "primary" | "secondary" | "tertiary" | "ghost" | "destructive";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ButtonTone = "brand" | "neutral";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  /**
   * Visual style, signaling emphasis/hierarchy.
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * The colour family: `brand` (the default) or `neutral`, a grey look for a control that shouldn't draw the eye to the brand
   * colour (a quiet icon button in a bar, say). Every variant but `destructive` follows it; `destructive` ignores it and stays
   * danger-coloured.
   * @default 'brand'
   */
  tone?: ButtonTone;
  /**
   * Controls padding, gap, and font-size together as one step on the
   * shared size scale.
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * Renders with fully rounded ends — a pill, or a circle when the button is
   * as wide as it is tall — instead of the standard rounded-corner shape.
   * Matches `IconButton`'s and `CloseButton`'s own `rounded` prop, and the
   * focus ring follows the same shape. Height, padding, and gap don't change.
   * @default false
   */
  rounded?: boolean;
  /** Leading icon — a component reference, not a string name. */
  leadingIcon?: PhosphorIcon;
  /** Trailing icon — a component reference, not a string name. */
  trailingIcon?: PhosphorIcon;
  /**
   * Shows a spinner in place of the leading icon (or before the label if
   * there is none), swaps in `loadingText`, and disables interaction while
   * `true`. When `asChild` is also set, the spinner is drawn inside the
   * slotted element but the label stays that element's own content (no
   * `loadingText` swap), and since the element can't take a native
   * `disabled` attribute, `aria-disabled`, dimmed styling and a blocked
   * click handler signal the loading state.
   * @default false
   */
  isLoading?: boolean;
  /**
   * Text shown in place of `children` while `isLoading` is `true` — lets
   * the label reflect the in-progress action (e.g. "Saving…") without the
   * caller managing conditional children. Falls back to `children` when
   * omitted.
   */
  loadingText?: string;
  /**
   * Stretches the button to fill the width of its container.
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Merge props onto the single child element instead of rendering a
   * `<button>` (via Radix `Slot`), for a link that looks like a button:
   * `<Button asChild leadingIcon={…}><a href="/next">Continue</a></Button>`.
   * The icons and the loading spinner are drawn inside that element, around
   * its own content, which is the label.
   * @default false
   */
  asChild?: boolean;
  /**
   * The native button behavior: `submit` submits the nearest `<form>`,
   * `reset` resets it, `button` (the default) does neither. Only relevant
   * for a real `<button>` element — ignored in `asChild` mode, since the
   * slotted element supplies its own semantics.
   * @default 'button'
   */
  type?: "button" | "submit" | "reset";
  /**
   * Disables the button natively. Prefer this over `isLoading` alone when
   * the button should look and behave as inert, not just busy.
   * @default false
   */
  disabled?: boolean;
  /** Fires on click, unless `disabled`/`isLoading` blocks it. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /**
   * Accessible label announced by assistive tech instead of the visible
   * `children`. Most buttons don't need this — visible text label content
   * already provides the accessible name — but it's required whenever the
   * button's meaning isn't fully conveyed by its visible label (e.g. an
   * icon-heavy button whose text is purely decorative, or to give a more
   * descriptive name than the visible label alone provides).
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing, already-visible element to use as
   * the accessible name instead — e.g. a heading the button sits next to
   * whose text already says what the button does. Use instead of
   * `aria-label` when that visible element's text is the better accessible
   * name; use `aria-label` when no such element exists.
   */
  "aria-labelledby"?: string;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * button, or when a test or router needs a stable anchor.
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
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
