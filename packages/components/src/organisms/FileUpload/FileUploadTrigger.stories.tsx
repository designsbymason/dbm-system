import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileUpload } from "./FileUpload";

// Docs-only (guidelines/adr/0013): `FileUpload.Trigger`'s own props get their own Properties table on FileUpload.mdx,
// separate from the umbrella table. Rendered inside a real `FileUpload`, since the part reads its settings from it.
const meta: Meta<typeof FileUpload.Trigger> = {
  title: "Components/FileUpload/Trigger",
  id: "organisms-inputs-fileupload-trigger",
  component: FileUpload.Trigger,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The button's text. Left out: \"Choose files\" (or \"Choose a file\" in a single-file field).",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description: "The button's visual style, from Button's own variants.",
      table: { defaultValue: { summary: "secondary" } },
    },
    leadingIcon: {
      control: false,
      description: "An icon before the text, as a Phosphor icon component; null for none. Defaults to the field's triggerIcon, which is a file with an up arrow.",
      table: { defaultValue: { summary: "FileArrowUpIcon" } },
    },
    onClick: {
      control: false,
      description: "Called when the button is pressed, before the picker opens. preventDefault() keeps the picker closed.",
    },
    id: { control: false, description: "Standard DOM id. Not set by the field, which puts its own id on the file input." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing. Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof FileUpload.Trigger>;

export const Default: Story = {
  render: (args) => (
    <FileUpload aria-label="Attachments" layout="button" hint={null}>
      <FileUpload.Trigger {...args} />
    </FileUpload>
  ),
};
