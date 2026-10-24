import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContextMenu } from "./ContextMenu";

// Docs-only — see ContextMenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof ContextMenu.SubContent> = {
  title: "Organisms/Overlay/ContextMenu/SubContent",
  component: ContextMenu.SubContent,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The submenu's items, labels, groups and separators.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The row height and type size of this submenu. By default it takes its parent menu's.",
    },
    sideOffset: {
      control: "number",
      description: "Pixel gap between the trigger and the submenu along the side it opens on.",
      table: { defaultValue: { summary: "0" } },
    },
    alignOffset: {
      control: "number",
      description: "Pixel offset along the submenu's alignment axis. The default lines the first item up with its trigger by cancelling the panel's own padding and border.",
      table: { defaultValue: { summary: "-5" } },
    },
    avoidCollisions: {
      control: "boolean",
      description: "Whether the submenu repositions itself (flips to the other side, or shifts) to stay inside the viewport instead of overflowing it.",
      table: { defaultValue: { summary: "true" } },
    },
    collisionBoundary: {
      control: false,
      description: "Element(s) to use as the collision boundary instead of the viewport, such as a scrolling container the menu should stay inside.",
      table: { defaultValue: { summary: "[]" } },
    },
    hideWhenDetached: {
      control: "boolean",
      description: "Hides the submenu when its trigger scrolls fully out of view, instead of leaving it floating.",
      table: { defaultValue: { summary: "false" } },
    },
    sticky: {
      control: "select",
      options: ["partial", "always"],
      description: "Whether the submenu stays in the viewport on the alignment axis once its trigger has gone past an edge: partial lets it leave with its trigger, always keeps it fully on screen.",
      table: { defaultValue: { summary: '"partial"' } },
    },
    onEscapeKeyDown: {
      control: false,
      description: "Called when Escape is pressed while the submenu is open. Call event.preventDefault() to keep it open.",
    },
    onPointerDownOutside: {
      control: false,
      description: "Called on a pointer press outside the submenu. Call event.preventDefault() to keep it open.",
    },
    onFocusOutside: {
      control: false,
      description: "Called when focus moves outside the submenu. Call event.preventDefault() to keep it open.",
    },
    onInteractOutside: {
      control: false,
      description: "Called on any interaction outside the submenu. Call event.preventDefault() to keep it open.",
    },
    loop: {
      control: "boolean",
      description: "Whether arrow-key movement wraps from the last item to the first and back.",
      table: { defaultValue: { summary: "false" } },
    },
    collisionPadding: {
      control: "number",
      description: "Minimum distance, in pixels, kept between the submenu and the viewport's edge while repositioning.",
      table: { defaultValue: { summary: "8" } },
    },
    container: {
      control: false,
      description: "The element the submenu is portaled into. Defaults to document.body.",
    },
    "aria-label": {
      control: "text",
      description: "An accessible name for the submenu. By default it is named after its trigger.",
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

type Story = StoryObj<typeof ContextMenu.SubContent>;

export const Default: Story = {
  render: (args) => (
    <ContextMenu>
      <ContextMenu.Trigger>Right-click me</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Sub open>
          <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
          <ContextMenu.SubContent {...args}>
            <ContextMenu.Item>Email</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
      </ContextMenu.Content>
    </ContextMenu>
  ),
};
