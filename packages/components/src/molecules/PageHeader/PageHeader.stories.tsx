import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { Breadcrumb } from "../Breadcrumb";
import { PageHeader } from "./PageHeader";
import type { PageHeaderProps } from "./PageHeader.types";
import { pageHeaderPlaygroundSnippet, pageHeaderSnippets } from "./PageHeader.snippets";

/** The header's props, and the Storybook-only controls that switch the demo's optional parts on and off. */
type PlaygroundArgs = PageHeaderProps & { breadcrumbs: boolean; description: boolean; meta: boolean; actions: boolean };

const trail = (
  <Breadcrumb>
    <Breadcrumb.Item>
      <Breadcrumb.Link href="#" onClick={(event) => event.preventDefault()}>
        Home
      </Breadcrumb.Link>
    </Breadcrumb.Item>
    <Breadcrumb.Item>
      <Breadcrumb.Page>Projects</Breadcrumb.Page>
    </Breadcrumb.Item>
  </Breadcrumb>
);

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Layout/PageHeader",
  component: PageHeader,
  subcomponents: {},
  parameters: { layout: "padded" },
  // Ordered to match PageHeaderProps' own declaration order (children, size, bordered, as), then the standard props last — the sequencing principle the
  // Properties table uses (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      control: false,
      description:
        "The parts, in reading order: PageHeader.Breadcrumbs, PageHeader.Title, PageHeader.Description and PageHeader.Meta in one column, and PageHeader.Actions beside it (under it where there is no room). Put them directly in the header: PageHeader.Actions has to be a direct child.",
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "The title's and the description's text steps, and the space between the text and the actions (tighter at sm) and between its lines (roomier at lg).",
      table: { defaultValue: { summary: "'md'" } },
    },
    bordered: {
      control: "boolean",
      description: "Draws a line under the header and room above it.",
      table: { defaultValue: { summary: "false" } },
    },
    as: {
      control: "radio",
      options: ["div", "header"],
      description:
        "The element the header is. header inside the page's main is not a banner landmark, so either is safe there; outside main use div, since a header there would be a second banner.",
      table: { defaultValue: { summary: "'div'" } },
    },
    breadcrumbs: { control: "boolean", description: "Storybook only — not a PageHeader prop. Draws PageHeader.Breadcrumbs.", table: { disable: true } },
    description: { control: "boolean", description: "Storybook only — not a PageHeader prop. Draws PageHeader.Description.", table: { disable: true } },
    meta: { control: "boolean", description: "Storybook only — not a PageHeader prop. Draws PageHeader.Meta.", table: { disable: true } },
    actions: { control: "boolean", description: "Storybook only — not a PageHeader prop. Draws PageHeader.Actions.", table: { disable: true } },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value, matching its real default (07 §5).
  args: { size: "md", bordered: false, as: "div", breadcrumbs: true, description: true, meta: true, actions: true },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

const noControls = {
  size: { control: false },
  bordered: { control: false },
  as: { control: false },
  breadcrumbs: { control: false },
  description: { control: false },
  meta: { control: false },
  actions: { control: false },
} as const;

/**
 * The title level a demo draws: on a Docs page the demos draw `h3`, under the page's own sections, so the page keeps one `h1` and its outline; on their
 * own they draw the default `h1` the code shows. A page's header keeps the default.
 */
const titleLevel = (context: { viewMode?: string }, onTheirOwn: 1 | 2 = 1) => (context.viewMode === "docs" ? 3 : onTheirOwn);

/** Drive the header's props live, and switch its optional parts on and off. */
export const Playground: Story = {
  parameters: {
    docs: { source: { type: "dynamic", transform: (_code: string, context: StoryContext) => pageHeaderPlaygroundSnippet(context.args) } },
  },
  render: ({ breadcrumbs, description, meta, actions, ...args }, context) => (
    <PageHeader {...args}>
      {breadcrumbs && <PageHeader.Breadcrumbs>{trail}</PageHeader.Breadcrumbs>}
      <PageHeader.Title level={titleLevel(context)}>Projects</PageHeader.Title>
      {description && <PageHeader.Description>Everything your team is working on, in one place.</PageHeader.Description>}
      {meta && (
        <PageHeader.Meta>
          <Badge tone="info">Draft</Badge>
          <Text size="sm" color="secondary">
            Updated 3 days ago
          </Text>
        </PageHeader.Meta>
      )}
      {actions && (
        <PageHeader.Actions>
          <Button variant="secondary">Share</Button>
          <Button>New project</Button>
        </PageHeader.Actions>
      )}
    </PageHeader>
  ),
};

export const TitleOnly: Story = {
  name: "A title alone",
  parameters: { docs: { source: { code: pageHeaderSnippets.titleOnly } } },
  argTypes: { ...noControls },
  render: (_args, context) => (
    <PageHeader>
      <PageHeader.Title level={titleLevel(context)}>Settings</PageHeader.Title>
    </PageHeader>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: { docs: { source: { code: pageHeaderSnippets.sizes } } },
  argTypes: { ...noControls },
  render: (_args, context) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <PageHeader key={size} size={size}>
          <PageHeader.Title level={titleLevel(context)}>{{ sm: "Small", md: "Medium", lg: "Large" }[size]}</PageHeader.Title>
          <PageHeader.Description>{{ sm: "A panel's page.", md: "A page's usual head.", lg: "A landing page." }[size]}</PageHeader.Description>
        </PageHeader>
      ))}
    </div>
  ),
};

export const Bordered: Story = {
  name: "With a line under it",
  parameters: { docs: { source: { code: pageHeaderSnippets.bordered } } },
  argTypes: { ...noControls },
  render: (_args, context) => (
    <PageHeader bordered>
      <PageHeader.Title level={titleLevel(context)}>Billing</PageHeader.Title>
      <PageHeader.Description>Invoices and payment methods.</PageHeader.Description>
      <PageHeader.Actions>
        <Button>Add payment method</Button>
      </PageHeader.Actions>
    </PageHeader>
  ),
};

export const Section: Story = {
  name: "The header of a section",
  parameters: { docs: { source: { code: pageHeaderSnippets.section } } },
  argTypes: { ...noControls },
  render: (_args, context) => (
    <PageHeader as="header" size="sm">
      <PageHeader.Title level={context.viewMode === "docs" ? 4 : 2}>Members</PageHeader.Title>
      <PageHeader.Actions>
        <Button size="sm">Invite</Button>
      </PageHeader.Actions>
    </PageHeader>
  ),
};
