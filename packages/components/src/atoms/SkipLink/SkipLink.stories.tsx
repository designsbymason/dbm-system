import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Text } from "../Text";
import { SkipLink } from "./SkipLink";
import { skipLinkPlaygroundSnippet, skipLinkSnippets } from "./SkipLink.snippets";

const meta: Meta<typeof SkipLink> = {
  title: "Atoms/Utility/SkipLink",
  component: SkipLink,
  parameters: { layout: "padded" },
  // Ordered to match SkipLinkProps' own declaration order (children, href, labels), then the standard props last — the sequencing principle the
  // Properties table uses (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: { control: "text", description: "The link's text. Left out, labels.skipToContent." },
    href: {
      control: "text",
      description: "Where the link goes, as a hash link: the id of the page's main content. Give that element tabIndex={-1} so focus lands in it.",
      table: { defaultValue: { summary: "'#main'" } },
    },
    labels: {
      control: false,
      description: "The words the link supplies itself, in your language: { skipToContent } (default 'Skip to content').",
    },
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
  args: { children: "Skip to content", href: "#main" },
};

export default meta;

type Story = StoryObj<typeof SkipLink>;

const docs = (context: { viewMode?: string }) => context.viewMode === "docs";

/** A demo target and what to do: the link is out of sight until a keyboard reaches it, so the demo says to press Tab. */
function Demo({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)" }}>
      {children}
      <Text color="secondary">
        Click here, then press <kbd>Tab</kbd>: the link appears in the top corner of the window.
      </Text>
      <main id="main" tabIndex={-1}>
        <Text>{"The page's main content, where the link goes."}</Text>
      </main>
    </div>
  );
}

/** Drive the link's props live. It is out of sight until it takes keyboard focus. */
export const Playground: Story = {
  parameters: {
    docs: { source: { type: "dynamic", transform: (_code: string, context: StoryContext) => skipLinkPlaygroundSnippet(context.args) } },
  },
  render: (args, context) => (
    <Demo>
      <SkipLink {...args} onClick={docs(context) ? (event) => event.preventDefault() : undefined} />
    </Demo>
  ),
};

export const YourWords: Story = {
  name: "In your language",
  parameters: { docs: { source: { code: skipLinkSnippets.yourWords } } },
  argTypes: { children: { control: false }, href: { control: false } },
  render: () => (
    <Demo>
      <SkipLink labels={{ skipToContent: "Aller au contenu" }} onClick={(event) => event.preventDefault()} />
    </Demo>
  ),
};

export const WithATarget: Story = {
  name: "Beside the page it skips to",
  parameters: { docs: { source: { code: skipLinkSnippets.withATarget } } },
  argTypes: { children: { control: false }, href: { control: false } },
  render: () => (
    <Demo>
      <SkipLink onClick={(event) => event.preventDefault()} />
    </Demo>
  ),
};
