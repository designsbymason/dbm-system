import type { ComponentPropsWithoutRef, CSSProperties, MouseEventHandler } from "react";
import type { ButtonSize, ButtonTone } from "../Button/Button.types";

export interface CloseButtonProps extends ComponentPropsWithoutRef<"button"> {
  /**
   * Controls the button's clickable box and its glyph together, as one
   * step — the icon always fills the box exactly (no separate icon-size
   * override), matching `IconButton`'s own single-`size` model.
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * The colour family of the icon and its hover fill: `neutral` (the default) draws the icon in `icon.default` and fills
   * `bg.neutral-subtle` on hover, and `brand` draws it in `icon.brand` and fills `bg.brand-subtle-hover`. Both are
   * `IconButton`'s own `tertiary` colours at the same tone, and neither adapts to an ancestor's colour.
   * @default 'neutral'
   */
  tone?: ButtonTone;
  /**
   * Renders as a circle instead of the standard rounded-corner shape —
   * matches `IconButton`'s own `rounded` prop exactly, including its
   * default.
   * @default false
   */
  rounded?: boolean;
  /**
   * Adds an optional translucent grounding layer behind the icon (white in
   * light mode, a dark neutral in dark mode) — for a CloseButton placed
   * over unpredictable external content (a photo, a busy hero image)
   * where the icon might not otherwise read clearly
   * against whatever's behind it. Purely a visual grounding aid: there's
   * no fixed WCAG contrast guarantee here, since what this composites
   * over is by definition outside this component's control.
   * @default false
   */
  hasBackground?: boolean;
  /**
   * The native button behavior: `submit` submits the nearest `<form>`,
   * `reset` resets it, `button` (the default) does neither.
   * @default 'button'
   */
  type?: "button" | "submit" | "reset";
  /**
   * Disables the button natively.
   * @default false
   */
  disabled?: boolean;
  /** Fires on click, unless `disabled` blocks it. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /**
   * Accessible label announced by assistive tech. Defaults to `"Close"`
   * when omitted — override for context, e.g. "Dismiss notification".
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing, already-visible element to use as
   * the accessible name instead of `aria-label` — e.g. a heading the
   * button sits next to whose text already says what it does.
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
