import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menubar } from "../Menubar";

// Docs-only — see MenubarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menubar.Action> = {
  title: "Organisms/Navigation/Menubar/Action",
  component: Menubar.Action,
  tags: ["!dev"],
  argTypes: {
    asChild: {
      // A single element child is what asChild needs; the story's text child can't stand in for one.
      control: false,
      description:
        "Renders as a single provided child element (Radix Slot) instead of the built-in <button>, which receives the action's role and keys. Use it to make a link an action; the action then draws no icon or trailing content of its own.",
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      control: "text",
      description:
        'The action\'s label ("Run", "Help"), or a single element when asChild is set.',
    },
    disabled: {
      control: "boolean",
      description:
        "A disabled action can't be chosen and is skipped by the arrow keys, unless it has a disabledReason.",
      table: { defaultValue: { summary: "false" } },
    },
    disabledReason: {
      control: "text",
      description:
        "Why the action is disabled, shown in a tooltip and announced as its description. Only with disabled. An action with a reason stays focusable (and aria-disabled) so the reason can be reached and heard, and the arrow keys stop on it.",
    },
    icon: {
      control: false,
      description:
        "A leading icon, as a component reference (icon={FileIcon}), drawn in icon.* colours. Decorative: the label carries the meaning.",
    },
    trailing: {
      control: false,
      description: "Content after the label: a count, a Badge.",
    },
    onSelect: {
      control: false,
      description:
        "Called when the action is chosen, by a click, Enter or Space. It opens no menu and closes any that is open.",
    },
    "aria-label": {
      control: "text",
      description:
        "An accessible name, for an action whose label is not its visible text.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names the action.",
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
    children: "Run",
  },
};

export default meta;

type Story = StoryObj<typeof Menubar.Action>;

export const Default: Story = {
  render: (args) => (
    <Menubar aria-label="Application menu">
      <Menubar.Action {...args} />
    </Menubar>
  ),
};
