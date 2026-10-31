// The code shown under each story's "Show code" button on Carousel's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object plus demo-only helpers, which can't be pasted anywhere. Each
// snippet here is the smallest real usage of what its story shows — only exports
// of the package, no demo scaffolding — and `storySnippets.test.ts` checks that
// stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type {
  CarouselControls,
  CarouselIndicatorsPlacement,
  CarouselOrientation,
  CarouselSize,
} from "./Carousel.types";

const slides = (count = 5) =>
  Array.from({ length: count }, (_, index) => `  <Carousel.Slide>Slide ${index + 1}</Carousel.Slide>`).join("\n");

const carousel = (attributes = "", body = slides(), name = "Featured") =>
  `<Carousel aria-label=${quote(name)}${attributes ? ` ${attributes}` : ""}>\n${body}\n</Carousel>`;

export const carouselSnippets = {
  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — the buttons and indicators */}
${carousel('size="lg"')}`,

  severalInView: `{/* slidesPerView: how many are in view; a breakpoint map is allowed */}
${carousel('slidesPerView={{ base: 1, md: 3 }}')}`,

  slidesPerMove: `{/* slidesPerMove="view": a press moves a whole view, and there is one indicator per view */}
${carousel('slidesPerView={2} slidesPerMove="view"', slides(7))}`,

  peek: `{/* peek: the edge of the slide after the last one in view says there is more */}
${carousel('slidesPerView={2} peek')}`,

  loop: `{/* loop: the buttons and indicators wrap from the last position to the first */}
${carousel("loop")}`,

  vertical: `{/* orientation="vertical": the carousel needs a height from its container */}
<div style={{ blockSize: "20rem" }}>
${carousel('orientation="vertical"').replace(/^/gm, "  ")}
</div>`,

  controlsInBar: `{/* controls: "auto" (default) over the slides from the sm breakpoint up | "overlay" | "bar" | "hidden" */}
${carousel('controls="bar"')}`,

  indicatorsOverGallery: `{/* indicators: "dots" (default) | "outlined" | "bars" | false; indicatorsPlacement: "below" | "overlay" */}
${carousel('indicators="bars" indicatorsPlacement="overlay" controls="hidden"')}`,

  autoPlay: `{/* autoPlay: off by default. A pause button is always drawn; it holds on hover, focus and a hidden page */}
${carousel("autoPlay={{ interval: 4000 }}")}`,

  controlled: `const [value, setValue] = useState(0);

<Carousel aria-label="Featured" value={value} onValueChange={setValue}>
${slides()}
</Carousel>`,

  controller: `{/* carousel is a ref to the controller: useRef(null), typed as CarouselController */}
<Button onClick={() => carousel.current?.goTo(2)}>Jump to the third</Button>
<Carousel aria-label="Featured" controllerRef={carousel}>
${slides()}
</Carousel>`,

  placedParts: `{/* Place a part as a direct child to replace the default of its kind */}
<Carousel aria-label="Featured" controls="hidden" indicators={false}>
  <Carousel.Previous aria-label="Back one" />
  <Carousel.Indicators variant="outlined" />
  <Carousel.Next aria-label="Forward one" />
${slides()}
</Carousel>`,

  labels: `<Carousel
  aria-label="Destacados"
  labels={{
    track: "Diapositivas",
    slide: (n, total) => \`Diapositiva \${n} de \${total}\`,
    previous: "Anterior",
    next: "Siguiente",
    indicators: "Navegación",
    indicator: (n) => \`Ir a la diapositiva \${n}\`,
    announcement: (first, last, total) => \`Diapositiva \${first} de \${total}\`,
  }}
>
${slides()}
</Carousel>`,

  rtl: `{/* dir: the arrows and the arrow keys follow the reading direction */}
${carousel('dir="rtl"')}`,
};

export interface CarouselPlaygroundSnippetArgs {
  slidesPerView?: number;
  slidesPerMove?: number | "view";
  loop?: boolean;
  orientation?: CarouselOrientation;
  gap?: number;
  peek?: boolean;
  size?: CarouselSize;
  controls?: CarouselControls;
  indicators?: string | false;
  indicatorsPlacement?: CarouselIndicatorsPlacement;
  autoPlay?: boolean;
  announce?: boolean;
  dir?: "ltr" | "rtl";
  "aria-label"?: string;
}

/** The Playground's snippet, built from its live controls. */
export function carouselPlaygroundSnippet(args: CarouselPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.slidesPerView && args.slidesPerView !== 1) attributes.push(`slidesPerView={${args.slidesPerView}}`);
  if (args.slidesPerMove === "view") attributes.push('slidesPerMove="view"');
  else if (typeof args.slidesPerMove === "number" && args.slidesPerMove !== 1) attributes.push(`slidesPerMove={${args.slidesPerMove}}`);
  if (args.loop) attributes.push("loop");
  if (args.orientation && args.orientation !== "horizontal") attributes.push(`orientation="${args.orientation}"`);
  if (args.gap !== undefined && args.gap !== 4) attributes.push(`gap={${args.gap}}`);
  if (args.peek) attributes.push("peek");
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.controls && args.controls !== "auto") attributes.push(`controls="${args.controls}"`);
  if (args.indicators === false) attributes.push("indicators={false}");
  else if (args.indicators && args.indicators !== "dots") attributes.push(`indicators="${args.indicators}"`);
  if (args.indicatorsPlacement && args.indicatorsPlacement !== "below") attributes.push(`indicatorsPlacement="${args.indicatorsPlacement}"`);
  if (args.autoPlay) attributes.push("autoPlay");
  if (args.announce === false) attributes.push("announce={false}");
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  return carousel(attributes.join(" "), slides(), args["aria-label"] || "Featured");
}
