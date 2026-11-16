import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toast } from "./Toast";

// Docs-only (guidelines/adr/0013). This resolves a single `Toast`'s own argTypes for the main Properties table: the
// Playground's meta carries the provider's props and the options of `toast()` in one render.
const meta: Meta<typeof Toast> = {
  title: "Components/Toast/Root",
  id: "organisms-feedback-toast-root",
  component: Toast,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The message: Toast.Title, Toast.Description and Toast.Action in any order, any of them optional.",
    },
    tone: {
      control: "select",
      options: ["info", "success", "warning", "danger", "neutral"],
      description: "What the message is about. Each tone has its own icon and colours.",
      table: { defaultValue: { summary: '"info"' } },
    },
    variant: {
      control: "select",
      options: ["subtle", "outlined", "solid"],
      description: "How it is drawn. The provider's variant when left out.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Padding and type size. The provider's size when left out.",
    },
    icon: {
      control: false,
      description:
        "The icon before the message, a component reference from @dbm-system/icons. Each tone has its own; pass another to replace it, or false for none.",
    },
    loading: {
      control: "boolean",
      description: "Shows a spinner in place of the icon.",
      table: { defaultValue: { summary: "false" } },
    },
    dismissible: {
      control: "boolean",
      description: "Adds a button that dismisses it.",
      table: { defaultValue: { summary: "true" } },
    },
    duration: {
      control: false,
      description:
        "How long it stays, in milliseconds. null keeps it until it is dismissed. The provider's duration when left out.",
    },
    open: {
      control: "boolean",
      description: "Whether it is showing, when controlled. Pair with onOpenChange.",
    },
    defaultOpen: {
      control: "boolean",
      description: "Whether it starts out showing, when uncontrolled.",
      table: { defaultValue: { summary: "true" } },
    },
    onOpenChange: {
      control: false,
      description:
        "Called with false when it closes, and { reason }: timeout, dismiss, action, swipe, escape or programmatic. It never calls with true.",
    },
    onOpenChangeComplete: {
      control: false,
      description:
        "Called with true once it has finished arriving and with false once it has finished leaving and is out of the page. onOpenChange says a change started; this says it is over.",
    },
    role: {
      control: "select",
      options: ["alert", "status"],
      description:
        "How it is announced. alert interrupts, status waits for a pause. Follows the tone when left out: alert for danger and warning, status for the rest.",
    },
    dismissLabel: {
      control: "text",
      description: "The accessible name of the dismiss button, for this toast only. The provider's labels.dismiss when left out.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names the toast.",
    },
    "aria-describedby": {
      control: false,
      description: "The id of an element that describes it.",
    },
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

type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  render: (args) => (
    <Toast.Provider>
      <Toast {...args}>
        <Toast.Title>Saved</Toast.Title>
      </Toast>
    </Toast.Provider>
  ),
};
