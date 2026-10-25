import { useResolvedResponsiveValue } from "@dbm-system/utils";
import type { Responsive } from "@dbm-system/utils";
import { useEffect, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import { useViewportRoom } from "../useViewportRoom";

/** The gap between the field and its list, in pixels (Radix takes a number, as `Popover`'s `sideOffset` does). */
export const SIDE_OFFSET = 4;
/** The gap kept between a full-width list and the edges of the screen, in pixels (also the layer's collision padding). */
export const EDGE_GAP = SIDE_OFFSET * 2;
// A full-width list opens on the side that has at least this much room (pixels) before the other side is tried: about
// five rows. A behaviour threshold, not a design value.
const MIN_ROOM = 160;

export type OptionListPresentation = "anchored" | "full-width";

interface Options {
  /** The element the list is positioned against, and whose width it takes. */
  rootRef: RefObject<HTMLElement | null>;
  presentation: Responsive<OptionListPresentation>;
  open: boolean;
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
  /** The owner's once-per-message development warning, so the message carries the owner's name. */
  warn: (message: string) => void;
  /** The component's name, for the development warning. */
  name: string;
}

/**
 * Where a field's floating list goes and how big it is: as wide as the field, or across the visible screen on the
 * side that has room once an on-screen keyboard is counted.
 */
export function useOptionListLayout({ rootRef, presentation, open, side, align, warn, name }: Options) {
  // The list is as wide as the field. Radix's own `--radix-popover-trigger-width` is rewritten while the page is
  // being laid out, and a width that follows it feeds back into the layer's size observer (a "ResizeObserver
  // loop" warning inside a `Dialog`, whose entrance scales the field), so the field's layout width is read here.
  const [anchorWidth, setAnchorWidth] = useState<number | undefined>();
  useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      setAnchorWidth(entry?.borderBoxSize?.[0]?.inlineSize ?? element.offsetWidth);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootRef]);

  // A full-width list (a phone, usually) spans the visible screen, and goes on whichever side has room above or
  // below the field once an on-screen keyboard is counted, which the layer doesn't know about.
  const fullWidth = useResolvedResponsiveValue(presentation, "anchored") === "full-width";
  const room = useViewportRoom(rootRef, fullWidth && open);
  useEffect(() => {
    if (fullWidth && align !== "start") {
      warn(`${name}: \`align\` has no effect while \`presentation\` is "full-width"; the list spans the screen.`);
    }
  }, [fullWidth, align, warn, name]);
  const preferredTop = side === "top";
  const roomOnPreferred = room ? (preferredTop ? room.above : room.below) : 0;
  const roomOnOther = room ? (preferredTop ? room.below : room.above) : 0;
  const wideSide: "top" | "bottom" =
    room && roomOnPreferred < MIN_ROOM && roomOnOther > roomOnPreferred
      ? preferredTop
        ? "bottom"
        : "top"
      : preferredTop
        ? "top"
        : "bottom";
  const wideRoom = room ? (wideSide === "top" ? room.above : room.below) - SIDE_OFFSET - EDGE_GAP : undefined;

  const listWidth = fullWidth && room ? room.width - 2 * EDGE_GAP : anchorWidth;
  const contentStyle: CSSProperties | undefined =
    listWidth === undefined
      ? undefined
      : ({
          "--combobox-width": `${listWidth}px`,
          ...(fullWidth && wideRoom !== undefined ? { "--combobox-room": `${Math.max(wideRoom, 0)}px` } : {}),
        } as CSSProperties);

  return { fullWidth, panelSide: fullWidth ? wideSide : side, contentStyle };
}
