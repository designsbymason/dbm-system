import { cx, mergeRefs } from "@dbm-system/utils";
import { forwardRef, useContext, useEffect, useRef } from "react";
import { CarouselContext, CarouselSlideContext } from "./CarouselContext";
import styles from "./Carousel.module.css";
import type { CarouselSlideProps } from "./Carousel.types";

/**
 * One slide of a `Carousel`: a group named by its place ("3 of 8") that fills its share of the track. A slide outside the
 * view is `inert`, so a link or button in it is neither tabbable nor read out until the slide is in view.
 *
 * With `lazy` on the carousel, a slide far from the view draws its `placeholder` instead of its content until it is near; give it
 * a size of its own (a height, an aspect ratio), since an empty slide has none.
 *
 * `ref` forwards to the slide's `<div>`.
 *
 * @example
 * ```tsx
 * <Carousel aria-label="Featured">
 *   <Carousel.Slide><img src="/one.jpg" alt="A harbour at dusk" /></Carousel.Slide>
 *   <Carousel.Slide><img src="/two.jpg" alt="A market street" /></Carousel.Slide>
 * </Carousel>
 * ```
 */
export const CarouselSlide = forwardRef<HTMLDivElement, CarouselSlideProps>(
  ({ children, placeholder, className, "aria-label": ariaLabel, onFocus, ...props }, ref) => {
    const carousel = useContext(CarouselContext);
    const position = useContext(CarouselSlideContext);
    const element = useRef<HTMLDivElement>(null);
    const inView = position?.inView ?? true;
    const clone = position?.clone ?? false;

    // `inert` is set as a property rather than the JSX attribute: React 18 drops the attribute, and the peer range starts there.
    useEffect(() => {
      const slide = element.current;
      if (!slide) return;
      if (!inView && slide.contains(document.activeElement)) {
        // Focus inside a slide that is about to leave the view would be dropped to the page; keep it on the track instead.
        slide.closest<HTMLElement>("[data-carousel-track]")?.focus({ preventScroll: true });
      }
      slide.inert = !inView;
    }, [inView]);

    return (
      <div
        ref={mergeRefs(ref, element)}
        className={cx(styles.slide, className)}
        {...props}
        role={clone ? undefined : "group"}
        aria-roledescription={clone ? undefined : "slide"}
        aria-label={clone ? undefined : (ariaLabel ?? (carousel && position ? carousel.labels.slide(position.index + 1, position.total) : undefined))}
        aria-hidden={clone ? true : props["aria-hidden"]}
        data-carousel-slide=""
        data-carousel-clone={clone ? "" : undefined}
        data-in-view={inView ? "" : undefined}
        onFocus={(event) => {
          onFocus?.(event);
          if (carousel && position && !position.clone) carousel.reveal(position.index);
        }}
      >
        {position && !position.render ? placeholder : children}
      </div>
    );
  },
);

CarouselSlide.displayName = "Carousel.Slide";
