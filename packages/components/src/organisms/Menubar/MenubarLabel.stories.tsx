import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menubar } from "./Menubar";

// Docs-only — see MenubarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menubar.Label> = {
  title: "Organisms/Navigation/Menubar/Label",
  component: Menubar.Label,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description:
        "The heading text. It names the Menubar.Group or Menubar.RadioGroup it sits in.",
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
    children: "Account",
  },
};

export default meta;

type Story = StoryObj<typeof Menubar.Label>;

export const Default: Story = {
  render: (args) => (
    <Menubar aria-label="Application menu">
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Group>
            <Menubar.Label {...args} />
            <Menubar.Item>Profile</Menubar.Item>
          </Menubar.Group>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  ),
};
