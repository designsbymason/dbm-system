import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../../atoms/Text";
import { Tabs } from "./Tabs";

// Docs-only (guidelines/adr/0013) — `Tabs.Content`'s own props get their own
// Properties table on Tabs.mdx. Rendered inside a real `Tabs` with its own tab
// selected (Radix's own context-scoped Content throws outside one, and stays
// unmounted unless its tab is selected).
const meta: Meta<typeof Tabs.Content> = {
  title: "Components/Tabs/Content",
  id: "molecules-navigation-tabs-content",
  component: Tabs.Content,
  tags: ["!dev"],
  argTypes: {
    value: {
      control: false,
      description:
        "The value of the Tabs.Trigger this panel belongs to. It shows while that tab is selected.",
      type: { name: "string", required: true },
    },
    children: {
      control: false,
      description: "The panel's content.",
    },
    forceMount: {
      control: false,
      description:
        "Keeps the panel mounted while its tab is not selected, hidden from view and from assistive technology, instead of removing it from the DOM. Use it when a panel holds state that must survive switching away (a half-filled form, a scroll position, a video).",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when a test or router needs a stable anchor. Radix sets a default one, which the trigger's aria-controls points at — overriding it here would break that pairing.",
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
    value: "overview",
  },
};

export default meta;

type Story = StoryObj<typeof Tabs.Content>;

export const Default: Story = {
  render: (args) => (
    <Tabs defaultValue="overview">
      <Tabs.List aria-label="Project">
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content {...args}>
        <Text size="sm">A summary of the project.</Text>
      </Tabs.Content>
    </Tabs>
  ),
};
