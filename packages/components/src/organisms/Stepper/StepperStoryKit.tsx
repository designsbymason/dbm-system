import { Stepper } from "./Stepper";
import type { StepperProps, StepperSize } from "./Stepper.types";

// What the stories file and the real-browser checks file share. A module that is not a stories file, so the runner loads
// each stories file on its own and this is drawn by both (`07-storybook-and-documentation-standards.md` §4.2).

/** The steps every demo draws, with the description the first three can show. */
export const demoSteps = [
  ["account", "Account", "Your details"],
  ["shipping", "Shipping", "Where it goes"],
  ["payment", "Payment", "Card or invoice"],
  ["review", "Review", undefined],
] as const;

export const allSizes: readonly StepperSize[] = ["xs", "sm", "md", "lg", "xl"];

export type DemoProps = Omit<StepperProps, "children"> & {
  /** Draws each step's description. */
  descriptions?: boolean;
};

/** A small, real stepper the gallery stories and the checks vary, starting on Shipping. */
export const Demo = ({ descriptions = false, ...props }: DemoProps) => (
  <Stepper defaultValue="shipping" {...props}>
    {demoSteps.map(([value, title, description]) => (
      <Stepper.Step key={value} value={value} title={title} description={descriptions ? description : undefined} />
    ))}
  </Stepper>
);
