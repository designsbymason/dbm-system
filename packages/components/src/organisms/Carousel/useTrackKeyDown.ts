import type { KeyboardEvent } from "react";

interface TrackKeys {
  vertical: boolean;
  dir: "ltr" | "rtl";
  stops: readonly number[];
  step: (direction: 1 | -1) => boolean;
  request: (index: number) => boolean;
}

/**
 * The keys of the focused track: the arrows along its axis (swapped in a right-to-left one) step, Home and End go to the first and
 * last position. Only when the track itself has focus, so a text field or slider inside a slide keeps its own keys.
 */
export function useTrackKeyDown({ vertical, dir, stops, step, request }: TrackKeys): (event: KeyboardEvent<HTMLDivElement>) => void {
  return (event) => {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    const forward = vertical ? "ArrowDown" : dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const back = vertical ? "ArrowUp" : dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    if (event.key === forward) step(1);
    else if (event.key === back) step(-1);
    else if (event.key === "Home") request(stops[0] ?? 0);
    else if (event.key === "End") request(stops[stops.length - 1] ?? 0);
    else return;
    event.preventDefault();
  };
}
