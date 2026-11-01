import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menubar } from "../Menubar";

// Docs-only — see MenubarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menubar.Content> = {
  title: "Organisms/Navigation/Menubar/Content",
  component: Menubar.Content,
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
        "The row height and type size of every item, label and submenu in this menu. A submenu takes its parent's unless its own Menubar.SubContent sets one.",
      table: { defaultValue: { summary: "the bar's size" } },
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description:
        "Which side of the trigger the panel opens on — a single value, or a mobile-first map keyed by breakpoint (e.g. { base: 'bottom', lg: 'right' }). Radix flips it to the opposite side when there isn't room.",
      table: { defaultValue: { summary: '"bottom"' } },
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description:
        "Alignment along the chosen side: start lines the panel's start edge up with the trigger's.",
      table: { defaultValue: { summary: '"start"' } },
    },
    sideOffset: {
      control: "number",
      description: "Pixel gap between the trigger and the panel along side.",
      table: { defaultValue: { summary: "4" } },
    },
    alignOffset: {
      control: "number",
      description: "Pixel offset along align's own axis.",
      table: { defaultValue: { summary: "0" } },
    },
    avoidCollisions: {
      control: "boolean",
      description:
        "Whether the panel repositions itself to stay inside the viewport instead of overflowing it.",
      table: { defaultValue: { summary: "true" } },
    },
    collisionPadding: {
      control: "number",
      description:
        "Minimum distance, in pixels, kept between the panel and the viewport's edge while repositioning.",
      table: { defaultValue: { summary: "8" } },
    },
    collisionBoundary: {
      control: false,
      description:
        "Element(s) to use as the collision boundary instead of the viewport, such as a scrolling container the menu should stay inside.",
      table: { defaultValue: { summary: "[]" } },
    },
    hideWhenDetached: {
      control: "boolean",
      description:
        "Hides the panel when its trigger scrolls fully out of view, instead of leaving it floating.",
      table: { defaultValue: { summary: "false" } },
    },
    sticky: {
      control: "select",
      options: ["partial", "always"],
      description:
        "Whether the panel stays in the viewport on the alignment axis once the trigger has gone past an edge: partial lets it leave with its trigger, always keeps it fully on screen.",
      table: { defaultValue: { summary: '"partial"' } },
    },
    loop: {
      control: "boolean",
      description:
        "Whether arrow-key movement wraps from the last item to the first and back.",
      table: { defaultValue: { summary: "false" } },
    },
    container: {
      control: false,
      description:
        "The element the panel is portaled into. Defaults to document.body.",
    },
    onCloseAutoFocus: {
      control: false,
      description:
        "Called when focus would return to the trigger on close. Call event.preventDefault() to place it yourself.",
    },
    onEscapeKeyDown: {
      control: false,
      description:
        "Called when Escape is pressed while open. Call event.preventDefault() to keep the menu open.",
    },
    onPointerDownOutside: {
      control: false,
      description:
        "Called on a pointer press outside the panel. Call event.preventDefault() to keep the menu open.",
    },
    onFocusOutside: {
      control: false,
      description:
        "Called when focus moves outside the panel. Call event.preventDefault() to keep the menu open.",
    },
    onInteractOutside: {
      control: false,
      description:
        "Called on any interaction outside the panel. Call event.preventDefault() to keep the menu open.",
    },
    "aria-label": {
      control: "text",
      description:
        "An accessible name for the panel. By default it is named after its trigger.",
    },
    "aria-labelledby": {
      control: false,
      description:
        "The id of an element that names the panel. By default it is named after its trigger.",
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
      description:
        "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Menubar.Content>;

export const Default: Story = {
  render: (args) => (
    <Menubar aria-label="Application menu" defaultValue="file">
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content {...args}>
          <Menubar.Item>New</Menubar.Item>
          <Menubar.Item>Open</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  ),
};
