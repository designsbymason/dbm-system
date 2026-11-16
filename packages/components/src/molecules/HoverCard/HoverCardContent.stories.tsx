import type { Meta, StoryObj } from "@storybook/react-vite";
import { HoverCard } from "./HoverCard";

// Docs-only — see HoverCardTrigger.stories.tsx's own comment for the full
// rationale (guidelines/adr/0013). Rendered open (`defaultOpen`) so
// `HoverCard.Content` actually mounts.
const meta: Meta<typeof HoverCard.Content> = {
  title: "Components/HoverCard/Content",
  id: "molecules-overlay-hovercard-content",
  component: HoverCard.Content,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "The card's own content — a short preview, never the only way to reach anything.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "The padding step around the content, on the standard scale (8, 12, 16, 20, 24px). A HoverCard.Media bleeds out to the card's edges whatever the step.",
      table: { defaultValue: { summary: '"md"' } },
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description:
        "Which side of the trigger the content renders on — a single value, or a mobile-first responsive map keyed by breakpoint (e.g. { base: 'bottom', lg: 'right' }). Radix repositions it automatically to stay within the viewport, but only within the same axis; a responsive map lets you switch axes deliberately at a chosen breakpoint.",
      table: { defaultValue: { summary: '"top"' } },
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Alignment along the chosen side.",
      table: { defaultValue: { summary: '"center"' } },
    },
    sideOffset: {
      control: "number",
      description:
        "Pixel gap between the trigger and the content along side. A transparent bridge, as long as the gap, is part of the card, so the pointer can cross it onto the card without the card closing, whatever the offset.",
      table: { defaultValue: { summary: "8" } },
    },
    alignOffset: {
      control: "number",
      description: "Pixel offset along align's own axis.",
      table: { defaultValue: { summary: "0" } },
    },
    avoidCollisions: {
      control: "boolean",
      description:
        "Whether the content repositions itself to stay within the viewport instead of overflowing it.",
      table: { defaultValue: { summary: "true" } },
    },
    collisionPadding: {
      control: "number",
      description:
        "Minimum distance, in pixels, kept between the content and the edge of the viewport while repositioning to avoid a collision.",
      table: { defaultValue: { summary: "8" } },
    },
    collisionBoundary: {
      control: false,
      description:
        "Element(s) to use as the collision boundary instead of the viewport — e.g. a scrollable container the card should stay within.",
      table: { defaultValue: { summary: "[]" } },
    },
    hideWhenDetached: {
      control: "boolean",
      description:
        "Hides the content entirely when its trigger is fully scrolled out of view, instead of leaving it floating in a now-meaningless position.",
      table: { defaultValue: { summary: "false" } },
    },
    hideArrow: {
      control: "boolean",
      description: "Hides the small pointer arrow connecting the content to its trigger.",
      table: { defaultValue: { summary: "false" } },
    },
    container: {
      control: false,
      description:
        "Renders the content into a different DOM node than document.body (Radix's own default).",
    },
    onEscapeKeyDown: {
      control: false,
      description:
        "Called when Escape is pressed while open. Call event.preventDefault() inside to keep the card open instead of the default dismissal.",
    },
    onPointerDownOutside: {
      control: false,
      description:
        "Called on a pointer-down outside the content. Call event.preventDefault() inside to keep the card open instead of the default dismissal.",
    },
    onFocusOutside: {
      control: false,
      description:
        "Called when focus moves outside the content. The card ignores a focus move on its own (it closes when the trigger loses focus instead), so this is for observing it.",
    },
    onInteractOutside: {
      control: false,
      description:
        "Called on any interaction outside the content (a pointer-down or a focus move). Call event.preventDefault() inside to keep the card open instead of the default dismissal.",
    },
    id: {
      control: false,
      description: "Standard DOM id, applied to the content element.",
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
    children: "Card content",
    side: "top",
    align: "center",
  },
};

export default meta;

type Story = StoryObj<typeof HoverCard.Content>;

export const Default: Story = {
  render: (args) => (
    <HoverCard defaultOpen>
      <HoverCard.Trigger href="/people/jane">@jane</HoverCard.Trigger>
      <HoverCard.Content {...args} />
    </HoverCard>
  ),
};
