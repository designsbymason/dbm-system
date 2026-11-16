import type { Meta, StoryObj } from "@storybook/react-vite";
import { Drawer } from "./Drawer";

// Docs-only — see DrawerRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Drawer.Content> = {
  title: "Components/Drawer/Content",
  id: "organisms-overlay-drawer-content",
  component: Drawer.Content,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The drawer's content: usually Drawer.Header, Drawer.Body and Drawer.Footer, any of them optional.",
    },
    side: {
      control: "select",
      options: ["start", "end", "top", "bottom"],
      description:
        "The edge the panel is attached to. start and end are logical (the left and right edges in left-to-right text, swapped in right-to-left); top and bottom span the width. A mobile-first map switches it at a breakpoint, e.g. { base: \"bottom\", md: \"end\" }.",
      table: { defaultValue: { summary: '"end"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "The panel's extent along its axis: its width for start and end, the most height it takes for top and bottom. A step of the scale, or a CSS length or a number of pixels for a size the scale doesn't have. On a smaller viewport a sliver of the page is left showing.",
      table: { defaultValue: { summary: '"md"' } },
    },
    swipeToDismiss: {
      control: "boolean",
      description:
        "Lets a touch or a pen drag the panel toward its edge to dismiss it, by its handle or header; a mouse can drag the handle only. A short drag settles back; a long or quick one closes it with the reason swipe. Off while busy.",
      table: { defaultValue: { summary: "true" } },
    },
    showHandle: {
      control: "boolean",
      description:
        "Draws a small grab handle on the inner edge of a top or bottom drawer. Decorative, and not drawn for a start or end drawer.",
      table: { defaultValue: { summary: "true" } },
    },
    divided: {
      control: "select",
      options: [false, true, "auto"],
      description:
        "Draws a line between the header and the body and between the body and the footer. \"auto\" draws each only while content is scrolled out of view on that side, and nothing moves when it appears.",
      table: { defaultValue: { summary: '"auto"' } },
    },
    busy: {
      control: "boolean",
      description:
        "Marks the drawer as working on something: Escape, the scrim, the close button and Drawer.Close do nothing until it is false again, the close button is aria-disabled (dimmed, still focusable), and the panel is aria-busy.",
      table: { defaultValue: { summary: "false" } },
    },
    keepMounted: {
      control: "boolean",
      description:
        "Keeps what is inside mounted while the drawer is closed, so a half-filled form or a scroll position is still there when it reopens. Rendered the first time it opens, then kept.",
      table: { defaultValue: { summary: "false" } },
    },
    initialFocus: {
      control: false,
      description:
        "An element to focus when the drawer opens, instead of the first focusable one. Ignored if onOpenAutoFocus prevents the default.",
    },
    scrimOpacity: {
      control: "select",
      options: [20, 40, 60, 80, 90],
      description: "How opaque the scrim behind a modal drawer is, from the opacity scale. No effect while modal is false.",
      table: { defaultValue: { summary: "60" } },
    },
    scrimBlur: {
      control: "boolean",
      description: "Blurs the page behind the scrim as well as dimming it. No effect while modal is false.",
      table: { defaultValue: { summary: "false" } },
    },
    showCloseButton: {
      control: "boolean",
      description: "Shows a CloseButton in the panel's top-end corner. On by default: a modal needs a visible way out.",
      table: { defaultValue: { summary: "true" } },
    },
    closeOnOutsideClick: {
      control: "boolean",
      description: "Whether a press outside the panel (on the scrim) closes the drawer. Set false for a form with unsaved changes.",
      table: { defaultValue: { summary: "true" } },
    },
    closeOnEscape: {
      control: "boolean",
      description: "Whether Escape closes the drawer.",
      table: { defaultValue: { summary: "true" } },
    },
    labels: {
      control: false,
      description: "The text the component supplies itself, each part replaceable: { close } for the close button's accessible name.",
      table: { defaultValue: { summary: "—" } },
    },
    container: {
      control: false,
      description: "Renders the drawer into a different DOM node than document.body — for a specific stacking-context requirement.",
    },
    onOpenAutoFocus: {
      control: false,
      description: "Called when focus moves into the drawer on open. Call event.preventDefault() to choose the element to focus yourself.",
    },
    onCloseAutoFocus: {
      control: false,
      description: "Called when focus would return to the trigger on close. Call event.preventDefault() to send focus elsewhere.",
    },
    onEscapeKeyDown: {
      control: false,
      description: "Called when Escape is pressed while open. Call event.preventDefault() to keep the drawer open.",
    },
    onPointerDownOutside: {
      control: false,
      description: "Called on a pointer-down outside the panel. Call event.preventDefault() to keep the drawer open.",
    },
    onFocusOutside: {
      control: false,
      description: "Called when focus moves outside the panel (only a non-modal drawer can lose focus this way). Call event.preventDefault() to keep it open.",
    },
    onInteractOutside: {
      control: false,
      description: "Called on any interaction outside the panel — a pointer-down or a focus move. Call event.preventDefault() to keep the drawer open.",
    },
    "aria-label": {
      control: "text",
      description: "Accessible name for the drawer, used when it has no visible title. A Drawer.Title is the preferred name.",
    },
    "aria-labelledby": {
      control: "text",
      description: "Points to the id of an existing element to use as the accessible name instead of a Drawer.Title.",
    },
    "aria-describedby": {
      control: "text",
      description: "Points to the id of an existing element that describes the drawer. Drawer.Description is wired in automatically.",
    },
    id: {
      control: "text",
      description: "Standard DOM id.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization, on the drawer panel itself.",
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
    size: "md",
  },
};

export default meta;

type Story = StoryObj<typeof Drawer.Content>;

export const Default: Story = {
  render: (args) => (
    <Drawer defaultOpen>
      <Drawer.Content aria-label="Example drawer" {...args}>
        <Drawer.Body>Drawer content</Drawer.Body>
      </Drawer.Content>
    </Drawer>
  ),
};
