import type { Meta, StoryObj } from "@storybook/react-vite";
import { CopyIcon, PencilSimpleIcon, TrashIcon } from "@dbm-system/icons";
import { ContextMenu } from "./ContextMenu";

// Docs-only — see ContextMenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
// `icon` takes a component reference, not a string name (05 §5), which the Controls panel can't drive, so a small
// curated set of real icons is mapped onto string keys, as `Button`'s icon slots do. "None" is a Playground-only
// choice that leaves the prop out.
const iconControl = {
  control: "select" as const,
  options: ["None", "Copy", "Pencil", "Trash"],
  mapping: { None: undefined, Copy: CopyIcon, Pencil: PencilSimpleIcon, Trash: TrashIcon },
  description: "A leading icon, as a component reference (icon={CopyIcon}), drawn in icon.* colours. Decorative: the label carries the meaning.",
};

const meta: Meta<typeof ContextMenu.RadioItem> = {
  title: "Organisms/Overlay/ContextMenu/RadioItem",
  component: ContextMenu.RadioItem,
  tags: ["!dev"],
  argTypes: {
    value: {
      control: "text",
      description: "The value this item stands for. Required: it is what the group's value is compared with.",
    },
    children: {
      control: "text",
      description: "The item's label. Typeahead matches the start of its text.",
    },
    icon: {
      control: false,
      description: "A leading icon, as a component reference (icon={CopyIcon}), drawn in icon.* colours. Decorative: the label carries the meaning.",
    },
    description: {
      control: "text",
      description:
        "A second line under the label, in quiet text. It describes the item for assistive technology rather than becoming part of its name.",
    },
    trailing: {
      control: false,
      description: "Content at the item's end, before a shortcut hint: a count, a Badge, \"New\".",
    },
    disabledReason: {
      control: "text",
      description:
        "Why the item is disabled, shown in a tooltip and announced as its description. Only with disabled. An item with a reason stays focusable (and aria-disabled) so the reason can be reached and heard.",
    },
    closeOnSelect: {
      control: "boolean",
      description:
        "Whether choosing the item closes the menu. An action closes it; a checkbox or radio item stays open by default. onSelect's event.preventDefault() still keeps it open.",
      table: { defaultValue: { summary: "true (false for CheckboxItem and RadioItem)" } },
    },
    onSelectError: {
      control: false,
      description:
        "Receives the error when a promise returned by onSelect rejects. The menu stays open either way; with no handler the rejection is left unhandled so it is not lost silently.",
    },
    shortcut: {
      control: "text",
      description:
        "A shortcut hint shown at the item's end (\"⌘C\"). It displays the shortcut and does not bind it: wire the key yourself, and pass aria-keyshortcuts on the item if it should be announced.",
    },
    disabled: {
      control: "boolean",
      description: "A disabled item is dimmed, skipped by the arrow keys and typeahead, and can't be chosen.",
      table: { defaultValue: { summary: "false" } },
    },
    onSelect: {
      control: false,
      description:
        "Called when the item is chosen, by a click, Enter or Space. Call event.preventDefault() to keep the menu open after it. Return a promise for an action that takes time: the item shows a spinner and ignores presses while it is pending, the menu stays open, and it closes when the promise resolves.",
    },
    "aria-keyshortcuts": {
      control: "text",
      description:
        "The keys that do the same as choosing this item from elsewhere in the page (\"Meta+E\"), announced with it. The shortcut hint only displays a key; this says it exists, so set both together and bind the key yourself.",
    },
    "aria-describedby": {
      control: false,
      description:
        "The id(s) of elements that describe the item, in addition to its description and disabledReason, which are added to it.",
    },
    textValue: {
      control: "text",
      description: "The text typeahead matches, when it isn't the item's own text.",
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
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    value: "name",
    children: "Name",
  },
};

export default meta;

type Story = StoryObj<typeof ContextMenu.RadioItem>;

export const Default: Story = {
  // Playground-only choices: they are not values the prop takes, so they stay off the meta-level argTypes.
  argTypes: { icon: iconControl },
  render: (args) => (
    <ContextMenu>
      <ContextMenu.Trigger>Sort</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.RadioGroup defaultValue="name" aria-label="Sort by">
          <ContextMenu.RadioItem {...args} />
        </ContextMenu.RadioGroup>
      </ContextMenu.Content>
    </ContextMenu>
  ),
};
