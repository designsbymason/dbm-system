import { useEffect, useImperativeHandle, useMemo, useRef } from "react";
import type { Ref } from "react";
import type { TourController } from "./Tour.types";
import type { TourState } from "./useTourState";

/**
 * The controls `controllerRef` hands to code outside the tour: one object for the tour's life, whose methods and getters
 * read the latest state, so they never go stale and never change identity.
 */
export function useTourController(controllerRef: Ref<TourController> | undefined, state: TourState): TourController {
  const latest = useRef(state);
  // Written after each commit: the getters below read it when called, not when rendered.
  useEffect(() => {
    latest.current = state;
  });
  const controller = useMemo<TourController>(
    () => ({
      get isOpen() {
        return latest.current.open;
      },
      get value() {
        return latest.current.step?.id;
      },
      open: (stepId) => latest.current.requestOpen("controller", stepId),
      close: () => latest.current.requestClose("controller"),
      next: () => latest.current.next(),
      back: () => latest.current.back(),
      goTo: (stepId) => latest.current.goTo(stepId),
    }),
    [],
  );
  useImperativeHandle(controllerRef, () => controller, [controller]);
  return controller;
}
