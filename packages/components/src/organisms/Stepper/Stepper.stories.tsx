import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { CreditCardIcon, PackageIcon, UserIcon } from "@dbm-system/icons";
import { Button } from "../../atoms/Button";
import { Stepper } from "./Stepper";
import { stepperPlaygroundSnippet, stepperSnippets } from "./Stepper.snippets";
import type {
  StepperCompact,
  StepperConnector,
  StepperController,
  StepperInteractive,
  StepperLabelAlignment,
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
  rounded: boolean;
  connector: StepperConnector;
  colorful: boolean;
  showLabels: boolean;
  labelPlacement: StepperLabelPlacement;
  labelAlignment: StepperLabelAlignment;
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
  controllerRef: StepperProps["controllerRef"];
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
const allTones: StepperTone[] = ["brand", "info", "highlight", "neutral"];

// A fixed-render story ignores its own args, so every control it can't honour is
// turned off (07-storybook-and-documentation-standards.md §5).
const off = { control: false } as const;
const noControls = {
  orientation: off,
  size: off,
  variant: off,
  tone: off,
  rounded: off,
  connector: off,
  colorful: off,
  showLabels: off,
  labelPlacement: off,
  labelAlignment: off,
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

/** How tall the Playground's demo box is: all the room the canvas has for the compact vertical form, nothing set otherwise. */
const playgroundBoxHeight = (args: Pick<PlaygroundArgs, "orientation" | "compact">, viewMode: string): string | undefined => {
  if (args.orientation !== "vertical" || args.compact === "never") return undefined;
  // The decorator pads the story by `space-6` and the canvas by 1rem, each side.
  return viewMode === "docs" ? "24rem" : "calc(100vh - 2 * var(--dbm-space-6) - 2rem)";
};

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
      options: ["brand", "info", "highlight", "neutral"],
      description: "The colour of the progress: finished steps, the current step and the line between finished steps. A step with an error is always red.",
      table: { defaultValue: { summary: '"brand"' } },
    },
    rounded: {
      control: "boolean",
      description: "Draws the indicators as circles. Turn it off for squares with rounded corners.",
      table: { defaultValue: { summary: "true" } },
    },
    connector: {
      control: "select",
      options: ["solid", "dashed", "none"],
      description: "The line between steps: solid, dashed, or none. The line leaving a skipped step is always dashed.",
      table: { defaultValue: { summary: '"solid"' } },
    },
    colorful: {
      control: "boolean",
      description:
        "Colours a finished step (and the line after it) success instead of the tone. The current step and a step that was started and left before it was completed keep the tone.",
      table: { defaultValue: { summary: "false" } },
    },
    showLabels: {
      control: "boolean",
      description:
        "Shows each step's title, description and Optional mark, and the compact summary's text. Off, the stepper is indicators alone: the text is hidden from the eye but still read by a screen reader, and a step's title shows in a tooltip on hover or focus.",
      table: { defaultValue: { summary: "true" } },
    },
    labelPlacement: {
      control: "select",
      options: ["end", "bottom"],
      if: { arg: "orientation", eq: "horizontal" },
      description: "Where a horizontal stepper puts each step's text: beside the indicator (end) or under it (bottom).",
      table: { defaultValue: { summary: '"end"' } },
    },
    labelAlignment: {
      control: "select",
      options: ["start", "center"],
      if: { arg: "compact", neq: "never" },
      description:
        "Where the compact horizontal summary puts its text: at the start of the row, with Back and Next side by side at the end, or centred, with Back at the start and Next at the end. Has no effect on the vertical form.",
      table: { defaultValue: { summary: '"start"' } },
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
      description:
        "Formats the numbers the stepper shows: the digit in an indicator, and the numbers in the labels it writes by default (stepOf, place and the labels built on them). The default is String.",
      table: { defaultValue: { summary: "" } },
    },
    labels: {
      control: false,
      description:
        "The text the component supplies itself, each part replaceable: navigation; stepOf and place (functions of a step's place and the total); summary, announcement and statusText (functions that write a whole sentence, so a translation chooses its own punctuation; by default they build on stepOf); complete, current, upcoming, error, warning, skipped and busy (the status words); previous, next and optional.",
    },
    controllerRef: {
      control: false,
      description:
        "Hands the stepper's controls (next, back, goTo and the current value) to code outside it, such as a Next button. Each asks for a change the way a click on a step does and says whether there was a step to ask for.",
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
    rounded: true,
    connector: "solid",
    colorful: false,
    showLabels: true,
    labelPlacement: "end",
    labelAlignment: "start",
    compact: "never",
    interactive: "none",
    announce: true,
    "aria-label": "Progress",
    dir: "ltr",
    defaultValue: "shipping",
  },
  render: (args, context) => (
    // The demo box. The compact vertical form fills the height it is given, so there the box takes all the room the
    // canvas has: the page's height standalone (less the story's own padding), a set height inside a Docs page. Any other
    // form takes its own height.
    <div style={{ blockSize: playgroundBoxHeight(args, context.viewMode) }}>
      <Stepper
        // Keyed by the starting step, so choosing another in the control restarts the (uncontrolled) stepper there.
        key={args.defaultValue}
        defaultValue={args.defaultValue}
        orientation={args.orientation}
        size={args.size}
        variant={args.variant}
        tone={args.tone}
        rounded={args.rounded}
        connector={args.connector}
        colorful={args.colorful}
        showLabels={args.showLabels}
        labelPlacement={args.orientation === "vertical" ? undefined : args.labelPlacement}
        compact={args.compact}
        labelAlignment={args.orientation === "vertical" || args.compact === "never" ? undefined : args.labelAlignment}
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
    </div>
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
  name: "With icons",
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

export const BusyAndWarning: Story = {
  name: "Busy and warning steps",
  argTypes: { ...except("variant") },
  render: (args) => (
    <Stepper defaultValue="payment" variant={args.variant} aria-label="Busy and warning">
      <Stepper.Step value="account" title="Account" />
      <Stepper.Step value="shipping" title="Shipping" status="warning" description="Address not verified" />
      <Stepper.Step value="payment" title="Payment" busy description="Checking your card" />
      <Stepper.Step value="review" title="Review" />
    </Stepper>
  ),
  parameters: { docs: { source: { code: stepperSnippets.busyAndWarning } } },
};

export const Square: Story = {
  name: "Square indicators",
  argTypes: { ...except("variant", "size") },
  render: (args) => <Demo rounded={false} variant={args.variant} size={args.size} aria-label="Square" />,
  parameters: { docs: { source: { code: stepperSnippets.square } } },
};

export const Connectors: Story = {
  name: "Dashed and hidden lines",
  argTypes: { ...noControls },
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <Demo connector="dashed" aria-label="Dashed" />
      <Demo connector="none" aria-label="No line" />
      <Stepper defaultValue="payment" aria-label="A skipped step">
        <Stepper.Step value="account" title="Account" />
        <Stepper.Step value="gift" title="Gift note" status="skipped" optional />
        <Stepper.Step value="payment" title="Payment" />
      </Stepper>
    </div>
  ),
  parameters: { docs: { source: { code: stepperSnippets.connectors } } },
};

export const ResponsiveOrientation: Story = {
  name: "Changing direction with the width",
  argTypes: { ...noControls },
  render: () => (
    <Demo orientation={{ base: "vertical", md: "horizontal" }} aria-label="Responsive direction" />
  ),
  parameters: { docs: { source: { code: stepperSnippets.responsiveOrientation } } },
};

/**
 * A flow that went to Payment and came back to Shipping: with `interactive="completed"` the steps passed on the way stay
 * finished, and Payment, the furthest step reached and not completed, is started. It starts at Payment and goes back once,
 * on mount, so the demo shows the state without a click.
 */
const WentBack = (props: DemoProps) => {
  const [value, setValue] = useState("payment");
  useEffect(() => {
    const timer = setTimeout(() => setValue("shipping"), 0);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Stepper value={value} onValueChange={setValue} interactive="completed" {...props}>
      {demoSteps.map(([step, title]) => (
        <Stepper.Step key={step} value={step} title={title} />
      ))}
      <Stepper.Step value="confirmation" title="Confirmation" />
    </Stepper>
  );
};

export const StartedStep: Story = {
  name: "A started step, after going back",
  argTypes: { ...except("size", "variant", "tone") },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <WentBack size={args.size} variant={args.variant} tone={args.tone} aria-label="Went back" />
      <WentBack size={args.size} variant={args.variant} tone={args.tone} orientation="vertical" aria-label="Went back, vertical" />
    </div>
  ),
  parameters: { docs: { source: { code: stepperSnippets.startedStep } } },
};

export const Colourful: Story = {
  name: "Colourful",
  argTypes: { ...except("size", "variant") },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <WentBack colorful size={args.size} variant={args.variant} aria-label="Colourful" />
      <WentBack colorful size={args.size} variant={args.variant} orientation="vertical" aria-label="Colourful, vertical" />
    </div>
  ),
  parameters: { docs: { source: { code: stepperSnippets.colourful } } },
};

/** Back and Next drive `value`; a finished step can be entered to go back. */
export const Controlled: Story = {
  name: "Controlled, with Back and Next",
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
  name: "With a router's link (asChild)",
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

export const CompactBack: Story = {
  name: "Compact, with Back and Next",
  argTypes: { ...noControls },
  render: () => <Demo compact="always" defaultValue="payment" interactive="all" aria-label="Compact with back and next" />,
  parameters: { docs: { source: { code: stepperSnippets.compactBack } } },
};

export const WithoutLabels: Story = {
  name: "Indicators only, without labels",
  argTypes: { ...except("size", "variant", "tone") },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <Demo showLabels={false} size={args.size} variant={args.variant} tone={args.tone} interactive="all" aria-label="Indicators only" />
      <Demo showLabels={false} size={args.size} variant={args.variant} tone={args.tone} compact="always" interactive="all" aria-label="Compact, no labels" />
      <div style={{ display: "flex", gap: "var(--dbm-space-8)" }}>
        <Demo showLabels={false} orientation="vertical" size={args.size} variant={args.variant} tone={args.tone} aria-label="Vertical, no labels" />
      </div>
    </div>
  ),
  parameters: { docs: { source: { code: stepperSnippets.withoutLabels } } },
};

export const CompactCentred: Story = {
  name: "Compact, with the text centred",
  argTypes: { ...noControls },
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <Demo compact="always" labelAlignment="center" defaultValue="payment" interactive="all" aria-label="Compact centred, interactive" />
      <Demo compact="always" labelAlignment="center" defaultValue="payment" aria-label="Compact centred, read only" />
    </div>
  ),
  parameters: { docs: { source: { code: stepperSnippets.compactCentred } } },
};

export const CompactNoLabels: Story = {
  name: "Compact, without labels",
  argTypes: { ...noControls },
  render: () => <Demo compact="always" showLabels={false} defaultValue="payment" interactive="all" aria-label="Compact, no labels, with buttons" />,
  parameters: { docs: { source: { code: stepperSnippets.compactNoLabels } } },
};

export const CompactVertical: Story = {
  name: "Compact and vertical, in one column",
  argTypes: { ...noControls },
  render: () => <Demo compact="always" orientation="vertical" defaultValue="payment" interactive="all" aria-label="Compact vertical" />,
  parameters: { docs: { source: { code: stepperSnippets.compactVertical } } },
};

export const CompactVerticalFull: Story = {
  name: "Compact and vertical, filling its container",
  argTypes: { ...noControls },
  render: () => (
    <div style={{ blockSize: "22rem", border: "1px dashed var(--dbm-border-default)", padding: "var(--dbm-space-2)" }}>
      <Demo compact="always" orientation="vertical" defaultValue="payment" interactive="all" aria-label="Compact vertical, full height" />
    </div>
  ),
  parameters: { docs: { source: { code: stepperSnippets.compactVerticalFull } } },
};

/** Next and Back are buttons of your own, outside the stepper; the controller asks for the change. */
export const WithController: Story = {
  name: "Next and Back from a controller",
  argTypes: { ...noControls },
  render: function ControllerStory() {
    const controller = useRef<StepperController>(null);
    return (
      <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
        <Demo controllerRef={controller} aria-label="Controller" />
        <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
          <Button variant="secondary" onClick={() => controller.current?.back()}>
            Back
          </Button>
          <Button onClick={() => controller.current?.next()}>Next</Button>
        </div>
      </div>
    );
  },
  parameters: { docs: { source: { code: stepperSnippets.controller } } },
};

export const NamedNav: Story = {
  name: "Naming the navigation",
  argTypes: { ...noControls },
  render: () => <Demo aria-label="Checkout progress" />,
  parameters: { docs: { source: { code: stepperSnippets.namedNav } } },
};

export const Translated: Story = {
  name: "Translated text",
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
  name: "Right-to-left",
  argTypes: { ...noControls },
  render: () => <Demo dir="rtl" aria-label="Right to left" />,
  parameters: { docs: { source: { code: stepperSnippets.rightToLeft } } },
};
