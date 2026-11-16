import type { Meta, StoryObj } from "@storybook/react-vite";
import { HoverCard } from "./HoverCard";

// Docs-only — see HoverCardTrigger.stories.tsx's own comment for the full
// rationale (guidelines/adr/0013). Rendered open so `HoverCard.Media` mounts.
const meta: Meta<typeof HoverCard.Media> = {
  title: "Components/HoverCard/Media",
  id: "molecules-overlay-hovercard-media",
  component: HoverCard.Media,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "An image or video that fills the card's width — <img>, <video> or a DBM Image. It is laid out as a block, full width, and clipped to the card's rounded top corners.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this element, or when a test or router needs a stable anchor.",
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

type Story = StoryObj<typeof HoverCard.Media>;

export const Default: Story = {
  render: (args) => (
    <HoverCard defaultOpen>
      <HoverCard.Trigger href="/people/jane">@jane</HoverCard.Trigger>
      <HoverCard.Content>
        <HoverCard.Media {...args} />
        Content
      </HoverCard.Content>
    </HoverCard>
  ),
};
