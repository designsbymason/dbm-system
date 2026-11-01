import type { SyntheticEvent } from "react";

/** A link that leaves the site: a full or protocol-relative `http(s)` URL. */
export const EXTERNAL_HREF_PATTERN = /^(https?:)?\/\//i;

/**
 * The capture-phase guard of a disabled link (`<a>` has no native `disabled`): stops the click and its default before any bubble-phase
 * handler, a slotted child's own `onClick` (a router's navigation) included, which is why it is the capture phase. Returns whether
 * the click was blocked, so a caller's own capture handler runs only when it was not. The link stays focusable, per the ARIA practices
 * for `aria-disabled`.
 */
export function blockDisabledClick(event: SyntheticEvent, disabled: boolean): boolean {
  if (!disabled) return false;
  event.preventDefault();
  event.stopPropagation();
  return true;
}
