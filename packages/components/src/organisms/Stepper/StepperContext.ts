import { createContext, useContext } from "react";
import type {
  StepperConnector,
  StepperLabelPlacement,
  StepperLabels,
  StepperOrientation,
  StepperSize,
  StepperTone,
  StepperVariant,
  StepStatus,
} from "./Stepper.types";

/** What the root hands every step. */
export interface StepperContextValue {
  size: StepperSize;
  variant: StepperVariant;
  tone: StepperTone;
  orientation: StepperOrientation;
  labelPlacement: StepperLabelPlacement;
  connector: StepperConnector;
  /** Whether the steps' text is shown. */
  showLabels: boolean;
  labels: StepperLabels;
  formatNumber: (value: number) => string;
  /** Asks for a step to become the current one. */
  request: (value: string) => void;
}

export const StepperContext = createContext<StepperContextValue | null>(null);

/** What the root works out about one step and hands to it. */
export interface StepPosition {
  /** Zero-based. */
  index: number;
  total: number;
  status: StepStatus;
  enterable: boolean;
}

export const StepPositionContext = createContext<StepPosition>({ index: 0, total: 1, status: "upcoming", enterable: false });

export const useStepperContext = (): StepperContextValue => {
  const context = useContext(StepperContext);
  if (!context) throw new Error("Stepper.Step must be used inside a Stepper.");
  return context;
};
