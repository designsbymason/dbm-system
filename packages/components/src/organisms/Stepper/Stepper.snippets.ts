// The code shown under each story's "Show code" button on Stepper's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object plus demo-only helpers, which can't be pasted anywhere. Each
// snippet here is the smallest real usage of what its story shows — only exports
// of the package, no demo scaffolding — and `storySnippets.test.ts` checks that
// stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type {
  StepperCompact,
  StepperConnector,
  StepperInteractive,
  StepperLabelAlignment,
  StepperLabelPlacement,
  StepperOrientation,
  StepperSize,
  StepperTone,
  StepperVariant,
} from "./Stepper.types";

const step = (value: string, title: string, attributes = "") =>
  `  <Stepper.Step value="${value}" title="${title}"${attributes ? ` ${attributes}` : ""} />`;

const defaultSteps = [
  step("account", "Account"),
  step("shipping", "Shipping"),
  step("payment", "Payment"),
  step("review", "Review"),
].join("\n");

const stepper = (attributes = "", steps = defaultSteps) =>
  `<Stepper defaultValue="shipping"${attributes ? ` ${attributes}` : ""}>\n${steps}\n</Stepper>`;

export const stepperSnippets = {
  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — indicators, text and gaps */}
${stepper('size="lg"')}`,

  variants: `{/* variant: "filled" (default) — a finished step is a solid disc with a check
    | "outlined" — every indicator is a ring on the page */}
${stepper('variant="outlined"')}`,

  tones: `{/* tone: "brand" (default) | "info" | "highlight" | "neutral" — the colour of the progress.
    A step with an error is always red. Put "highlight" on a surface, not on the canvas. */}
${stepper('tone="info"')}`,

  descriptions: `{/* description: a line under the title. optional: marks a step that may be left out. */}
<Stepper defaultValue="shipping">
  <Stepper.Step value="account" title="Account" description="Your details" />
  <Stepper.Step value="shipping" title="Shipping" description="Where it goes" />
  <Stepper.Step value="gift" title="Gift note" description="A message to include" optional />
  <Stepper.Step value="payment" title="Payment" description="Card or invoice" />
</Stepper>`,

  icons: `{/* PackageIcon comes from @dbm-system/icons. An icon replaces the number on a step that is not
    finished; a finished step always shows its check. */}
<Stepper defaultValue="shipping">
  <Stepper.Step value="account" title="Account" icon={UserIcon} />
  <Stepper.Step value="shipping" title="Shipping" icon={PackageIcon} />
  <Stepper.Step value="payment" title="Payment" icon={CreditCardIcon} />
</Stepper>`,

  vertical: `{/* orientation: "horizontal" (default) | "vertical" — the text sits beside each indicator */}
<Stepper orientation="vertical" defaultValue="shipping">
  <Stepper.Step value="account" title="Account" description="Your details" />
  <Stepper.Step value="shipping" title="Shipping" description="Where it goes" />
  <Stepper.Step value="payment" title="Payment" description="Card or invoice" />
</Stepper>`,

  labelBottom: `{/* labelPlacement: "end" (default) | "bottom" — horizontal steppers only */}
${stepper('labelPlacement="bottom"')}`,

  statuses: `{/* status overrides what a step shows: "error", "complete" (finished out of order) or "skipped".
    The error is yours to set — Stepper does not read your form. */}
<Stepper defaultValue="payment">
  <Stepper.Step value="account" title="Account" />
  <Stepper.Step value="shipping" title="Shipping" status="error" description="Choose a delivery address" />
  <Stepper.Step value="gift" title="Gift note" status="skipped" optional />
  <Stepper.Step value="payment" title="Payment" />
  <Stepper.Step value="review" title="Review" />
</Stepper>`,

  busyAndWarning: `{/* busy shows a spinner while a check or save runs. status="warning" is a step that can
    be continued from but needs another look; "error" is one that must be fixed. */}
<Stepper defaultValue="payment">
  <Stepper.Step value="account" title="Account" />
  <Stepper.Step value="shipping" title="Shipping" status="warning" description="Address not verified" />
  <Stepper.Step value="payment" title="Payment" busy description="Checking your card" />
  <Stepper.Step value="review" title="Review" />
</Stepper>`,

  square: `{/* rounded is on by default: round indicators. rounded={false} draws squares with rounded corners. */}
${stepper("rounded={false}")}`,

  connectors: `{/* connector: "solid" (default) | "dashed" | "none". The line leaving a skipped step is
    always dashed, since the flow did not run through it. */}
${stepper('connector="dashed"')}`,

  responsiveOrientation: `{/* orientation takes a mobile-first map by breakpoint: stacked on a phone, in a row from md up */}
${stepper('orientation={{ base: "vertical", md: "horizontal" }}')}`,

  compactBack: `{/* With interactive set, the compact summary always shows Back and Next; one with nowhere to go is
    disabled. interactive="completed" enables Next only after going back, to a step already reached. */}
${stepper('compact="always" interactive="all" defaultValue="payment"').replace('defaultValue="shipping" ', '')}`,

  withoutLabels: `{/* showLabels={false}: indicators alone. The titles are hidden from the eye but still read by a screen reader
    (they name each step), and each shows in a Tooltip on hover or focus. The compact summary's text is hidden the same way. */}
${stepper('showLabels={false}')}`,

  compactCentred: `{/* labelAlignment: "start" (default) | "center". Centred, the text is in the middle of the row,
    with Back at the start and Next at the end (when interactive). Compact horizontal only. */}
${stepper('compact="always" labelAlignment="center" interactive="all" defaultValue="payment"').replace('defaultValue="shipping" ', '')}`,

  compactNoLabels: `{/* showLabels={false} with compact and interactive: Back and Next go at the two ends of the bars */}
${stepper('compact="always" showLabels={false} interactive="all" defaultValue="payment"').replace('defaultValue="shipping" ', '')}`,

  compactVertical: `{/* orientation="vertical" with compact: one column — Up, the bars, Down, then "3/4" as text */}
${stepper('compact="always" orientation="vertical" interactive="all" defaultValue="payment"').replace('defaultValue="shipping" ', '')}`,

  compactVerticalFull: `{/* In a container with a set height the compact vertical form fills it: the bars take the room
    between Up and Down, so Down and "3/4" sit at the bottom. */}
<div style={{ height: "22rem" }}>
${stepper('compact="always" orientation="vertical" interactive="all" defaultValue="payment"').replace('defaultValue="shipping" ', '')}
</div>`,

  controller: `{/* const controller = useRef<StepperController>(null);
    const [step, setStep] = useState("shipping");
    next(), back() and goTo(value) ask the way a click does — through onValueChange — and
    return whether there was a step to ask for. */}
<Stepper controllerRef={controller} value={step} onValueChange={setStep}>
${defaultSteps}
</Stepper>
<button onClick={() => controller.current?.next()}>Next</button>`,

  startedStep: `{/* With interactive="completed", after going back: the steps passed on the way stay finished, and the
    furthest step reached, if it was not completed, is started — a dashed ring. Give it status="complete" once it is.
    const [step, setStep] = useState("payment") — then setStep("shipping") when the person goes back. */}
<Stepper value={step} onValueChange={setStep} interactive="completed">
${defaultSteps}
</Stepper>`,

  savedDraft: `{/* status="started" is for a step you know was begun and not finished — a saved draft. It is drawn with a dashed
    ring and announced as "started, not completed", and with interactive="completed" it can be returned to. */}
<Stepper defaultValue="account" interactive="completed">
  <Stepper.Step value="account" title="Account" />
  <Stepper.Step value="shipping" title="Shipping" status="started" description="Saved draft" />
  <Stepper.Step value="payment" title="Payment" />
</Stepper>`,

  colourful: `{/* colorful: a finished step (and the line after it) is success; the current step and a started step keep
    the tone. */}
<Stepper colorful value={step} onValueChange={setStep} interactive="completed">
${defaultSteps}
</Stepper>`,

  controlled: `{/* const [step, setStep] = useState("shipping"); — a click asks through onValueChange and the
    current step changes when value does. interactive="completed" lets a person go back. */}
<Stepper value={step} onValueChange={setStep} interactive="completed">
${defaultSteps}
</Stepper>`,

  interactive: `{/* interactive: "none" (default) | "completed" | "all". An enterable step is a real button
    in the tab order; any other step has no focus stop. disabled blocks one step. */}
${stepper('interactive="all"')}`,

  asChild: `{/* asChild renders your own single child element as the step — here a plain <a>, standing in for
    your router's link component. Its text is the title; the indicator is drawn before it. */}
<Stepper defaultValue="shipping" interactive="completed">
  <Stepper.Step value="account" title="Account" asChild>
    <a href="/checkout/account">Account</a>
  </Stepper.Step>
  <Stepper.Step value="shipping" title="Shipping" />
</Stepper>`,

  compact: `{/* compact: "never" (default) | "auto" | "always". The summary — "Step 2 of 4 — Shipping" above a row
    of segments — replaces the steps on a phone-width screen ("auto") or everywhere ("always").
    It is read-only: its steps cannot be entered. */}
${stepper('compact="always"')}`,

  namedNav: `{/* Name each stepper when a page holds more than one */}
${stepper('aria-label="Checkout progress"')}`,

  translated: `{/* labels holds every piece of text the component writes itself; formatNumber writes the digits.
    The summary, announcement and statusText sentences build on stepOf unless you give them too. */}
${stepper(
  `labels={{ navigation: "Progression", stepOf: (n, total) => \`Étape \${n} sur \${total}\`, complete: "terminée", current: "en cours", upcoming: "à venir" }}`,
)}`,

  rightToLeft: `{/* dir="rtl" runs the steps right to left and the line fills from the right */}
${stepper('dir="rtl"')}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface StepperPlaygroundSnippetArgs {
  orientation?: StepperOrientation;
  size?: StepperSize;
  variant?: StepperVariant;
  tone?: StepperTone;
  rounded?: boolean;
  connector?: StepperConnector;
  colorful?: boolean;
  showLabels?: boolean;
  labelPlacement?: StepperLabelPlacement;
  labelAlignment?: StepperLabelAlignment;
  compact?: StepperCompact;
  interactive?: StepperInteractive;
  announce?: boolean;
  "aria-label"?: string;
  dir?: "ltr" | "rtl";
}

/** The Playground's snippet, built from its current controls: only the props that differ from their defaults. */
export function stepperPlaygroundSnippet(args: StepperPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.orientation && args.orientation !== "horizontal") attributes.push(`orientation="${args.orientation}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.variant && args.variant !== "filled") attributes.push(`variant="${args.variant}"`);
  if (args.tone && args.tone !== "brand") attributes.push(`tone="${args.tone}"`);
  if (args.rounded === false) attributes.push("rounded={false}");
  if (args.connector && args.connector !== "solid") attributes.push(`connector="${args.connector}"`);
  if (args.colorful) attributes.push("colorful");
  if (args.showLabels === false) attributes.push("showLabels={false}");
  if (args.labelPlacement && args.labelPlacement !== "end" && args.orientation !== "vertical") {
    attributes.push(`labelPlacement="${args.labelPlacement}"`);
  }
  if (args.compact && args.compact !== "never") attributes.push(`compact="${args.compact}"`);
  if (args.labelAlignment === "center" && args.compact && args.compact !== "never" && args.orientation !== "vertical") {
    attributes.push('labelAlignment="center"');
  }
  if (args.interactive && args.interactive !== "none") attributes.push(`interactive="${args.interactive}"`);
  if (args.announce === false) attributes.push("announce={false}");
  if (args["aria-label"] && args["aria-label"] !== "Progress") attributes.push(`aria-label=${quote(args["aria-label"])}`);
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  return stepper(attributes.join(" "));
}
