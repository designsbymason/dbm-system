import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./Alert";

// Docs-only (guidelines/adr/0013) — `Alert.Action`'s own props get their own Properties table on Alert.mdx. Rendered inside a
// real `Alert`, whose tone, variant and size the action reads. Its Default column is set by hand: docgen can't trace a default
// through a compound sub-part's property-access `component`.
const meta: Meta<typeof Alert.Action> = {
  title: "Components/Alert/Action",
  id: "molecules-feedback-alert-action",
  component: Alert.Action,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The action's label — or, with asChild, the element it is drawn onto (a link, say).",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
      description:
        "How prominent it is, using Button's names: primary (a filled button, and on a solid alert an inverted one), secondary (an outlined one) or tertiary (text only). How each looks depends on the alert's tone and variant, so it always reads against it.",
      table: { defaultValue: { summary: '"primary"' } },
    },
    leadingIcon: {
      control: false,
      description: "An icon before the label — a component reference from @dbm-system/icons, not a string name. Takes the label's colour.",
    },
    trailingIcon: {
      control: false,
      description: "An icon after the label — a component reference from @dbm-system/icons. Takes the label's colour.",
    },
    isLoading: {
      control: "boolean",
      description: "Shows a spinner in place of the icons and disables the action while true.",
      table: { defaultValue: { summary: "false" } },
    },
    loadingText: {
      control: "text",
      description: "Replaces the label while isLoading is true.",
    },
    rounded: {
      control: "boolean",
      description: "Draws it fully round-ended, like a pill.",
      table: { defaultValue: { summary: "false" } },
    },
    fullWidth: {
      control: "boolean",
      description: "Stretches it to the full width of its container.",
      table: { defaultValue: { summary: "false" } },
    },
    asChild: {
      control: "boolean",
      description:
        "Draws the action onto your own single child element (a router's link, an anchor) instead of a button, keeping its look.",
      table: { defaultValue: { summary: "false" } },
    },
    type: {
      control: "select",
      options: ["button", "submit", "reset"],
      description: "The native button type.",
      table: { defaultValue: { summary: '"button"' } },
    },
    disabled: {
      control: "boolean",
      description: "Disables the action: it is dimmed, and cannot be activated.",
      table: { defaultValue: { summary: "false" } },
    },
    onClick: { control: false, description: "Called when the action is activated." },
    "aria-label": {
      control: "text",
      description: "Accessible name override, for an action whose visible content isn't readable text on its own.",
    },
    "aria-labelledby": { control: false, description: "The id of an element that labels this action." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { variant: "primary", isLoading: false, rounded: false, fullWidth: false, asChild: false, type: "button", disabled: false },
};

export default meta;

type Story = StoryObj<typeof Alert.Action>;

export const Default: Story = {
  render: (args) => (
    <Alert>
      <Alert.Description>Your card was declined.</Alert.Description>
      <Alert.Actions>
        <Alert.Action {...args}>Update card</Alert.Action>
      </Alert.Actions>
    </Alert>
  ),
};
