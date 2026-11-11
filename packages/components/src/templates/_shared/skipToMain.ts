import type { MouseEvent } from "react";

/**
 * The click handler a story-only page gives `PageShell.SkipLink`: in an app a router handles the link, but here the click moves focus to the main area
 * itself and keeps the preview's address unchanged.
 */
export function skipToMain(event: MouseEvent) {
  event.preventDefault();
  document.getElementById("main")?.focus();
}
