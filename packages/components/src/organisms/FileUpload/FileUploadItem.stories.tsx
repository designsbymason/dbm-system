import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileUpload } from "./FileUpload";
import { demoEntries } from "./FileUploadStoryKit";

// Docs-only (guidelines/adr/0013): `FileUpload.Item`'s own props get their own Properties table on FileUpload.mdx,
// separate from the umbrella table. Rendered inside a real `FileUpload`, since the part reads its settings from it.
const meta: Meta<typeof FileUpload.Item> = {
  title: "Components/FileUpload/Item",
  id: "organisms-inputs-fileupload-item",
  component: FileUpload.Item,
  tags: ["!dev"],
  argTypes: {
    entry: {
      control: false,
      description: "The entry this row shows: its id, the file, its status, its progress and, for a failed one, its error.",
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
  args: { entry: demoEntries()[1] },
};

export default meta;

type Story = StoryObj<typeof FileUpload.Item>;

export const Default: Story = {
  render: (args) => (
    <FileUpload aria-label="Attachments" defaultValue={[args.entry]}>
      <FileUpload.Trigger />
      <FileUpload.List>{(entry) => <FileUpload.Item key={entry.id} entry={entry} />}</FileUpload.List>
    </FileUpload>
  ),
};
