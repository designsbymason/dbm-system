import type { Meta, StoryObj } from "@storybook/react-vite";
import { MagnifyingGlassPlusIcon } from "@dbm-system/icons";
import { ImageViewerButton } from "./ImageViewer";

// Docs-only: its props are shown in a Properties table on ImageViewer's Docs page, with no sidebar entry of its own
// (guidelines/adr/0013). The button is drawn for the viewer's dark stage, so it is shown on one.
const meta: Meta<typeof ImageViewerButton> = {
  title: "Organisms/Media/ImageViewer/Button",
  component: ImageViewerButton,
  tags: ["!dev"],
  argTypes: {
    label: {
      control: "text",
      description: "The accessible name. When the button shows text of its own (children), the name must contain that text.",
    },
    icon: {
      control: false,
      description: "The Phosphor icon to draw, as a component reference. Makes a round, icon-only button; leave it out and pass children for a pill.",
    },
    children: { control: "text", description: "Text shown in place of the icon." },
    unavailable: {
      control: "boolean",
      description: "Dims the button and ignores a press, but leaves it focusable (aria-disabled), so a press that turns it off keeps the person's place.",
      table: { defaultValue: { summary: "false" } },
    },
    mirrored: {
      control: "boolean",
      description: "Mirrors the icon in a right-to-left viewer, for an arrow that points toward the start or the end.",
      table: { defaultValue: { summary: "false" } },
    },
    onClick: { control: false, description: "Called when the button is pressed, unless it is unavailable." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles." },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing, rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { label: "Copy link", children: "Copy link", unavailable: false, mirrored: false },
};

export default meta;

type Story = StoryObj<typeof ImageViewerButton>;

export const Default: Story = {
  render: (args) => (
    <div style={{ background: "var(--dbm-bg-overlay)", padding: "var(--dbm-space-4)", display: "flex", gap: "var(--dbm-space-2)" }}>
      <ImageViewerButton {...args} />
      <ImageViewerButton label="Zoom in" icon={MagnifyingGlassPlusIcon} />
    </div>
  ),
};
