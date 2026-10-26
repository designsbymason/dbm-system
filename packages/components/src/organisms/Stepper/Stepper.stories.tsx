import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { CSSProperties } from "react";
import { CreditCardIcon, PackageIcon, UserIcon } from "@dbm-system/icons";
import { Button } from "../../atoms/Button";
import { Stepper } from "./Stepper";
import { stepperPlaygroundSnippet, stepperSnippets } from "./Stepper.snippets";
import type {
  StepperCompact,
  StepperInteractive,
  StepperLabelPlacement,
  StepperOrientation,
  StepperProps,
  StepperSize,
  StepperTone,
  StepperVariant,
} from "./Stepper.types";

// `Stepper.Step` gets its own Properties table via a hidden docs-only stories file
// (guidelines/adr/0013), where its argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  orientation: StepperOrientation;
  size: StepperSize;
  variant: StepperVariant;
  tone: StepperTone;
  labelPlacement: StepperLabelPlacement;
  compact: StepperCompact;
  interactive: StepperInteractive;
  announce: boolean;
  "aria-label": string;
  dir: "ltr" | "rtl";
  value: string;
  defaultValue: string;
  onValueChange: StepperProps["onValueChange"];
  formatNumber: StepperProps["formatNumber"];
  "aria-labelledby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
  labels: StepperProps["labels"];
  children: StepperProps["children"];
}

const demoSteps = [
  ["account", "Account"],
  ["shipping", "Shipping"],
  ["payment", "Payment"],
  ["review", "Review"],
] as const;

type DemoProps = Omit<StepperProps, "children">;

/** A small, real stepper the gallery stories vary. */
const Demo = (props: DemoProps) => (
  <Stepper defaultValue="shipping" {...props}>
    {demoSteps.map(([value, title]) => (
      <Stepper.Step key={value} value={value} title={title} />
    ))}
  </Stepper>
);

const allSizes: StepperSize[] = ["xs", "sm", "md", "lg", "xl"];
const allTones: StepperTone[] = ["brand", "info", "success", "highlight"];

// A fixed-render story ignores its own args, so every control it can't honour is
// turned off (07-storybook-and-documentation-standards.md §5).
const off = { control: false } as const;
const noControls = {
  orientation: off,
  size: off,
  variant: off,
  tone: off,
  labelPlacement: off,
  compact: off,
  interactive: off,
  announce: off,
  "aria-label": off,
  dir: off,
  value: off,
  defaultValue: off,
} as const;
/** The same, except the one axis a story does draw from its own args. */
const except = (...keys: Array<keyof typeof noControls>) =>
  Object.fromEntries(Object.entries(noControls).filter(([key]) => !keys.includes(key as keyof typeof noControls)));

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Navigation/Stepper",
  parameters: { layout: "padded" },
  argTypes: {
    children: {
      control: false,
      description: "The steps, in order: one Stepper.Step each.",
    },
    value: {
      control: false,
      description:
        "The value of the current step. Makes the stepper controlled: a click on a step asks through onValueChange and the current step changes only when this does.",
    },
    defaultValue: {
      control: "select",
      options: ["account", "shipping", "payment", "review"],
      description: "The value of the step that is current at first, when value is not set.",
      table: { defaultValue: { summary: "The first step" } },
    },
    onValueChange: { control: false, description: "Called with the value of a step the person chose to enter." },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "Which way the steps run.",
      table: { defaultValue: { summary: '"horizontal"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the indicators, text and gaps.",
      table: { defaultValue: { summary: '"md"' } },
    },
    variant: {
      control: "select",
      options: ["filled", "outlined"],
      description: "The look of the indicators: filled (a finished step is a solid disc with a check) or outlined (every indicator is a ring on the page).",
      table: { defaultValue: { summary: '"filled"' } },
    },
    tone: {
      control: "select",
      options: ["brand", "info", "success", "highlight"],
      description: "The colour of the progress: finished steps, the current step and the line between finished steps. A step with an error is always red.",
      table: { defaultValue: { summary: '"brand"' } },
    },
    labelPlacement: {
      control: "select",
      options: ["end", "bottom"],
      if: { arg: "orientation", eq: "horizontal" },
      description: "Where a horizontal stepper puts each step's text: beside the indicator (end) or under it (bottom).",
      table: { defaultValue: { summary: '"end"' } },
    },
    compact: {
      control: "select",
      options: ["never", "auto", "always"],
      description:
        'Collapses the stepper to a one-line summary above a row of segments: never (the default), auto (on a phone-width screen) or always. The summary is read-only.',
      table: { defaultValue: { summary: '"never"' } },
    },
    interactive: {
      control: "select",
      options: ["none", "completed", "all"],
      description:
        "Which steps can be entered: none (the default, progress only), completed (to go back) or all (every step but the current one). A disabled step can never be entered.",
      table: { defaultValue: { summary: '"none"' } },
    },
    announce: {
      control: "boolean",
      description: "Announces the step to a screen reader when the current step changes. Turn it off where the page already moves focus to the new step's content.",
      table: { defaultValue: { summary: "true" } },
    },
    formatNumber: {
      control: false,
      description: "Formats the numbers the stepper shows (the digit in an indicator, and the plain numbers in labels.stepOf).",
      table: { defaultValue: { summary: "" } },
    },
    labels: {
      control: false,
      description:
        "The text the component supplies itself, each part replaceable: navigation, stepOf (a function of a step's place and the total), complete, current, upcoming, error, skipped and optional.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "The reading direction. Passed to the stepper rather than read from the page, so the line between steps and the order of the steps agree with the text.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    "aria-label": {
      control: "text",
      description: "The nav's accessible name, overriding labels.navigation. Give each stepper a distinct name when a page holds more than one.",
    },
    "aria-labelledby": { control: false, description: "The id of a visible element that names the nav, in place of aria-label." },
    id: { control: false, description: "Standard DOM id, on the nav." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    orientation: "horizontal",
    size: "md",
    variant: "filled",
    tone: "brand",
    labelPlacement: "end",
    compact: "never",
    interactive: "none",
    announce: true,
    "aria-label": "Progress",
    dir: "ltr",
    defaultValue: "shipping",
  },
  render: (args) => (
    <Stepper
      // Keyed by the starting step, so choosing another in the control restarts the (uncontrolled) stepper there.
      key={args.defaultValue}
      defaultValue={args.defaultValue}
      orientation={args.orientation}
      size={args.size}
      variant={args.variant}
      tone={args.tone}
      labelPlacement={args.orientation === "vertical" ? undefined : args.labelPlacement}
      compact={args.compact}
      interactive={args.interactive}
      announce={args.announce}
      aria-label={args["aria-label"]}
      dir={args.dir}
    >
      <Stepper.Step value="account" title="Account" description="Your details" />
      <Stepper.Step value="shipping" title="Shipping" description="Where it goes" />
      <Stepper.Step value="payment" title="Payment" description="Card or invoice" />
      <Stepper.Step value="review" title="Review" description="Check and place" />
    </Stepper>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => stepperPlaygroundSnippet(context.args),
      },
    },
  },
};

/** The five size steps. */
export const Sizes: Story = {
  name: "All sizes",
  argTypes: { ...except("tone", "variant") },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      {allSizes.map((size) => (
        <Demo key={size} size={size} tone={args.tone} variant={args.variant} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
  parameters: { docs: { source: { code: stepperSnippets.sizes } } },
};

export const Variants: Story = {
  name: "Variants",
  argTypes: { ...except("tone") },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <Demo variant="filled" tone={args.tone} aria-label="Filled" />
      <Demo variant="outlined" tone={args.tone} aria-label="Outlined" />
    </div>
  ),
  args: { tone: "brand" },
  parameters: { docs: { source: { code: stepperSnippets.variants } } },
};

export const Tones: Story = {
  argTypes: { ...except("variant") },
  render: (args) => (
    // The surface the tone colours were measured against: the highlight ring falls under 3:1 on the canvas.
    <div style={{ display: "grid", gap: "var(--dbm-space-6)", background: "var(--dbm-bg-surface)", padding: "var(--dbm-space-4)" }}>
      {allTones.map((tone) => (
        <Demo key={tone} tone={tone} variant={args.variant} aria-label={`Tone ${tone}`} />
      ))}
    </div>
  ),
  parameters: { docs: { source: { code: stepperSnippets.tones } } },
};

export const WithDescriptions: Story = {
  name: "With descriptions and an optional step",
  argTypes: { ...noControls },
  render: () => (
    <Stepper defaultValue="shipping" aria-label="Checkout">
      <Stepper.Step value="account" title="Account" description="Your details" />
      <Stepper.Step value="shipping" title="Shipping" description="Where it goes" />
      <Stepper.Step value="gift" title="Gift note" description="A message to include" optional />
      <Stepper.Step value="payment" title="Payment" description="Card or invoice" />
    </Stepper>
  ),
  parameters: { docs: { source: { code: stepperSnippets.descriptions } } },
};

export const WithIcons: Story = {
  argTypes: { ...noControls },
  render: () => (
    <Stepper defaultValue="shipping" aria-label="Checkout icons">
      <Stepper.Step value="account" title="Account" icon={UserIcon} />
      <Stepper.Step value="shipping" title="Shipping" icon={PackageIcon} />
      <Stepper.Step value="payment" title="Payment" icon={CreditCardIcon} />
    </Stepper>
  ),
  parameters: { docs: { source: { code: stepperSnippets.icons } } },
};

export const Vertical: Story = {
  argTypes: { ...except("size", "variant", "tone") },
  render: (args) => (
    <Stepper orientation="vertical" defaultValue="shipping" size={args.size} variant={args.variant} tone={args.tone} aria-label="Vertical">
      <Stepper.Step value="account" title="Account" description="Your details" />
      <Stepper.Step value="shipping" title="Shipping" description="Where it goes" />
      <Stepper.Step value="payment" title="Payment" description="Card or invoice" />
    </Stepper>
  ),
  parameters: { docs: { source: { code: stepperSnippets.vertical } } },
};

export const LabelsUnderneath: Story = {
  name: "Labels under the indicators",
  argTypes: { ...except("size") },
  render: (args) => <Demo labelPlacement="bottom" size={args.size} aria-label="Labels underneath" />,
  parameters: { docs: { source: { code: stepperSnippets.labelBottom } } },
};

export const Statuses: Story = {
  name: "Error, skipped and out-of-order steps",
  argTypes: { ...except("variant") },
  render: (args) => (
    <Stepper defaultValue="payment" variant={args.variant} aria-label="Statuses">
      <Stepper.Step value="account" title="Account" />
      <Stepper.Step value="shipping" title="Shipping" status="error" description="Choose a delivery address" />
      <Stepper.Step value="gift" title="Gift note" status="skipped" optional />
      <Stepper.Step value="payment" title="Payment" />
      <Stepper.Step value="review" title="Review" />
    </Stepper>
  ),
  parameters: { docs: { source: { code: stepperSnippets.statuses } } },
};

/** Back and Next drive `value`; a finished step can be entered to go back. */
export const Controlled: Story = {
  argTypes: { ...noControls },
  render: function ControlledStory() {
    const [step, setStep] = useState("shipping");
    const index = demoSteps.findIndex(([value]) => value === step);
    return (
      <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
        <Stepper value={step} onValueChange={setStep} interactive="completed" aria-label="Controlled">
          {demoSteps.map(([value, title]) => (
            <Stepper.Step key={value} value={value} title={title} />
          ))}
        </Stepper>
        <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
          <Button variant="secondary" disabled={index === 0} onClick={() => setStep(demoSteps[index - 1]![0])}>
            Back
          </Button>
          <Button disabled={index === demoSteps.length - 1} onClick={() => setStep(demoSteps[index + 1]![0])}>
            Next
          </Button>
        </div>
      </div>
    );
  },
  parameters: { docs: { source: { code: stepperSnippets.controlled } } },
};

export const Interactive: Story = {
  name: "Every step enterable",
  argTypes: { ...noControls },
  render: () => <Demo interactive="all" aria-label="Interactive" />,
  parameters: { docs: { source: { code: stepperSnippets.interactive } } },
};

export const AsRouterLink: Story = {
  argTypes: { ...noControls },
  render: () => (
    <Stepper defaultValue="shipping" interactive="completed" aria-label="Router links">
      <Stepper.Step value="account" title="Account" asChild>
        <a href="#account" onClick={(event) => event.preventDefault()}>
          Account
        </a>
      </Stepper.Step>
      <Stepper.Step value="shipping" title="Shipping" />
      <Stepper.Step value="payment" title="Payment" />
    </Stepper>
  ),
  parameters: { docs: { source: { code: stepperSnippets.asChild } } },
};

export const Compact: Story = {
  argTypes: { ...except("tone") },
  render: (args) => <Demo compact="always" tone={args.tone} aria-label="Compact" />,
  parameters: { docs: { source: { code: stepperSnippets.compact } } },
};

export const NamedNav: Story = {
  name: "Naming the navigation",
  argTypes: { ...noControls },
  render: () => <Demo aria-label="Checkout progress" />,
  parameters: { docs: { source: { code: stepperSnippets.namedNav } } },
};

export const Translated: Story = {
  argTypes: { ...noControls },
  render: () => (
    <Demo
      aria-label={undefined}
      labels={{
        navigation: "Progression",
        stepOf: (n, total) => `Étape ${n} sur ${total}`,
        complete: "terminée",
        current: "en cours",
        upcoming: "à venir",
      }}
    />
  ),
  parameters: { docs: { source: { code: stepperSnippets.translated } } },
};

export const RightToLeft: Story = {
  argTypes: { ...noControls },
  render: () => <Demo dir="rtl" aria-label="Right to left" />,
  parameters: { docs: { source: { code: stepperSnippets.rightToLeft } } },
};
