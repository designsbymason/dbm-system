import type { Meta, StoryObj } from "@storybook/react-vite";
import { Drawer } from "./Drawer";

// Docs-only — see DrawerRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Drawer.Header> = {
  title: "Components/Drawer/Header",
  id: "organisms-overlay-drawer-header",
  component: Drawer.Header,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "The header's content, usually a Drawer.Title and optionally a Drawer.Description.",
    },
    id: {
      control: "text",
      description: "Standard DOM id.",
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
    children: "Header",
  },
};

export default meta;

type Story = StoryObj<typeof Drawer.Header>;

export const Default: Story = {
  render: (args) => (
    <Drawer defaultOpen>
      <Drawer.Content aria-label="Example drawer">
        <Drawer.Header {...args} />
      </Drawer.Content>
    </Drawer>
  ),
};
