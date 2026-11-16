import type { Meta, StoryObj } from "@storybook/react-vite";
import { Drawer } from "./Drawer";

// Docs-only — see DrawerRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Drawer.Description> = {
  title: "Components/Drawer/Description",
  id: "organisms-overlay-drawer-description",
  component: Drawer.Description,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "One or two sentences saying what the drawer is for. Read out after the title when the drawer opens.",
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
    children: "Changes are saved to your account.",
  },
};

export default meta;

type Story = StoryObj<typeof Drawer.Description>;

export const Default: Story = {
  render: (args) => (
    <Drawer defaultOpen>
      <Drawer.Content aria-label="Example drawer">
        <Drawer.Header>
          <Drawer.Description {...args} />
        </Drawer.Header>
      </Drawer.Content>
    </Drawer>
  ),
};
