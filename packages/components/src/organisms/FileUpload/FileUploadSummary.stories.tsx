import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileUpload } from "./FileUpload";
import { demoEntries } from "./FileUploadStoryKit";

// Docs-only (guidelines/adr/0013): `FileUpload.Summary`'s own props get their own Properties table on FileUpload.mdx,
// separate from the umbrella table. Rendered inside a real `FileUpload`, since the part reads the list from it.
const meta: Meta<typeof FileUpload.Summary> = {
  title: "Organisms/Inputs/FileUpload/Summary",
  component: FileUpload.Summary,
  tags: ["!dev"],
  argTypes: {
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

type Story = StoryObj<typeof FileUpload.Summary>;

export const Default: Story = {
  render: (args) => (
    <FileUpload aria-label="Attachments" defaultValue={demoEntries()}>
      <FileUpload.Trigger />
      <FileUpload.Summary {...args} />
    </FileUpload>
  ),
};
