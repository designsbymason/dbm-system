import { createContext, useContext } from "react";
import type { CarouselLabels, CarouselOrientation, CarouselSize } from "./Carousel.types";

/** What the root hands every part: the settings the parts draw with and the state they read or ask to change. */
export interface CarouselContextValue {
  size: CarouselSize;
  orientation: CarouselOrientation;
  dir: "ltr" | "rtl";
  labels: CarouselLabels;
  formatNumber: (value: number) => string;
  /** Where the previous and next buttons go when a part doesn't say: the carousel's `controls`. */
  controlsPlacement: "overlay" | "bar" | "auto" | "hidden";
  indicatorsVariant: "dots" | "outlined" | "bars";
  indicatorsPlacement: "below" | "overlay";
  count: number;
  /** The index of the first slide in view. */
  value: number;
  perView: number;
  /** The positions the carousel can rest at, as the index of the first slide in view at each. */
  stops: readonly number[];
  /** The place in `stops` of the current position. */
  stopPlace: number;
  canPrevious: boolean;
  canNext: boolean;
  /** Asks for the slide at this index to be first in view. Says whether there was a change to ask for. */
  request: (index: number) => boolean;
  /** Asks for a slide that has taken focus while only its edge is in view (the peeking one) to be brought fully into view. */
  reveal: (index: number) => void;
  /** Asks for the next (`1`) or previous (`-1`) position, from a person's press. */
  step: (direction: 1 | -1) => boolean;
  autoPlay: boolean;
  /** Whether rotation is running now (on, and not held by hover, focus, a hidden page or the person's pause). */
  playing: boolean;
  /** Whether the person's own pause is off, so rotation is wanted. */
  playWanted: boolean;
  togglePlay: () => void;
}

export const CarouselContext = createContext<CarouselContextValue | null>(null);

export function useCarouselContext(part: string): CarouselContextValue {
  const context = useContext(CarouselContext);
  if (!context) throw new Error(`${part} must be used inside a Carousel.`);
  return context;
}

/** What the root works out about one slide and hands to it. */
export interface CarouselSlidePosition {
  /** Zero-based. */
  index: number;
  total: number;
  /** Whether the slide is among those in view, or the one peeking beyond them (the rest are `inert`). */
  inView: boolean;
  /** Whether this is a copy of a slide at an end of a wrapping carousel: hidden from assistive technology and never pressable. */
  clone: boolean;
  /** Whether its content is drawn, or only its placeholder (`lazy`). */
  render: boolean;
}

export const CarouselSlideContext = createContext<CarouselSlidePosition | null>(null);
