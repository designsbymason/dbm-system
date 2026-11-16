import { TrayIcon } from "@dbm-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./EmptyState";

// Docs-only (guidelines/adr/0013) — `EmptyState.Icon`'s own props get their own
// Properties table on EmptyState.mdx, separate from the umbrella table. Rendered
// inside a real `EmptyState` so the sub-part is shown in its real context.
const meta: Meta<typeof EmptyState.Icon> = {
  title: "Components/EmptyState/Icon",
  id: "molecules-data-display-emptystate-icon",
  component: EmptyState.Icon,
  tags: ["!dev"],
  argTypes: {
    icon: {
      control: false,
      description:
        "The Phosphor icon component to show — a component reference, not a string name, so unused icons stay tree-shaken and references are type-checked.",
    },
    label: {
      control: "text",
      description:
        "A text alternative for the icon. Unset by default, which hides the icon from assistive technology — right when the title already says what the icon shows. Set it only when the icon conveys something the text doesn't.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this icon.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    label: "",
  },
};

export default meta;

type Story = StoryObj<typeof EmptyState.Icon>;

export const Default: Story = {
  render: (args) => (
    <EmptyState>
      <EmptyState.Icon {...args} icon={TrayIcon} label={args.label || undefined} />
      <EmptyState.Title>No invoices yet</EmptyState.Title>
    </EmptyState>
  ),
};
