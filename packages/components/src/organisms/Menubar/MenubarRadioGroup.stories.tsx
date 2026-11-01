import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menubar } from "./Menubar";

// Docs-only — see MenubarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menubar.RadioGroup> = {
  title: "Organisms/Navigation/Menubar/RadioGroup",
  component: Menubar.RadioGroup,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "Menubar.RadioItems, with an optional Menubar.Label.",
    },
    value: {
      control: false,
      description:
        "The value of the chosen item (controlled). Omit it, with defaultValue, to let the group keep its own.",
    },
    defaultValue: {
      control: "text",
      description:
        "The initially chosen value for uncontrolled usage — ignored once value is provided.",
    },
    onValueChange: {
      control: false,
      description: "Called with the new value when an item is chosen.",
    },
    "aria-label": {
      control: "text",
      description:
        "An accessible name for the group, when there is no Menubar.Label inside it.",
    },
    "aria-labelledby": {
      control: false,
      description:
        "The id of an element that names the group. Without it, a Menubar.Label inside the group names it.",
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
    defaultValue: "name",
    "aria-label": "Sort by",
  },
};

export default meta;

type Story = StoryObj<typeof Menubar.RadioGroup>;

export const Default: Story = {
  render: (args) => (
    <Menubar aria-label="Application menu">
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.RadioGroup {...args}>
            <Menubar.RadioItem value="name">Name</Menubar.RadioItem>
            <Menubar.RadioItem value="date">Date</Menubar.RadioItem>
          </Menubar.RadioGroup>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  ),
};
