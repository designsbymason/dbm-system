import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, MouseEvent, ReactNode } from "react";

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
 * The colour of the progress: finished steps, the current step and the line between finished steps. A step with an
 * error is always `danger`, whatever the tone.
 */
export type StepperTone = "brand" | "info" | "success" | "highlight";

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
 * The summary is read-only: its steps cannot be entered, whatever `interactive` says.
 */
export type StepperCompact = "never" | "auto" | "always";

/**
 * Which steps can be entered with a click or the keyboard.
 *
 * - `"none"` (the default) — none; the stepper only shows progress and has no focus stop.
 * - `"completed"` — the steps that are finished, to go back to one.
 * - `"all"` — every step but the current one, for a flow that may be done in any order.
 *
 * A step that is `disabled` can never be entered.
 */
export type StepperInteractive = "none" | "completed" | "all";

/** What a step shows. Worked out from the stepper's `value` unless a step sets its own `status`. */
export type StepStatus = "complete" | "current" | "upcoming" | "error" | "skipped";

/**
 * The text `Stepper` supplies itself, translatable through the `labels` prop (`ADR-0021`). A label that needs numbers
 * is a function of the plain numbers.
 */
export interface StepperLabels {
  /** The `<nav>`'s accessible name. @default 'Progress' */
  navigation: string;
  /** Where a step is in the flow, given its place and the number of steps. @default (n, total) => `Step ${n} of ${total}` */
  stepOf: (position: number, total: number) => string;
  /** Said after a finished step's title. @default 'completed' */
  complete: string;
  /** Said after the current step's title. @default 'current' */
  current: string;
  /** Said after a step that has not been reached. @default 'not started' */
  upcoming: string;
  /** Said after a step with an error. @default 'has an error' */
  error: string;
  /** Said after a step that was skipped. @default 'skipped' */
  skipped: string;
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
   * Which way the steps run.
   * @default 'horizontal'
   */
  orientation?: StepperOrientation;
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
  /** The title as plain text, for the announcement, when `title` is not a string. */
  textValue?: string;
  /** An icon to draw in the indicator in place of the number. A finished step still shows its check. */
  icon?: PhosphorIcon;
  /**
   * Overrides what the step shows, in place of working it out from the current step. `"error"` is for a step whose
   * content has a problem; `"complete"` for one finished out of order; `"skipped"` for one that was passed over.
   */
  status?: "complete" | "error" | "skipped";
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
