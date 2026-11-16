import type { Meta, StoryObj } from "@storybook/react-vite";
import { HoverCard } from "./HoverCard";
import { HoverCardProvider } from "./HoverCardProvider";

// Docs-only — see HoverCardTrigger.stories.tsx's own comment for the full
// rationale (guidelines/adr/0013). Resolves `HoverCardProvider`'s argTypes for
// the "HoverCardProvider properties" table on `HoverCard.mdx`.
const meta: Meta<typeof HoverCardProvider> = {
  title: "Components/HoverCard/Provider",
  id: "molecules-overlay-hovercard-provider",
  component: HoverCardProvider,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The subtree whose HoverCards should share timing.",
    },
    openDelay: {
      control: "number",
      description:
        "Milliseconds before a card opens, for every HoverCard below that doesn't set its own openDelay. Doesn't apply while the provider is warm (see skipDelayDuration) — then a card opens at once.",
      table: { defaultValue: { summary: "300" } },
    },
    closeDelay: {
      control: "number",
      description:
        "Milliseconds a card stays open after the pointer or focus leaves, for every HoverCard below that doesn't set its own closeDelay.",
      table: { defaultValue: { summary: "300" } },
    },
    skipDelayDuration: {
      control: "number",
      description:
        "How long, in milliseconds, the provider stays warm after the last card closes. While one card is open, or within this window after it closed, the next card opens immediately instead of waiting out openDelay. Set 0 to wait on every card.",
      table: { defaultValue: { summary: "300" } },
    },
  },
};

export default meta;

type Story = StoryObj<typeof HoverCardProvider>;

export const Default: Story = {
  render: (args) => (
    <HoverCardProvider {...args}>
      <HoverCard>
        <HoverCard.Trigger href="/people/jane">@jane</HoverCard.Trigger>
        <HoverCard.Content>Content</HoverCard.Content>
      </HoverCard>
    </HoverCardProvider>
  ),
};
