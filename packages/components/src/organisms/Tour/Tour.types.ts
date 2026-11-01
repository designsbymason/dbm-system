import type { SpaceValue, Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, RefObject, Ref } from "react";

/** Which side of the highlighted element the card sits on. Logical: `"start"` and `"end"` follow the text direction. */
export type TourSide = "top" | "bottom" | "start" | "end";

/** Alignment of the card along the chosen side. */
export type TourAlign = "start" | "center" | "end";

/**
 * How the card is placed.
 *
 * - `"anchored"` (the default) — beside the highlighted element, flipping to stay on the screen.
 * - `"docked"` — pinned across the bottom of the screen, with the highlighted element scrolled into the room above it.
 *   Use it on a phone, where there is nowhere beside a full-width element for a card to go.
 */
export type TourPresentation = "anchored" | "docked";

/** What the card shows for progress: `"text"` writes "Step 2 of 5" (the default), `"none"` shows nothing. */
export type TourProgress = "text" | "none";

/**
 * Why the tour changed.
 *
 * - `"finish"` — Finish was pressed on the last step.
 * - `"skip"` — Skip was pressed.
 * - `"escape"` — Escape was pressed.
 * - `"outside"` — the dimmed page was pressed, with `closeOnOutsidePress`.
 * - `"controller"` — code called `open()` or `close()` on the controller.
 */
export type TourChangeReason = "finish" | "skip" | "escape" | "outside" | "controller";

/** What `onOpenChange` is told besides the new state. */
export interface TourChangeDetails {
  /** Why the tour opened or closed. */
  reason: TourChangeReason;
  /** The step that was showing (or, for an opening, the step it opened on). */
  stepId: string | undefined;
}

/**
 * The element a step highlights: a CSS selector, an element, a ref or a function that returns one. A selector, a ref
 * or a function is looked up again whenever the step is shown, so it may name an element that appears a moment later
 * (see `targetTimeout`).
 */
export type TourTarget = string | HTMLElement | RefObject<HTMLElement | null> | (() => HTMLElement | null);

/** The text a tour writes itself, each part replaceable. Numbers it shows go through `formatNumber`. */
export interface TourLabels {
  /** The Next button's text. @default 'Next' */
  next: string;
  /** The Back button's text. @default 'Back' */
  back: string;
  /** The Skip button's text. @default 'Skip tour' */
  skip: string;
  /** The Next button's text on the last step. @default 'Finish' */
  finish: string;
  /** The progress text, written from the plain numbers. @default 'Step 2 of 5' */
  stepOf: (current: number, total: number) => string;
  /**
   * What a screen reader is told when the step changes: the progress and the step's title (plain text only).
   * Built on {@link TourLabels.stepOf}.
   */
  announcement: (current: number, total: number, title: string) => string;
  /** The card's accessible name for a step whose title is not plain text and has no `textValue`. @default 'Tour' */
  dialog: string;
}

/** One step of the tour. */
export interface TourStep {
  /** A name for the step, unique among the steps: it is the tour's `value`. */
  id: string;
  /**
   * The element to highlight. Leave it out for a step with no element (a welcome or a closing card): the card sits in
   * the middle of the screen and the whole page is dimmed.
   */
  target?: TourTarget;
  /** The step's heading. */
  title: ReactNode;
  /** The step's text, shown under the title. */
  content?: ReactNode;
  /**
   * The plain-text form of `title`, used for the screen-reader announcement and the card's name when `title` is not a
   * string.
   */
  textValue?: string;
  /**
   * Which side of the element the card sits on. It flips to the other side when there is no room.
   * @default 'bottom'
   */
  side?: TourSide;
  /**
   * Alignment along that side.
   * @default 'center'
   */
  align?: TourAlign;
  /**
   * Room between the element and the edge of the spotlight, a step on the spacing scale.
   * @default 2
   */
  padding?: SpaceValue;
  /**
   * Whether the person can use the highlighted element: a press inside the spotlight reaches it, and focus is not held
   * inside the card, so Tab can reach the element. The arrow keys then belong to the page, not the card.
   * @default false
   */
  interactive?: boolean;
  /** This step's own button text, over the tour's `labels`. */
  labels?: Partial<Pick<TourLabels, "next" | "back" | "skip" | "finish">>;
}

/** The controls `controllerRef` hands to code outside the tour. Its identity never changes. */
export interface TourController {
  /** Whether the tour is open now. */
  readonly isOpen: boolean;
  /** The id of the step showing now, or `undefined` when there are no steps. */
  readonly value: string | undefined;
  /** Opens the tour, on `stepId` or the first step. Returns whether anything changed. */
  open: (stepId?: string) => boolean;
  /** Closes the tour. Returns whether it was open. */
  close: () => boolean;
  /** Goes to the next step, or finishes on the last. Returns whether it was open. */
  next: () => boolean;
  /** Goes to the previous step. Returns whether there was one. */
  back: () => boolean;
  /** Goes to a step by id. Returns whether there is such a step and it is not already showing. */
  goTo: (stepId: string) => boolean;
}

export interface TourProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "title" | "content" | "dir" | "defaultValue"> {
  /** The steps, in order. An empty list draws nothing. Each `id` must be unique. */
  steps: TourStep[];
  /** Whether the tour is open. Omit it (with `defaultOpen`) and the tour keeps its own state, opened with the controller. */
  open?: boolean;
  /**
   * Whether it starts open, when uncontrolled.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the tour opens or closes, with the reason and the step. */
  onOpenChange?: (open: boolean, details: TourChangeDetails) => void;
  /** The id of the step showing. Omit it and the tour keeps its own, starting at `defaultValue` or the first step. */
  value?: string;
  /** The step to start on, when uncontrolled. @default The first step */
  defaultValue?: string;
  /** Called with a step's id when the person (or the controller) moves to it. */
  onValueChange?: (stepId: string) => void;
  /**
   * How the card is placed, or a mobile-first map of it by breakpoint (`{ base: "docked", md: "anchored" }`).
   * @default 'anchored'
   */
  presentation?: Responsive<TourPresentation>;
  /**
   * What the card shows for progress.
   * @default 'text'
   */
  progress?: TourProgress;
  /**
   * How dark the dimmed page is, 0 to 1.
   * @default 0.6
   */
  scrimOpacity?: number;
  /**
   * Whether pressing the dimmed page closes the tour. Off by default, so a stray press does not end it.
   * @default false
   */
  closeOnOutsidePress?: boolean;
  /**
   * How long, in milliseconds, to wait for a step's element to appear before showing the card in the middle of the
   * screen instead.
   * @default 1000
   */
  targetTimeout?: number;
  /** Called, once per step, when a step's element is not found within `targetTimeout`. */
  onTargetMissing?: (step: TourStep) => void;
  /**
   * The element the tour is drawn into, in place of `document.body`. Give it a box that is a containing block for fixed
   * descendants to hold a tour inside a demo.
   */
  container?: HTMLElement | null;
  /**
   * The text direction of the card and of `"start"`/`"end"`. Set, not read from the page.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /** The text the tour writes itself. See {@link TourLabels}. */
  labels?: Partial<TourLabels>;
  /** Writes the numbers the tour shows. @default String */
  formatNumber?: (value: number) => string;
  /** A controller for code outside the tour: open, close, next, back and go to a step. */
  controllerRef?: Ref<TourController>;
  /** Additional CSS classes, on the card. */
  className?: string;
  /** Inline styles, on the card. */
  style?: CSSProperties;
  /** Standard DOM id, on the card. */
  id?: string;
  /** Test identifier, on the card. */
  "data-testid"?: string;
  /** Names the card. By default it is named by the step's title. */
  "aria-label"?: string;
  /** Points at an element that names the card, in place of the step's title. */
  "aria-labelledby"?: string;
  /** Points at an element that describes the card, in place of the step's text. */
  "aria-describedby"?: string;
}
