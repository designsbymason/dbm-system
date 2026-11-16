import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Text } from "../Text";
import { Highlight } from "./Highlight";
import { highlightPlaygroundSnippet, highlightSnippets } from "./Highlight.snippets";

const meta: Meta<typeof Highlight> = {
  title: "Components/Highlight",
  id: "atoms-typography-highlight",
  component: Highlight,
  parameters: { layout: "padded" },
  // Ordered to match HighlightProps' own declaration order (children, tone,
  // query, caseSensitive), then the inherited native escape-hatch props
  // last — same sequencing principle the Properties table uses
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      control: "text",
      description:
        "The content to highlight. Any ReactNode when `query` is omitted (the whole of it is highlighted); a plain string when `query` is provided (Highlight finds and wraps each match itself).",
    },
    tone: {
      control: "radio",
      options: ["warning", "highlight", "success", "info", "danger"],
      description: "Semantic tone controlling the background/text color pairing.",
    },
    query: {
      control: "text",
      description:
        "A substring to automatically find and wrap within `children`, instead of highlighting all of it. Requires `children` to be a plain string. Also accepts an array of substrings (not directly settable from this control).",
    },
    caseSensitive: {
      control: "boolean",
      description: "Whether `query` matching is case-sensitive. Only relevant when `query` is provided.",
    },
    id: {
      control: false,
      description:
        "DOM id. Attached to a single generated <mark> when query produces exactly one match (or when query is omitted) — avoid pairing with a query that can match more than once.",
    },
    className: {
      control: false,
      description: "Additional CSS classes, applied to every generated <mark>.",
    },
    style: {
      control: false,
      description: "Inline styles, applied to every generated <mark>.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert
  // placeholder instead of a live, interactive control (see
  // guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    tone: "warning",
    caseSensitive: false,
  },
};

export default meta;

type Story = StoryObj<typeof Highlight>;

/** Drive every prop live. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => highlightPlaygroundSnippet(context.args),
      },
    },
  },
  args: {
    children: "Results for design system",
    query: "design",
  },
};

export const Default: Story = {
  args: {
    children: "design",
  },
  argTypes: {
    children: { control: false },
    query: { control: false },
  },
};

export const AllTones: Story = {
  name: "All tones",
  parameters: { docs: { source: { code: highlightSnippets.allTones } } },
  argTypes: {
    children: { control: false },
    query: { control: false },
    tone: { control: false },
    caseSensitive: { control: false },
  },
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
      {(["warning", "highlight", "success", "info", "danger"] as const).map((tone) => (
        <Highlight key={tone} tone={tone}>
          {tone}
        </Highlight>
      ))}
    </div>
  ),
};

export const SearchMatch: Story = {
  name: "Search-match emphasis",
  parameters: { docs: { source: { code: highlightSnippets.searchMatch } } },
  argTypes: {
    children: { control: false },
    query: { control: false },
    tone: { control: false },
    caseSensitive: { control: false },
  },
  render: () => (
    <Text>
      Showing results for &quot;<Highlight>design</Highlight> system&quot; —
      3 matches found.
    </Text>
  ),
};

export const AutoMatching: Story = {
  name: "Auto-matching (query prop)",
  parameters: { docs: { source: { code: highlightSnippets.autoMatching } } },
  argTypes: {
    children: { control: false },
    query: { control: false },
    tone: { control: false },
    caseSensitive: { control: false },
  },
  render: () => (
    <Text>
      <Highlight query="design">
        Results for the design system — a design-first approach.
      </Highlight>
    </Text>
  ),
};

export const MultipleQueries: Story = {
  name: "Multiple queries (array)",
  parameters: { docs: { source: { code: highlightSnippets.multipleQueries } } },
  argTypes: {
    children: { control: false },
    query: { control: false },
    tone: { control: false },
    caseSensitive: { control: false },
  },
  render: () => (
    <Text>
      <Highlight query={["design", "agent"]} tone="info">
        A design system built for AI agents and human engineers alike.
      </Highlight>
    </Text>
  ),
};
