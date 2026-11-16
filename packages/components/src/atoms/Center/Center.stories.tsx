import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Spinner } from "../Spinner";
import { Center } from "./Center";
import { centerPlaygroundSnippet, centerSnippets } from "./Center.snippets";

const meta: Meta<typeof Center> = {
  title: "Components/Center",
  id: "atoms-layout-center",
  component: Center,
  parameters: { layout: "padded" },
  // Ordered to match CenterProps' own declaration order (as, inline,
  // children), then the inherited native escape-hatch props last — same
  // sequencing principle the future Properties table will use
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    as: {
      control: "select",
      options: ["div", "span", "section", "article", "aside", "header", "footer", "nav", "main"],
      description: "The HTML element (or component) to render as.",
    },
    inline: {
      control: "boolean",
      description:
        "Renders inline-flex instead of flex, for centering within an inline flow instead of as a block.",
    },
    children: { control: "text" },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    id: {
      control: false,
      description:
        "DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // string"/"Set boolean" placeholder instead of a live, interactive
  // control (see guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    as: "div",
    inline: false,
    children: "Centered content",
  },
};

export default meta;

type Story = StoryObj<typeof Center>;

/**
 * Drive every prop live. The dashed border is Storybook-only demo chrome
 * (so the centering is visible against a bounded box) — not part of the
 * component itself.
 */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => centerPlaygroundSnippet(context.args),
      },
    },
  },
  render: (args) => (
    <Center
      {...args}
      style={{
        height: "12rem",
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
      }}
    />
  ),
};

export const Default: Story = {
  parameters: { docs: { source: { code: centerSnippets.default } } },
  // `children` is the whole point of this story — a static reference
  // showing a real interactive child (Spinner) — so no single control
  // value could represent it without contradicting the story's own point
  // (same reasoning as Skeleton's `DefaultSizes`).
  argTypes: { as: { control: false }, inline: { control: false }, children: { control: false } },
  render: () => (
    <Center
      style={{
        height: "12rem",
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
      }}
    >
      <Spinner tone="brand" label="Loading" />
    </Center>
  ),
};

export const Inline: Story = {
  parameters: { docs: { source: { code: centerSnippets.inline } } },
  argTypes: { as: { control: false }, inline: { control: false }, children: { control: false } },
  render: () => (
    <p>
      Text with an{" "}
      <Center
        as="span"
        inline
        style={{ border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)" }}
      >
        inline-centered badge
      </Center>{" "}
      in the middle of a sentence.
    </p>
  ),
};
