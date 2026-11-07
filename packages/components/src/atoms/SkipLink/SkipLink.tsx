import { cx, mergeDefined } from "@dbm-system/utils";
import { forwardRef } from "react";
import styles from "./SkipLink.module.css";
import type { SkipLinkLabels, SkipLinkProps } from "./SkipLink.types";

const defaultLabels: SkipLinkLabels = { skipToContent: "Skip to content" };

/**
 * A link that jumps past the page's header to its main content, out of sight until it takes keyboard focus. Then it is drawn in the top corner
 * of the window, above everything, with an edge and a focus ring, so a sighted keyboard user sees where focus is. Put it first on the page, so it
 * is the first tab stop; give the element `href` names (`#main` by default) `tabIndex={-1}`, so focus lands in it.
 *
 * It is a plain hash link: nothing moves focus by script. It is hidden by clipping to one pixel, not by `display: none`, so it stays in the tab
 * order and the accessibility tree. It is not printed. A shell's own `SkipLink` (and `Navbar.SkipLink`) is this link.
 *
 * @example
 * ```tsx
 * <SkipLink />
 * <header>…</header>
 * <main id="main" tabIndex={-1}>…</main>
 * ```
 */
export const SkipLink = forwardRef<HTMLAnchorElement, SkipLinkProps>(({ href = "#main", labels: labelsProp, className, children, ...props }, ref) => {
  const labels = mergeDefined(defaultLabels, labelsProp);
  return (
    <a {...props} ref={ref} href={href} className={cx(styles.skipLink, className)}>
      {children ?? labels.skipToContent}
    </a>
  );
});

SkipLink.displayName = "SkipLink";
