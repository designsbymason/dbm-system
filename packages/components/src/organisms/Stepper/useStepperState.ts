import { useAnnouncement } from "@dbm-system/utils";
import { useEffect, useRef, useState } from "react";
import type { StepperLabels } from "./Stepper.types";

interface StepperValueOptions {
  value: string | undefined;
  defaultValue: string | undefined;
  onValueChange: ((value: string) => void) | undefined;
  /** The steps' `value`s, in order. */
  values: string[];
}

/**
 * The current step, and the furthest one reached. Controlled when `value` is given: a request then only asks through
 * `onValueChange`, and the current step changes when the prop does.
 */
export function useStepperValue({ value: valueProp, defaultValue, onValueChange, values }: StepperValueOptions) {
  const controlled = valueProp !== undefined;
  const wasControlled = useRef(controlled);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && wasControlled.current !== controlled) {
      console.warn(
        `Stepper: changed from ${wasControlled.current ? "controlled" : "uncontrolled"} to ${controlled ? "controlled" : "uncontrolled"}. Decide between \`value\` and \`defaultValue\` for the stepper's life.`,
      );
    }
    wasControlled.current = controlled;
  }, [controlled]);
  const [inner, setInner] = useState<string | undefined>(defaultValue);
  const current = controlled ? valueProp : (inner ?? values[0]);
  const currentIndex = current === undefined ? -1 : values.indexOf(current);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && current !== undefined && values.length > 0 && currentIndex === -1) {
      console.warn(`Stepper: the value "${current}" matches no step, so every step is shown as not started.`);
    }
  }, [current, currentIndex, values.length]);

  // A click asks for a value; the stepper changes it only when it holds the state itself.
  const request = (next: string) => {
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };

  // The furthest step the person has been on: with `interactive="completed"` every step up to it can be entered, so after
  // going back they can go forward again. Set while rendering, from the current step, the way React asks for a value
  // derived from props and state.
  const [furthest, setFurthest] = useState(currentIndex);
  if (currentIndex > furthest) setFurthest(currentIndex);

  return { current, currentIndex, furthest, request };
}

interface StepAnnouncementOptions {
  announce: boolean;
  current: string | undefined;
  currentIndex: number;
  total: number;
  /** The current step's title as plain text, `""` when it has none. */
  title: string;
  labels: StepperLabels;
}

/**
 * The live-region text for a change of the current step: announced when the step changes between two states that were both
 * on screen, never on the first appearance (`06` §9, live regions).
 */
export function useStepAnnouncement({ announce, current, currentIndex, total, title, labels }: StepAnnouncementOptions): string {
  const { message, announce: say } = useAnnouncement();
  const announced = useRef<string | undefined>(undefined);
  const write = labels.announcement;
  useEffect(() => {
    const previous = announced.current;
    announced.current = current;
    if (!announce || previous === undefined || previous === current || currentIndex < 0) return;
    say(write(currentIndex + 1, total, title));
  }, [announce, current, currentIndex, say, title, total, write]);
  return message;
}
