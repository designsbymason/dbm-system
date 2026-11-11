import { useRef } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";

/** The height of the box a story-only page is drawn in on its Docs page, where a page as tall as the window would fill it. */
export const pageFrameHeight = "40rem";

export interface PageFrameProps {
  /** Draws the page in a scrolling box of its own (a Docs page). Otherwise the children are drawn as they are. */
  framed: boolean;
  /**
   * The page. Called with the box's ref when `framed` (pass it to a sticky `Navbar`'s, a `BackToTop`'s or a `TableOfContents`' `scrollContainerRef`, which
   * watch the box's scrolling and not the window's), and with `undefined` otherwise.
   */
  children: (frameRef: RefObject<HTMLDivElement | null> | undefined) => ReactNode;
}

/** The scrolling box a story-only page sits in on a Docs page, shared by the pages so each frames itself alike. */
export function PageFrame({ framed, children }: PageFrameProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  if (!framed) return <>{children(undefined)}</>;
  return (
    <div
      ref={frameRef}
      style={
        {
          blockSize: pageFrameHeight,
          overflow: "auto",
          border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
          borderRadius: "var(--dbm-radius-lg)",
        } as CSSProperties
      }
    >
      {children(frameRef)}
    </div>
  );
}
