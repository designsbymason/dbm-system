import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button";
import { Dialog } from "./Dialog";

// Docs-only — see DialogRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Dialog.Footer> = {
  title: "Components/Dialog/Footer",
  id: "organisms-overlay-dialog-footer",
  component: Dialog.Footer,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The footer's actions, usually Buttons, one of them a Dialog.Close.",
    },
    align: {
      control: "select",
      options: ["start", "end", "between", "stretch"],
      description: "Where the actions sit along the row. \"stretch\" makes each one fill an equal share, which suits a phone.",
      table: { defaultValue: { summary: '"end"' } },
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
    align: "end",
  },
};

export default meta;

type Story = StoryObj<typeof Dialog.Footer>;

export const Default: Story = {
  render: (args) => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Example dialog">
        <Dialog.Footer {...args}>
          <Dialog.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Dialog.Close>
          <Button>Save</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
};
