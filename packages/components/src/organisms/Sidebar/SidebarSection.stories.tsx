import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";
import { preventNavigation } from "./SidebarStoryKit";

// Docs-only (guidelines/adr/0013). This resolves Section's own argTypes for its Properties table on the main Docs page.
const meta: Meta<typeof Sidebar.Section> = {
  title: "Components/Sidebar/Section",
  id: "organisms-navigation-sidebar-section",
  component: Sidebar.Section,
  tags: ["!dev"],
  argTypes: {
    label: { control: "text", description: "The section's heading, drawn above its items. In the rail it is hidden and a line sets the sections apart; it still names the list." },
    action: {
      control: false,
      description: "A control drawn at the end of the heading, such as an add IconButton: as Sidebar.Item's action. Not drawn in the rail.",
    },
    collapsible: {
      control: "boolean",
      description:
        "Makes the heading a button that folds the section's list away and brings it back, with a caret. The rail has no headings, so it always shows every list. The state is kept for the whole sidebar, so a fold on the page is the same in the phone panel.",
      table: { defaultValue: { summary: "false" } },
    },
    open: { control: false, description: "Whether a collapsible section is open (controlled). Pair with onOpenChange." },
    defaultOpen: {
      control: "boolean",
      description: "Whether a collapsible section starts open (uncontrolled).",
      table: { defaultValue: { summary: "true" } },
    },
    onOpenChange: { control: false, description: "Called with the new value when a collapsible section's heading is pressed." },
    value: {
      control: "text",
      description:
        "A name for this section's fold, kept for the whole sidebar so the page and the phone panel share it. Left out, it is the label, which is enough unless two sections have the same label, or the label is not plain text (then the page's copy and the panel's keep a fold each).",
    },
    children: { control: false, description: "The section's Sidebar.Items and Sidebar.Groups." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { label: "Workspace" },
};

export default meta;

type Story = StoryObj<typeof Sidebar.Section>;

export const Default: Story = {
  render: (args) => (
    <Sidebar collapseBelow="never">
      <Sidebar.Nav>
        <Sidebar.Section {...args}>
          <Sidebar.Item href="#a" onClick={preventNavigation}>
            Home
          </Sidebar.Item>
        </Sidebar.Section>
      </Sidebar.Nav>
    </Sidebar>
  ),
};
