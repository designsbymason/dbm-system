import { Carousel } from "./Carousel";
import type { CarouselProps } from "./Carousel.types";

/** A small carousel of numbered slides for tests; any children are placed parts, drawn after the slides. */
export const Slides = ({ slides = 5, children, ...props }: Partial<CarouselProps> & { slides?: number }) => (
  <Carousel aria-label="Stories" {...props}>
    {Array.from({ length: slides }, (_, index) => (
      <Carousel.Slide key={index}>Slide {index + 1}</Carousel.Slide>
    ))}
    {children}
  </Carousel>
);
