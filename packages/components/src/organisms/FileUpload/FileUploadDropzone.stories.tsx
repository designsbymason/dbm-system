import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileUpload } from "./FileUpload";

// Docs-only (guidelines/adr/0013): `FileUpload.Dropzone`'s own props get their own Properties table on FileUpload.mdx,
// separate from the umbrella table. Rendered inside a real `FileUpload`, since the part reads its settings from it.
const meta: Meta<typeof FileUpload.Dropzone> = {
  title: "Components/FileUpload/Dropzone",
  id: "organisms-inputs-fileupload-dropzone",
  component: FileUpload.Dropzone,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "What the drop area holds. Left out: an icon, the prompt, the button and the hint. Give your own to change the content; the drop, paste and click behaviour stays.",
    },
    id: { control: false, description: "Standard DOM id." },
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

type Story = StoryObj<typeof FileUpload.Dropzone>;

export const Default: Story = {
  render: (args) => (
    <FileUpload aria-label="Attachments">
      <FileUpload.Dropzone {...args} />
    </FileUpload>
  ),
};
