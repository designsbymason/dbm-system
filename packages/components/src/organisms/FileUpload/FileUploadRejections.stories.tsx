import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileUpload } from "./FileUpload";

// Docs-only (guidelines/adr/0013): `FileUpload.Rejections`'s own props get their own Properties table on FileUpload.mdx,
// separate from the umbrella table. Rendered inside a real `FileUpload`, since the part reads its settings from it.
const meta: Meta<typeof FileUpload.Rejections> = {
  title: "Components/FileUpload/Rejections",
  id: "organisms-inputs-fileupload-rejections",
  component: FileUpload.Rejections,
  tags: ["!dev"],
  argTypes: {
    id: { control: false, description: "Standard DOM id. The field sets its own, which the button's aria-describedby points at." },
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

type Story = StoryObj<typeof FileUpload.Rejections>;

export const Default: Story = {
  render: (args) => (
    <FileUpload aria-label="Attachments" accept=".pdf">
      <FileUpload.Dropzone />
      <FileUpload.Rejections {...args} />
    </FileUpload>
  ),
};
