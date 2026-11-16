import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover } from "./Popover";

// Docs-only — see PopoverTrigger.stories.tsx's own comment for the full
// rationale (guidelines/adr/0013).
const meta: Meta<typeof Popover.Close> = {
  title: "Components/Popover/Close",
  id: "molecules-overlay-popover-close",
  component: Popover.Close,
  tags: ["!dev"],
  argTypes: {
    asChild: {
      control: "boolean",
      description:
        "Renders as a single provided child element (Radix Slot) instead of the built-in, unstyled native <button> — for a custom dismiss control (e.g. a Button reading \"Done\") that should still close the popover on click.",
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      control: "text",
      description: "The close control's own content — a single element when asChild is set.",
    },
    id: {
      control: "text",
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this close control, or when a test or router needs a stable anchor.",
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
    children: "Done",
  },
};

export default meta;

type Story = StoryObj<typeof Popover.Close>;

export const Default: Story = {
  render: (args) => (
    <Popover defaultOpen>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Content aria-label="Example popover">
        Content
        <Popover.Close {...args} />
      </Popover.Content>
    </Popover>
  ),
};
