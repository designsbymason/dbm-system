import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Heading } from "../../atoms/Heading";
import { Text } from "../../atoms/Text";
import { DemoPage, DemoTopNavShell, demoCopy } from "./TopNavShellStoryKit";
import { TopNavShell } from "./TopNavShell";
import type { TopNavShellProps } from "./TopNavShell.types";
import { topNavShellPlaygroundSnippet, topNavShellSnippets } from "./TopNavShell.snippets";

// A template is a whole page, so every story fills the window (`layout: "fullscreen"`). The page scrolls as a whole, so open a story on its own to
// see the header stay at the top; on a Docs page the shell sits in a frame instead (see TopNavShell.mdx).
/** The shell's props, and the two Storybook-only controls (whether the demo has a sub-navigation and a banner). */
type PlaygroundArgs = TopNavShellProps & { subNav: boolean; banner: boolean };

const meta: Meta<PlaygroundArgs> = {
  title: "Templates/Application shells/TopNavShell",
  component: TopNavShell,
  subcomponents: {},
  parameters: { layout: "fullscreen", fullBleed: true },
  argTypes: {
    children: {
      control: false,
      description:
        "The shell's parts: TopNavShell.SkipLink, TopNavShell.Banner, TopNavShell.Header (a Navbar and an optional TopNavShell.SubNav), TopNavShell.Main (holding a TopNavShell.Content) and TopNavShell.Footer. They draw in the order you write them, which is the keyboard's tab order: put the skip link first and the header after it. Only TopNavShell.Main is needed.",
    },
    stickyHeader: {
      control: "boolean",
      description:
        "Keeps the header (and the sub-navigation in it) at the top of the window while the page scrolls. Leave the Navbar inside it without its own sticky: the shell owns the sticking.",
      table: { defaultValue: { summary: "true" } },
    },
    scrolledEdge: {
      control: "boolean",
      description: "Shows a shadow under the header while the page is scrolled down from its top (a line instead in forced colours, which drop shadows).",
      table: { defaultValue: { summary: "true" } },
    },
    pageKey: {
      control: false,
      description:
        "A value that changes when the reader goes to another page, such as the router's pathname. When it changes after the first render the shell moves focus to TopNavShell.Main so the keyboard starts at the new page's top, and announces pageTitle. Nothing happens on the first render, or while this is left out.",
    },
    pageTitle: {
      control: false,
      description: "The new page's title, announced politely to a screen reader when pageKey changes. Left out, the focus still moves and nothing is said.",
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description:
        "The reading direction of everything inside. The shell sets it on its own element and provides it to the Navbar and everything inside, so none needs one of its own. Set lang beside it.",
      table: { defaultValue: { summary: "the provider's, else 'ltr'" } },
    },
    subNav: {
      control: "boolean",
      description: "Storybook only — not a TopNavShell prop. Adds a TopNavShell.SubNav of the project's sections under the bar.",
      table: { disable: true },
    },
    banner: {
      control: "boolean",
      description: "Storybook only — not a TopNavShell prop. Adds a TopNavShell.Banner with a notice above the header.",
      table: { disable: true },
    },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    className: { control: false, description: "Additional CSS classes, on the shell's root." },
    id: { control: false, description: "Standard DOM id, on the shell's root." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { stickyHeader: true, scrolledEdge: true, dir: "ltr", subNav: false, banner: false },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

const noControls = {
  stickyHeader: { control: false },
  scrolledEdge: { control: false },
  dir: { control: false },
  subNav: { control: false },
  banner: { control: false },
} as const;

const docs = (context: { viewMode?: string }) => context.viewMode === "docs";

/** Drive the shell's props live; the navbar and the page it is filled with stay fixed. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: { type: "dynamic", transform: (_code: string, context: StoryContext) => topNavShellPlaygroundSnippet(context.args) },
    },
  },
  render: ({ subNav, banner, ...args }, context) => <DemoTopNavShell {...args} subNav={subNav} banner={banner} framed={docs(context)} />,
};

export const WithSubNav: Story = {
  name: "A second row of navigation",
  parameters: { docs: { source: { code: topNavShellSnippets.subNav } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoTopNavShell subNav framed={docs(context)} />,
};

export const WithBanner: Story = {
  name: "A banner above the header",
  parameters: { docs: { source: { code: topNavShellSnippets.banner } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoTopNavShell banner subNav framed={docs(context)} />,
};

export const ShortPage: Story = {
  name: "A short page",
  parameters: { docs: { source: { code: topNavShellSnippets.shortPage } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoTopNavShell rows={2} framed={docs(context)} />,
};

export const Busy: Story = {
  name: "A page that is loading",
  parameters: { docs: { source: { code: topNavShellSnippets.busy } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoTopNavShell busy rows={6} framed={docs(context)} />,
};

export const EmptyPage: Story = {
  name: "A page with nothing to show",
  parameters: { docs: { source: { code: topNavShellSnippets.emptyPage } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoTopNavShell state="empty" framed={docs(context)} />,
};

export const ErrorPage: Story = {
  name: "A page that failed to load",
  parameters: { docs: { source: { code: topNavShellSnippets.errorPage } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoTopNavShell state="error" framed={docs(context)} />,
};

export const StaticHeader: Story = {
  name: "A header that scrolls away",
  parameters: { docs: { source: { code: topNavShellSnippets.staticHeader } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoTopNavShell stickyHeader={false} subNav framed={docs(context)} />,
};

/** The router's part, played by state: choosing a link of the bar changes `pageKey`, as navigating would. */
function PageChangeDemo({ framed }: { framed: boolean }) {
  const [page, setPage] = useState<"projects" | "reports" | "team" | "settings">("projects");
  const copy = demoCopy.en;
  const title = { projects: copy.projects, reports: copy.reports, team: copy.team, settings: copy.settings }[page];
  return (
    <DemoTopNavShell pageKey={page} pageTitle={title} onNavigate={setPage} framed={framed}>
      {page === "projects" ? (
        <DemoPage rows={6} />
      ) : (
        <div style={{ display: "grid", gap: "var(--dbm-space-2)" }}>
          <Heading level={1} size="2xl">
            {title}
          </Heading>
          <Text color="secondary">Focus moved to the main area, and the new title was announced.</Text>
        </div>
      )}
    </DemoTopNavShell>
  );
}

export const PageChange: Story = {
  name: "Moving to another page",
  parameters: { docs: { source: { code: topNavShellSnippets.pageChange } } },
  argTypes: { ...noControls },
  render: (_args, context) => <PageChangeDemo framed={docs(context)} />,
};

export const ContentWidth: Story = {
  name: "Content kept to a narrower width",
  parameters: { docs: { source: { code: topNavShellSnippets.contentWidth } } },
  argTypes: { ...noControls },
  render: (_args, context) => (
    <DemoTopNavShell framed={docs(context)}>
      <div style={{ maxInlineSize: "40rem", marginInline: "auto" }}>
        <DemoPage rows={4} />
      </div>
    </DemoTopNavShell>
  ),
};
