import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import type { MouseEvent, ReactNode } from "react";
import { Kbd } from "../Kbd";
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
      description: "The words the link supplies itself, in your language: { skipToContent }.",
      table: { defaultValue: { summary: "{ skipToContent: 'Skip to content' }" } },
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

/**
 * What a router's click handler does for a skip link: keep the hash out of the address (and the preview on its own page) and move focus to the target
 * by script. The link itself is a plain hash link; an app that lets the browser follow it needs none of this.
 */
const goToTarget = (event: MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
  const id = event.currentTarget.getAttribute("href")?.replace(/^#/, "");
  if (id) document.getElementById(id)?.focus();
};

/**
 * A demo target and what to do: the link is out of sight until a keyboard reaches it, so the demo says to press Tab. The target is a `div`, not a
 * `<main>`, and its id is the story's own, so a Docs page that draws several demos has no duplicate ids and no nested landmarks.
 */
function Demo({ children, target }: { children: ReactNode; target: string }) {
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)" }}>
      {children}
      <Text color="secondary">
        Click here, then press <Kbd>Tab</Kbd>: the link appears in the top corner of the window.
      </Text>
      <div id={target} tabIndex={-1}>
        <Text>{"The page's main content, where the link goes."}</Text>
      </div>
    </div>
  );
}

/** Drive the link's props live. It is out of sight until it takes keyboard focus. */
export const Playground: Story = {
  parameters: {
    docs: { source: { type: "dynamic", transform: (_code: string, context: StoryContext) => skipLinkPlaygroundSnippet(context.args) } },
  },
  render: (args) => (
    <Demo target={(args.href ?? "#main").replace(/^#/, "")}>
      <SkipLink {...args} onClick={goToTarget} />
    </Demo>
  ),
};

export const YourWords: Story = {
  name: "In your language",
  parameters: { docs: { source: { code: skipLinkSnippets.yourWords } } },
  argTypes: { children: { control: false }, href: { control: false } },
  render: () => (
    <Demo target="skip-link-words-target">
      <SkipLink href="#skip-link-words-target" labels={{ skipToContent: "Aller au contenu" }} onClick={goToTarget} />
    </Demo>
  ),
};

export const WithATarget: Story = {
  name: "Beside the page it skips to",
  parameters: { docs: { source: { code: skipLinkSnippets.withATarget } } },
  argTypes: { children: { control: false }, href: { control: false } },
  render: () => (
    <Demo target="skip-link-page-target">
      <SkipLink href="#skip-link-page-target" onClick={goToTarget} />
    </Demo>
  ),
};
