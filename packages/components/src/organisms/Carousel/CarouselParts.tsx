import { cx } from "@dbm-system/utils";
import { forwardRef } from "react";
import { CaretDownIcon, CaretLeftIcon, CaretRightIcon, CaretUpIcon, PauseIcon, PlayIcon } from "@dbm-system/icons";
import { IconButton } from "../../atoms/IconButton";
import { Indicators } from "../../atoms/Indicators";
import { useCarouselContext } from "./CarouselContext";
import { useRepeatOnHold } from "./useRepeatOnHold";
import type { CarouselContextValue } from "./CarouselContext";
import styles from "./Carousel.module.css";
import type {
  CarouselAutoPlayToggleProps,
  CarouselIndicatorsProps,
  CarouselNextProps,
  CarouselPreviousProps,
} from "./Carousel.types";

/** Where a previous or next button sits, given the carousel's `controls`: `hidden` and `bar` both mean the bar, for a button placed on purpose. */
const placementOf = (controls: CarouselContextValue["controlsPlacement"]): "overlay" | "auto" | "bar" =>
  controls === "overlay" ? "overlay" : controls === "auto" ? "auto" : "bar";

/**
 * The button that goes to the previous position. Drawn by the carousel by default; place one as a direct child to give it
 * an icon or a name of your own. It stays in the tab order at the first position when `loop` is on, and is disabled
 * there otherwise, handing focus to the next button.
 *
 * @example
 * ```tsx
 * <Carousel aria-label="Featured">
 *   <Carousel.Previous aria-label="Back one" />
 *   <Carousel.Slide>…</Carousel.Slide>
 * </Carousel>
 * ```
 */
export const CarouselPrevious = forwardRef<HTMLButtonElement, CarouselPreviousProps>(({ icon, className, "aria-label": ariaLabel, ...props }, ref) => {
  const carousel = useCarouselContext("Carousel.Previous");
  const vertical = carousel.orientation === "vertical";
  const hold = useRepeatOnHold(() => carousel.step(-1), carousel.repeatOnHold);
  return (
    <IconButton
      ref={ref}
      className={cx(styles.control, styles.previous, styles[placementOf(carousel.controlsPlacement)], className)}
      {...props}
      icon={icon ?? (vertical ? CaretUpIcon : CaretLeftIcon)}
      aria-label={ariaLabel ?? carousel.labels.previous}
      variant={placementOf(carousel.controlsPlacement) === "bar" ? "secondary" : "primary"}
      tone="neutral"
      size={carousel.size}
      rounded
      disabled={!carousel.canPrevious}
      data-carousel-control="previous"
      {...hold}
      onClick={() => carousel.step(-1)}
    />
  );
});
CarouselPrevious.displayName = "Carousel.Previous";

/**
 * The button that goes to the next position. Drawn by the carousel by default; place one as a direct child to give it an
 * icon or a name of your own.
 *
 * @example
 * ```tsx
 * <Carousel aria-label="Featured">
 *   <Carousel.Next aria-label="Forward one" />
 *   <Carousel.Slide>…</Carousel.Slide>
 * </Carousel>
 * ```
 */
export const CarouselNext = forwardRef<HTMLButtonElement, CarouselNextProps>(({ icon, className, "aria-label": ariaLabel, ...props }, ref) => {
  const carousel = useCarouselContext("Carousel.Next");
  const vertical = carousel.orientation === "vertical";
  const hold = useRepeatOnHold(() => carousel.step(1), carousel.repeatOnHold);
  return (
    <IconButton
      ref={ref}
      className={cx(styles.control, styles.next, styles[placementOf(carousel.controlsPlacement)], className)}
      {...props}
      icon={icon ?? (vertical ? CaretDownIcon : CaretRightIcon)}
      aria-label={ariaLabel ?? carousel.labels.next}
      variant={placementOf(carousel.controlsPlacement) === "bar" ? "secondary" : "primary"}
      tone="neutral"
      size={carousel.size}
      rounded
      disabled={!carousel.canNext}
      data-carousel-control="next"
      {...hold}
      onClick={() => carousel.step(1)}
    />
  );
});
CarouselNext.displayName = "Carousel.Next";

/**
 * The position indicators: one dot (or bar) per position, each a button that goes there. Drawn by the carousel by default
 * from its `indicators` and `indicatorsPlacement`; place one as a direct child to set them for it. Nothing is drawn with
 * a single position.
 *
 * @example
 * ```tsx
 * <Carousel aria-label="Featured" indicators={false}>
 *   <Carousel.Indicators variant="bars" placement="overlay" />
 *   <Carousel.Slide>…</Carousel.Slide>
 * </Carousel>
 * ```
 */
export const CarouselIndicators = forwardRef<HTMLDivElement, CarouselIndicatorsProps>(
  ({ variant, placement, showLabel = false, className, "aria-label": ariaLabel, ...props }, ref) => {
    const carousel = useCarouselContext("Carousel.Indicators");
    if (carousel.stops.length < 2) return null;
    const where = placement ?? carousel.indicatorsPlacement;
    return (
      <div className={cx(styles.indicators, where === "overlay" && styles.indicatorsOverlay)} data-carousel-indicators="">
        <Indicators
          ref={ref}
          className={className}
          {...props}
          count={carousel.stops.length}
          activeIndex={carousel.stopPlace}
          onIndexChange={(place) => carousel.request(carousel.stops[place] ?? 0)}
          orientation={carousel.orientation}
          variant={variant ?? carousel.indicatorsVariant}
          size={carousel.size}
          showLabel={showLabel}
          getLabel={(place) => carousel.labels.indicator((carousel.stops[place] ?? 0) + 1, carousel.count)}
          aria-label={ariaLabel ?? carousel.labels.indicators}
        />
      </div>
    );
  },
);
CarouselIndicators.displayName = "Carousel.Indicators";

/**
 * The button that stops and restarts automatic rotation. Drawn by the carousel whenever `autoPlay` is on (it cannot be
 * left out: a rotation the person cannot stop fails WCAG 2.2.2); place one as a direct child to give it a class or id.
 * Not drawn while `autoPlay` is off.
 *
 * @example
 * ```tsx
 * <Carousel aria-label="Featured" autoPlay>
 *   <Carousel.AutoPlayToggle className="my-toggle" />
 *   <Carousel.Slide>…</Carousel.Slide>
 * </Carousel>
 * ```
 */
export const CarouselAutoPlayToggle = forwardRef<HTMLButtonElement, CarouselAutoPlayToggleProps>(({ className, ...props }, ref) => {
  const carousel = useCarouselContext("Carousel.AutoPlayToggle");
  if (!carousel.autoPlay) return null;
  return (
    <IconButton
      ref={ref}
      className={cx(styles.toggle, className)}
      {...props}
      icon={carousel.playWanted ? PauseIcon : PlayIcon}
      aria-label={carousel.playWanted ? carousel.labels.pause : carousel.labels.play}
      variant="secondary"
      tone="neutral"
      size={carousel.size}
      rounded
      data-carousel-control="auto-play"
      onClick={carousel.togglePlay}
    />
  );
});
CarouselAutoPlayToggle.displayName = "Carousel.AutoPlayToggle";
