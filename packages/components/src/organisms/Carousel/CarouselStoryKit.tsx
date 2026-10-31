import type { CSSProperties } from "react";
import { Carousel } from "./Carousel";
import type { CarouselProps } from "./Carousel.types";

// What the stories file and the real-browser checks file share. A module that is not a stories file, so the runner loads
// each stories file on its own and this is drawn by both (`07-storybook-and-documentation-standards.md` §4.2).

const tints = ["brand", "info", "success", "highlight", "warning"] as const;
export const allSizes = ["xs", "sm", "md", "lg", "xl"] as const;

const slideStyle = (index: number, height: string): CSSProperties => ({
  alignItems: "center",
  backgroundColor: `var(--dbm-bg-${tints[index % tints.length]}-subtle)`,
  borderRadius: "var(--dbm-radius-md)",
  color: "var(--dbm-text-primary)",
  display: "flex",
  flexDirection: "column",
  fontFamily: "var(--dbm-font-family-primary)",
  gap: "var(--dbm-space-1)",
  justifyContent: "center",
  blockSize: height,
});

/** A coloured, numbered panel standing in for real slide content. */
export const DemoSlide = ({ index, height = "var(--dbm-space-32)" }: { index: number; height?: string }) => (
  <Carousel.Slide>
    <div style={slideStyle(index, height)}>
      <strong style={{ fontSize: "var(--dbm-font-size-2xl)" }}>{index + 1}</strong>
      <span style={{ color: "var(--dbm-text-secondary)", fontSize: "var(--dbm-font-size-sm)" }}>Slide {index + 1}</span>
    </div>
  </Carousel.Slide>
);

export type DemoProps = Omit<CarouselProps, "children"> & {
  /** How many slides to draw. */
  slides?: number;
  /** How tall each panel is. */
  height?: string;
  /** Placed parts (a `Carousel.Indicators`, say), drawn after the slides. */
  children?: CarouselProps["children"];
};

/** A small, real carousel the gallery stories and the checks vary. */
export const Demo = ({ slides = 5, height, children, ...props }: DemoProps) => (
  <Carousel aria-label="Featured" {...props}>
    {Array.from({ length: slides }, (_, index) => (
      <DemoSlide key={index} index={index} height={height} />
    ))}
    {children}
  </Carousel>
);
