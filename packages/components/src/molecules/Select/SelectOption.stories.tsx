import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "./Select";

// Docs-only: exists purely to resolve `Select.Option`'s own argTypes for
// the "Select.Option properties" table on `Select.mdx` — `Select.Option`
// is a compound sub-part (05-component-api-conventions.md §4), not an
// independently browsable component, so it has no story of its own meant
// for the sidebar. `tags: ["!dev"]` is a standard, stable CSF3 tag (not an
// internal/unstable API — distinct from the manager.ts-level Storybook
// internals `07-storybook-and-documentation-standards.md` §9 warns about)
// that removes every story in this file from the sidebar/dev view while
// keeping it indexed for `useOf` resolution from a Docs page. The render
// wraps `Select.Option` in a real `<Select>` — Radix's own `SelectItem`
// throws if rendered outside its `Select.Root` context — so this stays
// safe under `@storybook/addon-vitest`'s full-sweep render even though
// nothing ever opens the dropdown (Select.Content, and therefore this
// Option, simply isn't mounted while closed, same as any other closed
// Select in this package's own test suite).
const meta: Meta<typeof Select.Option> = {
  title: "Components/Select/Option",
  id: "molecules-inputs-select-option",
  component: Select.Option,
  tags: ["!dev"],
  argTypes: {
    value: {
      control: "text",
      description: "The value submitted when this option is selected.",
      type: { name: "string", required: true },
    },
    children: {
      control: "text",
      description: "The option's own visible content.",
    },
    disabled: {
      control: "boolean",
      description: "Prevents this specific option from being selected.",
    },
    textValue: {
      control: "text",
      description:
        "Plain-text label used for typeahead search (typing a letter to jump to a matching option) when children isn't plain, searchable text. Defaults to children itself when omitted.",
    },
    asChild: {
      control: "boolean",
      description:
        "Renders as a single provided child element (Radix Slot) instead of the built-in <div> — for a custom option row (e.g. with a leading icon or a secondary description line) that still needs Radix's own selection/typeahead/highlight behavior.",
      table: { defaultValue: { summary: "false" } },
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this option, or a test/router needs a stable anchor.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    value: "example",
    children: "Example option",
  },
};

export default meta;

type Story = StoryObj<typeof Select.Option>;

export const Default: Story = {
  render: (args) => (
    <Select aria-label="Example" placeholder="Choose">
      <Select.Option {...args} />
    </Select>
  ),
};
