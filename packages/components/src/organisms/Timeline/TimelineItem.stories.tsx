import type { Meta, StoryObj } from "@storybook/react-vite";
import { Timeline } from "./Timeline";

// Docs-only (guidelines/adr/0013) — `Timeline.Item`'s own props get their own
// Properties table on Timeline.mdx. Rendered inside a real `Timeline`, whose
// context the item reads.
const meta: Meta<typeof Timeline.Item> = {
  title: "Organisms/Data Display/Timeline/Item",
  component: Timeline.Item,
  tags: ["!dev"],
  argTypes: {
    title: { control: "text", description: "What happened: the event's headline." },
    time: { control: "text", description: "The event's time as it should be read (2 hours ago, 14 Mar 09:30). Timeline formats nothing." },
    dateTime: { control: "text", description: "The machine-readable form of time (2026-03-14T09:30), which makes it a time element." },
    description: { control: "text", description: "A line or two under the title." },
    icon: { control: false, description: "An icon to draw in the marker in place of the plain dot: a component reference, not a string name." },
    marker: { control: false, description: "Anything to draw in the marker in place of the dot and the icon (an Avatar). It is hidden from assistive technology, so the title must say what it shows." },
    tone: {
      control: "select",
      options: [undefined, "neutral", "brand", "info", "success", "warning", "danger", "highlight"],
      description: "The marker's colour, in place of the timeline's tone.",
    },
    statusText: { control: "text", description: "Words for what the marker's tone means (Failed), read after the title by a screen reader, since a colour alone says nothing to one. Not shown." },
    pending: {
      control: "boolean",
      description: "Marks the event as under way: a spinner in the marker, the pending words read after the title (unless statusText says it), and a dashed line leaving it.",
      table: { defaultValue: { summary: "false" } },
    },
    connector: {
      control: "select",
      options: [undefined, "solid", "dashed", "none"],
      description: "The line leaving this event, in place of the timeline's connector: solid, dashed, or none (a gap in time, or the end of a thread).",
    },
    href: { control: "text", description: "Makes the event a link: its title becomes an anchor to this address, stretched over the whole event. Links and buttons inside the body still work." },
    onPress: { control: false, description: "Makes the event a button: its title becomes a button stretched over the whole event, and this is called when it is pressed. Ignored when href is set." },
    detail: { control: "text", description: "More about the event, kept behind a button that opens and closes it. The button is a disclosure: aria-expanded, pointing at the content." },
    open: { control: false, description: "Whether the detail is open. Makes it controlled: the button asks through onOpenChange." },
    defaultOpen: { control: "boolean", description: "Whether the detail is open at first, when open is not set.", table: { defaultValue: { summary: "false" } } },
    onOpenChange: { control: false, description: "Called with the value the person asked for when they press the button that opens or closes the detail." },
    children: { control: false, description: "Anything further the event needs, drawn under the description (a link, a code block, a button)." },
    id: { control: false, description: "Standard DOM id, on the list item." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { title: "Shipped", time: "Yesterday, 17:40", description: "With the courier", pending: false },
};

export default meta;

type Story = StoryObj<typeof Timeline.Item>;

export const Default: Story = {
  render: (args) => (
    <Timeline aria-label="Order history">
      <Timeline.Item {...args} />
      <Timeline.Item title="Order placed" time="12 Mar" />
    </Timeline>
  ),
};
