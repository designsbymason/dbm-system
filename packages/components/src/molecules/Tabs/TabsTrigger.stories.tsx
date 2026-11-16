import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../../atoms/Text";
import { Tabs } from "./Tabs";

// Docs-only (guidelines/adr/0013) — `Tabs.Trigger`'s own props get their own
// Properties table on Tabs.mdx. Rendered inside a real `Tabs.List` (Radix's own
// context-scoped Trigger throws outside one).
const meta: Meta<typeof Tabs.Trigger> = {
  title: "Components/Tabs/Trigger",
  id: "molecules-navigation-tabs-trigger",
  component: Tabs.Trigger,
  tags: ["!dev"],
  argTypes: {
    value: {
      control: false,
      description:
        "This tab's unique identifier within its Tabs — what value/defaultValue/onValueChange refer to, and what pairs it with the Tabs.Content that has the same value.",
      type: { name: "string", required: true },
    },
    children: {
      control: "text",
      description:
        "The tab's label. Optional only for an icon-only tab, which then needs an aria-label.",
    },
    icon: {
      control: false,
      description:
        "An icon shown before the label. Pass a Phosphor icon reference. It is decorative — the label names the tab — so an icon-only tab needs an aria-label instead.",
    },
    disabled: {
      control: "boolean",
      description:
        "Prevents this tab from being selected or focused. A disabled tab is skipped by Tab and by the arrow keys, like a natively disabled button.",
    },
    asChild: {
      control: false,
      description:
        "Renders the trigger's behaviour and styling onto a single provided child element instead of its own button — for a tab that must be another element, such as a link. The child's own content is the label, and icon is drawn inside the child, before it.",
      table: { defaultValue: { summary: "false" } },
    },
    "aria-label": {
      control: false,
      description:
        "The tab's accessible name. Required for an icon-only tab, which has no visible label to name it.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of a visible element that names this tab.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when a test or router needs a stable anchor. Radix sets a default one, which the panel's aria-labelledby points at — overriding it here would break that pairing.",
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
    children: "Overview",
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<typeof Tabs.Trigger>;

export const Default: Story = {
  render: (args) => (
    <Tabs defaultValue="overview">
      <Tabs.List aria-label="Project">
        <Tabs.Trigger {...args} />
        <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">
        <Text size="sm">A summary of the project.</Text>
      </Tabs.Content>
    </Tabs>
  ),
};
