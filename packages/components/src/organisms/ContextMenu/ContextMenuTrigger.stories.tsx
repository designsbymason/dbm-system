import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContextMenu } from "./ContextMenu";

// Docs-only — see ContextMenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof ContextMenu.Trigger> = {
  title: "Organisms/Overlay/ContextMenu/Trigger",
  component: ContextMenu.Trigger,
  tags: ["!dev"],
  argTypes: {
    asChild: {
      // A single element child is what asChild needs; the story's text child can't stand in for one.
      control: false,
      description:
        "Renders as a single provided child element (Radix Slot) instead of the built-in <span> — a row, a card or a canvas of your own.",
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      control: "text",
      description: "The area a right-click opens the menu from — a single element when asChild is set.",
    },
    disabled: {
      control: "boolean",
      description: "A disabled trigger opens nothing, and the browser's own context menu shows instead.",
      table: { defaultValue: { summary: "false" } },
    },
    tabIndex: {
      control: "number",
      description:
        "Makes the area reachable by keyboard. The context-menu key and Shift+F10 open the menu on the element that has focus, so an area that can't take focus can't be opened that way: set 0 here, or put the trigger on an element that is already focusable with asChild.",
    },
    "aria-label": {
      control: "text",
      description: "An accessible name for the area, when it is focusable and has no text of its own.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names the area.",
    },
    "aria-describedby": {
      control: false,
      description: "The id(s) of elements that describe the area.",
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
    children: "Right-click me",
  },
};

export default meta;

type Story = StoryObj<typeof ContextMenu.Trigger>;

export const Default: Story = {
  render: (args) => (
    <ContextMenu>
      <ContextMenu.Trigger {...args} />
      <ContextMenu.Content>
        <ContextMenu.Item>Edit</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu>
  ),
};
