import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";

// Docs-only (guidelines/adr/0013). This resolves Toggle's own argTypes for its Properties table on the main Docs page.
const meta: Meta<typeof Sidebar.Toggle> = {
  title: "Components/Sidebar/Toggle",
  id: "organisms-navigation-sidebar-toggle",
  component: Sidebar.Toggle,
  tags: ["!dev"],
  argTypes: {
    collapseIcon: {
      control: false,
      description:
        "The icon while the sidebar is expanded, on the button that collapses it. Left out it is a caret pointing toward the edge the sidebar sits against (mirrored for side end and right-to-left text), so give one that does not depend on direction or mirror it yourself.",
    },
    expandIcon: {
      control: false,
      description: "The icon while the sidebar is a rail, on the button that expands it. Left out it is a caret pointing away from the edge the sidebar sits against.",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description: "The button's look: any IconButton variant, so it can match the icon buttons beside it.",
      table: { defaultValue: { summary: '"ghost"' } },
    },
    tone: {
      control: "select",
      options: ["brand", "neutral"],
      description: "The button's colour family: brand or neutral.",
      table: { defaultValue: { summary: '"neutral"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The button's size, on the same scale as IconButton. Defaults to the sidebar's own size.",
    },
    "aria-label": { control: "text", description: "The button's accessible name. Defaults to labels.collapse (Collapse sidebar) or labels.expand (Expand sidebar), whichever the press would do." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { variant: "ghost", tone: "neutral" },
};

export default meta;

type Story = StoryObj<typeof Sidebar.Toggle>;

export const Default: Story = {
  render: (args) => (
    <Sidebar collapseBelow="never">
      <Sidebar.Footer>
        <Sidebar.Toggle {...args} />
      </Sidebar.Footer>
    </Sidebar>
  ),
};
