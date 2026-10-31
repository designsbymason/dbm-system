import { Children, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import { CarouselAutoPlayToggle, CarouselIndicators, CarouselNext, CarouselPrevious } from "./CarouselParts";
import type { CarouselSlideProps } from "./Carousel.types";

const isOfType = <P,>(child: ReactNode, type: unknown): child is ReactElement<P> => isValidElement(child) && child.type === type;

interface SplitChildren {
  slides: Array<ReactElement<CarouselSlideProps>>;
  previousPart: ReactElement | undefined;
  nextPart: ReactElement | undefined;
  indicatorsPart: ReactElement<{ placement?: string }> | undefined;
  togglePart: ReactElement | undefined;
}

/**
 * Sorts a carousel's children into its slides and the four parts that replace a default control. Every element that is not one of
 * the parts is a slide, so a component of your own that renders a `Carousel.Slide` can be mapped over data; text and other
 * non-elements are not slides.
 */
export function splitChildren(children: ReactNode): SplitChildren {
  const all = Children.toArray(children);
  const isPart = (child: ReactNode) => [CarouselPrevious, CarouselNext, CarouselIndicators, CarouselAutoPlayToggle].some((type) => isOfType(child, type));
  return {
    slides: all.filter((child): child is ReactElement<CarouselSlideProps> => isValidElement(child) && !isPart(child)),
    previousPart: all.find((child) => isOfType(child, CarouselPrevious)) as ReactElement | undefined,
    nextPart: all.find((child) => isOfType(child, CarouselNext)) as ReactElement | undefined,
    indicatorsPart: all.find((child): child is ReactElement<{ placement?: string }> => isOfType(child, CarouselIndicators)),
    togglePart: all.find((child) => isOfType(child, CarouselAutoPlayToggle)) as ReactElement | undefined,
  };
}
