import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Text } from "../Text";
import { Code } from "./Code";
import { codePlaygroundSnippet, codeSnippets } from "./Code.snippets";

const meta: Meta<typeof Code> = {
  title: "Components/Code",
  id: "atoms-typography-code",
  component: Code,
  parameters: { layout: "padded" },
  // Ordered to match CodeProps' own declaration order (children), then the
  // inherited native escape-hatch props last — same sequencing principle
  // the Properties table uses (guidelines/07-storybook-and-documentation-
  // standards.md §4 item 3).
  argTypes: {
    children: {
      control: "text",
      description: "The code snippet's text content.",
    },
    id: {
      control: false,
      description:
        "DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
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
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // string" placeholder instead of a live, interactive control (see
  // guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    children: "pnpm install",
  },
};

export default meta;

type Story = StoryObj<typeof Code>;

/** Drive every prop live. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => codePlaygroundSnippet(context.args),
      },
    },
  },
};

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => codePlaygroundSnippet(context.args),
      },
    },
  },
  argTypes: {
    children: { control: false },
  },
};

export const WithinText: Story = {
  name: "Within body text",
  parameters: { docs: { source: { code: codeSnippets.withinText } } },
  argTypes: {
    children: { control: false },
  },
  render: () => (
    <Text>
      Run <Code>pnpm install</Code> to install dependencies, then{" "}
      <Code>pnpm dev</Code> to start the dev server.
    </Text>
  ),
};

export const InheritsSurroundingSize: Story = {
  name: "Inherits surrounding font size",
  parameters: { docs: { source: { code: codeSnippets.inheritsSurroundingSize } } },
  argTypes: {
    children: { control: false },
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
      <Text size="sm">
        Small text with <Code>inline code</Code>
      </Text>
      <Text size="lg">
        Large text with <Code>inline code</Code>
      </Text>
    </div>
  ),
};
