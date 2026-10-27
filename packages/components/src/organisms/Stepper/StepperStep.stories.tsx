import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stepper } from "./Stepper";

// Docs-only (guidelines/adr/0013) — `Stepper.Step`'s own props get their own
// Properties table on Stepper.mdx. Rendered inside a real `Stepper`, whose
// context the step reads.
const meta: Meta<typeof Stepper.Step> = {
  title: "Organisms/Navigation/Stepper/Step",
  component: Stepper.Step,
  tags: ["!dev"],
  argTypes: {
    value: {
      control: "text",
      description: "This step's id: what Stepper's value and onValueChange use. Unique within the stepper.",
    },
    title: { control: "text", description: "The step's name. Also announced when the step becomes current, if it is plain text (or textValue is set)." },
    description: { control: "text", description: "A line of text under the title." },
    textValue: { control: "text", description: "The title as plain text, for the announcement and the compact summary, when title is not a string." },
    icon: { control: false, description: "An icon to draw in the indicator in place of the number. A finished step still shows its check." },
    status: {
      control: "select",
      options: [undefined, "complete", "started", "error", "warning", "skipped"],
      description:
        "Overrides what the step shows, in place of working it out from the current step: complete (finished out of order), started (begun and not finished, such as a saved draft: a dashed ring), error, warning or skipped.",
    },
    busy: {
      control: "boolean",
      description: "Shows a spinner in the indicator in place of its mark and marks the control aria-busy, for a step whose check or save is running. The status word for busy is added to what a screen reader hears.",
      table: { defaultValue: { summary: "false" } },
    },
    optional: { control: "boolean", description: "Marks the step as one that may be left out.", table: { defaultValue: { summary: "false" } } },
    disabled: { control: "boolean", description: "Stops the step being entered, whatever interactive says.", table: { defaultValue: { summary: "false" } } },
    asChild: {
      control: false,
      description: "Renders the step's clickable part onto its one child (a router's link) instead of a button. The child's own children become the title.",
      table: { defaultValue: { summary: "false" } },
    },
    children: { control: false, description: "Used only with asChild: the one element that becomes the step's clickable part." },
    onClick: { control: false, description: "Called when the step is chosen, before the stepper's onValueChange. preventDefault() stops the stepper asking for the change." },
    id: { control: false, description: "Standard DOM id, on the li." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { value: "shipping", title: "Shipping", description: "Where it goes", optional: false, disabled: false },
};

export default meta;

type Story = StoryObj<typeof Stepper.Step>;

export const Default: Story = {
  render: (args) => (
    <Stepper defaultValue="shipping">
      <Stepper.Step value="account" title="Account" />
      <Stepper.Step {...args} />
      <Stepper.Step value="payment" title="Payment" />
    </Stepper>
  ),
};
