import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar } from "./Navbar";
import { preventNavigation } from "./NavbarStoryKit";

// Docs-only — see NavbarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Navbar.Search> = {
  title: "Components/Navbar/Search",
  id: "organisms-navigation-navbar-search",
  component: Navbar.Search,
  tags: ["!dev"],
  argTypes: {
    value: {
      control: false,
      description:
        "The field's text when controlled. The bar's field and the sheet's are two inputs, so pass this with onChange to keep them in step.",
    },
    collapseBelow: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl", "never"],
      description:
        "The width below which the field leaves the bar for a button that opens it in a sheet from the top of the screen, or never to keep it in the bar. Decided by the stylesheet.",
      table: { defaultValue: { summary: '"md"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description: "This field's size, in place of its row's.",
    },
    buttonVariant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description:
        "The look of the search button the field becomes below collapseBelow: any IconButton variant, so it can match the icon buttons beside it.",
      table: { defaultValue: { summary: '"ghost"' } },
    },
    buttonTone: {
      control: "select",
      options: ["brand", "neutral"],
      description:
        "The colour family of the search button the field becomes below collapseBelow: brand or neutral, so it can match the icon buttons beside it.",
      table: { defaultValue: { summary: '"brand"' } },
    },
    buttonSize: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "The size of the search button the field becomes below collapseBelow, in place of the field's size, so the button can match the icon buttons beside it while the field stays smaller.",
    },
    closeOnSubmit: {
      control: "boolean",
      description: "Closes the sheet when Enter is pressed in its field, so a phone returns to the page. No effect in the bar.",
      table: { defaultValue: { summary: "true" } },
    },
    column: {
      control: "select",
      options: ["start", "center", "end"],
      description: "The column this part sits in when its row is drawn in columns, in place of the one it belongs in by default. Ignored otherwise.",
      table: { defaultValue: { summary: '"start"' } },
    },
    "aria-label": { control: "text", description: 'Names the field. Defaults to labels.search ("Search").' },
    id: { control: "text", description: "Standard DOM id, on the bar's field." },
    className: { control: false, description: "Additional CSS classes, on the search landmark." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { collapseBelow: "md", closeOnSubmit: true },
};

export default meta;

type Story = StoryObj<typeof Navbar.Search>;

export const Default: Story = {
  render: (args) => (
    <Navbar onClick={preventNavigation}>
      <Navbar.Brand href="#">dbM</Navbar.Brand>
      <Navbar.Search {...args} />
    </Navbar>
  ),
};
