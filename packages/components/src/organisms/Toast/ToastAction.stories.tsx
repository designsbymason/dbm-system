import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toast } from "./Toast";

// Docs-only (guidelines/adr/0013): resolves `Toast.Action`'s own argTypes for its sub-part Properties table.
const meta: Meta<typeof Toast.Action> = {
  title: "Components/Toast/Action",
  id: "organisms-feedback-toast-action",
  component: Toast.Action,
  tags: ["!dev"],
  argTypes: {
    children: { control: "text", description: "The action's label (or, with asChild, the element it is drawn onto)." },
    altText: {
      control: "text",
      description:
        "How to do the same thing without the toast — required. A toast goes away by itself, and a screen reader user or a keyboard user may never reach it in time, so this is read out with the toast in place of the button. The action must never be the only way.",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
      description:
        "How prominent it is, using the names Button uses for the same three treatments. How each looks depends on the toast's tone and variant, so that it always reads against it.",
      table: { defaultValue: { summary: '"primary"' } },
    },
    leadingIcon: {
      control: false,
      description:
        "An icon before the label, a component reference from @dbm-system/icons, not a string name. Takes the label's colour.",
    },
    trailingIcon: {
      control: false,
      description: "An icon after the label, a component reference from @dbm-system/icons. Takes the label's colour.",
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
    onClick: {
      control: false,
      description:
        "Called when it is pressed, and then the toast closes. Returning a promise holds the toast open while it runs (a spinner on the button, no second press, no timeout) and closes it when it resolves; a rejection keeps it open and goes to onClickError.",
    },
    onClickError: {
      control: false,
      description:
        "Called with what a promise returned by onClick rejected with. With none, the rejection is left unhandled so it surfaces where it can be seen rather than being dropped.",
    },
    asChild: {
      control: false,
      description: "Renders the action onto your own single child element instead of a button, a link to the page it belongs to, say.",
      table: { defaultValue: { summary: "false" } },
    },
    isLoading: {
      control: "boolean",
      description:
        "Shows a spinner in place of the icons and disables the action while true, as Button does. A promise returned from onClick holds the toast with its own spinner and does not need it.",
      table: { defaultValue: { summary: "false" } },
    },
    loadingText: {
      control: "text",
      description: "Replaces the label while isLoading is true.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the action: it is dimmed, and cannot be activated.",
      table: { defaultValue: { summary: "false" } },
    },
    type: {
      control: "select",
      options: ["button", "submit", "reset"],
      description: "The native button type.",
      table: { defaultValue: { summary: '"button"' } },
    },
    "aria-label": {
      control: "text",
      description: "Accessible name override, for an action whose visible content isn't readable text on its own.",
    },
    "aria-labelledby": { control: false, description: "The id of an element that labels this action." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    id: { control: false, description: "Standard DOM id." },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing. Rendered as the DOM data-testid attribute.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Toast.Action>;

export const Default: Story = {
  render: (args) => (
    <Toast.Provider>
      <Toast>
        <Toast.Title>Deleted</Toast.Title>
        <Toast.Action {...args} altText={args.altText ?? "Undo from the Edit menu"}>
          Undo
        </Toast.Action>
      </Toast>
    </Toast.Provider>
  ),
};
