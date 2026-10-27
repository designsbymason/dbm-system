import { useEffect, useImperativeHandle, useMemo, useRef } from "react";
import type { Ref } from "react";
import type { StepperController } from "./Stepper.types";

interface StepperControllerOptions {
  controllerRef: Ref<StepperController> | undefined;
  values: string[];
  /** Whether each step, by position, is disabled. */
  disabled: boolean[];
  currentIndex: number;
  request: (value: string) => void;
}

/**
 * The controls `controllerRef` hands to code outside the stepper: one object for the stepper's life, whose methods read
 * the latest state (kept in a ref updated after each commit), so they never go stale and never change identity.
 */
export function useStepperController({ controllerRef, values, disabled, currentIndex, request }: StepperControllerOptions): void {
  const latest = useRef({ values, disabled, currentIndex, request });
  useEffect(() => {
    latest.current = { values, disabled, currentIndex, request };
  });
  const controller = useMemo<StepperController>(() => {
    const ask = (index: number): boolean => {
      const { values: all, disabled: off, currentIndex: now, request: send } = latest.current;
      if (index < 0 || index >= all.length || index === now || off[index]) return false;
      send(all[index]!);
      return true;
    };
    const find = (from: number, direction: 1 | -1): number => {
      const { values: all, disabled: off } = latest.current;
      for (let index = from + direction; index >= 0 && index < all.length; index += direction) {
        if (!off[index]) return index;
      }
      return -1;
    };
    return {
      get value() {
        const { values: all, currentIndex: now } = latest.current;
        return now >= 0 ? all[now] : undefined;
      },
      next: () => ask(find(latest.current.currentIndex, 1)),
      back: () => {
        const { currentIndex: now } = latest.current;
        return now > 0 && ask(find(now, -1));
      },
      goTo: (target) => ask(latest.current.values.indexOf(target)),
    };
  }, []);
  useImperativeHandle(controllerRef, () => controller, [controller]);
}
