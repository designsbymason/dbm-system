import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar } from "./Navbar";
import { preventNavigation } from "./NavbarStoryKit";

// Docs-only — see NavbarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Navbar.Links> = {
  title: "Organisms/Navigation/Navbar/Links",
  component: Navbar.Links,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "Navbar.Link items. The same items are drawn in the bar and, below the collapse width, in the menu panel, so give them no id.",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description:
        "Where the links sit between the brand and the actions: next to the brand, centred in the room between them, or against the actions. Follows the reading direction; no effect in the menu panel.",
      table: { defaultValue: { summary: '"start"' } },
    },
    quiet: {
      control: "boolean",
      description:
        "A quieter look for secondary links (a courtesy row): smaller text in the secondary colour. The current link is still marked.",
      table: { defaultValue: { summary: "false" } },
    },
    scroll: {
      control: "boolean",
      description:
        "Keeps the set in the bar at every width, for a second row of links that should not hide behind the menu button: not copied into the menu panel, its row not removed below the collapse width, no menu button for a bar of only such sets. It scrolls sideways when the links do not fit, fades at the edge that has more and scrolls the current link into view. Only Navbar.Link items: a Navbar.Group warns.",
      table: { defaultValue: { summary: "false" } },
    },
    hideBelow: {
      control: "select",
      options: ["", "sm", "md", "lg", "xl", "2xl", "3xl"],
      description:
        "Hides this set from the bar below a width, because the links are offered somewhere else on a phone (a sidebar's menu panel, say). It hides the bar's copy only: the menu panel below collapseBelow still offers them, so set collapseBelow to never on a bar that hides its links.",
    },
    currentVariant: {
      control: "select",
      options: ["bar's", "underline", "subtle", "solid"],
      mapping: { "bar's": undefined },
      description: "How this set marks the current page, in place of the bar's currentVariant. The menu panel keeps the bar's.",
    },
    rounded: {
      control: "boolean",
      description: "Whether this set's links are pills, in place of the bar's rounded. The menu panel keeps the bar's.",
    },
    linkSize: {
      control: "select",
      options: ["auto", "xs", "sm", "md", "lg", "xl"],
      mapping: { auto: undefined },
      description: "This set's link size, in place of its row's and the bar's linkSize (auto follows them).",
    },
    column: {
      control: "select",
      options: ["start", "center", "end"],
      description: "The column this part sits in when its row is drawn in columns, in place of the one it belongs in by default. Ignored otherwise.",
      table: { defaultValue: { summary: '"center"' } },
    },
    "aria-label": {
      control: "text",
      description: "Names the navigation landmark. Defaults to labels.navigation (\"Main\").",
    },
    "aria-labelledby": { control: "text", description: "The id of a visible element that names the navigation, in place of aria-label." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes, on the <nav> element." },
    style: {
      control: false,
      description:
        'Inline styles, merged onto the component\'s own internal styles. The links inherit their text style from the set, so this is also where their weight and case go (there are no props for them): style={{ fontWeight: "var(--dbm-font-weight-bold)", textTransform: "uppercase" }}. The menu panel draws its own copy of the links and keeps its own text.',
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Navbar.Links>;

export const Default: Story = {
  render: (args) => (
    <Navbar collapseBelow="never" onClick={preventNavigation}>
      <Navbar.Links {...args}>
        <Navbar.Link href="#a" current>
          Products
        </Navbar.Link>
        <Navbar.Link href="#b">Pricing</Navbar.Link>
      </Navbar.Links>
    </Navbar>
  ),
};
