import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../../atoms/Text";
import { Tabs } from "./Tabs";

// Docs-only (guidelines/adr/0013) — `Tabs.List`'s own props get their own
// Properties table on Tabs.mdx. Rendered inside a real `Tabs` (Radix's own
// context-scoped List throws outside one).
const meta: Meta<typeof Tabs.List> = {
  title: "Components/Tabs/List",
  id: "molecules-navigation-tabs-list",
  component: Tabs.List,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The Tabs.Trigger elements.",
    },
    loop: {
      control: "boolean",
      description:
        "Whether arrow-key navigation wraps around — End past the last tab lands on the first, and the reverse.",
      table: { defaultValue: { summary: "true" } },
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description:
        "Where the tabs sit within the list when they don't fill it: the leading edge, the middle, or the trailing edge.",
      table: { defaultValue: { summary: '"start"' } },
    },
    showScrollButtons: {
      control: "boolean",
      description:
        "Whether the scroll buttons appear at whichever edge currently has more tabs beyond it, while the list is scrollable. The edge fade is unaffected either way — arrow keys, and a touch or trackpad swipe, still scroll the list when this is false; only the pointer-only buttons are hidden.",
      table: { defaultValue: { summary: "true" } },
    },
    "aria-label": {
      control: "text",
      description:
        "The list's accessible name, announced with the tablist role. Name it when the page holds more than one set of tabs, or when the surrounding heading does not already say what they switch between.",
    },
    "aria-labelledby": {
      control: false,
      description:
        "The id of a visible element that names this list. Takes the place of aria-label when there is already a heading to point at.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this list.",
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
    loop: true,
    align: "start",
    showScrollButtons: true,
    "aria-label": "Project",
  },
};

export default meta;

type Story = StoryObj<typeof Tabs.List>;

export const Default: Story = {
  render: (args) => (
    <Tabs defaultValue="overview">
      <Tabs.List {...args}>
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">
        <Text size="sm">A summary of the project.</Text>
      </Tabs.Content>
    </Tabs>
  ),
};
