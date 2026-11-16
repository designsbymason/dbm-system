import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileUpload } from "./FileUpload";
import { demoEntries } from "./FileUploadStoryKit";

// Docs-only (guidelines/adr/0013): `FileUpload.List`'s own props get their own Properties table on FileUpload.mdx,
// separate from the umbrella table. Rendered inside a real `FileUpload`, since the part reads its settings from it.
const meta: Meta<typeof FileUpload.List> = {
  title: "Components/FileUpload/List",
  id: "organisms-inputs-fileupload-list",
  component: FileUpload.List,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "What to draw for each entry, as a function of the entry. Left out: a FileUpload.Item. Give a function to draw your own, usually a FileUpload.Item with something added.",
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

type Story = StoryObj<typeof FileUpload.List>;

export const Default: Story = {
  render: (args) => (
    <FileUpload aria-label="Attachments" defaultValue={demoEntries().slice(0, 2)}>
      <FileUpload.Trigger />
      <FileUpload.List {...args} />
    </FileUpload>
  ),
};
