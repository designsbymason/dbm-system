import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button";
import { Drawer } from "./Drawer";

// Docs-only — see DrawerRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Drawer.Footer> = {
  title: "Components/Drawer/Footer",
  id: "organisms-overlay-drawer-footer",
  component: Drawer.Footer,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The footer's actions, usually Buttons, one of them a Drawer.Close.",
    },
    align: {
      control: "select",
      options: ["start", "end", "between", "stretch"],
      description: "Where the actions sit along the row. \"stretch\" makes each one fill an equal share, which suits a phone.",
      table: { defaultValue: { summary: '"end"' } },
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
    align: "end",
  },
};

export default meta;

type Story = StoryObj<typeof Drawer.Footer>;

export const Default: Story = {
  render: (args) => (
    <Drawer defaultOpen>
      <Drawer.Content aria-label="Example drawer">
        <Drawer.Footer {...args}>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>
          <Button>Save</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  ),
};
