import { cx, mergeRefs, useAnnouncement, useResolvedResponsiveValue } from "@dbm-system/utils";
import { Children, forwardRef, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FocusEvent, KeyboardEvent, ReactElement, ReactNode } from "react";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import {
  clampIndex,
  computeStops,
  DEFAULT_AUTO_PLAY_INTERVAL_MS,
  lastStart,
  neighbourStop,
  nearestStop,
  resolveLabels,
  wholeNumber,
} from "./carouselHelpers";
import { CarouselContext, CarouselSlideContext } from "./CarouselContext";
import type { CarouselContextValue } from "./CarouselContext";
import { CarouselAutoPlayToggle, CarouselIndicators, CarouselNext, CarouselPrevious } from "./CarouselParts";
import { CarouselSlide } from "./CarouselSlide";
import { useAutoPlay } from "./useAutoPlay";
import { useCarouselController } from "./useCarouselController";
import { useCarouselScroll } from "./useCarouselScroll";
import styles from "./Carousel.module.css";
import type { CarouselProps, CarouselSlideProps } from "./Carousel.types";

const isOfType = <P,>(child: ReactNode, type: unknown): child is ReactElement<P> => isValidElement(child) && child.type === type;

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
 * `Carousel`, and name it with `aria-label`. A region the person swipes, scrolls with a wheel or trackpad, or steps with the
 * buttons, the indicators or the arrow keys on the focused track; the slides are the browser's own scroll-snapping, so
 * touch, momentum and inertia are the platform's.
 *
 * The first slide in view is `value` (controlled with `onValueChange`, or `defaultValue`). `slidesPerView` shows several
 * at once (a breakpoint map is allowed), `slidesPerMove` sets how many a press moves, `peek` shows the edge of the next,
 * `loop` wraps from the last position to the first, and `orientation="vertical"` runs the slides up and down inside a
 * height you give the carousel. A slide outside the view is `inert`. `autoPlay` rotates the slides by itself, paused on hover,
 * focus and a hidden page, starting paused for a person who prefers reduced motion, with a pause button that is always drawn.
 * `controllerRef` hands `next()`, `previous()` and `goTo()` to a button of your own. Text the component writes itself is in
 * `labels`, and `formatNumber` writes its digits.
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

    const rawChildren = Children.toArray(children);
    const isPart = (child: ReactNode) => [CarouselPrevious, CarouselNext, CarouselIndicators, CarouselAutoPlayToggle].some((type) => isOfType(child, type));
    // Every element that is not one of the parts is a slide, so a component of your own that renders a `Carousel.Slide` can be
    // mapped over data; text and other non-elements are not slides.
    const slides = rawChildren.filter((child): child is ReactElement<CarouselSlideProps> => isValidElement(child) && !isPart(child));
    const previousPart = rawChildren.find((child) => isOfType(child, CarouselPrevious));
    const nextPart = rawChildren.find((child) => isOfType(child, CarouselNext));
    const indicatorsPart = rawChildren.find((child): child is ReactElement<{ placement?: string }> => isOfType(child, CarouselIndicators));
    const togglePart = rawChildren.find((child) => isOfType(child, CarouselAutoPlayToggle));
    const count = slides.length;

    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && !ariaLabel && !ariaLabelledBy) {
        console.warn("Carousel: it needs an accessible name. Pass `aria-label` or `aria-labelledby`.");
      }
    }, [ariaLabel, ariaLabelledBy]);

    const perViewRequested = useResolvedResponsiveValue<number>(slidesPerView, 1);
    const perView = Math.min(wholeNumber(perViewRequested, 1, 1), Math.max(1, count));
    const move = slidesPerMove === "view" ? perView : wholeNumber(slidesPerMove, 1, 1);
    const max = lastStart(count, perView);
    const stops = useMemo(() => computeStops(count, perView, move), [count, perView, move]);

    const controlled = valueProp !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue);
    const value = clampIndex(controlled ? valueProp : internalValue, max);
    const stopPlace = nearestStop(stops, value);

    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && count > 0 && controlled && (valueProp < 0 || valueProp > max)) {
        console.warn(`Carousel: \`value\` (${valueProp}) is outside 0–${max} for ${count} slides with ${perView} in view; it is held to that range.`);
      }
    }, [controlled, valueProp, max, count, perView]);

    const request = (index: number): boolean => {
      const next = clampIndex(index, max);
      if (next === value) return false;
      if (!controlled) setInternalValue(next);
      onValueChange?.(next);
      return true;
    };

    const pressed = useRef<"previous" | "next" | null>(null);
    const step = (direction: 1 | -1): boolean => {
      const target = neighbourStop(stops, stopPlace, direction, loop);
      if (target === undefined) return false;
      pressed.current = direction === 1 ? "next" : "previous";
      return request(target);
    };
    const canNext = neighbourStop(stops, stopPlace, 1, loop) !== undefined;
    const canPrevious = neighbourStop(stops, stopPlace, -1, loop) !== undefined;

    const autoPlayOn = autoPlay !== false && autoPlay !== undefined && count > 1 && stops.length > 1;
    const intervalMs = typeof autoPlay === "object" ? wholeNumber(autoPlay.interval, DEFAULT_AUTO_PLAY_INTERVAL_MS, 1000) : DEFAULT_AUTO_PLAY_INTERVAL_MS;
    const [hovered, setHovered] = useState(false);
    const [focusHeld, setFocusHeld] = useState(false);
    const [moving, setMoving] = useState(false);
    const rotation = useAutoPlay({
      enabled: autoPlayOn,
      intervalMs,
      held: hovered || focusHeld,
      moving,
      value,
      advance: () => {
        const target = neighbourStop(stops, stopPlace, 1, true);
        if (target !== undefined) request(target);
      },
    });

    const vertical = orientation === "vertical";
    const trackRef = useRef<HTMLDivElement>(null);
    useCarouselScroll({
      trackRef,
      axis: vertical ? "block" : "inline",
      value,
      max,
      layoutKey: `${perView}|${gap}|${orientation}|${peek}|${count}|${dir}`,
      onSettle: request,
      onMoving: setMoving,
    });
    useCarouselController(controllerRef, { value, count, max, request, step });

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
        say(labels.announcement(value + 1, Math.min(value + perView, count), count));
      }
      // `labels` is rebuilt every render; the message only needs to be written when the value changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, count]);

    const root = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const wasPressed = pressed.current;
      pressed.current = null;
      if (!wasPressed || !root.current) return;
      const active = document.activeElement;
      const lost = active === document.body || (active instanceof HTMLButtonElement && active.disabled && root.current.contains(active));
      if (!lost) return;
      const other = wasPressed === "next" ? "previous" : "next";
      root.current.querySelector<HTMLButtonElement>(`[data-carousel-control="${other}"]:not(:disabled)`)?.focus();
    }, [value, canNext, canPrevious]);

    const onTrackKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
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
      canPrevious,
      canNext,
      request,
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
      "--carousel-gaps": perView - 1 + (peek ? 1 : 0),
      "--carousel-gap": `var(--dbm-space-${gap})`,
      ...style,
    } as CSSProperties;

    return (
      <CarouselContext.Provider value={context}>
        <div
          ref={mergeRefs(ref, root)}
          className={cx(styles.root, peek && styles.peek, className)}
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
              onKeyDown={onTrackKeyDown}
            >
              {slides.map((slide, index) => (
                <CarouselSlideContext.Provider key={slide.key} value={{ index, total: count, inView: index >= value && index < value + perView }}>
                  {slide}
                </CarouselSlideContext.Provider>
              ))}
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
