import type { Meta, StoryObj } from "@storybook/react-vite";
import { CopyIcon, PencilSimpleIcon, TrashIcon } from "@dbm-system/icons";
import { Menubar } from "./Menubar";

// Docs-only — see MenubarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
// `icon` takes a component reference, not a string name (05 §5), which the Controls panel can't drive, so a small
// curated set of real icons is mapped onto string keys, as `Button`'s icon slots do. "None" is a Playground-only
// choice that leaves the prop out.
const iconControl = {
  control: "select" as const,
  options: ["None", "Copy", "Pencil", "Trash"],
  mapping: {
    None: undefined,
    Copy: CopyIcon,
    Pencil: PencilSimpleIcon,
    Trash: TrashIcon,
  },
  description:
    "A leading icon, as a component reference (icon={CopyIcon}), drawn in icon.* colours. Decorative: the label carries the meaning.",
};

const meta: Meta<typeof Menubar.SubTrigger> = {
  title: "Organisms/Navigation/Menubar/SubTrigger",
  component: Menubar.SubTrigger,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "The item's label. Typeahead matches the start of its text.",
    },
    icon: {
      control: false,
      description:
        "A leading icon, as a component reference (icon={CopyIcon}), drawn in icon.* colours. Decorative: the label carries the meaning.",
    },
    disabled: {
      control: "boolean",
      description:
        "A disabled submenu trigger is dimmed, skipped by the arrow keys and can't be opened.",
      table: { defaultValue: { summary: "false" } },
    },
    textValue: {
      control: "text",
      description:
        "The text typeahead matches, when it isn't the item's own text.",
    },
    id: {
      control: "text",
      description: "Standard DOM id.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    children: "Share",
  },
};

export default meta;

type Story = StoryObj<typeof Menubar.SubTrigger>;

export const Default: Story = {
  // Playground-only choices: they are not values the prop takes, so they stay off the meta-level argTypes.
  argTypes: { icon: iconControl },
  render: (args) => (
    <Menubar aria-label="Application menu">
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Sub>
            <Menubar.SubTrigger {...args} />
            <Menubar.SubContent>
              <Menubar.Item>Email</Menubar.Item>
            </Menubar.SubContent>
          </Menubar.Sub>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  ),
};
