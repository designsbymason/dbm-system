import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";
import { preventNavigation } from "./SidebarStoryKit";

// Docs-only (guidelines/adr/0013). This resolves Group's own argTypes for its Properties table on the main Docs page.
const meta: Meta<typeof Sidebar.Group> = {
  title: "Components/Sidebar/Group",
  id: "organisms-navigation-sidebar-group",
  component: Sidebar.Group,
  tags: ["!dev"],
  argTypes: {
    label: { control: "text", description: "The group's text, on the button that opens it. In the rail it is the title of the flyout and the button's tooltip." },
    children: { control: false, description: "The group's Sidebar.Items, and Sidebar.Groups nested in it (up to three levels)." },
    icon: { control: false, description: "An icon before the label. It is all the rail shows, so give every top-level group one." },
    badge: {
      control: false,
      description:
        "A badge for the group, shown while its items are out of sight: after the label while the group is shut, and on the icon in the rail. Anything Sidebar.Item's badge takes. Left out, it is the sum of the numeric badges of the items written inside it (none when there is no number among them); null shows nothing.",
    },
    action: {
      control: false,
      description: "A control drawn at the end of the group's button, outside it, such as an add IconButton: as Sidebar.Item's action. Not drawn in the rail.",
    },
    current: {
      control: "boolean",
      description: "Marks the group as holding the current page: the currentVariant look on its button while it is shut, and it starts open. It has no aria-current, since a button is not a page. Left out, it is worked out from the sidebar's currentPath and the href of the items written inside it; true or false here always wins.",
      table: { defaultValue: { summary: "false" } },
    },
    open: { control: false, description: "Whether the group is open (controlled). Pair with onOpenChange. Ignored in the rail, where the group is a flyout." },
    defaultOpen: {
      control: "boolean",
      description: "Whether the group starts open (uncontrolled). Left out it starts open when current.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: { control: false, description: "Called with the new value when the group's button is pressed." },
    disabled: {
      control: "boolean",
      description: "Makes the group's button inert: a native disabled button, so it leaves the tab order, unlike a disabled item.",
      table: { defaultValue: { summary: "false" } },
    },
    value: {
      control: "text",
      description:
        "A name for this group's open state, kept for the whole sidebar so the page and the phone panel share it. Left out, it is the label (under the labels of the groups it is inside), which is enough unless two groups beside each other have the same label.",
    },
    id: { control: "text", description: "Standard DOM id, on the group's button." },
    className: { control: false, description: "Additional CSS classes, on the group's button." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { label: "Reports", current: false, disabled: false },
};

export default meta;

type Story = StoryObj<typeof Sidebar.Group>;

export const Default: Story = {
  render: (args) => (
    <Sidebar collapseBelow="never" onClick={preventNavigation}>
      <Sidebar.Nav>
        <Sidebar.Group {...args}>
          <Sidebar.Item href="#sales">Sales</Sidebar.Item>
          <Sidebar.Item href="#costs">Costs</Sidebar.Item>
        </Sidebar.Group>
      </Sidebar.Nav>
    </Sidebar>
  ),
};
