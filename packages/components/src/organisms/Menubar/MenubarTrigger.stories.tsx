import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menubar } from "../Menubar";

// Docs-only — see MenubarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menubar.Trigger> = {
  title: "Organisms/Navigation/Menubar/Trigger",
  component: Menubar.Trigger,
  tags: ["!dev"],
  argTypes: {
    asChild: {
      // A single element child is what asChild needs; the story's text child can't stand in for one.
      control: false,
      description:
        "Renders as a single provided child element (Radix Slot) instead of the built-in <button>, which receives the trigger's role, keys and open state. The bar styles its own trigger, so reach for this only to put the behaviour on an element of your own.",
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      control: "text",
      description:
        'The trigger\'s label ("File", "Edit"), or a single element when asChild is set.',
    },
    disabled: {
      control: "boolean",
      description:
        "A disabled trigger opens nothing and is skipped by the arrow keys.",
      table: { defaultValue: { summary: "false" } },
    },
    "aria-haspopup": {
      control: false,
      description:
        'Set to "menu" on the trigger; Radix keeps it, so a value passed here is documentation only.',
    },
    "aria-expanded": {
      control: false,
      description:
        "Whether the menu is open; kept in step with the open state.",
    },
    "aria-label": {
      control: "text",
      description:
        "An accessible name, for a trigger whose label is not its visible text. The menu is named after its trigger.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names the trigger.",
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
    children: "File",
  },
};

export default meta;

type Story = StoryObj<typeof Menubar.Trigger>;

export const Default: Story = {
  render: (args) => (
    <Menubar aria-label="Application menu">
      <Menubar.Menu value="file">
        <Menubar.Trigger {...args} />
        <Menubar.Content>
          <Menubar.Item>New</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  ),
};
