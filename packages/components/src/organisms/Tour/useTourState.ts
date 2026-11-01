import { useCallback, useEffect, useRef, useState } from "react";
import type { TourChangeDetails, TourChangeReason, TourStep } from "./Tour.types";

interface TourStateOptions {
  steps: TourStep[];
  openProp: boolean | undefined;
  defaultOpen: boolean;
  onOpenChange: ((open: boolean, details: TourChangeDetails) => void) | undefined;
  valueProp: string | undefined;
  defaultValue: string | undefined;
  onValueChange: ((stepId: string) => void) | undefined;
}

export interface TourState {
  open: boolean;
  step: TourStep | undefined;
  index: number;
  /** Opens (or, when open and given a step, moves to it). Returns whether anything changed. */
  requestOpen: (reason: TourChangeReason, stepId?: string) => boolean;
  /** Closes. Returns whether it was open. */
  requestClose: (reason: TourChangeReason) => boolean;
  /** Next step, or a finish on the last. */
  next: () => boolean;
  back: () => boolean;
  goTo: (stepId: string) => boolean;
}

/**
 * The tour's open state and current step, each controlled by its prop or kept here. Every action reads the latest state
 * through a ref, so the functions returned never change identity and the controller built on them never goes stale.
 * Closing an uncontrolled tour puts its step back at the start, so opening it again starts over.
 */
export function useTourState(options: TourStateOptions): TourState {
  const { steps, openProp, defaultOpen, valueProp } = options;
  const [openState, setOpenState] = useState(defaultOpen);
  const [valueState, setValueState] = useState<string | undefined>(options.defaultValue);
  const open = openProp ?? openState;
  const rawValue = valueProp ?? valueState;
  const found = rawValue === undefined ? 0 : steps.findIndex((candidate) => candidate.id === rawValue);
  const index = found < 0 ? 0 : found;
  const step = steps[index];

  const latest = useRef({ ...options, open, index });
  useEffect(() => {
    latest.current = { ...options, open, index };
  });

  const goTo = useCallback((stepId: string): boolean => {
    const current = latest.current;
    const target = current.steps.findIndex((candidate) => candidate.id === stepId);
    if (target < 0 || target === current.index) return false;
    if (current.valueProp === undefined) setValueState(stepId);
    current.onValueChange?.(stepId);
    return true;
  }, []);

  const requestOpen = useCallback(
    (reason: TourChangeReason, stepId?: string): boolean => {
      const current = latest.current;
      if (current.steps.length === 0) return false;
      if (current.open) return stepId === undefined ? false : goTo(stepId);
      if (current.openProp === undefined) setOpenState(true);
      if (stepId !== undefined) goTo(stepId);
      current.onOpenChange?.(true, { reason, stepId: stepId ?? current.steps[current.index]?.id });
      return true;
    },
    [goTo],
  );

  const requestClose = useCallback((reason: TourChangeReason): boolean => {
    const current = latest.current;
    if (!current.open) return false;
    if (current.openProp === undefined) setOpenState(false);
    const stepId = current.steps[current.index]?.id;
    if (current.valueProp === undefined) setValueState(current.defaultValue);
    current.onOpenChange?.(false, { reason, stepId });
    return true;
  }, []);

  const next = useCallback((): boolean => {
    const current = latest.current;
    if (!current.open) return false;
    const following = current.steps[current.index + 1];
    if (following) return goTo(following.id);
    return requestClose("finish");
  }, [goTo, requestClose]);

  const back = useCallback((): boolean => {
    const current = latest.current;
    const previous = current.steps[current.index - 1];
    return current.open && previous !== undefined && goTo(previous.id);
  }, [goTo]);

  return { open, step, index, requestOpen, requestClose, next, back, goTo };
}
