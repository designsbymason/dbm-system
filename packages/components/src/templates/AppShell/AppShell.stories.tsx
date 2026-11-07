import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";
import type { AppShellProps } from "./AppShell.types";
import { appShellPlaygroundSnippet, appShellSnippets } from "./AppShell.snippets";
import { DemoLayersShell, DemoNavigationShell, DemoPlainHeaderShell, DemoShell, DemoStickyBarShell } from "./AppShellStoryKit";

// A template is a whole page, so every story fills the window (`layout: "fullscreen"`) and the shell is as tall as the window
// (`scroll="content"`). On a Docs page the shell sits in a frame instead (see AppShell.mdx).
/** The shell's props, and the one Storybook-only control (whether the demo has an aside). */
type PlaygroundArgs = AppShellProps & { showAside: boolean };

const meta: Meta<PlaygroundArgs> = {
  title: "Templates/Application shells/AppShell",
  component: AppShell,
  subcomponents: {},
  parameters: { layout: "fullscreen", fullBleed: true },
  argTypes: {
    children: {
      control: false,
      description: "The shell's slots: AppShell.SkipLink and AppShell.Header (first, so the skip link is the first tab stop), AppShell.Sidebar, AppShell.Main, AppShell.Aside and AppShell.Footer. Only AppShell.Main is needed.",
    },
    scroll: {
      control: "radio",
      options: ["content", "page"],
      description: "What scrolls: only the main area while the sidebar and header stay put, or the page as a whole.",
      table: { defaultValue: { summary: "'content'" } },
    },
    headerSpan: {
      control: "radio",
      options: ["content", "full"],
      description: "How far the header reaches: content stops at the sidebar (a full-height sidebar beside it), full runs across the top over the sidebar, which starts below it.",
      table: { defaultValue: { summary: "'content'" } },
    },
    showAside: {
      control: "boolean",
      description: "Storybook only — not an AppShell prop. Adds an AppShell.Aside with a detail pane, and the toggle that opens it as a drawer.",
      table: { disable: true },
    },
    asideCollapseBelow: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl", "never"],
      description: "The width below which AppShell.Aside leaves the page, or 'never' to keep it at every width. AppShell.AsideToggle shows below the same width.",
      table: { defaultValue: { summary: "'lg'" } },
    },
    asideCollapseTo: {
      control: "radio",
      options: ["drawer", "hidden"],
      description: "What the aside becomes below asideCollapseBelow: a drawer opened from AppShell.AsideToggle, or nothing at all.",
      table: { defaultValue: { summary: "'drawer'" } },
    },
    railBelow: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl", "never"],
      description:
        "The width below which the shell collapses the sidebar to a rail by itself, between the phone's drawer and the desktop, and expands it again above it. The reader's own toggle holds until the window crosses the step again.",
      table: { defaultValue: { summary: "'never'" } },
    },
    persistKey: {
      control: false,
      description:
        "Remembers the reader's collapsed state and the sidebar's width in localStorage under this key, and restores them after the page loads. Only the part you leave uncontrolled is stored.",
    },
    sidebarWidth: { control: false, description: "The sidebar's width in pixels (controlled), for a sidebar with resizable. Pair with onSidebarWidthChange." },
    defaultSidebarWidth: { control: false, description: "The sidebar's width in pixels to start at (uncontrolled), for a sidebar with resizable." },
    onSidebarWidthChange: {
      control: false,
      description: "Called with the new width in pixels when the reader resizes the sidebar, and with undefined when they reset it.",
    },
    scrolledEdge: {
      control: "boolean",
      description:
        "Shows a shadow under the header while the content is scrolled down from its top, and a line over the footer while there is more below. Off, neither is drawn.",
      table: { defaultValue: { summary: "true" } },
    },
    asideOpen: { control: false, description: "Whether the aside's drawer is open (controlled). Pair with onAsideOpenChange." },
    defaultAsideOpen: {
      control: false,
      description: "Whether the aside's drawer starts open (uncontrolled).",
      table: { defaultValue: { summary: "false" } },
    },
    onAsideOpenChange: { control: false, description: "Called when the aside's drawer opens or closes, with the new value." },
    pageKey: {
      control: false,
      description:
        "A value that changes when the reader goes to another page, such as the router's pathname. When it changes after the first render the shell moves focus to AppShell.Main, scrolls it back to the top and, with pageTitle, announces the new page. Never on the first render.",
    },
    pageTitle: {
      control: false,
      description: "The new page's title, announced politely to a screen reader when pageKey changes. Left out, the focus still moves and nothing is said.",
    },
    sidebarSide: {
      control: "radio",
      options: ["start", "end"],
      description: "Which edge of the page the sidebar column sits against. Set the sidebar's own side to match.",
      table: { defaultValue: { summary: "'start'" } },
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description:
        "The reading direction of everything inside. The shell sets it on its own element and provides it to the Sidebar, Navbar and everything inside, so none needs a dir of its own. Left out, the nearest DirectionProvider's, else left-to-right; not read from the page.",
      table: { defaultValue: { summary: "the provider's, else 'ltr'" } },
    },
    collapseBelow: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl", "never"],
      description: "The width below which the sidebar leaves the page for a menu button and a panel, or 'never' to keep the column at every width.",
      table: { defaultValue: { summary: "'md'" } },
    },
    collapsed: { control: false, description: "Whether the sidebar is collapsed to a rail of icons (controlled). Pair with onCollapsedChange." },
    defaultCollapsed: {
      control: "boolean",
      description: "Whether the sidebar starts as a rail (uncontrolled).",
      table: { defaultValue: { summary: "false" } },
    },
    onCollapsedChange: { control: false, description: "Called with the new value when the collapse button is pressed." },
    menuOpen: { control: false, description: "Whether the phone panel is open (controlled). Pair with onMenuOpenChange." },
    defaultMenuOpen: {
      control: false,
      description: "Whether the phone panel starts open (uncontrolled).",
      table: { defaultValue: { summary: "false" } },
    },
    onMenuOpenChange: { control: false, description: "Called when the phone panel opens or closes, with what caused it." },
    labels: {
      control: false,
      description: "Text the sidebar and its menu button supply themselves, merged over the English defaults. The shell has no text of its own.",
      table: { defaultValue: { summary: "the Sidebar's English labels" } },
    },
    className: { control: false, description: "Additional CSS classes, on the shell's root." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    id: { control: false, description: "Standard DOM id, on the shell's root." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    scroll: "content",
    headerSpan: "content",
    showAside: false,
    asideCollapseBelow: "lg",
    asideCollapseTo: "drawer",
    railBelow: "never",
    scrolledEdge: true,
    sidebarSide: "start",
    dir: "ltr",
    collapseBelow: "md",
    defaultCollapsed: false,
  },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

const noControls = {
  scroll: { control: false },
  headerSpan: { control: false },
  showAside: { control: false },
  asideCollapseBelow: { control: false },
  asideCollapseTo: { control: false },
  railBelow: { control: false },
  scrolledEdge: { control: false },
  sidebarSide: { control: false },
  dir: { control: false },
  collapseBelow: { control: false },
  defaultCollapsed: { control: false },
} as const;

/** Drive the shell's props live; the sidebar, navbar and page it is filled with stay fixed. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => appShellPlaygroundSnippet(context.args),
      },
    },
  },
  // The shell remounts when the props the sidebar reads once (its start state) change, so every control is live.
  decorators: [
    (Story, context) => (
      <div key={`${String(context.args.defaultCollapsed)}-${context.args.sidebarSide}-${context.args.dir}-${String(context.args.showAside)}`}>
        <Story />
      </div>
    ),
  ],
  render: ({ showAside, ...args }, context) => <DemoShell {...args} aside={showAside} framed={context.viewMode === "docs"} />,
};

export const Rail: Story = {
  name: "Sidebar as a rail",
  parameters: { docs: { source: { code: appShellSnippets.rail } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell defaultCollapsed framed={context.viewMode === "docs"} />,
};

export const EndSidebar: Story = {
  name: "Sidebar at the end edge",
  parameters: { docs: { source: { code: appShellSnippets.endSidebar } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell sidebarSide="end" framed={context.viewMode === "docs"} />,
};

export const PageScroll: Story = {
  name: "The page scrolls",
  parameters: { docs: { source: { code: appShellSnippets.pageScroll } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell scroll="page" framed={context.viewMode === "docs"} />,
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: appShellSnippets.rightToLeft } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell dir="rtl" framed={context.viewMode === "docs"} />,
};

export const WithAside: Story = {
  name: "An aside beside the main area",
  parameters: { docs: { source: { code: appShellSnippets.aside } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell aside framed={context.viewMode === "docs"} />,
};

export const AsideHidden: Story = {
  name: "An aside that is hidden on a phone",
  parameters: { docs: { source: { code: appShellSnippets.asideHidden } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell aside asideCollapseTo="hidden" framed={context.viewMode === "docs"} />,
};

export const HeaderOverSidebar: Story = {
  name: "The header runs over the sidebar",
  parameters: { docs: { source: { code: appShellSnippets.headerSpan } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell headerSpan="full" aside framed={context.viewMode === "docs"} />,
};

export const PlainHeader: Story = {
  name: "A header that is not a Navbar",
  parameters: { docs: { source: { code: appShellSnippets.plainHeader } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoPlainHeaderShell framed={context.viewMode === "docs"} />,
};

export const PageChange: Story = {
  name: "Moving to another page",
  parameters: { docs: { source: { code: appShellSnippets.pageChange } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoNavigationShell framed={context.viewMode === "docs"} />,
};

export const StickyBar: Story = {
  name: "A bar that sticks below the header",
  parameters: { docs: { source: { code: appShellSnippets.stickyBar } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoStickyBarShell framed={context.viewMode === "docs"} />,
};

export const AutoRail: Story = {
  name: "A rail between phone and desktop",
  parameters: { docs: { source: { code: appShellSnippets.autoRail } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell railBelow="xl" framed={context.viewMode === "docs"} />,
};

export const WithBanner: Story = {
  name: "A banner above the header",
  parameters: { docs: { source: { code: appShellSnippets.banner } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell banner framed={context.viewMode === "docs"} />,
};

export const StickyBanner: Story = {
  name: "A banner that stays in view",
  parameters: { docs: { source: { code: appShellSnippets.stickyBanner } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell scroll="page" banner="sticky" framed={context.viewMode === "docs"} />,
};

export const ContentWidth: Story = {
  name: "Content kept to a readable width",
  parameters: { docs: { source: { code: appShellSnippets.content } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell contentWrapper framed={context.viewMode === "docs"} />,
};

export const StickyFooter: Story = {
  name: "A bar of actions at the bottom",
  parameters: { docs: { source: { code: appShellSnippets.stickyFooter } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell scroll="page" stickyFooter framed={context.viewMode === "docs"} />,
};

export const Busy: Story = {
  name: "A page that is loading",
  parameters: { docs: { source: { code: appShellSnippets.busy } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell busy framed={context.viewMode === "docs"} />,
};

export const EmptyPage: Story = {
  name: "A page with nothing to show",
  parameters: { docs: { source: { code: appShellSnippets.emptyState } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell state="empty" framed={context.viewMode === "docs"} />,
};

export const ErrorPage: Story = {
  name: "A page that failed to load",
  parameters: { docs: { source: { code: appShellSnippets.errorState } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell state="error" framed={context.viewMode === "docs"} />,
};

export const Layers: Story = {
  name: "A page's own sticky bar below the header",
  parameters: { docs: { source: { code: appShellSnippets.layers } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoLayersShell parked framed={context.viewMode === "docs"} />,
};

export const ResizableSidebar: Story = {
  name: "A sidebar the reader can resize",
  parameters: { docs: { source: { code: appShellSnippets.resizable } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell resizable framed={context.viewMode === "docs"} />,
};

export const RememberedLayout: Story = {
  name: "A layout the shell remembers",
  parameters: { docs: { source: { code: appShellSnippets.remembered } } },
  argTypes: { ...noControls },
  render: (_args, context) => <DemoShell resizable persistKey="storybook-demo" framed={context.viewMode === "docs"} />,
};
