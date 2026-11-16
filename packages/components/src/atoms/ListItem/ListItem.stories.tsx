import { CheckIcon, GearIcon, HouseIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Badge } from "../Badge";
import { IconButton } from "../IconButton";
import { List } from "../../molecules/List";
import { ListItem } from "./ListItem";
import { listItemPlaygroundSnippet, listItemSnippets } from "./ListItem.snippets";

const meta: Meta<typeof ListItem> = {
  title: "Components/ListItem",
  id: "atoms-typography-listitem",
  component: ListItem,
  parameters: { layout: "padded" },
  // Ordered to match ListItemProps' own declaration order, content prop
  // first, then behavioral/state props, then advanced/escape-hatch props
  // last — same sequencing principle the Properties table uses
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      control: "text",
      description: "The item's content.",
    },
    icon: {
      control: false,
      description:
        "A custom marker icon rendered in place of this item's default bullet — a component reference, not a string name.",
    },
    interactive: {
      control: "boolean",
      description:
        "Makes the item focusable and clickable — role=\"button\", keyboard activatable (Enter/Space), with hover/focus-visible styling.",
    },
    selected: {
      control: "boolean",
      description:
        "Marks the item as the current selection within an interactive list. Only meaningful when interactive is true.",
    },
    disabled: {
      control: "boolean",
      description:
        "Disables an interactive item: aria-disabled, blocked click/keyboard activation, dimmed treatment. Only meaningful when interactive is true.",
    },
    trailing: {
      control: false,
      description:
        "Trailing content — a count, an icon button, a switch — rendered as a sibling of the item's own interactive surface, never nested inside it.",
    },
    "aria-label": {
      control: "text",
      description:
        "Accessible name override for an interactive item with no readable text content of its own. Only applied when interactive is true.",
    },
    "aria-labelledby": {
      control: false,
      description: "References the id of an element that labels this item, as an alternative to aria-label.",
    },
    value: {
      control: false,
      description: "Native <li> value — overrides this item's ordinal number within an ancestor <ol>.",
    },
    id: {
      control: false,
      description:
        "DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
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
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert
  // placeholder instead of a live, interactive control (see
  // guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    children: "A single list item",
    interactive: false,
    selected: false,
    disabled: false,
    "aria-label": "",
  },
};

export default meta;

type Story = StoryObj<typeof ListItem>;

/** Drive every prop live. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => listItemPlaygroundSnippet(context.args),
      },
    },
  },
  render: (args) => (
    <List>
      <ListItem {...args} />
    </List>
  ),
};

export const Default: Story = {
  parameters: { docs: { source: { code: listItemSnippets.default } } },
  argTypes: {
    children: { control: false },
    interactive: { control: false },
    selected: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <List>
      <ListItem>A single list item, rendered within a List</ListItem>
    </List>
  ),
};

export const CustomIconMarker: Story = {
  name: "Custom icon marker",
  parameters: { docs: { source: { code: listItemSnippets.customIconMarker } } },
  argTypes: {
    children: { control: false },
    interactive: { control: false },
    selected: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <List marker="none">
      <ListItem icon={CheckIcon}>Design tokens defined</ListItem>
      <ListItem icon={CheckIcon}>Core atoms shipped</ListItem>
      <ListItem icon={CheckIcon}>Molecules in progress</ListItem>
    </List>
  ),
};

export const TrailingContent: Story = {
  name: "Trailing content",
  parameters: { docs: { source: { code: listItemSnippets.trailingContent } } },
  argTypes: {
    children: { control: false },
    interactive: { control: false },
    selected: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <List marker="none">
      <ListItem trailing={<Badge tone="info">3</Badge>}>Inbox</ListItem>
      <ListItem trailing={<Badge tone="danger">12</Badge>}>Overdue</ListItem>
      <ListItem
        interactive
        onClick={() => {}}
        trailing={<IconButton icon={GearIcon} aria-label="Settings" size="xs" variant="ghost" />}
      >
        Preferences
      </ListItem>
    </List>
  ),
};

export const Interactive: Story = {
  name: "Interactive (nav-menu-style list)",
  parameters: { docs: { source: { code: listItemSnippets.interactive } } },
  argTypes: {
    children: { control: false },
    interactive: { control: false },
    selected: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: function InteractiveStory() {
    const [selected, setSelected] = useState("home");
    return (
      <List marker="none" as="ul">
        <ListItem
          interactive
          selected={selected === "home"}
          icon={HouseIcon}
          onClick={() => setSelected("home")}
        >
          Home
        </ListItem>
        <ListItem
          interactive
          selected={selected === "settings"}
          icon={GearIcon}
          onClick={() => setSelected("settings")}
        >
          Settings
        </ListItem>
      </List>
    );
  },
};

export const Disabled: Story = {
  name: "Disabled (aria-disabled, click blocked)",
  parameters: { docs: { source: { code: listItemSnippets.disabled } } },
  argTypes: {
    children: { control: false },
    interactive: { control: false },
    selected: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <List marker="none">
      <ListItem interactive icon={HouseIcon} onClick={() => {}}>
        Home
      </ListItem>
      <ListItem interactive icon={GearIcon} disabled onClick={() => {}}>
        Settings (unavailable)
      </ListItem>
    </List>
  ),
};
