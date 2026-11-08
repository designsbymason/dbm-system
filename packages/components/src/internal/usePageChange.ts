import { useAnnouncement } from "@dbm-system/utils";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * Moving to another page, for an application shell (`AppShell`, `PageShell`): focus goes to the main area (so the keyboard starts at the new
 * page's top, and a screen reader is told where it is), a main area that scrolls on its own goes back to its top (`resetScroll`), and the new
 * page's title is announced politely. Not on the first render, which the page's own load already announced, and not while `pageKey` is left
 * out. The key remembered here, not a flag, keeps it quiet under `StrictMode`. Returns the text for the shell's live region.
 */
export function usePageChange({
  pageKey,
  pageTitle,
  mainRef,
  resetScroll,
  focusTarget = "main",
  scrollToTop = false,
}: {
  /** The router's page (its pathname); a change of it is a change of page. */
  pageKey: string | number | undefined;
  /** The new page's title, announced after a change. */
  pageTitle: string | undefined;
  /** The shell's `<main>`. */
  mainRef: RefObject<HTMLElement | null>;
  /** Whether the main area scrolls inside itself, so it goes back to its top. */
  resetScroll: boolean;
  /** Where focus goes: the main area, or the first `h1` inside it (the main area when there is none). */
  focusTarget?: "main" | "heading";
  /** Whether the window scrolls to its top, for a shell whose page scrolls as a whole. */
  scrollToTop?: boolean;
}): string {
  const { message, announce } = useAnnouncement();
  const previousKey = useRef(pageKey);
  useEffect(() => {
    if (pageKey === undefined || previousKey.current === undefined) {
      previousKey.current = pageKey;
      return;
    }
    if (previousKey.current === pageKey) return;
    previousKey.current = pageKey;
    const main = mainRef.current;
    if (main !== null) {
      const heading = focusTarget === "heading" ? main.querySelector<HTMLElement>("h1") : null;
      if (heading !== null) {
        // Focusable for the moment it takes focus, and not a tab stop afterwards.
        const hadTabIndex = heading.hasAttribute("tabindex");
        if (!hadTabIndex) {
          heading.setAttribute("tabindex", "-1");
          heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
        }
        heading.focus({ preventScroll: true });
      } else {
        main.focus({ preventScroll: true });
      }
      if (resetScroll) main.scrollTop = 0;
    }
    if (scrollToTop) window.scrollTo(0, 0);
    if (pageTitle) announce(pageTitle);
  }, [pageKey, pageTitle, mainRef, resetScroll, focusTarget, scrollToTop, announce]);
  return message;
}
