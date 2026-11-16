import type { Meta, StoryObj } from "@storybook/react-vite";
import { TableOfContents } from "./TableOfContents";
import type { TableOfContentsItem } from "./TableOfContents.types";

// Docs-only (guidelines/adr/0013) — the fields of one entry of `items` get their own Properties table on
// TableOfContents.mdx, drawn like the main one.
const meta: Meta<TableOfContentsItem> = {
  title: "Components/TableOfContents/Item",
  id: "molecules-navigation-tableofcontents-item",
  tags: ["!dev"],
  argTypes: {
    id: {
      control: false,
      description: "The id of the element the entry points at. The link goes to #id.",
      type: { name: "string", required: true },
    },
    label: {
      control: false,
      description: "The entry's text.",
      type: { name: "other", value: "ReactNode", required: true },
    },
    icon: {
      control: false,
      description:
        "An icon shown before the text: a component reference from @dbm-system/icons, not a string name. Decorative.",
    },
    trailing: {
      control: false,
      description:
        "Content shown at the end of the entry, such as a Badge. It is part of the link, so it is read with the label.",
      type: { name: "other", value: "ReactNode" },
    },
    disabled: {
      control: "boolean",
      description: "Dims the entry and blocks it, as aria-disabled; it stays in the page and focusable.",
      table: { defaultValue: { summary: "false" } },
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors), set on the entry's link. Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
    level: {
      control: false,
      options: [1, 2, 3, 4],
      description: "How deeply nested the entry is. Each level is indented one step.",
      table: { defaultValue: { summary: "1" } },
    },
  },
};

export default meta;

type Story = StoryObj<TableOfContentsItem>;

// A story is needed for the file to be indexed; it is hidden, like the rest of the file.
export const Default: Story = {
  args: { id: "usage", label: "Usage", level: 1 },
  render: (args) => <TableOfContents items={[args]} />,
};
