import { useState } from "react";
import type { Ref } from "react";
import { Tour } from "./Tour";
import type { TourController, TourProps, TourStep } from "./Tour.types";

export const threeSteps: TourStep[] = [
  { id: "one", target: "#target-one", title: "First", content: "The first thing." },
  { id: "two", target: "#target-two", title: "Second", content: "The second thing." },
  { id: "three", title: "Last", content: "All done." },
];

/** A page with two elements to point at, and a tour that starts closed or open. */
export function Harness({
  steps = threeSteps,
  startOpen = true,
  onOpenChange,
  ...props
}: Partial<TourProps> & { startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <div>
      <button type="button" id="opener" onClick={() => setOpen(true)}>
        Start
      </button>
      <button type="button" id="target-one">
        One
      </button>
      <button type="button" id="target-two">
        Two
      </button>
      <Tour
        steps={steps}
        open={open}
        onOpenChange={(next, details) => {
          setOpen(next);
          onOpenChange?.(next, details);
        }}
        {...props}
      />
    </div>
  );
}

/** The same, with the controller handed out for the test to call. */
export function WithController({ controllerRef }: { controllerRef: Ref<TourController> }) {
  return (
    <div>
      <button type="button" id="target-one">
        One
      </button>
      <Tour steps={threeSteps} controllerRef={controllerRef} />
    </div>
  );
}
