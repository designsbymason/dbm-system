import type { Meta, StoryObj } from "@storybook/react-vite";
import { Drawer } from "./Drawer";

// Docs-only — see DrawerRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Drawer.Title> = {
  title: "Components/Drawer/Title",
  id: "organisms-overlay-drawer-title",
  component: Drawer.Title,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "The title text. It names the drawer for assistive technology, so every drawer should have one.",
    },
    level: {
      control: "select",
      options: [1, 2, 3, 4, 5, 6],
      description: "The heading level it is rendered as (h1–h6). Pick the level that fits the page's outline; it doesn't change the size.",
      table: { defaultValue: { summary: "2" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"],
      description: "The text size, from Heading's scale.",
      table: { defaultValue: { summary: '"xl"' } },
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
    children: "Edit profile", level: 2, size: "xl",
  },
};

export default meta;

type Story = StoryObj<typeof Drawer.Title>;

export const Default: Story = {
  render: (args) => (
    <Drawer defaultOpen>
      <Drawer.Content aria-label="Example drawer">
        <Drawer.Header>
          <Drawer.Title {...args} />
        </Drawer.Header>
      </Drawer.Content>
    </Drawer>
  ),
};
