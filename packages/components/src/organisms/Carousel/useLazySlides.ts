import { useState } from "react";
import { slidesOutside } from "./carouselHelpers";

interface LazyView {
  count: number;
  perView: number;
  loop: boolean;
  center: boolean;
  value: number;
  peek: boolean;
}

/**
 * Which slides draw their content: all of them, or (with `lazy`) those within `reach` slides of the view and those that have been
 * before. A slide that was drawn stays drawn, so scrolling back doesn't draw it again. `reach` is `Infinity` when `lazy` is off.
 */
export function useLazySlides(reach: number, view: LazyView): ReadonlySet<number> {
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set());
  const drawn = new Set<number>();
  for (let index = 0; index < view.count; index += 1) {
    if (reach === Infinity || seen.has(index) || slidesOutside(index, view) <= reach) drawn.add(index);
  }
  // Remembering what has been drawn is state derived from the render, so it is set during it, once, when it has grown.
  if (reach !== Infinity && [...drawn].some((index) => !seen.has(index))) setSeen(drawn);
  return drawn;
}
