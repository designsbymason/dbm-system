import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from "react";

/** The text `SkipLink` supplies itself. */
export interface SkipLinkLabels {
  /** The link's text when it is given no children. @default 'Skip to content' */
  skipToContent: string;
}

export interface SkipLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  /** The link's text. Left out, `labels.skipToContent`. */
  children?: ReactNode;
  /**
   * Where the link goes, as a hash link: the id of the page's main content. Give that element `tabIndex={-1}` so focus lands in it.
   * @default '#main'
   */
  href?: string;
  /** The words the link supplies itself, in your language. */
  labels?: Partial<SkipLinkLabels>;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
