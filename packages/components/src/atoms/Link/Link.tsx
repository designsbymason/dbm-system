import { ArrowSquareOutIcon } from "@dbm-system/icons";
import { cx } from "@dbm-system/utils";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { forwardRef } from "react";
import type { MouseEvent, ReactNode } from "react";
import { Icon } from "../Icon";
import { VisuallyHidden } from "../VisuallyHidden";
import styles from "./Link.module.css";
import type { LinkProps, LinkSize, LinkUnderline } from "./Link.types";

const EXTERNAL_HREF_PATTERN = /^(https?:)?\/\//i;

const underlineClass: Record<LinkUnderline, string | undefined> = {
  always: styles.underlineAlways,
  hover: styles.underlineHover,
  none: styles.underlineNone,
};

const sizeClass: Record<LinkSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  base: styles.sizeBase,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
  "2xl": styles.size2xl,
  "3xl": styles.size3xl,
  "4xl": styles.size4xl,
  "5xl": styles.size5xl,
  "6xl": styles.size6xl,
};

/**
 * A styled anchor with automatic external-link affordances (new tab,
 * `rel="noopener noreferrer"`, a trailing icon, and a visually-hidden
 * "(opens in a new tab)" cue for screen reader users) and `asChild` support
 * for composing with routers (e.g. `<Link asChild href="/x"><RouterLink to="/x">X</RouterLink></Link>`).
 * With `asChild` the external-link icon and cue are drawn inside the slotted
 * element, after its own content.
 *
 * `size` is left out by default: a link takes the font size of the text around it, or, with none around it, of its nearest ancestor that
 * sets one. Pass `size` (the font-size scale `Text` and `Heading` use) to set it. The external-link icon is the size of
 * the text, so it scales with it however the size is set.
 *
 * `underline` defaults to `"always"` — links inline within body text need
 * to stay distinguishable from surrounding text by more than color alone
 * for keyboard/touch users, who never trigger `:hover`. Use `"none"` (or
 * `"hover"`) for links with no surrounding flowing text to confuse them
 * with, e.g. navigation.
 *
 * `disabled` uses `aria-disabled` plus a click-handler guard rather than a
 * native `disabled` attribute — `<a>` has no such attribute regardless of
 * `asChild` (unlike `Button`, which can rely on a real `<button>` in its
 * own default, non-`asChild` case). The link stays focusable and its
 * `href` stays present, matching WAI-ARIA APG guidance for `aria-disabled`
 * (unlike native `disabled`, which removes an element from the tab order).
 *
 * @example
 * ```tsx
 * <Link href="/docs">Docs</Link>
 * <Link href="https://example.com">External</Link>
 * <Link href="/nav-item" underline="none">Nav item</Link>
 * <Link href="/docs" size="lg">A larger link</Link>
 * <Link href="/docs" disabled>Unavailable right now</Link>
 * <Link asChild href="/docs"><RouterLink to="/docs">Docs</RouterLink></Link>
 * ```
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      href,
      external,
      underline = "always",
      size,
      asChild = false,
      disabled = false,
      className,
      children,
      target,
      rel,
      ...props
    },
    ref,
  ) => {
    const isExternal = external ?? EXTERNAL_HREF_PATTERN.test(href);
    const Component = asChild ? Slot : "a";

    // Capture-phase, not `onClick` — this must run and call
    // `preventDefault`/`stopPropagation` *before* any bubble-phase handler
    // gets a chance to run, including a caller's own `onClick` (plain mode)
    // and, critically, a `Slot`-composed child's own `onClick` in `asChild`
    // mode. Radix `Slot` composes bubble-phase `onClick` handlers with the
    // slotted child's own handler running *first*, then Link's — so a
    // bubble-phase guard here would only block Link's own default
    // navigation, not any side effect the child's own click handler (e.g. a
    // router's navigation call) already ran before Link's guard got a turn.
    // Verified empirically, not assumed: a bubble-phase `onClick` guard let
    // a slotted child's own `onClick` fire even with `disabled` set; a
    // capture-phase one blocks it, confirmed for both the `Slot`-composed
    // case and a plain `onClick` on the same native element.
    const handleClickCapture = (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const decorate = (content: ReactNode) => (
      <>
        {content}
        {isExternal && (
          <>
            <Icon icon={ArrowSquareOutIcon} className={styles.icon} />
            <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
          </>
        )}
      </>
    );

    return (
      <Component
        {...props}
        // Applied last (after `...props`) so none of these can be silently
        // overridden by a same-named prop the caller passes — including
        // `aria-disabled`, which TypeScript's JSX checker permits on any
        // component regardless of whether it's declared in its prop type
        // (the same ordering rule already fixed on Button/Skeleton/
        // ProgressBar/etc. — see `05-component-api-conventions.md` §3).
        ref={ref}
        href={href}
        target={target ?? (isExternal ? "_blank" : undefined)}
        rel={rel ?? (isExternal ? "noopener noreferrer" : undefined)}
        aria-disabled={disabled || undefined}
        onClickCapture={handleClickCapture}
        className={cx(styles.root, size && sizeClass[size], underlineClass[underline], disabled && styles.disabled, className)}
      >
        {asChild ? (
          // `Slottable`'s render form clones the slotted element with what it returns as its content: the external-link
          // icon and the "(opens in a new tab)" cue are drawn after the element's own content, inside it, and the element
          // (a router's link, say) is still the one rendered.
          <Slottable child={children}>{decorate}</Slottable>
        ) : (
          decorate(children)
        )}
      </Component>
    );
  },
);

Link.displayName = "Link";
