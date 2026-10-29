import type { Meta, StoryObj } from "@storybook/react-vite";
import { EditorTabs } from "./EditorTabs";

// Docs-only (guidelines/adr/0013) — `EditorTabs.Panel`'s own props get their own Properties table on EditorTabs.mdx.
// Rendered inside a real `EditorTabs`, whose tabs it belongs to.
const meta: Meta<typeof EditorTabs.Panel> = {
  title: "Organisms/Navigation/EditorTabs/Panel",
  component: EditorTabs.Panel,
  tags: ["!dev"],
  argTypes: {
    value: {
      control: false,
      description: "The id of the tab this panel belongs to. It shows while that tab is selected.",
      type: { name: "string", required: true },
    },
    children: { control: "text", description: "The panel's content." },
    forceMount: {
      control: false,
      description:
        "Keeps the panel mounted, hidden, while its tab is not selected, so it keeps its state (an editor's undo history, a scroll position). Leave it out and the panel is removed when its tab is not selected.",
    },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    id: {
      control: false,
      description:
        "Standard DOM id. Radix sets a default one, which the tab's aria-controls points at: overriding it here would break that pairing.",
    },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing. Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof EditorTabs.Panel>;

export const Panel: Story = {
  render: (args) => (
    <EditorTabs tabs={[{ id: "a", label: "index.ts" }]} value="a" aria-label="Files">
      <EditorTabs.Panel {...args} value="a">
        {args.children ?? "The file's contents."}
      </EditorTabs.Panel>
    </EditorTabs>
  ),
  args: { children: "The file's contents." },
};
