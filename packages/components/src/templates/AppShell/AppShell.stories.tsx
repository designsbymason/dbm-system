import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";
import { appShellPlaygroundSnippet, appShellSnippets } from "./AppShell.snippets";
import { DemoShell } from "./AppShellStoryKit";

// A template is a whole page, so every story fills the window (`layout: "fullscreen"`) and the shell is as tall as the window
// (`scroll="content"`). On a Docs page the shell sits in a frame instead (see AppShell.mdx).
const meta: Meta<typeof AppShell> = {
  title: "Templates/Application shells/AppShell",
  component: AppShell,
  subcomponents: {},
  parameters: { layout: "fullscreen", fullBleed: true },
  argTypes: {
    children: {
      control: false,
      description: "The shell's slots: AppShell.Header (first, so the skip link is the first tab stop), AppShell.Sidebar, AppShell.Main and AppShell.Footer. Only AppShell.Main is needed.",
    },
    scroll: {
      control: "radio",
      options: ["content", "page"],
      description: "What scrolls: only the main area while the sidebar and header stay put, or the page as a whole.",
    },
    sidebarSide: {
      control: "radio",
      options: ["start", "end"],
      description: "Which edge of the page the sidebar column sits against. Set the sidebar's own side to match.",
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description: "The reading direction of everything inside. Not read from the page; components with their own dir prop still need it passed.",
    },
    collapseBelow: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl", "never"],
      description: "The width below which the sidebar leaves the page for a menu button and a panel, or 'never' to keep the column at every width.",
    },
    collapsed: { control: false, description: "Whether the sidebar is collapsed to a rail of icons (controlled). Pair with onCollapsedChange." },
    defaultCollapsed: { control: "boolean", description: "Whether the sidebar starts as a rail (uncontrolled)." },
    onCollapsedChange: { control: false, description: "Called with the new value when the collapse button is pressed." },
    menuOpen: { control: false, description: "Whether the phone panel is open (controlled). Pair with onMenuOpenChange." },
    defaultMenuOpen: { control: false, description: "Whether the phone panel starts open (uncontrolled)." },
    onMenuOpenChange: { control: false, description: "Called when the phone panel opens or closes, with what caused it." },
    labels: { control: false, description: "Text the sidebar and its menu button supply themselves, merged over the English defaults. The shell has no text of its own." },
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
    sidebarSide: "start",
    dir: "ltr",
    collapseBelow: "md",
    defaultCollapsed: false,
  },
};

export default meta;

type Story = StoryObj<typeof AppShell>;

const noControls = {
  scroll: { control: false },
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
      <div key={`${String(context.args.defaultCollapsed)}-${context.args.sidebarSide}-${context.args.dir}`}>
        <Story />
      </div>
    ),
  ],
  render: (args, context) => <DemoShell {...args} framed={context.viewMode === "docs"} />,
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
