import type { Meta, StoryObj } from "@storybook/react-vite";
import { HoverCard } from "./HoverCard";

// Docs-only: exists purely to resolve `HoverCard.Trigger`'s own argTypes for
// the "HoverCard.Trigger properties" table on `HoverCard.mdx` — a compound
// sub-part (05-component-api-conventions.md §4), not an independently
// browsable component. `tags: ["!dev"]` removes every story here from the
// sidebar/dev view while keeping it indexed for `useOf` resolution from a
// Docs page (guidelines/adr/0013). Rendered inside a real `<HoverCard>`,
// since Radix's context-scoped primitives throw outside their provider.
const meta: Meta<typeof HoverCard.Trigger> = {
  title: "Components/HoverCard/Trigger",
  id: "molecules-overlay-hovercard-trigger",
  component: HoverCard.Trigger,
  tags: ["!dev"],
  argTypes: {
    asChild: {
      control: "boolean",
      description:
        "Renders as a single provided child element (Radix Slot) instead of the built-in <a> — for using this system's Link as the visible trigger.",
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      control: "text",
      description: "The trigger's own content — a single element when asChild is set.",
    },
    href: {
      control: "text",
      description:
        "Where the link goes. A trigger with no href (and no tabIndex) can't be focused, so a keyboard user could never open the card.",
    },
    target: {
      control: "select",
      options: ["_self", "_blank", "_parent", "_top"],
      description:
        "Where to open the link — _blank for a new tab. When opening in a new tab, also set rel=\"noreferrer\" (or \"noopener\").",
    },
    rel: {
      control: "text",
      description:
        "The link's relationship to the destination (noreferrer, noopener, nofollow…). Required alongside target=\"_blank\" for a link to a page you don't control.",
    },
    id: {
      control: "text",
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this trigger, or when a test or router needs a stable anchor.",
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
    children: "@jane",
    href: "/people/jane",
  },
};

export default meta;

type Story = StoryObj<typeof HoverCard.Trigger>;

export const Default: Story = {
  render: (args) => (
    <HoverCard>
      <HoverCard.Trigger {...args} />
      <HoverCard.Content>Content</HoverCard.Content>
    </HoverCard>
  ),
};
