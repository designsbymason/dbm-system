import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog } from "./AlertDialog";

// Docs-only (guidelines/adr/0013): resolves the sub-part's own argTypes for its Properties table on the
// AlertDialog Docs page.
const meta: Meta<typeof AlertDialog.Content> = {
  title: "Components/AlertDialog/Content",
  id: "organisms-overlay-alertdialog-content",
  component: AlertDialog.Content,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The alert's content: an AlertDialog.Header with a Title and a Description, an optional Body, and a Footer with Cancel and Action.",
    },
    tone: {
      control: "select",
      options: ["neutral", "info", "warning", "danger"],
      description: "What the alert is about. Chooses the icon (each tone has one, in its colour) and, for danger, makes AlertDialog.Action destructive. There is no success: a success needs no answer.",
      table: { defaultValue: { summary: '"neutral"' } },
    },
    icon: {
      control: false,
      description: "A Phosphor icon component to replace the tone's own beside the title, or false for none. Decorative.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description: "The panel's maximum width. On a narrower viewport the panel fills the width less a gutter.",
      table: { defaultValue: { summary: '"sm"' } },
    },
    busy: {
      control: "boolean",
      description: "Marks the alert as working on something: Escape, Cancel and Action do nothing until it is false again, and the panel is aria-busy.",
      table: { defaultValue: { summary: "false" } },
    },
    closeOnEscape: {
      control: "boolean",
      description: "Whether Escape closes the alert, as a cancel. A press on the scrim never closes it, and there is no prop to change that.",
      table: { defaultValue: { summary: "true" } },
    },
    nudge: {
      control: "boolean",
      description:
        "A short pulse when something tries to dismiss the alert and can't (a press on the scrim, or Escape while closeOnEscape is off or the alert is busy). Under reduced motion the border flashes instead.",
      table: { defaultValue: { summary: "true" } },
    },
    initialFocus: {
      control: false,
      description: "An element to focus on open instead of the Cancel (or the Action when there is no Cancel). Ignored if onOpenAutoFocus prevents the default.",
    },
    scrimOpacity: {
      control: "select",
      options: [20, 40, 60, 80, 90],
      description: "How opaque the scrim is, from the opacity scale. Worth lightening when the alert opens over a dialog.",
      table: { defaultValue: { summary: "60" } },
    },
    scrimBlur: {
      control: "boolean",
      description: "Blurs the page behind the scrim as well as dimming it.",
      table: { defaultValue: { summary: "false" } },
    },
    container: {
      control: false,
      description: "Renders the alert into a different DOM node than document.body — for a specific stacking-context requirement.",
    },
    onOpenAutoFocus: {
      control: false,
      description: "Called when focus moves into the alert on open. Call event.preventDefault() to choose the element yourself.",
    },
    onCloseAutoFocus: {
      control: false,
      description: "Called when focus would return to the trigger on close. Call event.preventDefault() to send focus elsewhere.",
    },
    onEscapeKeyDown: {
      control: false,
      description: "Called when Escape is pressed while open. Call event.preventDefault() to keep the alert open.",
    },
    "aria-describedby": {
      control: "text",
      description: "Points to the id of an existing element that describes the alert. AlertDialog.Description is wired in automatically.",
    },
    id: {
      control: "text",
      description: "Standard DOM id.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization, on the dialog panel itself.",
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
    tone: "danger",
  },
};

export default meta;

type Story = StoryObj<typeof AlertDialog.Content>;

export const Default: Story = {
  render: (args) => (
    <AlertDialog defaultOpen>
      <AlertDialog.Content {...args}>
        <AlertDialog.Header>
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description>It cannot be undone.</AlertDialog.Description>
        </AlertDialog.Header>
      </AlertDialog.Content>
    </AlertDialog>
  ),
};
