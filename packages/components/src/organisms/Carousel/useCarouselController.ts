import { useImperativeHandle, useMemo, useRef } from "react";
import { useEffect } from "react";
import type { Ref } from "react";
import type { CarouselController } from "./Carousel.types";

interface ControllerState {
  value: number;
  count: number;
  max: number;
  request: (index: number) => boolean;
  step: (direction: 1 | -1) => boolean;
  hold: () => () => void;
}

/**
 * The controls `controllerRef` hands to code outside the carousel: one object for the carousel's life, whose methods read
 * the latest state (kept in a ref updated after each commit), so they never go stale and never change identity.
 */
export function useCarouselController(controllerRef: Ref<CarouselController> | undefined, state: ControllerState): void {
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  });
  const controller = useMemo<CarouselController>(
    () => ({
      get value() {
        return latest.current.value;
      },
      get count() {
        return latest.current.count;
      },
      next: () => latest.current.step(1),
      previous: () => latest.current.step(-1),
      hold: () => latest.current.hold(),
      goTo: (index) => Number.isInteger(index) && index >= 0 && index <= latest.current.max && latest.current.request(index),
    }),
    [],
  );
  useImperativeHandle(controllerRef, () => controller, [controller]);
}
