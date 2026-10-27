import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Stepper } from "./Stepper";
import type { StepperProps } from "./Stepper.types";

export const steps: Array<[string, string]> = [
  ["account", "Account"],
  ["shipping", "Shipping"],
  ["payment", "Payment"],
  ["review", "Review"],
];

/** A stepper on Shipping with the four steps, unless given children. */
export function Basic({ children, ...props }: Partial<StepperProps> & { children?: ReactNode }) {
  return (
    <Stepper defaultValue="shipping" {...props}>
      {children ?? steps.map(([value, title]) => <Stepper.Step key={value} value={value} title={title} />)}
    </Stepper>
  );
}

/** The list item that holds the step with this title. */
export const item = (title: string) => screen.getByText(title).closest("li") as HTMLElement;
