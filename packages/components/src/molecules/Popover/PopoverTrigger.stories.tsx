import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover } from "./Popover";

// Docs-only: exists purely to resolve `Popover.Trigger`'s own argTypes for
// the "Popover.Trigger properties" table on `Popover.mdx` — a compound
// sub-part (05-component-api-conventions.md §4), not an independently
// browsable component. `tags: ["!dev"]` removes every story here from the
// sidebar/dev view while keeping it indexed for `useOf` resolution from a
// Docs page (guidelines/adr/0013). Rendered inside a real `<Popover>` —
// Radix's own context-scoped primitives throw if rendered outside their
// required provider, and `@storybook/addon-vitest`'s full-sweep render
// exercises every story, `!dev`-tagged ones included.
const meta: Meta<typeof Popover.Trigger> = {
  title: "Components/Popover/Trigger",
  id: "molecules-overlay-popover-trigger",
  component: Popover.Trigger,
  tags: ["!dev"],
  argTypes: {
    asChild: {
      control: "boolean",
      description:
        "Renders as a single provided child element (Radix Slot) instead of the built-in, unstyled native <button> — for using one of this system's own interactive components (Button, IconButton) as the visible trigger.",
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      control: "text",
      description: "The trigger's own content — a single element when asChild is set.",
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
    children: "Open",
  },
};

export default meta;

type Story = StoryObj<typeof Popover.Trigger>;

export const Default: Story = {
  render: (args) => (
    <Popover>
      <Popover.Trigger {...args} />
      <Popover.Content aria-label="Example popover">Content</Popover.Content>
    </Popover>
  ),
};
