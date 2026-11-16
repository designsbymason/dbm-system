import type { Meta, StoryObj } from "@storybook/react-vite";
import { Splitter } from "./Splitter";

// Docs-only: exists purely to resolve `Splitter.Pane`'s own argTypes for the "Splitter.Pane properties" table on
// `Splitter.mdx` — it is a compound sub-part, not an independently browsable component (see ADR-0013), so
// `tags: ["!dev"]` keeps every story here out of the sidebar while leaving it indexed for the Docs page. The render
// wraps the pane in a real `Splitter`, which is where it gets its size.
const meta: Meta<typeof Splitter.Pane> = {
  title: "Components/Splitter/Pane",
  id: "molecules-layout-splitter-pane",
  component: Splitter.Pane,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "What the pane holds — or a function of the pane's state ({ collapsed, size, toggle }; toggle collapses or opens the pane), to show something else once it has collapsed to a strip, with a button that opens it.",
    },
    label: {
      control: "text",
      description: 'A short name for the pane ("Sidebar"). The handle after it is named from it ("Resize Sidebar"), so a screen reader user with several handles can tell them apart. Not added to the pane itself.',
    },
    resizable: {
      description:
        "Whether a handle next to this pane can resize it. false locks the pane (a header, a footer): each handle beside it is drawn as a plain divider, out of the tab order, that moves nothing. The pane can still be collapsed from outside with collapsed.",
      table: { defaultValue: { summary: "true" } },
    },
    fixed: {
      description:
        "Keeps the pane's length when the container is resized: it stays the same number of pixels and the other panes share out the difference (a sidebar that holds its width while the content flexes). A person can still drag it to a new size, which it then keeps. Without it a pane keeps its percentage.",
      table: { defaultValue: { summary: "false" } },
    },
    defaultSize: {
      control: "number",
      description:
        "The pane's starting size as a percentage, when the splitter holds its own layout and gets no defaultLayout. Panes without one share the rest equally.",
    },
    minSize: {
      control: "text",
      description: 'The smallest the pane can be: a percentage (20 or "20%") or a length ("240px", or "15rem" to keep up with the text size).',
      table: { defaultValue: { summary: "10" } },
    },
    maxSize: {
      control: "text",
      description: 'The largest the pane can be: a percentage (60 or "60%") or a length ("480px", or "30rem").',
      table: { defaultValue: { summary: "100" } },
    },
    collapsible: {
      description:
        "Lets the pane collapse: pulled past halfway to its minimum it snaps shut, and Enter or a double click on a neighbouring handle toggles it.",
      table: { defaultValue: { summary: "false" } },
    },
    collapsedSize: {
      control: "text",
      description: 'The size a collapsed pane keeps — 0 makes it disappear (and hides its content from assistive tech), "48px" leaves a strip.',
      table: { defaultValue: { summary: "0" } },
    },
    collapsed: {
      description:
        "Collapses or opens the pane from outside, and makes the pane controlled: a handle's gesture (a drag past the snap point, Home, Enter, a double click) then only asks, through onCollapsedChange, and the pane follows when you change this. Pair it with onCollapsedChange. A pane that is true at the start is already shut.",
    },
    defaultCollapsed: {
      description: "Whether the pane starts collapsed, when it isn't controlled.",
      table: { defaultValue: { summary: "false" } },
    },
    onCollapsedChange: {
      description:
        "Called when the pane collapses or opens — or, for a pane you control with collapsed, when a handle asks it to (it is then yours to change collapsed; changing it yourself isn't reported back).",
    },
    id: { control: false, description: "Standard DOM id; the handles next to the pane point at it with aria-controls. Generated when left out." },
    className: { control: false, description: "Additional CSS classes for the pane." },
    style: { control: false, description: "Inline styles for the pane." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
  },
  args: { resizable: true, fixed: false, collapsible: false, defaultCollapsed: false },
  render: (args) => (
    <div style={{ height: "8rem" }}>
      <Splitter>
        <Splitter.Pane {...args}>Pane</Splitter.Pane>
        <Splitter.Pane>Pane</Splitter.Pane>
      </Splitter>
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof Splitter.Pane>;

export const Default: Story = {};
