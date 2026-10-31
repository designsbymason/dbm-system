import { cx, mergeRefs, useAnnouncement, useResolvedResponsiveValue } from "@dbm-system/utils";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FocusEvent, ReactElement } from "react";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import {
  canLoop,
  clampIndex,
  computeStops,
  DEFAULT_AUTO_PLAY_INTERVAL_MS,
  MIN_AUTO_PLAY_INTERVAL_MS,
  lastIndex,
  nearestStop,
  neighbourStop,
  resolveLabels,
  slidesOutside,
  slidesTouched,
  viewSize,
  wholeNumber,
  wrapStep,
} from "./carouselHelpers";
import { CarouselContext, CarouselSlideContext } from "./CarouselContext";
import type { CarouselContextValue } from "./CarouselContext";
import { CarouselAutoPlayToggle, CarouselIndicators, CarouselNext, CarouselPrevious } from "./CarouselParts";
import { CarouselSlide } from "./CarouselSlide";
import { splitChildren } from "./carouselChildren";
import { useAutoHeight } from "./useAutoHeight";
import { useButtonFocusHandoff } from "./useButtonFocusHandoff";
import { useCarouselWarnings } from "./useCarouselWarnings";
import { useLazySlides } from "./useLazySlides";
import { useRotationHold } from "./useRotationHold";
import { useTrackKeyDown } from "./useTrackKeyDown";
import { useAutoPlay } from "./useAutoPlay";
import { useCarouselController } from "./useCarouselController";
import { useCarouselDrag } from "./useCarouselDrag";
import { useCarouselScroll } from "./useCarouselScroll";
import styles from "./Carousel.module.css";
import type { CarouselProps, CarouselSlideProps } from "./Carousel.types";

/**
 * Whether a focus event is the kind that should hold automatic rotation: keyboard focus (or a text field), not a press that
 * happens to leave focus on a button. Where `:focus-visible` can't be asked (an old engine), any focus holds it, which is the
 * safe side of WCAG 2.2.2.
 */
function holdsRotation(target: EventTarget): boolean {
  if (!(target instanceof HTMLElement)) return true;
  if (target.closest('[data-carousel-control="auto-play"]')) return false;
  try {
    return target.matches(":focus-visible");
  } catch {
    // `:focus-visible` is not a selector this engine knows.
    return true;
  }
}

/**
 * Slides that scroll sideways (or up and down) through a window, one position at a time, with previous and next buttons,
 * position indicators and optional automatic rotation. A compound component: put one `Carousel.Slide` per slide inside
 * `Carousel`, and name it with `aria-label`. A region the person swipes, drags with a mouse, scrolls with a wheel or trackpad,
 * or steps with the buttons, the indicators or the arrow keys on the focused track; the slides are the browser's own
 * scroll-snapping, so touch, momentum and inertia are the platform's.
 *
 * The slide at the track's edge is `value` (controlled with `onValueChange`, or `defaultValue`). `slidesPerView` shows several
 * at once (a breakpoint map and a fraction are allowed), `slidesPerMove` sets how many a press moves, `peek` shows the edge of
 * the next, `align="center"` keeps a slide in the middle, `loop` wraps round with no seam, `lazy` draws a slide's content only
 * near the view, and `orientation="vertical"` runs the slides up and down inside a height you give the carousel. A slide outside
 * the view is `inert`. `autoPlay` rotates the slides by itself, paused on hover, focus, playing media and a hidden page, starting
 * paused for a person who prefers reduced motion, with a pause button that is always drawn. `controllerRef` hands `next()`,
 * `previous()`, `goTo()` and `hold()` to code of your own. Text the component writes itself is in `labels`, and `formatNumber`
 * writes its digits.
 *
 * `ref` forwards to the root `<div>`, which carries `role="region"`, the name and `className`/`style`.
 *
 * @example
 * ```tsx
 * <Carousel aria-label="Featured stories" slidesPerView={{ base: 1, md: 3 }} loop>
 *   <Carousel.Slide>First</Carousel.Slide>
 *   <Carousel.Slide>Second</Carousel.Slide>
 *   <Carousel.Slide>Third</Carousel.Slide>
 *   <Carousel.Slide>Fourth</Carousel.Slide>
 * </Carousel>
 * ```
 */
const CarouselRoot = forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      children,
      value: valueProp,
      defaultValue = 0,
      onValueChange,
      slidesPerView = 1,
      slidesPerMove = 1,
      loop = false,
      align = "start",
      lazy = false,
      mouseDrag = true,
      effect = "none",
      autoHeight = false,
      repeatOnHold = true,
      edgeResistance = true,
      orientation = "horizontal",
      gap = 4,
      peek = false,
      size = "md",
      controls = "auto",
      indicators = "dots",
      indicatorsPlacement = "below",
      autoPlay = false,
      announce = true,
      formatNumber = String,
      labels: labelsProp,
      controllerRef,
      dir = "ltr",
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      className,
      style,
      onPointerEnter,
      onPointerLeave,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const labels = resolveLabels(formatNumber, labelsProp);

    const { slides, previousPart, nextPart, indicatorsPart, togglePart } = splitChildren(children);
    const count = slides.length;

    const perViewRequested = useResolvedResponsiveValue<number>(slidesPerView, 1);
    const perView = Math.min(viewSize(perViewRequested, 1), Math.max(1, count));
    const visible = slidesTouched(perView);
    const center = align === "center";
    const looping = canLoop(count, perView, loop);
    const peeking = peek && !center;
    const max = lastIndex({ count, perView, loop: looping, center });
    const move = Math.min(slidesPerMove === "view" ? Math.max(1, Math.floor(perView)) : wholeNumber(slidesPerMove, 1, 1), looping ? Math.max(1, count - 1) : Infinity);
    const stops = useMemo(() => computeStops({ count, perView, loop: looping, center }, move), [count, perView, looping, center, move]);
    const cloneCount = looping ? Math.min(count, visible + 1 + (peeking ? 1 : 0)) : 0;

    const controlled = valueProp !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue);
    const value = clampIndex(controlled ? valueProp : internalValue, max);
    const stopPlace = nearestStop(stops, value);

    const request = (index: number): boolean => {
      const next = clampIndex(index, max);
      if (next === value) return false;
      if (!controlled) setInternalValue(next);
      onValueChange?.(next);
      return true;
    };

    // A slide that takes focus with only its edge in view (the peeking one) is brought fully into view: the browser scrolls
    // a partly visible element no further.
    const reveal = (index: number) => {
      if (count === 0 || slidesOutside(index, { count, perView, loop: looping, center, value, peek: false }) === 0) return;
      request(center ? index : Math.max(0, index - visible + 1));
    };

        const neighbour = (direction: 1 | -1, wrapEnds: boolean): number | undefined =>
      looping ? wrapStep(value, direction, move, count) : neighbourStop(stops, stopPlace, direction, wrapEnds);
    const step = (direction: 1 | -1): boolean => {
      const target = neighbour(direction, false);
      if (target === undefined) return false;
      pressed.current = direction === 1 ? "next" : "previous";
      return request(target);
    };
    const canNext = neighbour(1, false) !== undefined;
    const canPrevious = neighbour(-1, false) !== undefined;
    const root = useRef<HTMLDivElement>(null);
    const pressed = useButtonFocusHandoff(root, { value, canNext, canPrevious });

    const autoPlayOn = autoPlay !== false && autoPlay !== undefined && count > 1 && stops.length > 1;
    const intervalMs = typeof autoPlay === "object" ? wholeNumber(autoPlay.interval, DEFAULT_AUTO_PLAY_INTERVAL_MS, MIN_AUTO_PLAY_INTERVAL_MS) : DEFAULT_AUTO_PLAY_INTERVAL_MS;
    const [hovered, setHovered] = useState(false);
    const [focusHeld, setFocusHeld] = useState(false);
    const [moving, setMoving] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);
    const { held: rotationHeld, hold } = useRotationHold(trackRef, autoPlayOn);
    const rotation = useAutoPlay({
      enabled: autoPlayOn,
      intervalMs,
      held: hovered || focusHeld || rotationHeld,
      moving,
      value,
      advance: () => {
        const target = neighbour(1, true);
        if (target !== undefined) request(target);
      },
    });

    const vertical = orientation === "vertical";
    const [settleTick, setSettleTick] = useState(0);
    useCarouselScroll({
      trackRef,
      axis: vertical ? "block" : "inline",
      align,
      value,
      max,
      count,
      cloneCount,
      layoutKey: `${perView}|${gap}|${orientation}|${peeking}|${count}|${dir}|${align}|${cloneCount}`,
      realignTick: settleTick,
      onSettle: (index) => {
        request(index);
        setSettleTick((tick) => tick + 1);
      },
      onMoving: setMoving,
    });
    useCarouselDrag(trackRef, { axis: vertical ? "block" : "inline", enabled: mouseDrag, resist: edgeResistance && !looping });
    const sizedByContent = autoHeight && vertical && !center;
    const autoSize = useAutoHeight(trackRef, { enabled: sizedByContent, perView, layoutKey: `${count}|${gap}|${looping}` });
    useCarouselController(controllerRef, { value, count, max, request, step, hold });

    useCarouselWarnings({
      name: { label: ariaLabel, labelledBy: ariaLabelledBy },
      controlledValue: valueProp,
      max,
      count,
      perView,
      requestedInterval: typeof autoPlay === "object" ? autoPlay.interval : undefined,
      trackRef,
      needsHeight: vertical && !sizedByContent,
      slidesInView: visible,
    });

    const { message, announce: say } = useAnnouncement();
    const previousValue = useRef({ value, count });
    const playingNow = useRef(rotation.playing);
    useEffect(() => {
      playingNow.current = rotation.playing;
    });
    useEffect(() => {
      const before = previousValue.current;
      previousValue.current = { value, count };
      if (announce && count > 0 && before.count === count && before.value !== value && !playingNow.current) {
        const last = center ? value + 1 : looping ? ((value + visible - 1) % count) + 1 : Math.min(value + visible, count);
        say(labels.announcement(value + 1, last, count));
      }
      // `labels` is rebuilt every render; the message only needs to be written when the value changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, count]);

    // Which slides draw their content: all of them, or (with `lazy`) those near the view and those that have been near before.
    const lazyReach = lazy === false || lazy === undefined ? Infinity : lazy === true ? 1 : wholeNumber(lazy, 1, 0);
    const viewState = { count, perView, loop: looping, center, value, peek: peeking };
    const drawn = useLazySlides(lazyReach, viewState);

    const onTrackKeyDown = useTrackKeyDown({ vertical, dir, stops, step, request });

    const context: CarouselContextValue = {
      size,
      orientation,
      dir,
      labels,
      formatNumber,
      controlsPlacement: controls,
      indicatorsVariant: indicators === false ? "dots" : indicators,
      indicatorsPlacement,
      count,
      value,
      perView,
      stops,
      stopPlace,
      repeatOnHold,
      canPrevious,
      canNext,
      request,
      reveal,
      step,
      autoPlay: autoPlayOn,
      playing: rotation.playing,
      playWanted: rotation.wanted,
      togglePlay: rotation.toggle,
    };

    const navigable = stops.length > 1;
    // A button placed on purpose while `controls` is "hidden" is drawn in the bar.
    const buttonsInBar = controls === "bar" || controls === "hidden";
    const previousElement = navigable ? (previousPart ?? (controls === "hidden" ? null : <CarouselPrevious />)) : null;
    const nextElement = navigable ? (nextPart ?? (controls === "hidden" ? null : <CarouselNext />)) : null;
    const indicatorsElement = navigable ? (indicatorsPart ?? (indicators === false ? null : <CarouselIndicators />)) : null;
    const toggleElement = autoPlayOn ? (togglePart ?? <CarouselAutoPlayToggle />) : null;
    const indicatorsOverlay = (indicatorsPart?.props.placement ?? indicatorsPlacement) === "overlay";
    const hasBar = Boolean(toggleElement) || Boolean(indicatorsElement && !indicatorsOverlay) || (buttonsInBar && Boolean(previousElement || nextElement));

    const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
      onFocus?.(event);
      setFocusHeld(holdsRotation(event.target));
    };
    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
      onBlur?.(event);
      if (!event.currentTarget.contains(event.relatedTarget)) setFocusHeld(false);
    };

    const rootStyle = {
      "--carousel-slides": perView,
      "--carousel-gaps": visible - 1 + (peeking ? 1 : 0),
      "--carousel-gap": `var(--dbm-space-${gap})`,
      ...style,
    } as CSSProperties;

    const slideAt = (slide: ReactElement<CarouselSlideProps>, index: number, copy: "pre" | "post" | null) => (
      <CarouselSlideContext.Provider
        key={copy ? `${copy}-${slide.key}` : slide.key}
        value={{ index, total: count, inView: !copy && slidesOutside(index, viewState) === 0, clone: copy !== null, render: drawn.has(index) }}
      >
        {slide}
      </CarouselSlideContext.Provider>
    );

    return (
      <CarouselContext.Provider value={context}>
        <div
          ref={mergeRefs(ref, root)}
          className={cx(
            styles.root,
            peeking && styles.peek,
            center && styles.centered,
            looping && styles.looping,
            sizedByContent && styles.autoHeight,
            effect === "fade" && styles.effectFade,
            effect === "scale" && styles.effectScale,
            effect === "fade-scale" && styles.effectFadeScale,
            className,
          )}
          style={rootStyle}
          {...props}
          role="region"
          aria-roledescription="carousel"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          dir={dir}
          data-orientation={orientation}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <div
            className={styles.viewport}
            onPointerEnter={(event) => {
              onPointerEnter?.(event);
              setHovered(true);
            }}
            onPointerLeave={(event) => {
              onPointerLeave?.(event);
              setHovered(false);
            }}
          >
            {/* A scrolling box has to be reachable by keyboard (WCAG 2.1.1), and it is the arrow keys' target: a focusable named group. */}
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <div
              ref={trackRef}
              className={styles.track}
              role="group"
              aria-label={labels.track}
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}
              data-carousel-track=""
              style={autoSize !== undefined ? ({ "--carousel-auto-size": `${autoSize}px` } as CSSProperties) : undefined}
              data-draggable={mouseDrag ? "" : undefined}
              onKeyDown={onTrackKeyDown}
            >
              {looping && slides.slice(count - cloneCount).map((slide, offset) => slideAt(slide, count - cloneCount + offset, "pre"))}
              {slides.map((slide, index) => slideAt(slide, index, null))}
              {looping && slides.slice(0, cloneCount).map((slide, index) => slideAt(slide, index, "post"))}
            </div>
            {!buttonsInBar && previousElement}
            {!buttonsInBar && nextElement}
            {indicatorsOverlay && indicatorsElement}
          </div>
          {hasBar && (
            <div className={styles.bar}>
              {buttonsInBar && previousElement}
              {!indicatorsOverlay && indicatorsElement}
              {toggleElement}
              {buttonsInBar && nextElement}
            </div>
          )}
          <VisuallyHidden role="status">{message}</VisuallyHidden>
        </div>
      </CarouselContext.Provider>
    );
  },
);

CarouselRoot.displayName = "Carousel";

/** A carousel of slides. See the root component for the props; the parts are `Carousel.Slide`, `Previous`, `Next`, `Indicators` and `AutoPlayToggle`. */
export const Carousel = Object.assign(CarouselRoot, {
  Slide: CarouselSlide,
  Previous: CarouselPrevious,
  Next: CarouselNext,
  Indicators: CarouselIndicators,
  AutoPlayToggle: CarouselAutoPlayToggle,
});
