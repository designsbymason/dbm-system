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
  StepperLabelPlacement,
  StepperOrientation,
  StepperShape,
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

  tones: `{/* tone: "brand" (default) | "info" | "success" | "highlight" — the colour of the progress.
    A step with an error is always red. Put "highlight" on a surface, not on the canvas. */}
${stepper('tone="success"')}`,

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

  square: `{/* shape: "circle" (default) | "square" — a square with rounded corners */}
${stepper('shape="square"')}`,

  connectors: `{/* connector: "solid" (default) | "dashed" | "none". The line leaving a skipped step is
    always dashed, since the flow did not run through it. */}
${stepper('connector="dashed"')}`,

  responsiveOrientation: `{/* orientation takes a mobile-first map by breakpoint: stacked on a phone, in a row from md up */}
${stepper('orientation={{ base: "vertical", md: "horizontal" }}')}`,

  compactBack: `{/* With interactive set, the compact summary gains a button that goes back a step */}
${stepper('compact="always" interactive="completed" defaultValue="payment"').replace('defaultValue="shipping" ', '')}`,

  controller: `{/* const controller = useRef<StepperController>(null);
    const [step, setStep] = useState("shipping");
    next(), back() and goTo(value) ask the way a click does — through onValueChange — and
    return whether there was a step to ask for. */}
<Stepper controllerRef={controller} value={step} onValueChange={setStep}>
${defaultSteps}
</Stepper>
<button onClick={() => controller.current?.next()}>Next</button>`,

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

  translated: `{/* labels holds every piece of text the component writes itself; formatNumber writes the digits */}
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
  shape?: StepperShape;
  connector?: StepperConnector;
  labelPlacement?: StepperLabelPlacement;
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
  if (args.shape && args.shape !== "circle") attributes.push(`shape="${args.shape}"`);
  if (args.connector && args.connector !== "solid") attributes.push(`connector="${args.connector}"`);
  if (args.labelPlacement && args.labelPlacement !== "end" && args.orientation !== "vertical") {
    attributes.push(`labelPlacement="${args.labelPlacement}"`);
  }
  if (args.compact && args.compact !== "never") attributes.push(`compact="${args.compact}"`);
  if (args.interactive && args.interactive !== "none") attributes.push(`interactive="${args.interactive}"`);
  if (args.announce === false) attributes.push("announce={false}");
  if (args["aria-label"] && args["aria-label"] !== "Progress") attributes.push(`aria-label=${quote(args["aria-label"])}`);
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  return stepper(attributes.join(" "));
}
