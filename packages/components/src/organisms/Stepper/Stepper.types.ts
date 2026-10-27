import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, MouseEvent, ReactNode, Ref } from "react";

/**
 * The size of the indicators, text and gaps, on the standard 5-step scale
 * (`05-component-api-conventions.md` §2).
 */
export type StepperSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * The look of the indicators.
 *
 * - `"filled"` (the default) — a finished step is a solid disc with a check; the current one is a ring on a soft tint.
 * - `"outlined"` — every indicator is a ring on the page surface; a finished step's check and the current step's
 *   number are in the tone's colour.
 */
export type StepperVariant = "filled" | "outlined";

/**
 * The colour of the progress: finished steps, the current step and the line between finished steps, and the soft tint
 * and border of a step not yet reached. `"neutral"` is grey. A step with an error is always `danger`, and one with a
 * warning `warning`, whatever the tone.
 */
export type StepperTone = "brand" | "info" | "success" | "highlight" | "neutral";

/** Which way the steps run. A `"vertical"` stepper puts each step's text beside its indicator. */
export type StepperOrientation = "horizontal" | "vertical";

/**
 * Where a horizontal stepper puts a step's text: `"end"` beside the indicator, `"bottom"` under it (centred). A
 * vertical stepper always puts the text beside the indicator.
 */
export type StepperLabelPlacement = "end" | "bottom";

/**
 * Whether the stepper collapses to a one-line summary ("Step 2 of 5 — Shipping") above a row of segments.
 *
 * - `"never"` (the default) — the full stepper at every width.
 * - `"auto"` — the full stepper from the `sm` breakpoint up, the summary on a phone-width screen.
 * - `"always"` — the summary at every width.
 *
 * The summary has no steps to enter. With `interactive` set it gains a back and a forward button, always both: one with
 * nowhere to go (to the nearest step before or after the current one that `interactive` lets a person enter; with
 * `"completed"` that is every step ahead of the furthest one reached) is disabled. When the width crosses the
 * `"auto"` breakpoint with focus inside the stepper, focus moves to the other form instead of being lost.
 */
export type StepperCompact = "never" | "auto" | "always";

/**
 * Which steps can be entered with a click or the keyboard.
 *
 * - `"none"` (the default) — none; the stepper only shows progress and has no focus stop.
 * - `"completed"` — the steps the person has reached: the furthest one they have been on and all before it (or marked
 *   complete), so they can go back to one and forward again. Steps they have not reached stay closed.
 * - `"all"` — every step but the current one, for a flow that may be done in any order.
 *
 * A step that is `disabled` can never be entered.
 */
export type StepperInteractive = "none" | "completed" | "all";

/**
 * The line between steps: `"solid"` (the default), `"dashed"`, or `"none"` to draw no line at all. Whatever this is,
 * the line leaving a skipped step is dashed, since the flow did not run through it.
 */
export type StepperConnector = "solid" | "dashed" | "none";

/** What a step shows. Worked out from the stepper's `value` unless a step sets its own `status`. */
export type StepStatus = "complete" | "current" | "upcoming" | "error" | "warning" | "skipped";

/**
 * The controls `controllerRef` hands to code outside the stepper, such as a Next button. Each asks for a change the way
 * a click on a step does — through `onValueChange` when the stepper is controlled, by moving itself when it is not — and
 * says whether there was a step to ask for (`false` for the last step's `next`, a disabled step, a `value` that matches
 * none). The object is the same for the stepper's life, and its methods read the latest state.
 */
export interface StepperController {
  /** The `value` of the current step, or `undefined` when none matches. */
  readonly value: string | undefined;
  /** Asks for the next step that is not disabled. */
  next: () => boolean;
  /** Asks for the nearest step before the current one that is not disabled. */
  back: () => boolean;
  /** Asks for the step with this `value`, unless it is the current step, disabled or missing. */
  goTo: (value: string) => boolean;
}

/**
 * The text `Stepper` supplies itself, translatable through the `labels` prop (`ADR-0021`). A label that needs numbers
 * is a function of the plain numbers.
 */
export interface StepperLabels {
  /** The `<nav>`'s accessible name. @default 'Progress' */
  navigation: string;
  /** Where a step is in the flow, given its place and the number of steps. @default (n, total) => `Step ${n} of ${total}` (the numbers through `formatNumber`) */
  stepOf: (position: number, total: number) => string;
  /**
   * The compact summary's text (horizontally, and read out vertically): a step's place and its title, given the plain
   * title (`""` when the step has none: see `textValue`). @default (n, total, title) => `Step ${n} of ${total} — ${title}`
   * (just the place when there is no title; the numbers through `formatNumber`). The place is written with `stepOf`.
   */
  summary: (position: number, total: number, title: string) => string;
  /**
   * The message announced when the current step changes, given the same three values as `summary`.
   * @default (n, total, title) => `Step ${n} of ${total}: ${title}` (just the place when there is no title)
   */
  announcement: (position: number, total: number, title: string) => string;
  /**
   * The text a screen reader hears after a step's title, given its place, the number of steps and the words for its
   * status (`labels.complete` and the like), with the `busy` words after it when the step is busy. Written as one string,
   * so a translation chooses its own punctuation. @default (n, total, words) => ` (Step ${n} of ${total}, ${words.join(", ")})`
   */
  statusText: (position: number, total: number, words: string[]) => string;
  /** Said after a finished step's title. @default 'completed' */
  complete: string;
  /** Said after the current step's title. @default 'current' */
  current: string;
  /** Said after a step that has not been reached. @default 'not started' */
  upcoming: string;
  /** Said after a step with an error. @default 'has an error' */
  error: string;
  /** Said after a step with a warning. @default 'has a warning' */
  warning: string;
  /** Said after a step that was skipped. @default 'skipped' */
  skipped: string;
  /**
   * The place of the current step in the compact vertical summary, which shows nothing else: given its place and the
   * number of steps. @default (n, total) => `${n}/${total}`
   */
  place: (position: number, total: number) => string;
  /** Said after a step that is `busy`. @default 'in progress' */
  busy: string;
  /** The accessible name of the compact summary's button that goes back a step. @default 'Previous step' */
  previous: string;
  /** The accessible name of the compact summary's button that goes forward a step. @default 'Next step' */
  next: string;
  /** The mark on a step that may be left out. @default 'Optional' */
  optional: string;
}

export interface StepperProps
  extends Omit<ComponentPropsWithoutRef<"nav">, "children" | "className" | "style" | "id" | "dir"> {
  /**
   * The steps, in order: one `Stepper.Step` each. Only `Stepper.Step` elements are drawn — a fragment or plain text
   * among them is ignored (with a warning in development).
   */
  children: ReactNode;
  /**
   * The `value` of the current step. Makes the stepper controlled: a click on a step asks through `onValueChange` and
   * the current step changes only when this does.
   */
  value?: string;
  /**
   * The `value` of the step that is current at first, when `value` is not set.
   * @default The first step
   */
  defaultValue?: string;
  /** Called with the `value` of a step the person chose to enter. */
  onValueChange?: (value: string) => void;
  /**
   * Which way the steps run. Takes a mobile-first map by breakpoint to change it with the width (`{ base:
   * "vertical", md: "horizontal" }`); it is worked out in the browser, so a server render and the first client
   * render draw the `base` value.
   * @default 'horizontal'
   */
  orientation?: Responsive<StepperOrientation>;
  /**
   * The size of the indicators, text and gaps.
   * @default 'md'
   */
  size?: StepperSize;
  /**
   * The look of the indicators — see {@link StepperVariant}.
   * @default 'filled'
   */
  variant?: StepperVariant;
  /**
   * The colour of the progress — see {@link StepperTone}.
   * @default 'brand'
   */
  tone?: StepperTone;
  /**
   * Draws the indicators as circles. Turn it off for squares with rounded corners. Matches the `rounded` prop on
   * `Button`, `IconButton` and `CloseButton`, except that the default here is on: a stepper's indicators are round
   * unless asked otherwise.
   * @default true
   */
  rounded?: boolean;
  /**
   * The line between steps — see {@link StepperConnector}.
   * @default 'solid'
   */
  connector?: StepperConnector;
  /**
   * Where a horizontal stepper puts each step's text — see {@link StepperLabelPlacement}.
   * @default 'end'
   */
  labelPlacement?: StepperLabelPlacement;
  /**
   * Whether the stepper collapses to a summary — see {@link StepperCompact}.
   * @default 'never'
   */
  compact?: StepperCompact;
  /**
   * Which steps can be entered — see {@link StepperInteractive}.
   * @default 'none'
   */
  interactive?: StepperInteractive;
  /**
   * Announces the step to a screen reader ("Step 3 of 5: Payment") when the current step changes. Turn it off where the
   * page already moves focus to the new step's content.
   * @default true
   */
  announce?: boolean;
  /**
   * Formats the numbers the stepper shows (the digit in an indicator, and the plain numbers in `labels.stepOf`).
   * @default String
   */
  formatNumber?: (value: number) => string;
  /** The text the component supplies itself, each part replaceable. See {@link StepperLabels}. */
  labels?: Partial<StepperLabels>;
  /**
   * Hands the stepper's controls — `next`, `back`, `goTo` and the current `value` — to code outside it, such as a
   * Next button. See {@link StepperController}. There is no hook for it: the only parts inside a stepper are its
   * steps' titles, so code that needs it is outside.
   */
  controllerRef?: Ref<StepperController>;
  /**
   * The reading direction. Passed to the stepper rather than read from the page, so the line between steps and the
   * order of the steps agree with the text.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /** The `<nav>`'s accessible name, overriding `labels.navigation`. Give each stepper a distinct name when a page holds more than one. */
  "aria-label"?: string;
  /** The id of a visible element that names the `<nav>`, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** Additional class names, merged after the component's own. */
  className?: string;
  /** Inline styles, applied to the `<nav>`. */
  style?: CSSProperties;
  /** A stable id on the `<nav>`. */
  id?: string;
  /** A test hook, passed straight through to the `<nav>`. */
  "data-testid"?: string;
}

export interface StepperStepProps
  extends Omit<ComponentPropsWithoutRef<"li">, "className" | "style" | "id" | "title" | "onClick"> {
  /** This step's id: what `Stepper`'s `value` and `onValueChange` use. Unique within the stepper. */
  value: string;
  /**
   * Used only with `asChild`: the one element (a router's link) that becomes the step's clickable part. Its own
   * children are the title, in place of the `title` prop.
   */
  children?: ReactNode;
  /** The step's name. Also announced when the step becomes current, if it is plain text (or `textValue` is set). */
  title: ReactNode;
  /** A line of text under the title. */
  description?: ReactNode;
  /** The title as plain text, for the announcement and the compact summary, when `title` is not a string. */
  textValue?: string;
  /** An icon to draw in the indicator in place of the number. A finished step still shows its check. */
  icon?: PhosphorIcon;
  /**
   * Overrides what the step shows, in place of working it out from the current step. `"error"` is for a step whose
   * content has a problem; `"warning"` for one that can go on but needs a second look; `"complete"` for one finished
   * out of order; `"skipped"` for one that was passed over.
   */
  status?: "complete" | "error" | "warning" | "skipped";
  /**
   * Shows a spinner in the indicator in place of its mark and marks the control `aria-busy`, for a step whose check or
   * save is running. The status word (`labels.busy`) is added to what a screen reader hears.
   * @default false
   */
  busy?: boolean;
  /** Marks the step as one that may be left out, with `labels.optional` beside its title. @default false */
  optional?: boolean;
  /** Stops the step being entered, whatever `interactive` says. @default false */
  disabled?: boolean;
  /**
   * Renders the step's clickable part onto its one child (a router's link) instead of a `<button>`. The child's own
   * children become the title, and the indicator is drawn before it. Has an effect only on a step that can be entered.
   * @default false
   */
  asChild?: boolean;
  /**
   * Called when the step is chosen, before the stepper's `onValueChange`. Calling `event.preventDefault()` stops the
   * stepper asking for the change.
   */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Additional class names, applied to the `<li>`. */
  className?: string;
  /** Inline styles, applied to the `<li>`. */
  style?: CSSProperties;
  /** A stable id on the `<li>`. */
  id?: string;
  /** A test hook, passed straight through to the `<li>`. */
  "data-testid"?: string;
}
