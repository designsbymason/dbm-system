import type { Meta, StoryObj } from "@storybook/react-vite";
import { HouseIcon } from "@dbm-system/icons";
import { Breadcrumb } from "./Breadcrumb";

// Docs-only (guidelines/adr/0013) — `Breadcrumb.Link`'s own props get their own
// Properties table on Breadcrumb.mdx.
const meta: Meta<typeof Breadcrumb.Link> = {
  title: "Components/Breadcrumb/Link",
  id: "molecules-navigation-breadcrumb-link",
  component: Breadcrumb.Link,
  tags: ["!dev"],
  argTypes: {
    href: { control: "text", description: "The link destination." },
    children: { control: false, description: "The link's text." },
    icon: {
      control: false,
      description:
        "An icon shown before the text — a component reference from @dbm-system/icons, not a string name. Decorative. With asChild it is drawn inside your element, before its own text.",
    },
    external: {
      control: "boolean",
      description:
        "Applies external-link affordances: a new tab, rel noopener noreferrer, a trailing icon and a hidden cue for screen readers. Detected from href when not set.",
      table: { defaultValue: { summary: "detected from href" } },
    },
    asChild: {
      control: "boolean",
      description:
        "Renders the link's look onto your own single child element (a router's link) instead of an anchor. The icon, and an external link's icon and cue, are drawn inside that element.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description:
        "Dims the link and blocks it, as aria-disabled; it stays in the page and focusable, per WAI-ARIA guidance.",
      table: { defaultValue: { summary: "false" } },
    },
    target: { control: "text", description: "Native anchor target. Defaults to _blank for an external link." },
    rel: {
      control: "text",
      description: "Native anchor rel. Defaults to noopener noreferrer for an external link.",
    },
    download: { control: false, description: "Native anchor download — prompts a file download instead of navigating." },
    "aria-label": {
      control: "text",
      description: "Accessible name override, for a link whose visible content isn't readable text on its own.",
    },
    "aria-labelledby": { control: false, description: "The id of an element that labels this link." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { href: "/", disabled: false, asChild: false },
};

export default meta;

type Story = StoryObj<typeof Breadcrumb.Link>;

export const Default: Story = {
  render: (args) => (
    <Breadcrumb>
      <Breadcrumb.Item>
        <Breadcrumb.Link {...args} icon={HouseIcon}>
          Home
        </Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        <Breadcrumb.Page>Products</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb>
  ),
};
