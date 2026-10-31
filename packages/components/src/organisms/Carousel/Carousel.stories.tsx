import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Button } from "../../atoms/Button";
import { Carousel } from "./Carousel";
import { allSizes, Demo, DemoSlide, verticalBoxHeight } from "./CarouselStoryKit";
import { carouselPlaygroundSnippet, carouselSnippets } from "./Carousel.snippets";
import type {
  CarouselAlign,
  CarouselController,
  CarouselEffect,
  CarouselControls,
  CarouselIndicatorsPlacement,
  CarouselOrientation,
  CarouselProps,
  CarouselSize,
} from "./Carousel.types";

// `Carousel.Slide` and the other parts get their own Properties tables via a hidden docs-only stories file
// (guidelines/adr/0013), where their argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  slidesPerView: number;
  slidesPerMove: number | "view";
  loop: boolean;
  align: CarouselAlign;
  lazy: boolean;
  mouseDrag: boolean;
  edgeResistance: boolean;
  repeatOnHold: boolean;
  effect: CarouselEffect;
  autoHeight: boolean;
  orientation: CarouselOrientation;
  gap: CarouselProps["gap"];
  peek: boolean;
  size: CarouselSize;
  controls: CarouselControls;
  indicators: CarouselProps["indicators"];
  indicatorsPlacement: CarouselIndicatorsPlacement;
  autoPlay: boolean;
  announce: boolean;
  dir: "ltr" | "rtl";
  "aria-label": string;
  value: number;
  defaultValue: number;
  onValueChange: CarouselProps["onValueChange"];
  formatNumber: CarouselProps["formatNumber"];
  "aria-labelledby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
  labels: CarouselProps["labels"];
  controllerRef: CarouselProps["controllerRef"];
  children: CarouselProps["children"];
}

// A fixed-render story ignores its own args, so every control it can't honour is turned off
// (07-storybook-and-documentation-standards.md §5).
const off = { control: false } as const;
const noControls = {
  slidesPerView: off,
  slidesPerMove: off,
  loop: off,
  align: off,
  lazy: off,
  mouseDrag: off,
  edgeResistance: off,
  repeatOnHold: off,
  effect: off,
  autoHeight: off,
  orientation: off,
  gap: off,
  peek: off,
  size: off,
  controls: off,
  indicators: off,
  indicatorsPlacement: off,
  autoPlay: off,
  announce: off,
  dir: off,
  "aria-label": off,
  value: off,
  defaultValue: off,
} as const;
/** The same, except the axes a story does draw from its own args. */
const except = (...keys: Array<keyof typeof noControls>) =>
  Object.fromEntries(Object.entries(noControls).filter(([key]) => !keys.includes(key as keyof typeof noControls)));

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Media/Carousel",
  parameters: { layout: "padded" },
  // The uncontrolled starting position is only read on mount, so its control remounts the carousel.
  decorators: [(Story, context) => <div key={String(context.args.defaultValue)}><Story /></div>],
  argTypes: {
    children: { control: false, description: "The slides, one Carousel.Slide each, and optionally a Carousel.Previous, Next, Indicators or AutoPlayToggle to replace the default of that kind." },
    value: {
      control: false,
      description: "The index of the first slide in view. Makes the carousel controlled: a press asks through onValueChange and the slides move when this does.",
    },
    defaultValue: {
      control: { type: "number", min: 0, max: 4 },
      description: "The index of the first slide in view at first, when value is not set.",
      table: { defaultValue: { summary: "0" } },
    },
    onValueChange: { control: false, description: "Called with the index of the first slide in view when a change is asked for, and when a swipe or scroll settles on another." },
    slidesPerView: {
      control: { type: "number", min: 1, max: 4, step: 0.5 },
      description: "How many slides are in view at once. A breakpoint map is allowed, and so is a fraction (1.5 shows a slide and half of the next).",
      table: { defaultValue: { summary: "1" } },
    },
    slidesPerMove: {
      control: "select",
      options: [1, 2, "view"],
      description: "How many slides a press of next or previous moves, and so how many positions (indicators) there are.",
      table: { defaultValue: { summary: "1" } },
    },
    loop: {
      control: "boolean",
      description: "Wraps round with no seam: from the last slide the next is the first, and the first's previous is the last. Copies of the slides at each end make it seamless.",
      table: { defaultValue: { summary: "false" } },
    },
    align: {
      control: "select",
      options: ["start", "center"],
      description: "Which edge of the track a slide is kept at: its start, or its middle with its neighbours showing at each side.",
      table: { defaultValue: { summary: '"start"' } },
    },
    lazy: {
      control: "boolean",
      description: "Draws a slide's content only within one slide of the view, and its placeholder before that. A number sets how many slides of reach.",
      table: { defaultValue: { summary: "false" } },
    },
    mouseDrag: {
      control: "boolean",
      description: "Lets a mouse drag the slides, as a finger does. A click that ends a drag is swallowed; touch and pen always scroll natively.",
      table: { defaultValue: { summary: "true" } },
    },
    edgeResistance: {
      control: "boolean",
      description: "Gives a mouse drag past the first or last slide some resistance: the slides follow the pointer a little and ease back when it lets go.",
      table: { defaultValue: { summary: "true" } },
    },
    repeatOnHold: {
      control: "boolean",
      description: "Keeps the previous and next buttons stepping while they are held, after a short delay.",
      table: { defaultValue: { summary: "true" } },
    },
    effect: {
      control: "select",
      options: ["none", "fade", "scale", "fade-scale"],
      description: "An effect drawn on the slides as they scroll towards the edges of the view, where the browser supports scroll-linked animation. Off under reduced motion.",
      table: { defaultValue: { summary: '"none"' } },
    },
    autoHeight: {
      control: "boolean",
      description: "A vertical carousel takes its height from its slides (the tallest window of them) instead of from its container.",
      table: { defaultValue: { summary: "false" } },
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "Which way the slides run. A vertical carousel needs a height from its container.",
      table: { defaultValue: { summary: '"horizontal"' } },
    },
    gap: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8],
      description: "The space between slides, a step of the spacing scale.",
      table: { defaultValue: { summary: "4" } },
    },
    peek: {
      control: "boolean",
      description: "Shows the edge of the slide after the last one in view. Those slides are not pressable until they are in view.",
      table: { defaultValue: { summary: "false" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the buttons and indicators.",
      table: { defaultValue: { summary: '"md"' } },
    },
    controls: {
      control: "select",
      options: ["auto", "overlay", "bar", "hidden"],
      description: "Where the previous and next buttons are drawn: over the slides from the sm breakpoint up (auto), over them at every width (overlay), in the row under them (bar) or not at all (hidden).",
      table: { defaultValue: { summary: '"auto"' } },
    },
    indicators: {
      control: "select",
      options: ["dots", "outlined", "bars", false],
      description: "The look of the position indicators, or false for none.",
      table: { defaultValue: { summary: '"dots"' } },
    },
    indicatorsPlacement: {
      control: "select",
      options: ["below", "overlay"],
      description: "Where the position indicators are drawn: below the slides, or over their lower edge.",
      table: { defaultValue: { summary: '"below"' } },
    },
    autoPlay: {
      control: "boolean",
      description: "Rotates the slides by themselves, with a pause button that is always drawn. Holds on hover, focus and a hidden page, and starts paused for a person who prefers reduced motion.",
      table: { defaultValue: { summary: "false" } },
    },
    announce: {
      control: "boolean",
      description: "Announces the slides in view to a screen reader when they change by the person's own action.",
      table: { defaultValue: { summary: "true" } },
    },
    formatNumber: {
      control: false,
      description: "Formats the numbers the carousel writes to a screen reader: the places in a slide's name and in the announcement.",
      table: { defaultValue: { summary: "String" } },
    },
    labels: { control: false, description: "The text the carousel writes itself, as an object with English defaults." },
    controllerRef: { control: false, description: "Receives the controls for code outside the carousel: next(), previous(), goTo() and the current value." },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction, passed to the root and defaulted rather than read from the page.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    "aria-label": { control: "text", description: "The accessible name of the carousel. Needs this or aria-labelledby." },
    "aria-labelledby": { control: false, description: "The id of the element that names the carousel." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Extra class name on the root element." },
    style: { control: false, description: "Inline styles on the root element." },
    "data-testid": { control: false, description: "Test hook, passed through to the root element." },
  },
  args: {
    slidesPerView: 1,
    slidesPerMove: 1,
    loop: false,
    align: "start",
    lazy: false,
    mouseDrag: true,
    edgeResistance: true,
    repeatOnHold: true,
    effect: "none",
    autoHeight: false,
    orientation: "horizontal",
    gap: 4,
    peek: false,
    size: "md",
    controls: "auto",
    indicators: "dots",
    indicatorsPlacement: "below",
    autoPlay: false,
    announce: true,
    dir: "ltr",
    "aria-label": "Featured",
    defaultValue: 0,
  },
  render: ({ slidesPerView, slidesPerMove, ...args }, context) => (
    <div style={args.orientation === "vertical" ? { blockSize: verticalBoxHeight(context.viewMode) } : undefined}>
      <Demo {...args} slidesPerView={slidesPerView} slidesPerMove={slidesPerMove} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => carouselPlaygroundSnippet(context.args),
      },
    },
  },
};

/** The five size steps. */
export const Sizes: Story = {
  name: "All sizes",
  argTypes: { ...except("controls") },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
      {allSizes.map((size) => (
        <Demo key={size} size={size} controls={args.controls} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
  parameters: { docs: { source: { code: carouselSnippets.sizes } } },
};

export const SeveralInView: Story = {
  name: "Several in view",
  argTypes: { ...except("slidesPerView", "gap") },
  render: (args) => <Demo slidesPerView={args.slidesPerView} gap={args.gap} slides={8} aria-label="Several in view" />,
  args: { slidesPerView: 3 },
  parameters: { docs: { source: { code: carouselSnippets.severalInView } } },
};

export const SlidesPerMove: Story = {
  name: "A whole view at a time",
  argTypes: { ...except() },
  render: () => <Demo slidesPerView={2} slidesPerMove="view" slides={7} aria-label="A view at a time" />,
  parameters: { docs: { source: { code: carouselSnippets.slidesPerMove } } },
};

export const Peek: Story = {
  name: "Peeking at the next slide",
  argTypes: { ...except() },
  render: () => <Demo slidesPerView={2} peek aria-label="Peeking" />,
  parameters: { docs: { source: { code: carouselSnippets.peek } } },
};

export const Loop: Story = {
  name: "Looping with no seam",
  argTypes: { ...except() },
  render: () => <Demo loop aria-label="Looping" />,
  parameters: { docs: { source: { code: carouselSnippets.loop } } },
};

export const FractionalView: Story = {
  name: "A slide and a half in view",
  argTypes: { ...except("slidesPerView") },
  render: (args) => <Demo slidesPerView={args.slidesPerView} slides={6} aria-label="Fractional view" />,
  args: { slidesPerView: 1.5 },
  parameters: { docs: { source: { code: carouselSnippets.fractional } } },
};

export const Centered: Story = {
  name: "A centred slide",
  argTypes: { ...except("slidesPerView", "loop") },
  render: (args) => <Demo align="center" slidesPerView={args.slidesPerView} loop={args.loop} slides={7} aria-label="Centred" />,
  args: { slidesPerView: 2.5 },
  parameters: { docs: { source: { code: carouselSnippets.centered } } },
};

export const Lazy: Story = {
  name: "Lazy content",
  argTypes: { ...except() },
  render: () => (
    <Carousel aria-label="Lazy" lazy>
      {Array.from({ length: 12 }, (_, index) => (
        <Carousel.Slide key={index} placeholder={<DemoSlide.Panel index={index} placeholderLabel="Loading…" />}>
          <DemoSlide.Panel index={index} />
        </Carousel.Slide>
      ))}
    </Carousel>
  ),
  parameters: { docs: { source: { code: carouselSnippets.lazy } } },
};

export const Effects: Story = {
  name: "Fading and scaling at the edges",
  argTypes: { ...except("effect", "slidesPerView") },
  render: (args) => <Demo effect={args.effect} slidesPerView={args.slidesPerView} slides={7} aria-label="Effects" />,
  args: { effect: "fade-scale", slidesPerView: 2.5 },
  parameters: { docs: { source: { code: carouselSnippets.effect } } },
};

export const AutoHeight: Story = {
  name: "Vertical, with its height from its slides",
  argTypes: { ...except() },
  render: () => (
    <Carousel aria-label="Auto height" orientation="vertical" autoHeight slidesPerView={2}>
      {[0, 1, 2, 3, 4].map((index) => (
        <Carousel.Slide key={index}>
          <DemoSlide.Panel index={index} height={`calc(var(--dbm-space-8) * ${2 + (index % 3)})`} />
        </Carousel.Slide>
      ))}
    </Carousel>
  ),
  parameters: { docs: { source: { code: carouselSnippets.autoHeight } } },
};

export const Vertical: Story = {
  name: "Vertical",
  argTypes: { ...except() },
  render: (_args, context) => (
    <div style={{ blockSize: verticalBoxHeight(context.viewMode) }}>
      <Demo orientation="vertical" aria-label="Vertical" />
    </div>
  ),
  parameters: { docs: { source: { code: carouselSnippets.vertical } } },
};

export const ControlsInBar: Story = {
  name: "Buttons in a bar",
  argTypes: { ...except() },
  render: () => <Demo controls="bar" aria-label="Buttons in a bar" />,
  parameters: { docs: { source: { code: carouselSnippets.controlsInBar } } },
};

export const IndicatorsOverSlides: Story = {
  name: "Indicators over the slides",
  argTypes: { ...except() },
  render: () => <Demo indicators="bars" indicatorsPlacement="overlay" controls="hidden" aria-label="Indicators over the slides" />,
  parameters: { docs: { source: { code: carouselSnippets.indicatorsOverGallery } } },
};

export const AutoPlay: Story = {
  name: "Automatic rotation",
  argTypes: { ...except() },
  render: () => <Demo autoPlay={{ interval: 4000 }} aria-label="Automatic rotation" />,
  parameters: { docs: { source: { code: carouselSnippets.autoPlay } } },
};

export const Controlled: Story = {
  name: "Controlled",
  argTypes: { ...except() },
  render: function Render() {
    const [value, setValue] = useState(0);
    return (
      <div style={{ display: "grid", gap: "var(--dbm-space-3)" }}>
        <Demo value={value} onValueChange={setValue} aria-label="Controlled" />
        <span style={{ color: "var(--dbm-text-secondary)", fontFamily: "var(--dbm-font-family-primary)", fontSize: "var(--dbm-font-size-sm)" }}>
          First in view: {value}
        </span>
      </div>
    );
  },
  parameters: { docs: { source: { code: carouselSnippets.controlled } } },
};

export const FromAController: Story = {
  name: "Moved from a controller",
  argTypes: { ...except() },
  render: function Render() {
    const controller = useRef<CarouselController>(null);
    return (
      <div style={{ display: "grid", gap: "var(--dbm-space-3)" }}>
        <div>
          <Button variant="secondary" size="sm" onClick={() => controller.current?.goTo(2)}>
            Jump to the third
          </Button>
        </div>
        <Demo controllerRef={controller} aria-label="From a controller" />
      </div>
    );
  },
  parameters: { docs: { source: { code: carouselSnippets.controller } } },
};

export const PlacedParts: Story = {
  name: "Parts of your own",
  argTypes: { ...except() },
  render: () => (
    <Carousel aria-label="Parts of your own" controls="hidden" indicators={false}>
      <Carousel.Previous aria-label="Back one" />
      <Carousel.Indicators variant="outlined" />
      <Carousel.Next aria-label="Forward one" />
      {[0, 1, 2, 3, 4].map((index) => (
        <DemoSlide key={index} index={index} />
      ))}
    </Carousel>
  ),
  parameters: { docs: { source: { code: carouselSnippets.placedParts } } },
};

export const TranslatedText: Story = {
  name: "Translated text",
  argTypes: { ...except() },
  render: () => (
    <Demo
      aria-label="Destacados"
      labels={{
        track: "Diapositivas",
        slide: (n, total) => `Diapositiva ${n} de ${total}`,
        previous: "Anterior",
        next: "Siguiente",
        indicators: "Navegación",
        indicator: (n) => `Ir a la diapositiva ${n}`,
        announcement: (first, _last, total) => `Diapositiva ${first} de ${total}`,
      }}
    />
  ),
  parameters: { docs: { source: { code: carouselSnippets.labels } } },
};

export const RightToLeft: Story = {
  name: "Right-to-left",
  argTypes: { ...except() },
  render: () => <Demo dir="rtl" aria-label="Right-to-left" />,
  parameters: { docs: { source: { code: carouselSnippets.rtl } } },
};
