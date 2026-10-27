import type { ReactElement } from "react";
import type { StepperInteractive, StepperLabels, StepperStepProps, StepStatus } from "./Stepper.types";

/**
 * The width at which `compact="auto"` switches, one pixel under the literal value of the breakpoint.sm primitive token
 * (the stylesheet's own `@media` condition says the same, and custom properties can't be used in one).
 */
export const COMPACT_QUERY = "(max-width: 639px)";

/**
 * The text the component writes itself, in English. The numbers go through `formatNumber`, so a step's digits and the
 * words that name it agree, and the labels that quote a step's place (`summary`, `announcement`, `statusText`) build on
 * the `stepOf` in use, so a translation of `stepOf` alone reaches all of them.
 */
export const defaultLabelsFor = (
  format: (value: number) => string,
  stepOfInUse?: StepperLabels["stepOf"],
): StepperLabels => {
  const stepOf = stepOfInUse ?? ((position: number, total: number) => `Step ${format(position)} of ${format(total)}`);
  return {
    navigation: "Progress",
    stepOf,
    summary: (position, total, title) => (title ? `${stepOf(position, total)} — ${title}` : stepOf(position, total)),
    announcement: (position, total, title) => (title ? `${stepOf(position, total)}: ${title}` : stepOf(position, total)),
    statusText: (position, total, words) => ` (${stepOf(position, total)}, ${words.join(", ")})`,
    place: (position, total) => `${format(position)}/${format(total)}`,
    complete: "completed",
    current: "current",
    upcoming: "not started",
    error: "has an error",
    warning: "has a warning",
    started: "started, not completed",
    skipped: "skipped",
    busy: "in progress",
    previous: "Previous step",
    next: "Next step",
    optional: "Optional",
  };
};

/** The plain text of a step's title, for the announcement and the summary: `textValue`, else a string or number title. */
export function titleText(props: Pick<StepperStepProps, "title" | "textValue">): string {
  if (props.textValue) return props.textValue;
  return typeof props.title === "string" || typeof props.title === "number" ? String(props.title) : "";
}

/**
 * Whether a step can be entered. `"completed"` allows every step the person has reached — the furthest one they have been
 * on and all before it, whatever they show, so a step with an error that was left behind can be gone back to and a step
 * that was gone back from can be returned to — and any step marked complete or started.
 */
export function canEnter(
  interactive: StepperInteractive,
  status: StepStatus,
  index: number,
  currentIndex: number,
  furthestIndex: number,
): boolean {
  if (interactive === "none" || index === currentIndex) return false;
  if (interactive === "all") return true;
  return index <= furthestIndex || status === "complete" || status === "started";
}

/** Scrolls `scroller` sideways just far enough for `element` to lie fully inside it. Nothing when it has no box (hidden). */
export function revealInline(scroller: HTMLElement, element: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;
  const box = scroller.getBoundingClientRect();
  const delta = rect.left < box.left ? rect.left - box.left : rect.right > box.right ? rect.right - box.right : 0;
  if (delta !== 0) scroller.scrollBy({ left: delta });
}

/**
 * The step's status when none is given: finished before the current step, current, then not started. With
 * `interactive="completed"` the steps after the current one that the person has reached stay finished, except the furthest
 * of them, which was started and left before it was completed.
 */
export function derivedStatus(
  step: ReactElement<StepperStepProps>,
  index: number,
  currentIndex: number,
  furthestIndex = currentIndex,
  interactive: StepperInteractive = "none",
): StepStatus {
  if (step.props.status) return step.props.status;
  if (index < currentIndex) return "complete";
  if (index === currentIndex) return "current";
  if (interactive === "completed" && index <= furthestIndex) return index === furthestIndex ? "started" : "complete";
  return "upcoming";
}
