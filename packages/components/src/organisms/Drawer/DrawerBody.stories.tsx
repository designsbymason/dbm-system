import type { Meta, StoryObj } from "@storybook/react-vite";
import { Drawer } from "./Drawer";

// Docs-only — see DrawerRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Drawer.Body> = {
  title: "Organisms/Overlay/Drawer/Body",
  component: Drawer.Body,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "The main content. It scrolls inside the panel while the header and footer stay put.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction of the scroll region, which decides the side the scrollbar sits on. Left out, the nearest DirectionProvider's, else left-to-right; not read from the page.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    "aria-label": {
      control: "text",
      description: "Accessible name for the scroll region, read when keyboard focus lands on a body that scrolls.",
    },
    "aria-labelledby": {
      control: "text",
      description: "Points to the id of an existing element that names the scroll region.",
    },
    id: {
      control: "text",
      description: "Standard DOM id.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization, on the scroll region's outer frame.",
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
    children: "Body content",
  },
};

export default meta;

type Story = StoryObj<typeof Drawer.Body>;

export const Default: Story = {
  render: (args) => (
    <Drawer defaultOpen>
      <Drawer.Content aria-label="Example drawer">
        <Drawer.Body {...args} />
      </Drawer.Content>
    </Drawer>
  ),
};
