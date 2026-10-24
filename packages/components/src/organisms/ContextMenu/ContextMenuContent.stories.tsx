import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContextMenu } from "./ContextMenu";

// Docs-only — see ContextMenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof ContextMenu.Content> = {
  title: "Organisms/Overlay/ContextMenu/Content",
  component: ContextMenu.Content,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The menu's items, labels, groups, separators and submenus.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "The row height and type size of every item, label and submenu in this menu. A submenu takes its parent's unless its own ContextMenu.SubContent sets one.",
      table: { defaultValue: { summary: '"md"' } },
    },
    alignOffset: {
      control: "number",
      description: "Pixel offset of the panel from the point that was pressed, along the pointer's own line (a context menu is placed at the pointer and takes no side, align or sideOffset).",
      table: { defaultValue: { summary: "0" } },
    },
    avoidCollisions: {
      control: "boolean",
      description: "Whether the panel repositions itself to stay inside the viewport instead of overflowing it.",
      table: { defaultValue: { summary: "true" } },
    },
    collisionPadding: {
      control: "number",
      description: "Minimum distance, in pixels, kept between the panel and the viewport's edge while repositioning.",
      table: { defaultValue: { summary: "8" } },
    },
    collisionBoundary: {
      control: false,
      description: "Element(s) to use as the collision boundary instead of the viewport, such as a scrolling container the menu should stay inside.",
      table: { defaultValue: { summary: "[]" } },
    },
    hideWhenDetached: {
      control: "boolean",
      description: "Hides the panel when the area it opened from scrolls fully out of view, instead of leaving it floating.",
      table: { defaultValue: { summary: "false" } },
    },
    sticky: {
      control: "select",
      options: ["partial", "always"],
      description: "Whether the panel stays in the viewport on the alignment axis once the area has gone past an edge: partial lets it leave with its trigger, always keeps it fully on screen.",
      table: { defaultValue: { summary: '"partial"' } },
    },
    loop: {
      control: "boolean",
      description: "Whether arrow-key movement wraps from the last item to the first and back.",
      table: { defaultValue: { summary: "false" } },
    },
    container: {
      control: false,
      description: "The element the panel is portaled into. Defaults to document.body.",
    },
    onCloseAutoFocus: {
      control: false,
      description: "Called when focus would return to where it was on close. Call event.preventDefault() to place it yourself.",
    },
    onEscapeKeyDown: {
      control: false,
      description: "Called when Escape is pressed while open. Call event.preventDefault() to keep the menu open.",
    },
    onPointerDownOutside: {
      control: false,
      description: "Called on a pointer press outside the panel. Call event.preventDefault() to keep the menu open.",
    },
    onFocusOutside: {
      control: false,
      description: "Called when focus moves outside the panel. Call event.preventDefault() to keep the menu open.",
    },
    onInteractOutside: {
      control: false,
      description: "Called on any interaction outside the panel. Call event.preventDefault() to keep the menu open.",
    },
    "aria-label": {
      control: "text",
      description: "An accessible name for the panel. A context menu has no trigger button to be named after, so name it when the area's own text would not say what the menu is for.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names the panel.",
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
};

export default meta;

type Story = StoryObj<typeof ContextMenu.Content>;

export const Default: Story = {
  render: (args) => (
    <ContextMenu>
      <ContextMenu.Trigger>Right-click me</ContextMenu.Trigger>
      <ContextMenu.Content {...args}>
        <ContextMenu.Item>Edit</ContextMenu.Item>
        <ContextMenu.Item>Duplicate</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu>
  ),
};
