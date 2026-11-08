import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Heading } from "../../atoms/Heading";
import { Text } from "../../atoms/Text";
import { DemoPage, DemoPageShell, demoCopy } from "./PageShellStoryKit";
import { PageShell } from "./PageShell";
import type { PageShellProps } from "./PageShell.types";
import { pageShellPlaygroundSnippet, pageShellSnippets } from "./PageShell.snippets";

// A template is a whole page, so every story fills the window (`layout: "fullscreen"`). The page scrolls as a whole, so open a story on its own to
// see the header stay at the top; on a Docs page the shell sits in a frame instead (see PageShell.mdx).
/** The shell's props, and the Storybook-only controls of the demo (the header's `sticky` and `hideOnScroll` are the `Navbar`'s, since the shell wraps no header). */
type PlaygroundArgs = PageShellProps & {
  subNav: boolean;
  banner: boolean;
  sticky: boolean;
  hideOnScroll: boolean;
  customHeader: boolean;
  aside: boolean;
  asideCollapse: "stack" | "drawer";
  asideSticky: boolean;
  asideSide: "start" | "end";
};

const meta: Meta<PlaygroundArgs> = {
  title: "Templates/Application shells/PageShell",
  component: PageShell,
  subcomponents: {},
  parameters: { layout: "fullscreen", fullBleed: true },
  argTypes: {
    children: {
      control: false,
      description:
        "The shell's parts and your header, in the order you want them on the page, which is the keyboard's tab order: PageShell.SkipLink first, then PageShell.Banner if there is one, your header (a Navbar, or any header of your own: the shell does not wrap it, so it sticks by its own means), PageShell.Main (holding a PageShell.Content) and PageShell.Footer. Only PageShell.Main is needed.",
    },
    pageKey: {
      control: false,
      description:
        "A value that changes when the reader goes to another page, such as the router's pathname. When it changes after the first render the shell moves focus to PageShell.Main so the keyboard starts at the new page's top, and announces pageTitle. Nothing happens on the first render, or while this is left out.",
    },
    pageTitle: {
      control: false,
      description: "The new page's title, announced politely to a screen reader when pageKey changes. Left out, the focus still moves and nothing is said.",
    },
    documentTitle: {
      control: false,
      description:
        "Keeps the browser tab's title (document.title) in step with pageTitle, so a router does not have to. true sets it to pageTitle; a function builds the whole title from it. The title the document had is put back when the shell unmounts. Nothing happens while pageTitle is left out.",
      table: { defaultValue: { summary: "false" } },
    },
    focusTarget: {
      control: false,
      description:
        "Where focus goes after pageKey changes: main (the main area, the default) or heading, the first h1 inside it, so the keyboard starts at the page's own title. With no h1 it is the main area. The title is announced either way.",
      table: { defaultValue: { summary: "\"main\"" } },
    },
    scrollToTopOnChange: {
      control: false,
      description: "Scrolls the window to its top, instantly, when pageKey changes, for an app whose router does not. Nothing happens on the first render.",
      table: { defaultValue: { summary: "false" } },
    },
    navigating: {
      control: false,
      description:
        "The app is moving between pages: a loading bar along the top of the window, above the header, and a polite \"Loading\" announcement. busy on PageShell.Main is for a page that is reloading its own content.",
    },
    labels: {
      control: false,
      description: "Text the shell supplies itself, namely what is announced while navigating. Merged over the English defaults.",
    },
    asideOpen: {
      control: false,
      description:
        "Whether the aside's drawer is open (controlled), for a PageShell.Aside with collapse=\"drawer\" below its collapse step. Always false while the aside is on the page.",
    },
    defaultAsideOpen: {
      control: false,
      description: "Whether the aside's drawer starts open (uncontrolled).",
      table: { defaultValue: { summary: "false" } },
    },
    onAsideOpenChange: {
      control: false,
      description: "Called with the drawer's next state when it opens or closes (the toggle, a close key, a press outside, the window growing past the step).",
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description:
        "The reading direction of everything inside. The shell sets it on its own element and provides it to the Navbar and everything inside, so none needs one of its own. Set lang beside it.",
      table: { defaultValue: { summary: "the provider's, else 'ltr'" } },
    },
    sticky: {
      control: "boolean",
      description: "Storybook only — not a PageShell prop. The demo Navbar's own sticky: the shell wraps no header, so the bar sticks itself.",
      table: { disable: true },
    },
    hideOnScroll: {
      control: "boolean",
      description: "Storybook only — not a PageShell prop. The demo Navbar's own hideOnScroll (it needs sticky).",
      table: { disable: true },
    },
    customHeader: {
      control: "boolean",
      description: "Storybook only — not a PageShell prop. Draws a header of the demo's own, a header made sticky by Affix, in place of the Navbar.",
      table: { disable: true },
    },
    aside: {
      control: "boolean",
      description: "Storybook only — not a PageShell prop. Adds a PageShell.Aside (a table of contents) beside the page, in a PageShell.Body.",
      table: { disable: true },
    },
    asideCollapse: {
      control: "radio",
      options: ["stack", "drawer"],
      description: "Storybook only — the aside's collapse: dropped under the page, or a drawer opened from a toggle beside the page's actions.",
      table: { disable: true },
    },
    asideSticky: {
      control: "boolean",
      description: "Storybook only — the aside's sticky: it stays in view under the header.",
      table: { disable: true },
    },
    asideSide: {
      control: "radio",
      options: ["start", "end"],
      description: "Storybook only — which end the aside is at: it is written before or after the main area.",
      table: { disable: true },
    },
    subNav: {
      control: "boolean",
      description: "Storybook only — not a PageShell prop. Adds a second row of the project's sections to the demo Navbar: a Navbar.Row that scrolls away.",
      table: { disable: true },
    },
    banner: {
      control: "boolean",
      description: "Storybook only — not a PageShell prop. Adds a PageShell.Banner with a notice above the header.",
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
  args: { dir: "ltr", sticky: true, hideOnScroll: false, customHeader: false, subNav: false, banner: false, aside: false, asideCollapse: "stack", asideSticky: false, asideSide: "end" },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

const noControls = {
  sticky: { control: false },
  hideOnScroll: { control: false },
  customHeader: { control: false },
  aside: { control: false },
  asideCollapse: { control: false },
  asideSticky: { control: false },
  asideSide: { control: false },
  dir: { control: false },
  subNav: { control: false },
  banner: { control: false },
} as const;

const docs = (context: { viewMode?: string }) => context.viewMode === "docs";

/** Drive the shell's props live; the navbar and the page it is filled with stay fixed. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: { type: "dynamic", transform: (_code: string, context: StoryContext) => pageShellPlaygroundSnippet(context.args) },
    },
  },
  render: (args, context) => <DemoPageShell {...args} framed={docs(context)} />,
};

export const WithSubNav: Story = {
  name: "A second row of links",
  parameters: { docs: { source: { code: pageShellSnippets.subNav } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell subNav framed={docs(context)} />,
};

export const WithBanner: Story = {
  name: "A banner above the header",
  parameters: { docs: { source: { code: pageShellSnippets.banner } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell banner subNav framed={docs(context)} />,
};

export const AutoHide: Story = {
  name: "A header that hides on scroll",
  parameters: { docs: { source: { code: pageShellSnippets.autoHide } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell hideOnScroll subNav rows={80} framed={docs(context)} />,
};

export const CustomHeader: Story = {
  name: "A header of your own",
  parameters: { docs: { source: { code: pageShellSnippets.customHeader } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell customHeader rows={80} framed={docs(context)} />,
};

export const WithAside: Story = {
  name: "An aside beside the page",
  parameters: { docs: { source: { code: pageShellSnippets.aside } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell aside rows={12} framed={docs(context)} />,
};

export const StickyAside: Story = {
  name: "An aside that stays in view",
  parameters: { docs: { source: { code: pageShellSnippets.asideSticky } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell aside asideSticky rows={80} framed={docs(context)} />,
};

export const AsideDrawer: Story = {
  name: "An aside that becomes a drawer",
  parameters: { docs: { source: { code: pageShellSnippets.asideDrawer } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell aside asideCollapse="drawer" asideCollapseBelow="3xl" rows={12} framed={docs(context)} />,
};

export const AsideFollowsHidingHeader: Story = {
  name: "An aside that follows a header that hides",
  parameters: { docs: { source: { code: pageShellSnippets.asideFollowsHeader } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell aside asideSticky hideOnScroll rows={80} framed={docs(context)} />,
};

export const TwoAsides: Story = {
  name: "An aside at each end",
  parameters: { docs: { source: { code: pageShellSnippets.twoAsides } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell aside secondAside rows={12} framed={docs(context)} />,
};

export const WithTableOfContents: Story = {
  name: "A table of contents in the aside",
  parameters: { docs: { source: { code: pageShellSnippets.tableOfContents } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell aside asideSticky asideContent="contents" page="article" framed={docs(context)} />,
};

export const ShortPage: Story = {
  name: "A short page",
  parameters: { docs: { source: { code: pageShellSnippets.shortPage } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell rows={2} framed={docs(context)} />,
};

export const Busy: Story = {
  name: "A page that is loading",
  parameters: { docs: { source: { code: pageShellSnippets.busy } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell busy rows={6} framed={docs(context)} />,
};

export const EmptyPage: Story = {
  name: "A page with nothing to show",
  parameters: { docs: { source: { code: pageShellSnippets.emptyPage } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell state="empty" framed={docs(context)} />,
};

export const ErrorPage: Story = {
  name: "A page that failed to load",
  parameters: { docs: { source: { code: pageShellSnippets.errorPage } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell state="error" framed={docs(context)} />,
};

export const StaticHeader: Story = {
  name: "A header that scrolls away",
  parameters: { docs: { source: { code: pageShellSnippets.staticHeader } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell sticky={false} subNav rows={80} framed={docs(context)} />,
};

/** The router's part, played by state: choosing a link of the bar changes `pageKey`, as navigating would. */
function PageChangeDemo({ framed, ...options }: { framed: boolean; focusTarget?: "main" | "heading"; scrollToTopOnChange?: boolean }) {
  const [page, setPage] = useState<"projects" | "reports" | "team" | "settings">("projects");
  const copy = demoCopy.en;
  const title = { projects: copy.projects, reports: copy.reports, team: copy.team, settings: copy.settings }[page];
  return (
    <DemoPageShell pageKey={page} pageTitle={title} onNavigate={setPage} framed={framed} {...options}>
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
    </DemoPageShell>
  );
}

export const PageChange: Story = {
  name: "Moving to another page",
  parameters: { docs: { source: { code: pageShellSnippets.pageChange } } },
  argTypes: { ...noControls },
  render: (_args, context) => <PageChangeDemo framed={docs(context)} />,
};

export const ContentWidth: Story = {
  name: "Content kept to a narrower width",
  parameters: { docs: { source: { code: pageShellSnippets.contentWidth } } },
  argTypes: { ...noControls },
  render: (_args, context) => (
    <DemoPageShell framed={docs(context)}>
      <div style={{ maxInlineSize: "40rem", marginInline: "auto" }}>
        <DemoPage rows={4} />
      </div>
    </DemoPageShell>
  ),
};

export const PageChangeToHeading: Story = {
  name: "A page change that lands on the heading",
  parameters: { docs: { source: { code: pageShellSnippets.pageChangeHeading } } },
  argTypes: { ...noControls },
  render: (_args, context) => <PageChangeDemo focusTarget="heading" scrollToTopOnChange framed={docs(context)} />,
};

export const Navigating: Story = {
  name: "Moving between pages",
  parameters: { docs: { source: { code: pageShellSnippets.navigating } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell navigating rows={6} framed={docs(context)} />,
};

export const DismissibleBanner: Story = {
  name: "A banner that can be dismissed",
  parameters: { docs: { source: { code: pageShellSnippets.dismissibleBanner } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell dismissibleBanner rows={4} framed={docs(context)} />,
};

export const NotFoundPage: Story = {
  name: "A page that does not exist",
  parameters: { docs: { source: { code: pageShellSnippets.notFoundPage } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell state="notFound" framed={docs(context)} />,
};

export const FullBleedSection: Story = {
  name: "A section that runs edge to edge",
  parameters: { docs: { source: { code: pageShellSnippets.fullBleed } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPageShell fullBleed rows={4} framed={docs(context)} />,
};
