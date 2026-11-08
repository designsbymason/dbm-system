import type { Breakpoint } from "@dbm-system/utils";
import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { Drawer } from "../organisms/Drawer";
import { minWidthQueries } from "./breakpoints";

export interface AsideDrawerProps {
  /** Whether the drawer is open. */
  open: boolean;
  /** Called with the drawer's next state: a close key, a press outside, the close button. */
  onOpenChange: (open: boolean) => void;
  /** The step the aside is back on the page at: an open drawer closes when the window grows to it. */
  collapseBelow: Exclude<Breakpoint, "base">;
  /** The drawer's width, a CSS length. */
  size: string;
  dir: "ltr" | "rtl";
  /** An element to draw the drawer inside instead of the document body, so it stays within a frame. */
  container?: HTMLElement | null;
  /** The drawer's title. */
  title: string;
  /** The accessible name of the close button. */
  closeLabel: string;
  /** The button that opened it, which gets focus back when it closes. */
  toggleRef: RefObject<HTMLElement | null>;
  children?: ReactNode;
}

/**
 * What an aside becomes below its collapse step: a `Drawer` on the end edge holding its children. It closes by itself if it is left open while the
 * window grows past the step (it would sit over a column already on show), and gives focus back to the toggle that opened it, but only if focus is still
 * in the drawer or has fallen to the page: a page change that moved it to the main area while the drawer was closing has put it where the reader should
 * be (`06-engineering-standards.md` §9). Shared by `AppShell.Aside` and `PageShell.Aside`.
 */
export function AsideDrawer({ open, onOpenChange, collapseBelow, size, dir, container, title, closeLabel, toggleRef, children }: AsideDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia(minWidthQueries[collapseBelow]);
    const close = () => {
      if (query.matches) onOpenChange(false);
    };
    close();
    query.addEventListener?.("change", close);
    return () => query.removeEventListener?.("change", close);
  }, [open, collapseBelow, onOpenChange]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content
        side="end"
        size={size}
        dir={dir}
        container={container}
        labels={{ close: closeLabel }}
        aria-describedby={undefined}
        ref={drawerRef}
        onCloseAutoFocus={(event) => {
          const toggle = toggleRef.current;
          if (toggle === null || !toggle.isConnected) return;
          event.preventDefault();
          const active = document.activeElement;
          if (active === null || active === document.body || drawerRef.current?.contains(active)) toggle.focus();
        }}
      >
        <Drawer.Header>
          <Drawer.Title>{title}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>{children}</Drawer.Body>
      </Drawer.Content>
    </Drawer>
  );
}
