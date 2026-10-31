import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { Responsive, SpaceValue } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from "react";
import type { IndicatorsVariant } from "../../atoms/Indicators/Indicators.types";

/**
 * The size of the previous and next buttons, the pause button and the position indicators, on the standard 5-step scale
 * (`05-component-api-conventions.md` §2).
 */
export type CarouselSize = "xs" | "sm" | "md" | "lg" | "xl";

/** Which edge of the track a slide is kept at: its start, or its middle. */
export type CarouselAlign = "start" | "center";

/**
 * An effect drawn on the slides as they scroll towards the edges of the view: `"fade"` dims them, `"scale"` shrinks them
 * slightly, `"fade-scale"` does both. Drawn by the browser's scroll-linked animation where it has one (and left out where it
 * doesn't) and never under reduced motion.
 */
export type CarouselEffect = "none" | "fade" | "scale" | "fade-scale";

/** Which way the slides run. A `"vertical"` carousel needs a height from its container; the track fills it. */
export type CarouselOrientation = "horizontal" | "vertical";

/**
 * Where the previous and next buttons are drawn.
 *
 * - `"auto"` (the default) — over the slides from the `sm` breakpoint up, and left out below it, where a swipe and the
 *   indicators move the slides and the buttons would cover them.
 * - `"overlay"` — over the slides at every width.
 * - `"bar"` — in the row under the slides, beside the indicators.
 * - `"hidden"` — not drawn. A `Carousel.Previous` or `Carousel.Next` you place yourself is still drawn, in the bar.
 */
export type CarouselControls = "auto" | "overlay" | "bar" | "hidden";

/** Where the position indicators are drawn: `"below"` the slides (the default), or `"overlay"` over their lower edge. */
export type CarouselIndicatorsPlacement = "below" | "overlay";

/**
 * How the slides rotate by themselves. `true` is the default timing; an object sets it. A pause button is always drawn
 * while auto-play is on.
 */
export type CarouselAutoPlay = boolean | CarouselAutoPlayOptions;

/** The timing of automatic rotation. */
export interface CarouselAutoPlayOptions {
  /** How long a slide stays, in milliseconds. @default 5000 */
  interval?: number;
}

/**
 * The controls `controllerRef` hands to code outside the carousel, such as a button of your own. Each asks for a change
 * the way a press on the carousel's own button does — through `onValueChange` when the carousel is controlled, by moving
 * itself when it is not — and says whether there was a place to go (`false` at the end without `loop`, or with a single
 * position). The object is the same for the carousel's life, and its methods read the latest state.
 */
export interface CarouselController {
  /** The index of the first slide in view. */
  readonly value: number;
  /** How many slides there are. */
  readonly count: number;
  /** Asks for the next position (the first again from the last, with `loop`). */
  next: () => boolean;
  /** Asks for the previous position (the last again from the first, with `loop`). */
  previous: () => boolean;
  /** Asks for the slide at this index to be the one at the track's edge, unless it is the current one or out of range. */
  goTo: (index: number) => boolean;
  /**
   * Holds automatic rotation until the returned function is called, for content the carousel can't see (a player of your
   * own, a form being filled in). Holds add up: rotation resumes when every one has been released. A `<video>` or `<audio>`
   * element playing in a slide holds it without this. Calling the release twice does nothing.
   */
  hold: () => () => void;
}

/**
 * The text `Carousel` supplies itself, translatable through the `labels` prop (`ADR-0021`). A label that needs numbers
 * is a function of the plain numbers.
 */
export interface CarouselLabels {
  /** The accessible name of the scrolling track of slides. @default 'Slides' */
  track: string;
  /** The accessible name of one slide, given its place and the number of slides. @default (n, total) => `${n} of ${total}` (through `formatNumber`) */
  slide: (position: number, total: number) => string;
  /**
   * The message announced when the slides in view change, given the places of the first and last slide in view and the
   * number of slides. @default 'Slide 3 of 8', or 'Slides 3 to 4 of 8' when more than one is in view (through `formatNumber`)
   */
  announcement: (first: number, last: number, total: number) => string;
  /** The accessible name of the previous button. @default 'Previous slide' */
  previous: string;
  /** The accessible name of the next button. @default 'Next slide' */
  next: string;
  /** The accessible name of the group of position indicators. @default 'Slide navigation' */
  indicators: string;
  /** The accessible name of the indicator for a position, given the place of the first slide it shows and the number of slides. @default (n) => `Go to slide ${n}` (through `formatNumber`) */
  indicator: (position: number, total: number) => string;
  /** The accessible name of the button that starts automatic rotation. @default 'Start automatic slide show' */
  play: string;
  /** The accessible name of the button that stops automatic rotation. @default 'Stop automatic slide show' */
  pause: string;
}

/** Props shared by the parts that draw a button or a group of the carousel's own. */
export interface CarouselPartProps {
  /** Standard DOM id. */
  id?: string;
  /** Extra class name on the part's element. */
  className?: string;
  /** Inline styles on the part's element. */
  style?: CSSProperties;
  /** Test hook, passed through to the part's element. */
  "data-testid"?: string;
}

export interface CarouselProps extends Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange" | "dir" | "children"> {
  /**
   * The slides: one `Carousel.Slide` each (or a component of your own that renders one), and optionally a `Carousel.Previous`,
   * `Next`, `Indicators` or `AutoPlayToggle` to replace the default of that kind. Every other element counts as a slide, so a
   * fragment holding several is one slide to the carousel; map over your data instead.
   */
  children?: ReactNode;
  /** The index of the first slide in view (or the one in the middle, with `align="center"`). Makes the carousel controlled: a press asks through `onValueChange` and the slides move when this does. */
  value?: number;
  /** The index of the first slide in view at first, when `value` is not set. @default 0 */
  defaultValue?: number;
  /** Called with the index of the first slide in view when the person (or `autoPlay`, or the controller) asks for a change, and when a swipe or scroll settles on another. */
  onValueChange?: (value: number) => void;
  /**
   * How many slides are in view at once. A breakpoint map is allowed (`{ base: 1, md: 3 }`), and so is a fraction: `1.5` shows a
   * slide and half of the next. Never less than 1, and clamped to the number of slides.
   * @default 1
   */
  slidesPerView?: Responsive<number>;
  /**
   * How many slides a press of next or previous moves, and so how many positions there are: `"view"` moves a whole view at a
   * time. The indicators show one per position.
   * @default 1
   */
  slidesPerMove?: number | "view";
  /**
   * Wraps round with no seam: from the last slide the next one is the first, and the first's previous is the last. Copies of
   * the slides at each end make it seamless (hidden from assistive technology and never pressable, so an `id` inside a slide
   * is repeated in them: don't point `aria-labelledby` at one), and a carousel that already shows every slide does not wrap.
   * @default false
   */
  loop?: boolean;
  /**
   * Which edge of the track a slide is kept at: its `"start"` (the default), or its `"center"`, with the slide before and after
   * showing at each side (give `slidesPerView` a fraction or an odd number to see them). With `"center"`, `value` is the slide in
   * the middle, any slide can be the value, and `peek` has no effect.
   * @default "start"
   */
  align?: CarouselAlign;
  /**
   * Draws a slide's content only when it is within this many slides of the view, and its `placeholder` before that, for a long
   * carousel of images or heavy content. `true` is one slide either side. A slide that has been drawn stays drawn.
   * @default false
   */
  lazy?: boolean | number;
  /**
   * Draws an effect on the slides as they scroll towards the edges of the view, where the browser supports scroll-linked
   * animation. Off under reduced motion.
   * @default "none"
   */
  effect?: CarouselEffect;
  /**
   * A vertical carousel takes its height from its slides: tall enough for `slidesPerView` of them at their own heights (the
   * tallest such window, so it never changes as it moves), instead of from its container. Has no effect on a horizontal one or
   * with `align="center"`.
   * @default false
   */
  autoHeight?: boolean;
  /** Keeps the previous and next buttons stepping while they are held, after a short delay. The click that ends a held press does not step once more. @default true */
  repeatOnHold?: boolean;
  /**
   * Gives a mouse drag past the first or last slide some resistance: the slides follow the pointer a little and ease back when
   * it lets go. Has no effect on a wrapping carousel, with `mouseDrag` off, or under reduced motion.
   * @default true
   */
  edgeResistance?: boolean;
  /** Lets a mouse drag the slides, as a finger does (touch and pen always scroll natively). A click that ends a drag is swallowed, and a press in a form field, a media element or `[data-carousel-no-drag]` never starts one. @default true */
  mouseDrag?: boolean;
  /** Which way the slides run. @default "horizontal" */
  orientation?: CarouselOrientation;
  /** The space between slides, a step of the spacing scale. @default 4 */
  gap?: SpaceValue;
  /** Shows the edge of the slide after the last one in view, to say there is more. That slide is pressable: tabbing into it scrolls it into view. @default false */
  peek?: boolean;
  /** The size of the buttons and indicators. @default "md" */
  size?: CarouselSize;
  /** Where the previous and next buttons are drawn. @default "auto" */
  controls?: CarouselControls;
  /** The look of the position indicators (`"bars"` suits a carousel of photos), or `false` for none. A `Carousel.Indicators` you place wins. @default "dots" */
  indicators?: IndicatorsVariant | false;
  /** Where the position indicators are drawn. @default "below" */
  indicatorsPlacement?: CarouselIndicatorsPlacement;
  /**
   * Rotates the slides by themselves, off by default. It pauses on hover, on focus inside and while the page is hidden,
   * starts paused when the person prefers reduced motion, and a pause button is always drawn. It wraps from the last
   * position to the first whatever `loop` is, and the position is not announced while it runs.
   * @default false
   */
  autoPlay?: CarouselAutoPlay;
  /** Announces the slides in view to a screen reader when they change by the person's own action. Turn it off where the page already moves focus to the new slide's content. @default true */
  announce?: boolean;
  /** Formats the numbers the carousel shows to a screen reader (`ADR-0021`). @default String */
  formatNumber?: (value: number) => string;
  /** The text the carousel writes itself. */
  labels?: Partial<CarouselLabels>;
  /** Receives the controls for code outside the carousel: `next()`, `previous()`, `goTo()` and the current `value`. */
  controllerRef?: Ref<CarouselController>;
  /** Text direction. Passed to the carousel's root and defaulted, not read from the page. @default "ltr" */
  dir?: "ltr" | "rtl";
  /** The accessible name of the carousel. Needs this or `aria-labelledby`. */
  "aria-label"?: string;
  /** The id of the element that names the carousel. */
  "aria-labelledby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Extra class name on the root element. */
  className?: string;
  /** Inline styles on the root element. */
  style?: CSSProperties;
  /** Test hook, passed through to the root element. */
  "data-testid"?: string;
}

export interface CarouselSlideProps extends ComponentPropsWithoutRef<"div"> {
  /** What the slide shows. */
  children?: ReactNode;
  /** What the slide draws in place of its content while it is far from the view and the carousel is `lazy`. Give the slide a size of its own, since a placeholder-only slide has none. */
  placeholder?: ReactNode;
  /** The accessible name of the slide, in place of "3 of 8". */
  "aria-label"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Extra class name on the slide. */
  className?: string;
  /** Inline styles on the slide. */
  style?: CSSProperties;
  /** Test hook, passed through to the slide. */
  "data-testid"?: string;
}

export interface CarouselPreviousProps extends CarouselPartProps {
  /** An icon in place of the arrow. */
  icon?: PhosphorIcon;
  /** The accessible name, in place of `labels.previous`. */
  "aria-label"?: string;
}

export interface CarouselNextProps extends CarouselPartProps {
  /** An icon in place of the arrow. */
  icon?: PhosphorIcon;
  /** The accessible name, in place of `labels.next`. */
  "aria-label"?: string;
}

export interface CarouselIndicatorsProps extends CarouselPartProps {
  /** The look of the indicators, in place of the carousel's `indicators`. */
  variant?: IndicatorsVariant;
  /** Where they are drawn, in place of the carousel's `indicatorsPlacement`. */
  placement?: CarouselIndicatorsPlacement;
  /** Shows a text progress label ("3/8") beside the indicators. @default false */
  showLabel?: boolean;
  /** The accessible name of the group, in place of `labels.indicators`. */
  "aria-label"?: string;
}

export type CarouselAutoPlayToggleProps = CarouselPartProps;
