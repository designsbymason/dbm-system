import type { AnchorHTMLAttributes, ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { TextSize } from "../Text";

/**
 * Controls when the underline is visible. `always` (the default) is the
 * safe choice for links inline within body text — WCAG 1.4.1 requires links
 * to be distinguishable from surrounding text by more than color alone
 * unless the color contrast between them is at least 3:1, which none of
 * this system's theme pairings clear (checked directly: 2.99:1 light /
 * 1.65:1 dark, the same for every theme since both text.link and
 * text.primary are brand-agnostic). `hover` (the previous default) only reveals the
 * underline on `:hover`, which never fires for keyboard/touch users — use
 * it only where there's no surrounding flowing text to confuse the link
 * with (e.g. a future Navbar's nav links), where `none` is often more
 * appropriate anyway.
 */
export type LinkUnderline = "always" | "hover" | "none";

/**
 * An explicit font size for a link, on the same scale as `Text` and `Heading` (the font-size tokens, `xs` to `6xl`). Left out, a link
 * has no size of its own: it takes the size of the text around it, and with no text around it, of its nearest ancestor that sets one.
 */
export type LinkSize = TextSize;

export interface LinkProps extends ComponentPropsWithoutRef<"a"> {
  /** The link destination. */
  href: string;
  /** The link text/content. */
  children?: ReactNode;
  /**
   * Applies external-link affordances: opens in a new tab
   * (`target="_blank"`), sets `rel="noopener noreferrer"`, appends a small
   * external-link icon, and adds a visually-hidden "(opens in a new tab)"
   * cue for screen reader users. Auto-detected from `href` (any absolute
   * `http(s)://` or protocol-relative `//` URL) when not set explicitly.
   */
  external?: boolean;
  /**
   * Controls when the underline is visible.
   * @default 'always'
   */
  underline?: LinkUnderline;
  /**
   * The link's font size, replacing the one it would take from the text around it (and, with none around it, from its nearest ancestor
   * that sets one). Left out, the link inherits, which is what a link inside a sentence wants. The external-link icon follows the text,
   * one to one (the same size), whichever way the size is set.
   * @default inherited
   */
  size?: LinkSize;
  /**
   * Merge props onto the single child element instead of rendering an
   * `<a>` (via Radix `Slot`), for a router's link component. The external-link
   * icon and the visually-hidden "(opens in a new tab)" cue are drawn inside
   * that element, after its own content (Radix `Slottable`), so an external
   * link keeps both.
   * @default false
   */
  asChild?: boolean;
  /**
   * Disables the link: applies `aria-disabled`, blocks click/keyboard
   * activation, and dims the visual treatment. Native `<a>` has no
   * `disabled` attribute (unlike `Button`'s own `<button>`-backed default),
   * so this is `aria-disabled` plus a click-handler guard instead — the
   * link stays focusable and its `href` stays present, per WAI-ARIA APG
   * guidance for `aria-disabled` (unlike native `disabled`, which removes
   * focusability).
   * @default false
   */
  disabled?: boolean;
  /**
   * Native anchor `target`. Defaults to `"_blank"` when the link is
   * external (see `external`); pass explicitly to override (e.g. force
   * same-tab navigation for an external `href`).
   */
  target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"];
  /**
   * Native anchor `rel`. Defaults to `"noopener noreferrer"` when the link
   * is external (see `external`); pass explicitly to override or extend
   * (e.g. `rel="nofollow noopener noreferrer"`).
   */
  rel?: string;
  /**
   * Native anchor `download` — prompts a file download instead of
   * navigating, optionally with a suggested filename (`download="report.pdf"`).
   */
  download?: AnchorHTMLAttributes<HTMLAnchorElement>["download"];
  /**
   * Accessible name override. Needed when `children` isn't readable text on
   * its own (an icon-only link, a link wrapping an image with no
   * descriptive surrounding context) — screen readers announce this instead
   * of the link's visible content.
   */
  "aria-label"?: string;
  /** References the id of an element that labels this link, as an alternative to `aria-label`. */
  "aria-labelledby"?: string;
  /**
   * Standard DOM id. Needed when another element's `aria-labelledby`/
   * `aria-describedby` must point at this component, or a test/router
   * needs a stable anchor.
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
