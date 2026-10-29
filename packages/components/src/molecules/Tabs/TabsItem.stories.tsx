import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../../atoms/Text";
import { Tabs } from "./Tabs";

// Docs-only (guidelines/adr/0013) — `Tabs.Item`'s own props get their own Properties table on Tabs.mdx.
// Rendered inside a real `Tabs.List`, whose settings its trigger reads.
const meta: Meta<typeof Tabs.Item> = {
  title: "Molecules/Navigation/Tabs/Item",
  component: Tabs.Item,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "One Tabs.Trigger: the tab this item holds.",
    },
    action: {
      control: false,
      description:
        "A control drawn at the tab's end, beside the tab button and not inside it (a button inside a button is invalid HTML), such as a close button. It is the caller's own element: give it tabIndex={-1} so the tab list stays one tab stop. It is hidden from assistive technology (a tablist may own only tabs), so it is a pointer shortcut: give what it does a key on the focused tab or a menu as well. The tab makes room for it, so the label never runs under it.",
    },
    className: { control: false, description: "Additional CSS classes for customization, applied to the item's wrapper." },
    style: { control: false, description: "Inline styles, merged onto the item's wrapper." },
    id: { control: false, description: "Standard DOM id, on the item's wrapper." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Tabs.Item>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview">
      <Tabs.List aria-label="Project">
        <Tabs.Item
          action={
            <button type="button" tabIndex={-1} aria-label="Close Overview">
              ×
            </button>
          }
        >
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        </Tabs.Item>
        <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">
        <Text size="sm">A summary of the project.</Text>
      </Tabs.Content>
    </Tabs>
  ),
};
